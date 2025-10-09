'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllProductDigitalFiles() {
  const supabase = createClient()

  async function getAllProductDigitalFiles(variantId: string) {
    const { data, error } = await supabase
      .from('product_digital_files')
      .select('*')
      .eq('variant_id', variantId)

    return { data, error }
  }

  return { getAllProductDigitalFiles }
}
