-- Insert sample data for development/testing
-- Note: In local development, we create mock auth users first

-- Create sample auth users for local development
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES
    ('550e8400-e29b-41d4-a716-446655440000', '00000000-0000-0000-0000-000000000000', 'alice@gamedev.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('550e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', 'bob@creativegames.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('550e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', 'carol@artgames.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Insert sample profiles (will be created automatically when users sign up)
INSERT INTO public.profiles (id, email, full_name, avatar_url) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'alice@gamedev.com', 'Alice Johnson', 'https://images.unsplash.com/photo-1494790108755-2616b612b787?w=150'),
    ('550e8400-e29b-41d4-a716-446655440001', 'bob@creativegames.com', 'Bob Smith', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
    ('550e8400-e29b-41d4-a716-446655440002', 'carol@artgames.com', 'Carol Davis', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150')
ON CONFLICT (id) DO NOTHING;

-- Insert sample game projects
INSERT INTO public.game_projects (id, name, description, category, status, creator_id, target_audience, estimated_players, estimated_playtime, concept_art_url) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', 'Mystic Realms', 'A fantasy adventure board game where players explore magical kingdoms and battle ancient creatures. Features modular board pieces and cooperative gameplay.', 'board-game', 'in-development', '550e8400-e29b-41d4-a716-446655440000', 'Ages 12+', '2-4 players', '60-90 minutes', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'),
    ('660e8400-e29b-41d4-a716-446655440001', 'Space Merchants', 'A strategic card game about interstellar trade and diplomacy. Build your fleet, negotiate with alien races, and dominate the galaxy through commerce.', 'card-game', 'idea', '550e8400-e29b-41d4-a716-446655440001', 'Ages 14+', '3-6 players', '45-60 minutes', 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=400'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Chronicles of Aetheria', 'An immersive tabletop RPG set in a steampunk world where magic and technology coexist. Features dynamic storytelling mechanics.', 'rpg', 'completed', '550e8400-e29b-41d4-a716-446655440002', 'Ages 16+', '3-8 players', '2-4 hours', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400')
ON CONFLICT (id) DO NOTHING;

-- Insert sample milestones
INSERT INTO public.milestones (id, project_id, name, description, funding_goal, current_funding, deliverables, timeline_weeks, required_skills, status, deadline) VALUES
    ('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'Core Artwork', 'Create all essential artwork including character designs, board illustrations, and card art', 5000, 2500, ARRAY['Character concept art', 'Board layout design', 'Card illustrations', 'Game box design'], 8, ARRAY['digital illustration', 'concept art', 'graphic design'], 'funding', '2024-03-15'),
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', 'Game Components', 'Design and produce all physical game components including tokens, cards, and board pieces', 8000, 1200, ARRAY['Miniature sculpts', 'Token designs', 'Card layouts', 'Rule book'], 12, ARRAY['3d modeling', 'graphic design', 'technical writing'], 'planning', '2024-05-01'),
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Card Design', 'Complete card artwork and balance gameplay mechanics', 3000, 500, ARRAY['100+ card illustrations', 'Gameplay balancing', 'Card templates'], 6, ARRAY['digital art', 'game design'], 'planning', '2024-04-01')
ON CONFLICT (id) DO NOTHING;

-- Insert sample contributors
INSERT INTO public.contributors (id, user_id, project_id, milestone_id, role, compensation_type, compensation_details, status, application_message, portfolio_links) VALUES
    ('880e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 'illustrator', 'fixed', '$2000 for complete artwork package', 'accepted', 'I have 5 years of fantasy illustration experience and would love to bring your world to life!', ARRAY['https://artstation.com/bobsmith', 'https://dribbble.com/bobsmith']),
    ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440001', '3d-modeler', 'royalty', '5% of net profits from sales', 'applied', 'Experienced in miniature design for board games. Check out my portfolio!', ARRAY['https://cgartist.com/caroldavis', 'https://sketchfab.com/caroldavis']),
    ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'graphic-designer', 'hybrid', '10% equity + $1000 upfront', 'active', 'Love the space theme! I can create amazing card layouts and UI elements.', ARRAY['https://behance.net/alicejohnson'])
ON CONFLICT (id) DO NOTHING;

-- Insert sample rulebooks
INSERT INTO public.rulebooks (id, project_id, title, content, version, last_edited_by, is_published) VALUES
    ('990e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'Mystic Realms - Official Rulebook', '<h1>Mystic Realms</h1><h2>Overview</h2><p>Welcome to the mystical world of Aetheria, where magic flows through ancient ley lines and brave adventurers seek glory and treasure.</p><h2>Components</h2><ul><li>1 Modular game board (9 pieces)</li><li>4 Hero miniatures</li><li>50 Adventure cards</li><li>30 Treasure tokens</li><li>6 Custom dice</li></ul><h2>Setup</h2><p>Each player chooses a hero and places their miniature on the starting space...</p>', 1, '550e8400-e29b-41d4-a716-446655440000', true),
    ('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Space Merchants - Core Rules', '<h1>Space Merchants</h1><h2>Overview</h2><p>In the year 2387, humanity has spread across the galaxy, establishing trade routes between distant worlds.</p><h2>Components</h2><ul><li>120 Trade cards</li><li>40 Ship cards</li><li>80 Resource tokens</li><li>6 Player boards</li></ul>', 1, '550e8400-e29b-41d4-a716-446655440001', false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample rulebook versions
INSERT INTO public.rulebook_versions (id, rulebook_id, content, version, edited_by, change_summary) VALUES
    ('aa0e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440000', '<h1>Mystic Realms</h1><h2>Overview</h2><p>Welcome to Aetheria...</p>', 1, '550e8400-e29b-41d4-a716-446655440000', 'Initial version of the rulebook'),
    ('aa0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '<h1>Space Merchants</h1><h2>Overview</h2><p>Trade among the stars...</p>', 1, '550e8400-e29b-41d4-a716-446655440001', 'First draft of core rules')
ON CONFLICT (id) DO NOTHING;