'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateProductSeo() {
  const supabase = createClient()

  async function updateProductSeo(productId: string, updates: {
    meta_title?: string
    meta_description?: string
    meta_keywords?: string
    og_image_url?: string
  }) {
    const { data, error } = await supabase
      .from('product_seo')
      .upsert({ product_id: productId, ...updates })
      .eq('product_id', productId)
      .select()
      .single()

    return { data, error }
  }

  return { updateProductSeo }
}
