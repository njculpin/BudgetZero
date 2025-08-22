-- Budget Zero Database Schema
-- Local-first development with PostgreSQL

-- Users table with invite tracking
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  bio TEXT,
  avatar_url VARCHAR,
  invited_by_user_id UUID REFERENCES users(id), -- Track who invited this user
  invited_by_code VARCHAR, -- The specific invite code used
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES users(id),
  status VARCHAR DEFAULT 'Idea',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invite System with Usage Tracking & Rewards
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL, -- Short, memorable invite codes
  inviter_id UUID REFERENCES users(id) NOT NULL,
  invite_type VARCHAR DEFAULT 'general', -- 'creator', 'contributor', 'general', 'vip'
  max_uses INTEGER DEFAULT 1, -- How many times this code can be used
  current_uses INTEGER DEFAULT 0, -- How many times it's been used
  expires_at TIMESTAMP, -- Optional expiration
  status VARCHAR DEFAULT 'active', -- 'active', 'exhausted', 'expired', 'revoked'
  metadata JSONB, -- Extra data like special permissions, rewards, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

-- Track each invite usage for analytics and rewards
CREATE TABLE invite_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID REFERENCES invites(id) NOT NULL,
  inviter_id UUID REFERENCES users(id) NOT NULL, -- Denormalized for faster queries
  invitee_id UUID REFERENCES users(id) NOT NULL, -- Who used the invite
  invitee_email VARCHAR NOT NULL, -- Email at time of signup
  used_at TIMESTAMP DEFAULT NOW(),
  ip_address INET, -- For fraud detection
  user_agent TEXT -- For analytics
);

-- Invite rewards system
CREATE TABLE invite_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  invite_usage_id UUID REFERENCES invite_usages(id),
  reward_type VARCHAR NOT NULL, -- 'invite_credits', 'platform_credits', 'badge', 'feature_access'
  reward_value INTEGER, -- Amount of credits, days of access, etc.
  reward_data JSONB, -- Additional reward metadata
  status VARCHAR DEFAULT 'pending', -- 'pending', 'granted', 'revoked'
  granted_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User invite statistics (for gamification)
CREATE TABLE user_invite_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_invites_sent INTEGER DEFAULT 0,
  total_invites_used INTEGER DEFAULT 0,
  successful_signups INTEGER DEFAULT 0, -- Users who actually completed onboarding
  active_invitees INTEGER DEFAULT 0, -- Invitees who are still active (30+ days)
  invite_credits_earned INTEGER DEFAULT 0, -- Total credits earned from invites
  invite_level INTEGER DEFAULT 1, -- Gamification level based on successful invites
  last_invite_sent_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Milestones table (basic structure for now)
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  funding_goal INTEGER DEFAULT 0,
  current_funding INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'planning', -- 'planning', 'active', 'funded', 'completed', 'failed'
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rulebooks table (basic structure for now)
CREATE TABLE rulebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  title VARCHAR NOT NULL,
  content TEXT, -- Will store rich text content
  version VARCHAR DEFAULT '1.0',
  status VARCHAR DEFAULT 'draft', -- 'draft', 'review', 'final', 'published'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_invited_by ON users(invited_by_user_id);
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_invites_code ON invites(code);
CREATE INDEX idx_invites_inviter ON invites(inviter_id);
CREATE INDEX idx_invite_usages_inviter ON invite_usages(inviter_id);
CREATE INDEX idx_invite_usages_invitee ON invite_usages(invitee_id);
CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_rulebooks_project ON rulebooks(project_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rulebooks_updated_at BEFORE UPDATE ON rulebooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_invite_stats_updated_at BEFORE UPDATE ON user_invite_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
