'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateProductDigitalFile() {
  const supabase = createClient()

  async function updateProductDigitalFile(id: string, updates: {
    file_url?: string
    file_name?: string
    file_size_bytes?: number
    file_format?: string
    is_primary?: boolean
  }) {
    const { data, error } = await supabase
      .from('product_digital_files')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  return { updateProductDigitalFile }
}
