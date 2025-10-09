'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteProductDigitalFile() {
  const supabase = createClient()

  async function deleteProductDigitalFile(id: string) {
    const { error } = await supabase
      .from('product_digital_files')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteProductDigitalFile }
}
