/**
 * Monitoring provider configuration.
 *
 * The ONLY file that talks to a monitoring SDK. Everything else imports from
 * `./index`, so replacing the provider is a change to this file alone.
 *
 * Sentry is loaded lazily and only when `PUBLIC_SENTRY_DSN` is set. That keeps
 * local development and CI quiet, and means a missing DSN degrades to structured
 * console output rather than crashing the app.
 */

export type Severity = 'error' | 'warning' | 'info';

type SentryModule = {
  captureException: (
    error: Error,
    hint?: { level?: Severity; extra?: Record<string, unknown> }
  ) => void;
};

const dsn = import.meta.env.PUBLIC_SENTRY_DSN || process.env.PUBLIC_SENTRY_DSN;

/**
 * Resolved once and cached. `null` means "no provider configured"; the promise is
 * stored rather than awaited at module scope so importing this file never blocks.
 */
let sentryPromise: Promise<SentryModule | null> | null = null;

function loadSentry(): Promise<SentryModule | null> {
  if (!dsn) {
    return Promise.resolve(null);
  }

  if (!sentryPromise) {
    // Imported by name built at runtime so bundlers do not try to resolve the
    // package when it is not installed. Sentry is an optional dependency here:
    // without it, reports fall through to console.
    const moduleName = '@sentry/astro';
    sentryPromise = import(/* @vite-ignore */ moduleName)
      .then((mod) => mod as SentryModule)
      .catch(() => {
        console.warn(
          'PUBLIC_SENTRY_DSN is set but @sentry/astro is not installed. ' +
            'Run `npm install @sentry/astro` to enable error reporting.'
        );
        return null;
      });
  }

  return sentryPromise;
}

/**
 * Emit one report.
 *
 * Always writes a structured line to the platform log, so an outage in the
 * monitoring provider never means an unrecorded failure. When a provider is
 * configured, the report is additionally forwarded to it.
 */
export function captureToProvider(
  severity: Severity,
  error: Error,
  context: Record<string, unknown>
): void {
  const { operation, ...extra } = context;

  const line = JSON.stringify({
    severity,
    operation,
    message: error.message,
    stack: error.stack,
    ...extra,
  });

  if (severity === 'error') {
    console.error(line);
  } else {
    console.warn(line);
  }

  void loadSentry().then((sentry) => {
    sentry?.captureException(error, {
      level: severity,
      extra: context,
    });
  });
}
