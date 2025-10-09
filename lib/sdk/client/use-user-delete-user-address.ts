'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteUserAddress() {
  const supabase = createClient()

  async function deleteUserAddress(id: string) {
    const { error } = await supabase
      .from('users_addresses')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteUserAddress }
}
