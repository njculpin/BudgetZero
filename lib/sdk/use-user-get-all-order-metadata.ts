'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllOrderMetadata() {
  const supabase = createClient()

  async function getOrderMetadata(order_id: string) {
    const { data, error } = await supabase
      .from('order_metadata')
      .select('*')
      .eq('order_id', order_id)

    return { data, error }
  }

  return { getOrderMetadata }
}
