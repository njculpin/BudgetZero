-- Test RLS policies for assets table
-- Tests the 4-state asset status system visibility rules

BEGIN;

SELECT plan(18); -- Number of tests we'll run

-- Switch to anon role to test RLS properly (postgres role bypasses RLS)
SET ROLE anon;

-- Create test users (using service role temporarily)
SET ROLE postgres;
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner@test.com', crypt('password', gen_salt('bf')), NOW(), '{}', '{}', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'other@test.com', crypt('password', gen_salt('bf')), NOW(), '{}', '{}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test assets with different statuses
INSERT INTO public.assets (id, user_id, title, handle, status, deleted)
VALUES
  -- Owner's assets with all 4 statuses
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Draft Asset', 'draft-asset-rls-test', 'draft', false),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Private Asset', 'private-asset-rls-test', 'private', false),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Public Asset', 'public-asset-rls-test', 'public', false),
  ('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Archived Asset', 'archived-asset-rls-test', 'archived', false),
  -- Soft-deleted public asset (should not be visible)
  ('a0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Deleted Public Asset', 'deleted-public-rls-test', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TEST GROUP 1: Anonymous User (not logged in)
-- ============================================

-- Switch to anon role (simulates anonymous/unauthenticated user)
SET ROLE anon;

-- Test 1: Anonymous users can ONLY see public assets
SELECT results_eq(
  $$SELECT id::text FROM public.assets WHERE deleted = false ORDER BY id$$,
  ARRAY['a0000000-0000-0000-0000-000000000003'],
  'Anonymous users can only view public assets'
);

-- Test 2: Anonymous users cannot see draft assets
SELECT is_empty(
  $$SELECT id FROM public.assets WHERE status = 'draft'$$,
  'Anonymous users cannot view draft assets'
);

-- Test 3: Anonymous users cannot see private assets
SELECT is_empty(
  $$SELECT id FROM public.assets WHERE status = 'private'$$,
  'Anonymous users cannot view private assets'
);

-- Test 4: Anonymous users cannot see archived assets
SELECT is_empty(
  $$SELECT id FROM public.assets WHERE status = 'archived'$$,
  'Anonymous users cannot view archived assets'
);

-- Test 5: Anonymous users cannot see deleted public assets
SELECT results_eq(
  $$SELECT COUNT(*)::integer FROM public.assets WHERE id = 'a0000000-0000-0000-0000-000000000005'$$,
  ARRAY[0],
  'Anonymous users cannot view soft-deleted public assets'
);

-- ============================================
-- TEST GROUP 2: Owner User (authenticated as owner)
-- ============================================

-- Switch to authenticated role and set JWT claims to simulate owner
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

-- Test 6: Owner can see their own draft assets
SELECT results_eq(
  $$SELECT id::text FROM public.assets WHERE status = 'draft' AND deleted = false$$,
  ARRAY['a0000000-0000-0000-0000-000000000001'],
  'Owner can view their own draft assets'
);

-- Test 7: Owner can see their own private assets
SELECT results_eq(
  $$SELECT id::text FROM public.assets WHERE status = 'private' AND deleted = false$$,
  ARRAY['a0000000-0000-0000-0000-000000000002'],
  'Owner can view their own private assets'
);

-- Test 8: Owner can see their own public assets
SELECT results_eq(
  $$SELECT id::text FROM public.assets WHERE status = 'public' AND deleted = false$$,
  ARRAY['a0000000-0000-0000-0000-000000000003'],
  'Owner can view their own public assets'
);

-- Test 9: Owner can see their own archived assets
SELECT results_eq(
  $$SELECT id::text FROM public.assets WHERE status = 'archived' AND deleted = false$$,
  ARRAY['a0000000-0000-0000-0000-000000000004'],
  'Owner can view their own archived assets'
);

-- Test 10: Owner can see ALL their non-deleted assets
SELECT results_eq(
  $$SELECT COUNT(*)::integer FROM public.assets WHERE user_id = '11111111-1111-1111-1111-111111111111' AND deleted = false$$,
  ARRAY[4],
  'Owner can view all 4 of their non-deleted assets'
);

-- Test 11: Owner can UPDATE their own assets
SELECT lives_ok(
  $$UPDATE public.assets SET title = 'Updated Draft' WHERE id = 'a0000000-0000-0000-0000-000000000001'$$,
  'Owner can update their own assets'
);

-- Test 12: Owner can change status of their own assets
SELECT lives_ok(
  $$UPDATE public.assets SET status = 'public' WHERE id = 'a0000000-0000-0000-0000-000000000001'$$,
  'Owner can change status of their own assets'
);

-- Test 13: Owner can DELETE (soft-delete) their own assets
SELECT lives_ok(
  $$UPDATE public.assets SET deleted = true WHERE id = 'a0000000-0000-0000-0000-000000000001'$$,
  'Owner can soft-delete their own assets'
);

-- ============================================
-- TEST GROUP 3: Other User (authenticated as non-owner)
-- ============================================

-- Switch JWT claims to different user (still authenticated role)
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', '22222222-2222-2222-2222-222222222222')::text, true);

-- Test 14: Other users can ONLY see public assets (not owner's draft/private/archived)
SELECT results_eq(
  $$SELECT id::text FROM public.assets WHERE deleted = false ORDER BY id$$,
  ARRAY['a0000000-0000-0000-0000-000000000003'],
  'Other users can only view public assets, not owner private/draft/archived'
);

-- Test 15: Other users cannot see owner's draft assets
SELECT is_empty(
  $$SELECT id FROM public.assets WHERE status = 'draft' AND user_id = '11111111-1111-1111-1111-111111111111'$$,
  'Other users cannot view owner draft assets'
);

-- Test 16: Other users cannot see owner's private assets
SELECT is_empty(
  $$SELECT id FROM public.assets WHERE status = 'private' AND user_id = '11111111-1111-1111-1111-111111111111'$$,
  'Other users cannot view owner private assets'
);

-- Test 17: Other users cannot UPDATE owner's assets (UPDATE affects 0 rows due to RLS)
-- We test this by checking that the asset title didn't change
SELECT lives_ok(
  $$UPDATE public.assets SET title = 'Hacked' WHERE id = 'a0000000-0000-0000-0000-000000000003'$$,
  'UPDATE completes without error but affects 0 rows'
);

-- Test 18: Verify the asset was NOT actually updated (RLS blocked it)
SET ROLE postgres; -- Temporarily use postgres to read actual value
SELECT is(
  (SELECT title FROM public.assets WHERE id = 'a0000000-0000-0000-0000-000000000003'),
  'Public Asset',
  'Other users cannot update assets they do not own (title unchanged)'
);
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', '22222222-2222-2222-2222-222222222222')::text, true);

SELECT * FROM finish();

ROLLBACK;
