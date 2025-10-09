'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreateUserLink() {
  const supabase = createClient()

  async function createUserLink(link: {
    user_id: string
    title?: string
    url?: string
  }) {
    const { data, error } = await supabase
      .from('users_links')
      .insert(link)
      .select()
      .single()

    return { data, error }
  }

  return { createUserLink }
}
