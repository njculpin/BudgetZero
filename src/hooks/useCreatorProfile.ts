import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Database } from '../lib/supabase'
import { useAuth } from './useAuth'

export type CreatorProfile = Database['public']['Tables']['creator_profiles']['Row']
export type CreatorProfileInsert = Database['public']['Tables']['creator_profiles']['Insert']
export type CreatorProfileUpdate = Database['public']['Tables']['creator_profiles']['Update']

// Get creator profile by user ID
export function useCreatorProfile(userId?: string) {
  return useQuery({
    queryKey: ['creator-profile', userId],
    queryFn: async (): Promise<CreatorProfile | null> => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      return data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get current user's creator profile
export function useMyCreatorProfile() {
  const { data: user } = useAuth()
  return useCreatorProfile(user?.id)
}

// Create or update creator profile
export function useUpdateCreatorProfile() {
  const queryClient = useQueryClient()
  const { data: user } = useAuth()

  return useMutation({
    mutationFn: async (profileData: CreatorProfileUpdate) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('creator_profiles')
          .update(profileData)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Create new profile with minimal required data
        const { data, error } = await supabase
          .from('creator_profiles')
          .insert({
            user_id: user.id,
            display_name: user.email?.split('@')[0] || 'Creator',
            specialties: [],
            experience_level: 'intermediate',
            availability_status: 'available',
            skills: [],
            ...profileData
          } as CreatorProfileInsert)
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['creator-profile', user?.id] })
    }
  })
}

// Get all creator profiles for discovery
export function useCreatorProfiles(filters?: {
  skills?: string[]
  specialties?: string[]
  experience_level?: Array<Database['public']['Enums']['experience_level']>
  availability_status?: Array<Database['public']['Enums']['availability_status']>
  project_types?: string[]
}) {
  return useQuery({
    queryKey: ['creator-profiles', filters],
    queryFn: async (): Promise<CreatorProfile[]> => {
      let query = supabase
        .from('creator_profiles')
        .select('*')
        .order('updated_at', { ascending: false })

      // Apply filters if provided
      if (filters?.availability_status?.length) {
        query = query.in('availability_status', filters.availability_status)
      }

      if (filters?.experience_level?.length) {
        query = query.in('experience_level', filters.experience_level)
      }

      const { data, error } = await query

      if (error) throw error

      // Filter by skills, specialties, and project types on the client side
      // (since Supabase doesn't have great array filtering for these use cases)
      let filteredData = data || []

      if (filters?.skills?.length) {
        filteredData = filteredData.filter(profile =>
          profile.skills && filters.skills!.some(skill => profile.skills!.includes(skill))
        )
      }

      if (filters?.specialties?.length) {
        filteredData = filteredData.filter(profile =>
          profile.specialties && filters.specialties!.some(specialty => profile.specialties!.includes(specialty))
        )
      }

      if (filters?.project_types?.length) {
        filteredData = filteredData.filter(profile =>
          profile.preferred_project_types && filters.project_types!.some(type => profile.preferred_project_types!.includes(type))
        )
      }

      return filteredData
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}