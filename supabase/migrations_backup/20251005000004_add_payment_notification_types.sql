-- Add payment-related notification types to the enum constraint

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'asset_reference_request',
    'asset_reference_approved',
    'asset_reference_rejected',
    'document_reference_request',
    'document_reference_approved',
    'document_reference_rejected',
    'project_collaboration_invite',
    'project_published',
    'comment_mention',
    'system_announcement',
    'purchase_complete',
    'revenue_earned',
    'payment_failed',
    'payout_processing',
    'payout_completed',
    'payout_failed'
  ));
