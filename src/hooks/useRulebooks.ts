import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRulebook,
  createRulebook,
  updateRulebook,
  getRulebookVersions,
  createRulebookVersion,
  getCurrentUser,
} from '../lib/supabase'

export function useRulebook(projectId: string) {
  return useQuery({
    queryKey: ['rulebook', projectId],
    queryFn: () => getRulebook(projectId),
    enabled: !!projectId
  })
}

export function useCreateRulebook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      projectId: string
      title: string
      content: string
      templateId?: string
    }) => {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      return createRulebook({
        project_id: data.projectId,
        title: data.title,
        content: data.content,
        template_id: data.templateId,
        last_edited_by: user.id,
        version: 1,
        is_published: false
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rulebook', data.project_id] })
    }
  })
}

export function useUpdateRulebook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      id: string
      projectId: string
      updates: {
        title?: string
        content?: string
        templateId?: string
        isPublished?: boolean
      }
      createVersion?: boolean
      changeSummary?: string
    }) => {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Update the main rulebook
      const updatedRulebook = await updateRulebook(data.id, {
        title: data.updates.title,
        content: data.updates.content,
        template_id: data.updates.templateId,
        is_published: data.updates.isPublished,
        last_edited_by: user.id
      })

      // Create a version if requested
      if (data.createVersion && data.updates.content) {
        await createRulebookVersion({
          rulebook_id: data.id,
          content: data.updates.content,
          version: updatedRulebook.version + 1,
          edited_by: user.id,
          change_summary: data.changeSummary
        })

        // Update version number in main record
        await updateRulebook(data.id, {
          last_edited_by: user.id
        })
      }

      return updatedRulebook
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rulebook', data.project_id] })
      queryClient.invalidateQueries({ queryKey: ['rulebook-versions', data.id] })
    }
  })
}

export function useRulebookVersions(rulebookId: string) {
  return useQuery({
    queryKey: ['rulebook-versions', rulebookId],
    queryFn: () => getRulebookVersions(rulebookId),
    enabled: !!rulebookId
  })
}

export function useAutoSaveRulebook(
  projectId: string,
  rulebookId: string | undefined,
) {
  const createMutation = useCreateRulebook()
  const updateMutation = useUpdateRulebook()

  const saveRulebook = async (title: string, content: string, templateId?: string) => {
    if (rulebookId) {
      // Update existing rulebook
      await updateMutation.mutateAsync({
        id: rulebookId,
        projectId,
        updates: { title, content, templateId },
        createVersion: false
      })
    } else {
      // Create new rulebook
      await createMutation.mutateAsync({
        projectId,
        title,
        content,
        templateId
      })
    }
  }

  return {
    saveRulebook,
    isSaving: createMutation.isPending || updateMutation.isPending,
    error: createMutation.error || updateMutation.error
  }
}