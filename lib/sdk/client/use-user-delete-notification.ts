'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteNotification() {
  const supabase = createClient()

  async function deleteNotification(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    return { error }
  }

  async function deleteAllRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true)

    return { error }
  }

  return { deleteNotification, deleteAllRead }
}
