import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGameProjects, createGameProject, type GameProject } from '../lib/supabase'

export function useGameProjects(userId?: string) {
  return useQuery({
    queryKey: ['gameProjects', userId],
    queryFn: () => getGameProjects(userId),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useUserGameProjects(userId: string | undefined) {
  return useQuery({
    queryKey: ['userGameProjects', userId],
    queryFn: () => getGameProjects(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

export function useCreateGameProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createGameProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gameProjects'] })
      queryClient.invalidateQueries({ queryKey: ['userGameProjects', data.creator_id] })
      queryClient.setQueryData(['userGameProjects', data.creator_id], (old: GameProject[] = []) => [data, ...old])
    },
  })
}