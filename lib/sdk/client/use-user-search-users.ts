'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserSearchUsers() {
  const supabase = createClient()

  async function searchUsers(options: {
    query?: string
    isActive?: boolean
    isVerified?: boolean
    limit?: number
    offset?: number
  }) {
    let queryBuilder = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (options.query) {
      queryBuilder = queryBuilder.or(
        `username.ilike.%${options.query}%,full_name.ilike.%${options.query}%,email.ilike.%${options.query}%`
      )
    }

    if (options.isActive !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', options.isActive)
    }

    if (options.isVerified !== undefined) {
      queryBuilder = queryBuilder.eq('is_verified', options.isVerified)
    }

    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit)
    }

    if (options.offset) {
      queryBuilder = queryBuilder.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await queryBuilder

    return { data, error, count }
  }

  return { searchUsers }
}
