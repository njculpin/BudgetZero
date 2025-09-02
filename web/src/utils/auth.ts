// Budget Zero Authentication Service
// Simple invite-based authentication

import { getDatabase } from './database.js'
import type { User } from './database.js'

export interface AuthResult {
  user: User
  token: string
}

export interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

export class AuthService {
  private database: any

  constructor(database: any) {
    this.database = database
  }

  /**
   * Authenticate user with invite code
   */
  async authenticateWithInvite(email: string, inviteCode: string): Promise<AuthResult> {
    try {
      // Validate invite code
      const invite = await this.database.validateInviteCode(inviteCode)
      if (!invite) {
        throw new Error('Invalid or expired invite code')
      }

      // Find or create user
      let user = await this.database.findUserByEmail(email)

      if (!user) {
        // Create user if they don't exist
        user = await this.database.createUser({
          email,
          name: email.split('@')[0],
          invitedByCode: inviteCode
        })
      }

      // Generate JWT token
      const token = this.generateJWT(user)

      return { user, token }
    } catch (error) {
      console.error('Authentication failed:', error)
      throw error
    }
  }

  /**
   * Create a new user account
   */
  async createUser(email: string, name: string, inviteCode: string): Promise<User> {
    try {
      // Validate invite code first
      const invite = await this.database.validateInviteCode(inviteCode)
      if (!invite) {
        throw new Error('Invalid or expired invite code')
      }

      // Check if user already exists
      const existingUser = await this.database.findUserByEmail(email)

      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Create new user
      const user = await this.database.createUser({
        email,
        name,
        invitedByCode: inviteCode
      })

      if (!user) {
        throw new Error('Failed to create user')
      }

      // Mark invite as used
      await this.database.useInviteCode(invite.id, user.id, email)

      return user
    } catch (error) {
      console.error('User creation failed:', error)
      throw error
    }
  }

  /**
   * Validate JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      // TODO: Implement actual JWT verification
      // For now, return a mock payload
      const payload = this.decodeJWT(token)
      if (payload && payload.exp > Date.now() / 1000) {
        return payload
      }
      return null
    } catch (error) {
      console.error('Token verification failed:', error)
      throw error
    }
  }

  /**
   * Generate JWT token
   */
  private generateJWT(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }

    // TODO: Implement actual JWT signing
    // For now, return a mock token
    return this.encodeJWT(payload)
  }

  /**
   * Mock JWT encoding (replace with actual implementation)
   */
  private encodeJWT(payload: JWTPayload): string {
    // TODO: Replace with actual JWT library
    return btoa(JSON.stringify(payload))
  }

  /**
   * Mock JWT decoding (replace with actual implementation)
   */
  private decodeJWT(token: string): JWTPayload | null {
    try {
      // TODO: Replace with actual JWT library
      return JSON.parse(atob(token))
    } catch (error) {
      return null
    }
  }
}

// Export singleton instance
let authServiceInstance: AuthService | null = null

export async function getAuthService(): Promise<AuthService> {
  if (!authServiceInstance) {
    const database = await getDatabase()
    authServiceInstance = new AuthService(database)
  }
  return authServiceInstance
}
