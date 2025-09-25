import { SupabaseClient } from '@supabase/supabase-js';
import {
  Profile,
  CreateProfileData,
  UpdateProfileData,
  ApiResponse
} from '@/lib/types/database';
import { CreateProfileSchema, UpdateProfileSchema } from '@/lib/validations/schemas';

export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  async getProfile(userId: string): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return { error: 'Failed to fetch profile' };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async getProfileByUsername(username: string): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching profile by username:', error);
        return { error: 'Profile not found' };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async createProfile(profileData: CreateProfileData): Promise<ApiResponse<Profile>> {
    try {
      // Validate input data
      const validatedData = CreateProfileSchema.parse({
        full_name: profileData.full_name,
        username: profileData.username,
        bio: profileData.bio,
        creator_roles: profileData.creator_roles,
        location: profileData.location,
        website_url: profileData.website_url,
        portfolio_url: profileData.portfolio_url,
        skills: profileData.skills,
        experience_level: profileData.experience_level,
      });

      // Check if username is already taken
      if (validatedData.username) {
        const { data: existingProfile } = await this.supabase
          .from('profiles')
          .select('id')
          .eq('username', validatedData.username)
          .single();

        if (existingProfile) {
          return { error: 'Username is already taken' };
        }
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .insert([{
          id: profileData.id,
          email: profileData.email,
          ...validatedData,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        if (error.code === '23505') { // Unique constraint violation
          return { error: 'Username or email is already taken' };
        }
        return { error: 'Failed to create profile' };
      }

      return { data };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Validation error:', error.message);
        return { error: error.message };
      }
      console.error('Unexpected error creating profile:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async updateProfile(userId: string, profileData: UpdateProfileData): Promise<ApiResponse<Profile>> {
    try {
      // Validate input data
      const validatedData = UpdateProfileSchema.parse(profileData);

      // Check if username is already taken by another user
      if (validatedData.username) {
        const { data: existingProfile } = await this.supabase
          .from('profiles')
          .select('id')
          .eq('username', validatedData.username)
          .neq('id', userId)
          .single();

        if (existingProfile) {
          return { error: 'Username is already taken' };
        }
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .update(validatedData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        if (error.code === '23505') { // Unique constraint violation
          return { error: 'Username is already taken' };
        }
        return { error: 'Failed to update profile' };
      }

      return { data };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Validation error:', error.message);
        return { error: error.message };
      }
      console.error('Unexpected error updating profile:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async searchProfiles(query: string, creatorRoles?: string[], limit = 20): Promise<ApiResponse<Profile[]>> {
    try {
      let queryBuilder = this.supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true);

      // Add text search
      if (query.trim()) {
        queryBuilder = queryBuilder.or(
          `full_name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%`
        );
      }

      // Filter by creator roles
      if (creatorRoles && creatorRoles.length > 0) {
        queryBuilder = queryBuilder.overlaps('creator_roles', creatorRoles);
      }

      const { data, error } = await queryBuilder
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching profiles:', error);
        return { error: 'Failed to search profiles' };
      }

      return { data: data || [] };
    } catch (error) {
      console.error('Unexpected error searching profiles:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async getProfilesByIds(userIds: string[]): Promise<ApiResponse<Profile[]>> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('Error fetching profiles by IDs:', error);
        return { error: 'Failed to fetch profiles' };
      }

      return { data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching profiles:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async checkUsernameAvailability(username: string, excludeUserId?: string): Promise<ApiResponse<boolean>> {
    try {
      let query = this.supabase
        .from('profiles')
        .select('id')
        .eq('username', username);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking username availability:', error);
        return { error: 'Failed to check username availability' };
      }

      const isAvailable = !data;
      return { data: isAvailable };
    } catch (error) {
      console.error('Unexpected error checking username:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async deactivateProfile(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) {
        console.error('Error deactivating profile:', error);
        return { error: 'Failed to deactivate profile' };
      }

      return { data: true };
    } catch (error) {
      console.error('Unexpected error deactivating profile:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating avatar:', error);
        return { error: 'Failed to update avatar' };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error updating avatar:', error);
      return { error: 'Unexpected error occurred' };
    }
  }
}