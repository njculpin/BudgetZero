import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getContributors, supabase, type Contributor } from '../lib/supabase'

export function useContributors(projectId: string | undefined) {
  return useQuery({
    queryKey: ['contributors', projectId],
    queryFn: () => getContributors(projectId!),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  })
}

export function useApplyAsContributor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (application: Omit<Contributor, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('contributors')
        .insert(application)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contributors', data.project_id] })
    },
  })
}

export function useUpdateContributorStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ contributorId, status }: { contributorId: string, status: Contributor['status'] }) => {
      const { data, error } = await supabase
        .from('contributors')
        .update({ status })
        .eq('id', contributorId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contributors', data.project_id] })
    },
  })
}