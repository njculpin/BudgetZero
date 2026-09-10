-- Rate limiting
--
-- Nothing throttled any route, including sign-in and file upload. Vercel runs each
-- request in a serverless invocation with no memory shared between them, so an
-- in-process counter would reset constantly and enforce nothing. The counter has to
-- live somewhere durable, and Postgres is already here.
--
-- This is a fixed-window counter: cheap, one round trip, and accurate enough for
-- the job (blunting credential stuffing and upload floods). It permits at most 2x
-- the limit across a window boundary, which is an acceptable trade for the
-- simplicity. Move to Upstash or a sliding window if the traffic ever justifies it.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  -- Identity of the caller for one bucket, e.g. 'sign-in:203.0.113.4'.
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  -- Start of the current window. Once NOW() passes window_start + interval, the
  -- counter resets rather than continuing to accumulate.
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.rate_limits IS
  'Fixed-window request counters. Written only by the service role from API routes.';

-- Lets the sweeper find expired rows without scanning the whole table.
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start
  ON public.rate_limits (window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No policy for anon or authenticated: this table is service-role only. A client
-- that could write here could erase its own limit.
CREATE POLICY "Service role manages rate limits"
ON public.rate_limits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Consume one unit of quota.
--
-- Returns the number of requests remaining, or -1 when the limit is already
-- exhausted. The whole check-reset-increment cycle is one statement so concurrent
-- invocations cannot each read the same count and all conclude they are under the
-- limit — which is exactly the burst a rate limiter exists to stop.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO rate_limits (key, count, window_start)
  VALUES (p_key, 1, NOW())
  ON CONFLICT (key) DO UPDATE
  SET
    -- Reset when the stored window has expired, otherwise increment.
    count = CASE
      WHEN rate_limits.window_start < NOW() - make_interval(secs => p_window_seconds)
        THEN 1
      ELSE rate_limits.count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < NOW() - make_interval(secs => p_window_seconds)
        THEN NOW()
      ELSE rate_limits.window_start
    END
  RETURNING count INTO v_count;

  IF v_count > p_limit THEN
    RETURN -1;
  END IF;

  RETURN p_limit - v_count;
END;
$$;

COMMENT ON FUNCTION public.consume_rate_limit IS
  'Consume one unit of quota. Returns remaining requests, or -1 if the limit is hit.';

-- Housekeeping for rows whose window lapsed long ago. Call periodically; the table
-- is correct without it, just larger than it needs to be.
CREATE OR REPLACE FUNCTION public.prune_rate_limits(
  p_older_than_seconds INTEGER DEFAULT 86400
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - make_interval(secs => p_older_than_seconds);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prune_rate_limits(INTEGER) FROM PUBLIC, anon, authenticated;
