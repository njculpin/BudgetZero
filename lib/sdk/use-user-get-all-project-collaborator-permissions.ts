'use client'

import { createClient } from '@/lib/supabase/client'

export function useUserGetAllProjectCollaboratorPermissions() {
  const supabase = createClient()

  async function getCollaboratorPermissions(collaborator_id: string) {
    const { data, error } = await supabase
      .from('project_collaborator_permissions')
      .select('*')
      .eq('collaborator_id', collaborator_id)

    return { data, error }
  }

  return { getCollaboratorPermissions }
}
