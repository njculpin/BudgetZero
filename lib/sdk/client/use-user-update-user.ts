'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateUser() {
  const supabase = createClient()

  async function updateUser(
    id: string,
    updates: {
      full_name?: string
      username?: string
      bio?: string
      avatar_url?: string
      location?: string
      is_verified?: boolean
      is_active?: boolean
    }
  ) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  return { updateUser }
}
