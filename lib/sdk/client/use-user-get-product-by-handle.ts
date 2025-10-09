'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetProductByHandle() {
  const supabase = createClient()

  async function getProductByHandle(handle: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_projects (
          project_id,
          display_order,
          projects (*)
        ),
        product_images (*),
        product_tags (*),
        product_seo (*),
        product_variants (
          *,
          product_variant_prices (*),
          product_variant_options (*),
          product_digital_files (*),
          product_print_options (*)
        )
      `)
      .eq('handle', handle)
      .eq('status', 'active')
      .single()

    return { data, error }
  }

  return { getProductByHandle }
}
