-- Seed common Creative Commons and custom licenses
-- Using deterministic UUIDs for consistent references

INSERT INTO licenses (id, title, version, agreement, tags, created_at, updated_at, is_deleted, deleted_at)
VALUES
  -- CC0 (Public Domain)
  (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'CC0 1.0 Universal (Public Domain)',
    '1.0',
    'The person who associated a work with this deed has dedicated the work to the public domain by waiving all of his or her rights to the work worldwide under copyright law, including all related and neighboring rights, to the extent allowed by law. You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.',
    'cc0,public-domain,free,commercial',
    NOW(),
    NOW(),
    FALSE,
    NULL
  ),

  -- CC BY
  (
    'a0000000-0000-0000-0000-000000000002'::uuid,
    'CC BY 4.0 (Attribution)',
    '4.0',
    'You are free to: Share — copy and redistribute the material in any medium or format; Adapt — remix, transform, and build upon the material for any purpose, even commercially. Under the following terms: Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.',
    'cc-by,attribution,free,commercial',
    NOW(),
    NOW(),
    FALSE,
    NULL
  ),

  -- CC BY-SA
  (
    'a0000000-0000-0000-0000-000000000003'::uuid,
    'CC BY-SA 4.0 (Attribution-ShareAlike)',
    '4.0',
    'You are free to: Share — copy and redistribute the material in any medium or format; Adapt — remix, transform, and build upon the material for any purpose, even commercially. Under the following terms: Attribution — You must give appropriate credit; ShareAlike — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.',
    'cc-by-sa,attribution,share-alike,copyleft,commercial',
    NOW(),
    NOW(),
    FALSE,
    NULL
  ),

  -- CC BY-NC
  (
    'a0000000-0000-0000-0000-000000000004'::uuid,
    'CC BY-NC 4.0 (Attribution-NonCommercial)',
    '4.0',
    'You are free to: Share — copy and redistribute the material in any medium or format; Adapt — remix, transform, and build upon the material. Under the following terms: Attribution — You must give appropriate credit; NonCommercial — You may not use the material for commercial purposes.',
    'cc-by-nc,attribution,non-commercial',
    NOW(),
    NOW(),
    FALSE,
    NULL
  ),

  -- Custom License Template
  (
    'a0000000-0000-0000-0000-000000000005'::uuid,
    'Custom License',
    '1.0',
    'This asset is licensed under custom terms defined by the creator. Please contact the asset owner for specific usage rights and restrictions.',
    'custom,contact-owner',
    NOW(),
    NOW(),
    FALSE,
    NULL
  )
ON CONFLICT (id) DO NOTHING;
