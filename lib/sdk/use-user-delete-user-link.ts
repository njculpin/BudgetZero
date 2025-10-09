'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteUserLink() {
  const supabase = createClient()

  async function deleteUserLink(id: string) {
    const { error } = await supabase
      .from('users_links')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteUserLink }
}
