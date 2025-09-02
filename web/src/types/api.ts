// Auto-generated TypeScript types from Go backend
// Do not edit manually - regenerate with: cd backend && go run cmd/generate/main.go


export interface User {
  id: number;
  email: string;
  name: string;
  bio: string | null;
  created_at: string;
  updated_at: string;
}


export interface Project {
  id: number;
  title: string;
  description: string;
  creator_id: number;
  creator: User;
  created_at: string;
  updated_at: string;
}


export interface Milestone {
  id: number;
  title: string;
  description: string;
  order_index: number;
  project_id: number;
  project: Project;
  created_at: string;
  updated_at: string;
}


export interface Invite {
  id: number;
  code: string;
  status: string;
  max_uses: number;
  current_uses: number;
  inviter_id: number;
  inviter: User;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}


export interface InviteUsage {
  id: number;
  invite_id: number;
  invite: Invite;
  inviter_id: number;
  inviter: User;
  invitee_id: number;
  invitee: User;
  invitee_email: string;
  created_at: string;
}


export interface AuthRequest {
  email: string;
  inviteCode: string;
}


export interface AuthResponse {
  user: User;
  token: string;
}


