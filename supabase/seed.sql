-- Seed file for Workshop platform
-- This creates sample users, projects, assets, and references for testing

-- First, we need to create users in auth.users which will trigger our handle_new_user function
-- For local development, we'll insert test users with passwords

-- Insert test users into auth.users (Supabase handles this)
-- Note: In local dev, you can create users via the Supabase Studio UI or use the auth API

-- For now, let's create public.users records directly (simulating what the trigger would do)
-- In production, these would be created automatically by the handle_new_user trigger

-- Create two test users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'authenticated',
  'authenticated',
  'demo@workshop.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid,
  'authenticated',
  'authenticated',
  'creator@workshop.com',
  crypt('creator123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- The trigger should have created users in public.users, but let's ensure they exist
INSERT INTO users (id, email, full_name, created_at, updated_at)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'demo@workshop.com', 'Demo User', NOW(), NOW()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, 'creator@workshop.com', 'Jane Creator', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name;

-- Insert projects
INSERT INTO projects (title, description, slug, status, creator_id, published_at, created_at, updated_at)
VALUES
  ('Realm of Dragons', 'A fantasy tabletop RPG with dragons, magic, and adventure', 'realm-of-dragons', 'published', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, NOW(), NOW(), NOW()),
  ('Space Station Alpha', 'Sci-fi game set on a futuristic space station', 'space-station-alpha', 'published', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, NOW(), NOW(), NOW()),
  ('Mystic Quest', 'Adventure game with mystical elements', 'mystic-quest', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, NULL, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insert assets
INSERT INTO assets (title, description, asset_type, status, creator_id, project_id, created_at, updated_at)
SELECT
  'Medieval Castle 3D Model',
  'Detailed 3D model of a medieval castle',
  'model'::asset_type,
  'active'::asset_status,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  p.id,
  NOW(),
  NOW()
FROM projects p WHERE p.slug = 'realm-of-dragons'
UNION ALL
SELECT
  'Fantasy Character Illustrations Set',
  'Set of character illustrations for fantasy games',
  'illustration'::asset_type,
  'active'::asset_status,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  p.id,
  NOW(),
  NOW()
FROM projects p WHERE p.slug = 'realm-of-dragons'
UNION ALL
SELECT
  'Spaceship Fleet Models',
  '3D models of various spaceships',
  'model'::asset_type,
  'active'::asset_status,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  p.id,
  NOW(),
  NOW()
FROM projects p WHERE p.slug = 'space-station-alpha'
UNION ALL
SELECT
  'Board Game Card Backs',
  'Illustration designs for card backs',
  'illustration'::asset_type,
  'active'::asset_status,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  p.id,
  NOW(),
  NOW()
FROM projects p WHERE p.slug = 'space-station-alpha'
ON CONFLICT DO NOTHING;

-- Insert asset royalties
INSERT INTO asset_royalties (asset_id, percentage, is_active, created_at, updated_at)
SELECT a.id, 15.00, true, NOW(), NOW()
FROM assets a WHERE a.title = 'Medieval Castle 3D Model'
UNION ALL
SELECT a.id, 20.00, true, NOW(), NOW()
FROM assets a WHERE a.title = 'Fantasy Character Illustrations Set'
UNION ALL
SELECT a.id, 10.00, true, NOW(), NOW()
FROM assets a WHERE a.title = 'Board Game Card Backs'
ON CONFLICT DO NOTHING;

-- Insert project asset references (from Jane's project to Demo's assets)
INSERT INTO project_asset_references (project_id, asset_id, asset_royalty_id, status, requested_by, requested_at, created_at, updated_at)
SELECT
  p.id,
  a.id,
  ar.id,
  'pending'::reference_status,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid,
  NOW(),
  NOW(),
  NOW()
FROM projects p
CROSS JOIN assets a
JOIN asset_royalties ar ON ar.asset_id = a.id
WHERE p.slug = 'mystic-quest' AND a.title = 'Medieval Castle 3D Model'
UNION ALL
SELECT
  p.id,
  a.id,
  ar.id,
  'approved'::reference_status,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid,
  NOW(),
  NOW(),
  NOW()
FROM projects p
CROSS JOIN assets a
JOIN asset_royalties ar ON ar.asset_id = a.id
WHERE p.slug = 'mystic-quest' AND a.title = 'Fantasy Character Illustrations Set'
UNION ALL
SELECT
  p.id,
  a.id,
  ar.id,
  'rejected'::reference_status,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid,
  NOW(),
  NOW(),
  NOW()
FROM projects p
CROSS JOIN assets a
JOIN asset_royalties ar ON ar.asset_id = a.id
WHERE p.slug = 'mystic-quest' AND a.title = 'Board Game Card Backs'
ON CONFLICT (project_id, asset_id) DO NOTHING;
