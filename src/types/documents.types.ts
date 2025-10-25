import type { BaseEntity } from "./common.types";

export type DocumentBlockType = 'paragraph' | 'heading' | 'list_item' | 'image' | 'code' | 'table' | 'quote' | 'callout';
export type DocumentCollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface Document extends BaseEntity {
  handle: string;
  title: string;
  description: string;
  user_id: string;
}

export interface DocumentBlock extends BaseEntity {
  document_id: string;
  parent_id: string | null;
  block_type: DocumentBlockType;
  content: Record<string, unknown>;
  position: number;
}

export interface DocumentAttachment extends BaseEntity {
  document_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
}

export interface DocumentCollaborator extends BaseEntity {
  document_id: string;
  user_id: string;
  role: DocumentCollaboratorRole;
  can_edit: boolean;
  can_delete: boolean;
  can_invite: boolean;
}
