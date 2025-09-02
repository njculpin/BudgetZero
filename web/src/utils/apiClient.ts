// Auto-generated TypeScript API client from Go backend
// Do not edit manually - regenerate with: cd backend && go run cmd/generate/main.go

import type { AuthRequest, AuthResponse, User, Project } from '../types/api';

const API_BASE_URL = 'http://localhost:3001';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.baseURL + endpoint;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'HTTP ' + response.status);
    }

    return response.json();
  }


  async authInvite(data: AuthRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async getUser(): Promise<User> {
    return this.request<User>('/api/users', {
      method: 'GET',
      
    });
  }


  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/api/projects', {
      method: 'GET',
      
    });
  }


  async getProject(): Promise<Project> {
    return this.request<Project>('/api/projects', {
      method: 'GET',
      
    });
  }


}

// Export a singleton instance
export const apiClient = new APIClient();

// Export the class for custom instances
export { APIClient };
