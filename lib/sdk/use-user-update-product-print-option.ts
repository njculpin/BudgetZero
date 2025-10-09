'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserUpdateProductPrintOption() {
  const supabase = createClient()

  async function updateProductPrintOption(id: string, updates: {
    printer_integration_id?: string
    print_template_id?: string
    paper_type?: string
    finish_type?: string
    dimensions?: string
  }) {
    const { data, error } = await supabase
      .from('product_print_options')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  return { updateProductPrintOption }
}
