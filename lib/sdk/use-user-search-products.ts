'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserSearchProducts() {
  const supabase = createClient()

  async function searchProducts(filters: {
    query?: string
    tags?: string[]
    status?: string
    is_featured?: boolean
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('products')
      .select(`
        *,
        product_images!inner (file_url, is_primary),
        product_tags (tag)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    // Filter by tags if provided (client-side filtering)
    let filteredData = data
    if (filters.tags && filters.tags.length > 0 && data) {
      filteredData = data.filter(product => {
        const productTags = product.product_tags?.map((t: { tag: string }) => t.tag) || []
        return filters.tags?.some(tag => productTags.includes(tag))
      })
    }

    return { data: filteredData, error, count }
  }

  return { searchProducts }
}
