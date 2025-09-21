import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMilestones, createMilestone, type Milestone } from '../lib/supabase'

export function useMilestones(projectId: string | undefined) {
  return useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => getMilestones(projectId!),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  })
}

export function useCreateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMilestone,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['milestones', data.project_id] })
      queryClient.setQueryData(['milestones', data.project_id], (old: Milestone[] = []) => [...old, data])
    },
  })
}