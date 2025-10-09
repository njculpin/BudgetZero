'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetOneProduct() {
  const supabase = createClient()

  async function getProduct(id: string) {
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
      .eq('id', id)
      .single()

    return { data, error }
  }

  return { getProduct }
}
