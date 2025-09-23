import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGameProjects, getGameProject, createGameProject, updateGameProject, deleteGameProject, type GameProject } from '../lib/supabase'

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

export function useGameProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['gameProject', projectId],
    queryFn: () => getGameProject(projectId!),
    enabled: !!projectId,
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

export function useUpdateGameProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<GameProject, 'id' | 'created_at' | 'updated_at' | 'creator_id'>> }) =>
      updateGameProject(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gameProjects'] })
      queryClient.invalidateQueries({ queryKey: ['userGameProjects', data.creator_id] })
      queryClient.invalidateQueries({ queryKey: ['gameProject', data.id] })
    },
  })
}

export function useDeleteGameProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteGameProject,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['gameProjects'] })
      queryClient.invalidateQueries({ queryKey: ['userGameProjects'] })
      queryClient.removeQueries({ queryKey: ['gameProject', deletedId] })
    },
  })
}