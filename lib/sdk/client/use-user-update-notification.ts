'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateNotification() {
  const supabase = createClient()

  async function updateNotification(
    id: string,
    updates: {
      is_read?: boolean
      read_at?: string
    }
  ) {
    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  async function markAsRead(id: string) {
    return updateNotification(id, {
      is_read: true,
      read_at: new Date().toISOString()
    })
  }

  async function markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false)

    return { error }
  }

  return { updateNotification, markAsRead, markAllAsRead }
}
