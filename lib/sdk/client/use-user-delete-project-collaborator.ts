'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteProjectCollaborator() {
  const supabase = createClient()

  async function deleteProjectCollaborator(id: string) {
    const { error } = await supabase
      .from('project_collaborators')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteProjectCollaborator }
}
