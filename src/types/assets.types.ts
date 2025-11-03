import type { BaseEntity, BaseEntityWithoutDelete } from "./common.types";

export type AssetStatus = 'draft' | 'published' | 'archived';
export type AssetCollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface Asset extends BaseEntity {
  handle: string;
  user_id: string;
  title: string;
  description: string;
  status: AssetStatus;
  download_count: number;
  total_size_bytes: number;
  file_count: number;
}

export interface AssetCollaborator extends BaseEntity {
  asset_id: string;
  user_id: string;
  role: AssetCollaboratorRole;
  can_edit: boolean;
  can_delete: boolean;
  can_invite: boolean;
}

export interface AssetFile extends BaseEntity {
  asset_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  position: number;
}

export interface AssetImage extends BaseEntity {
  asset_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  position: number;
}

export interface AssetTag extends BaseEntity {
  asset_id: string;
  value: string;
}

export interface AssetRoyalty extends BaseEntity {
  asset_id: string;
  user_id: string;
  royalty_type: 'fixed';
  royalty_value: number; // Flat rate in cents
}

export interface AssetLicense extends BaseEntity {
  asset_id: string;
  license_id: string;
  is_active: boolean;
  granted_at: string;
  expires_at: string;
}

export interface AssetChatMessage extends BaseEntity {
  asset_id: string;
  user_id: string;
  message: string;
}

export interface AssetChatMessageReaction extends BaseEntity {
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface AssetChatMessageAttachment extends BaseEntity {
  message_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
}

export interface AssetDownload extends BaseEntityWithoutDelete {
  asset_id: string;
  user_id: string;
  sale_id: string;
  download_url: string;
  expires_at: string;
}
