-- Budget Zero Development Seed Data

-- Create initial admin user (will be the first user to create invites)
INSERT INTO users (id, email, name, bio) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@budgetzero.dev', 'Admin User', 'Platform administrator for development');

-- Create some initial invite codes for testing
INSERT INTO invites (code, inviter_id, invite_type, max_uses, status) VALUES 
('CREATOR2024', '00000000-0000-0000-0000-000000000001', 'creator', 10, 'active'),
('CONTRIB2024', '00000000-0000-0000-0000-000000000001', 'contributor', 20, 'active'),
('VIP2024', '00000000-0000-0000-0000-000000000001', 'vip', 5, 'active'),
('GENERAL2024', '00000000-0000-0000-0000-000000000001', 'general', 50, 'active');

-- Initialize invite stats for admin user
INSERT INTO user_invite_stats (user_id, total_invites_sent) VALUES 
('00000000-0000-0000-0000-000000000001', 4);

-- Create a sample project for testing
INSERT INTO projects (id, name, description, creator_id) VALUES 
('00000000-0000-0000-0000-000000000002', 'Sample Board Game', 'A strategic board game about resource management and city building', '00000000-0000-0000-0000-000000000001');

-- Create sample milestones
INSERT INTO milestones (project_id, title, description, funding_goal, order_index) VALUES 
('00000000-0000-0000-0000-000000000002', 'Core Game Mechanics', 'Design and document the basic game mechanics and rules', 2500, 1),
('00000000-0000-0000-0000-000000000002', 'Artwork & Visual Design', 'Create artwork for cards, board, and game components', 5000, 2),
('00000000-0000-0000-0000-000000000002', 'Playtesting & Balancing', 'Conduct playtesting sessions and balance the game', 1500, 3);

-- Create initial rulebook
INSERT INTO rulebooks (project_id, title, content) VALUES 
('00000000-0000-0000-0000-000000000002', 'Sample Board Game Rules', '# Game Overview

This is a strategic board game for 2-4 players.

## Components
- 1 Game Board
- 120 Resource Cards
- 60 Building Tokens
- 4 Player Boards

## Setup
1. Place the game board in the center
2. Shuffle the resource cards
3. Give each player a player board

## Gameplay
Players take turns collecting resources and building structures to score points.

*This is placeholder content for development purposes.*');

-- Print success message
SELECT 'Database seeded successfully! Use these invite codes for testing:' as message;
SELECT code, invite_type, max_uses FROM invites WHERE inviter_id = '00000000-0000-0000-0000-000000000001';
