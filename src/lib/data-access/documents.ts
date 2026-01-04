import { serverClient } from "./client";
import type {
  Document,
  DocumentCollaborator,
  DocumentCollaboratorRole,
  User,
} from "@/types";
import { generateHandle } from "./handles";

export interface CreateDocumentParams {
  handle: string;
}

export interface UpdateDocumentParams {
  title?: string;
  description?: string;
  handle?: string;
}

// TipTap stores content as JSON
export type TipTapContent = {
  type: string;
  content?: TipTapContent[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
};

/**
 * Generate a unique handle with collision handling
 */
const generateUniqueHandle = async (baseHandle: string): Promise<string> => {
  let handle = baseHandle;
  let counter = 1;
  let isAvailable = await checkHandleAvailability(handle);

  while (!isAvailable) {
    handle = `${baseHandle}-${counter}`;
    counter++;
    isAvailable = await checkHandleAvailability(handle);
  }

  return handle;
};

/**
 * Create a new document
 */
export const createDocument = async (userId: string): Promise<Document | null> => {
  const baseHandle = generateHandle();
  const handle = await generateUniqueHandle(baseHandle);
  const { data, error } = await serverClient
    .from("documents")
    .insert({
      user_id: userId,
      handle: handle,
      title: handle,
      description: "",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating document:", error);
    return null;
  }

  const document = data as Document;

  // Automatically add creator as owner collaborator
  const { error: collaboratorError } = await serverClient
    .from("document_collaborators")
    .insert({
      document_id: document.id,
      user_id: userId,
      role: "owner",
      can_edit: true,
      can_delete: true,
      can_invite: true,
    });

  if (collaboratorError) {
    console.error("Error creating document collaborator:", collaboratorError);
  }

  return document;
};

/**
 * Fetch document by ID
 * Returns null if document doesn't exist or is deleted
 */
export const getDocumentById = async (documentId: string): Promise<Document | null> => {
  const { data, error } = await serverClient
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("deleted", false)
    .single();

  if (error) {
    return null;
  }

  return data as Document;
};

/**
 * Fetch document by handle
 * Returns null if document doesn't exist or is deleted
 */
export const getDocumentByHandle = async (handle: string): Promise<Document | null> => {
  const { data, error } = await serverClient
    .from("documents")
    .select("*")
    .eq("handle", handle)
    .eq("deleted", false)
    .single();

  if (error) {
    return null;
  }

  return data as Document;
};

/**
 * Fetch all documents for a user (owned or collaborating)
 */
export const getUserDocuments = async (userId: string): Promise<Document[]> => {
  // Get documents owned by the user
  const { data: ownedDocs, error: ownedError } = await serverClient
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .eq("deleted", false)
    .order("updated_at", { ascending: false });

  if (ownedError) {
    console.error("Error fetching user documents:", ownedError);
    return [];
  }

  // Get documents user collaborates on
  const { data: collabData, error: collabError } = await serverClient
    .from("document_collaborators")
    .select("document_id")
    .eq("user_id", userId)
    .eq("deleted", false);

  if (collabError) {
    console.error("Error fetching collaborations:", collabError);
    return ownedDocs as Document[];
  }

  const collabDocIds = collabData
    .map((c) => c.document_id)
    .filter((id) => !ownedDocs?.some((d) => d.id === id));

  if (collabDocIds.length === 0) {
    return ownedDocs as Document[];
  }

  const { data: collabDocs, error: collabDocsError } = await serverClient
    .from("documents")
    .select("*")
    .in("id", collabDocIds)
    .eq("deleted", false)
    .order("updated_at", { ascending: false });

  if (collabDocsError) {
    console.error("Error fetching collab documents:", collabDocsError);
    return ownedDocs as Document[];
  }

  // Combine and sort by updated_at
  const allDocs = [...(ownedDocs || []), ...(collabDocs || [])];
  allDocs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return allDocs as Document[];
};

/**
 * Update document metadata
 * Automatically generates handle from title if title is updated
 */
export const updateDocument = async (
  documentId: string,
  updates: UpdateDocumentParams
): Promise<Document | null> => {
  const updatesToApply = { ...updates };

  // If updating title, generate new handle from it
  if (updates.title) {
    const titleSlug = updates.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const isAvailable = await checkHandleAvailability(titleSlug, documentId);

    if (isAvailable) {
      updatesToApply.handle = titleSlug;
    } else {
      let counter = 1;
      let uniqueHandle = `${titleSlug}-${counter}`;
      let available = await checkHandleAvailability(uniqueHandle, documentId);

      while (!available) {
        counter++;
        uniqueHandle = `${titleSlug}-${counter}`;
        available = await checkHandleAvailability(uniqueHandle, documentId);
      }

      updatesToApply.handle = uniqueHandle;
    }
  }

  const { error } = await serverClient
    .from("documents")
    .update({
      ...updatesToApply,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (error) {
    throw error;
  }

  return getDocumentById(documentId);
};

/**
 * Update document content (TipTap JSON)
 */
export const updateDocumentContent = async (
  documentId: string,
  content: TipTapContent
): Promise<boolean> => {
  const { error } = await serverClient
    .from("documents")
    .update({
      content: content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (error) {
    console.error("Error updating document content:", error);
    return false;
  }

  return true;
};

/**
 * Get document content
 */
export const getDocumentContent = async (
  documentId: string
): Promise<TipTapContent | null> => {
  const { data, error } = await serverClient
    .from("documents")
    .select("content")
    .eq("id", documentId)
    .eq("deleted", false)
    .single();

  if (error) {
    console.error("Error fetching document content:", error);
    return null;
  }

  return (data?.content as TipTapContent) || null;
};

/**
 * Check if a handle is available for documents
 */
export const checkHandleAvailability = async (
  handle: string,
  currentDocumentId?: string
): Promise<boolean> => {
  let query = serverClient
    .from("documents")
    .select("id")
    .eq("handle", handle)
    .eq("deleted", false);

  if (currentDocumentId) {
    query = query.neq("id", currentDocumentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error checking handle availability:", error);
    return false;
  }

  return !data || data.length === 0;
};

/**
 * Delete document (soft delete)
 */
export const deleteDocument = async (documentId: string): Promise<boolean> => {
  const { error } = await serverClient
    .from("documents")
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (error) {
    console.error("Error deleting document:", error);
    return false;
  }

  return true;
};

// ============================================
// COLLABORATORS
// ============================================

/**
 * Get collaborators for a document
 */
export const getDocumentCollaborators = async (
  documentId: string
): Promise<(DocumentCollaborator & { user: User })[]> => {
  const { data, error } = await serverClient
    .from("document_collaborators")
    .select(`
      *,
      user:users!user_id (*)
    `)
    .eq("document_id", documentId)
    .eq("deleted", false);

  if (error) {
    console.error("Error fetching document collaborators:", error);
    return [];
  }

  return data as (DocumentCollaborator & { user: User })[];
};

/**
 * Get collaborator users for a document
 */
export const getDocumentCollaboratorUsers = async (
  documentId: string
): Promise<User[]> => {
  const { data: collabs, error: collabError } = await serverClient
    .from("document_collaborators")
    .select("user_id")
    .eq("document_id", documentId)
    .eq("deleted", false);

  if (collabError) {
    console.error("Error fetching document collaborators:", collabError);
    return [];
  }

  const userIds = collabs.map((c) => c.user_id);

  const { data: users, error: usersError } = await serverClient
    .from("users")
    .select("*")
    .in("id", userIds);

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return [];
  }

  return users as User[];
};

/**
 * Add collaborator to document
 */
export const addDocumentCollaborator = async (
  documentId: string,
  userId: string,
  role: DocumentCollaboratorRole = "editor",
  permissions: { canEdit?: boolean; canDelete?: boolean; canInvite?: boolean } = {}
): Promise<DocumentCollaborator | null> => {
  const { canEdit = role === "editor", canDelete = false, canInvite = false } = permissions;

  const { data, error } = await serverClient
    .from("document_collaborators")
    .insert({
      document_id: documentId,
      user_id: userId,
      role,
      can_edit: canEdit,
      can_delete: canDelete,
      can_invite: canInvite,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding document collaborator:", error);
    return null;
  }

  return data as DocumentCollaborator;
};

/**
 * Remove collaborator from document
 */
export const removeDocumentCollaborator = async (
  collaboratorId: string
): Promise<boolean> => {
  const { error } = await serverClient
    .from("document_collaborators")
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", collaboratorId);

  if (error) {
    console.error("Error removing document collaborator:", error);
    return false;
  }

  return true;
};

/**
 * Check if user can edit document
 */
export const canUserEditDocument = async (
  documentId: string,
  userId: string
): Promise<boolean> => {
  // Check if owner
  const doc = await getDocumentById(documentId);
  if (doc?.user_id === userId) {
    return true;
  }

  // Check if collaborator with edit permission
  const { data, error } = await serverClient
    .from("document_collaborators")
    .select("can_edit")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .eq("deleted", false)
    .single();

  if (error) {
    return false;
  }

  return data?.can_edit === true;
};

/**
 * Check if user can view document
 */
export const canUserViewDocument = async (
  documentId: string,
  userId: string
): Promise<boolean> => {
  // Check if owner
  const doc = await getDocumentById(documentId);
  if (doc?.user_id === userId) {
    return true;
  }

  // Check if collaborator
  const { data, error } = await serverClient
    .from("document_collaborators")
    .select("id")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .eq("deleted", false)
    .single();

  if (error) {
    return false;
  }

  return !!data;
};

/**
 * Document summary for navigation dropdown
 */
export interface DocumentSummary {
  id: string;
  handle: string;
  title: string;
  updated_at: string;
}

/**
 * Get recent documents for a user (for navigation dropdown)
 */
export const getRecentDocuments = async (
  userId: string,
  limit: number = 5
): Promise<DocumentSummary[]> => {
  const { data, error } = await serverClient
    .from("documents")
    .select("id, handle, title, updated_at")
    .eq("user_id", userId)
    .eq("deleted", false)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent documents:", error);
    return [];
  }

  return (data || []) as DocumentSummary[];
};

// ============================================
// DOCUMENT ATTACHMENTS
// ============================================

export interface DocumentAttachment {
  id: string;
  document_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentAttachmentParams {
  title: string;
  description?: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
}

/**
 * Get all attachments for a document
 */
export const getDocumentAttachments = async (
  documentId: string
): Promise<DocumentAttachment[]> => {
  const { data, error } = await serverClient
    .from("document_attachments")
    .select("*")
    .eq("document_id", documentId)
    .eq("deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching document attachments:", error);
    return [];
  }

  return (data || []) as DocumentAttachment[];
};

/**
 * Create a new document attachment
 */
export const createDocumentAttachment = async (
  documentId: string,
  params: CreateDocumentAttachmentParams
): Promise<DocumentAttachment | null> => {
  const { data, error } = await serverClient
    .from("document_attachments")
    .insert({
      document_id: documentId,
      title: params.title,
      description: params.description || "",
      file_url: params.file_url,
      storage_path: params.storage_path,
      file_size_bytes: params.file_size_bytes,
      mime_type: params.mime_type,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating document attachment:", error);
    return null;
  }

  return data as DocumentAttachment;
};

/**
 * Delete a document attachment
 */
export const deleteDocumentAttachment = async (
  attachmentId: string
): Promise<boolean> => {
  const { error } = await serverClient
    .from("document_attachments")
    .update({ deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", attachmentId);

  if (error) {
    console.error("Error deleting document attachment:", error);
    return false;
  }

  return true;
};
