'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserCreateProjectCollaboratorPermission() {
  const supabase = createClient()

  async function createCollaboratorPermission(
    collaborator_id: string,
    permission: 'read' | 'write' | 'delete' | 'admin' | 'manage_collaborators' | 'manage_pricing'
  ) {
    const { data, error } = await supabase
      .from('project_collaborator_permissions')
      .insert({ collaborator_id, permission })
      .select()
      .single()

    return { data, error }
  }

  return { createCollaboratorPermission }
}
