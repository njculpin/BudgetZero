'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserDeleteProjectCollaboratorPermission() {
  const supabase = createClient()

  async function deleteCollaboratorPermission(id: string) {
    const { error } = await supabase
      .from('project_collaborator_permissions')
      .delete()
      .eq('id', id)

    return { error }
  }

  return { deleteCollaboratorPermission }
}
