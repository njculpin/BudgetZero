-- Create collaboration proposals table for asset-based collaboration
-- This allows game designers to propose collaboration with modelers/illustrators

CREATE TYPE collaboration_proposal_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

CREATE TABLE collaboration_proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES game_projects(id) ON DELETE CASCADE,
  proposer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL CHECK (length(message) >= 20 AND length(message) <= 1000),
  status collaboration_proposal_status DEFAULT 'pending' NOT NULL,
  response_message TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_collaboration_proposals_asset ON collaboration_proposals(asset_id);
CREATE INDEX idx_collaboration_proposals_proposer ON collaboration_proposals(proposer_id);
CREATE INDEX idx_collaboration_proposals_recipient ON collaboration_proposals(recipient_id);
CREATE INDEX idx_collaboration_proposals_status ON collaboration_proposals(status);
CREATE INDEX idx_collaboration_proposals_project ON collaboration_proposals(project_id) WHERE project_id IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER update_collaboration_proposals_updated_at
  BEFORE UPDATE ON collaboration_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE collaboration_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Proposers can view their own proposals
CREATE POLICY "Proposers can view own proposals" ON collaboration_proposals
  FOR SELECT USING (auth.uid() = proposer_id);

-- Recipients can view proposals sent to them
CREATE POLICY "Recipients can view proposals" ON collaboration_proposals
  FOR SELECT USING (auth.uid() = recipient_id);

-- Authenticated users can create proposals (with check that they're the proposer)
CREATE POLICY "Users can create proposals" ON collaboration_proposals
  FOR INSERT WITH CHECK (auth.uid() = proposer_id);

-- Recipients can update proposals (for accepting/declining)
CREATE POLICY "Recipients can update proposals" ON collaboration_proposals
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Proposers can delete pending proposals
CREATE POLICY "Proposers can delete pending proposals" ON collaboration_proposals
  FOR DELETE USING (
    auth.uid() = proposer_id AND
    status = 'pending'
  );

-- Comments
COMMENT ON TABLE collaboration_proposals IS 'Collaboration proposals from game designers to asset creators';
COMMENT ON COLUMN collaboration_proposals.asset_id IS 'The asset (model/illustration) being proposed for collaboration';
COMMENT ON COLUMN collaboration_proposals.project_id IS 'Optional: The specific project the asset would be used in';
COMMENT ON COLUMN collaboration_proposals.proposer_id IS 'User proposing the collaboration (usually game designer)';
COMMENT ON COLUMN collaboration_proposals.recipient_id IS 'Asset creator receiving the proposal';
COMMENT ON COLUMN collaboration_proposals.message IS 'Proposal message from proposer to recipient';
COMMENT ON COLUMN collaboration_proposals.status IS 'Current status of the proposal';
COMMENT ON COLUMN collaboration_proposals.response_message IS 'Optional response from recipient when accepting/declining';
COMMENT ON COLUMN collaboration_proposals.expires_at IS 'Proposals expire after 30 days if not responded to';
