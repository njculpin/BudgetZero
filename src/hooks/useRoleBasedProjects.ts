import { useQuery } from '@tanstack/react-query'
import { getUserProjectsWithRoles, getProjectTeamSize } from '../lib/supabase'
import { ProjectWithRoles } from '../types/roles'
import { useAuth } from './useAuth'

export function useRoleBasedProjects() {
  const { data: user } = useAuth()

  return useQuery({
    queryKey: ['role-based-projects', user?.id],
    queryFn: async (): Promise<ProjectWithRoles[]> => {
      if (!user?.id) return []

      const projectsWithRoles = await getUserProjectsWithRoles(user.id)

      // Transform the data to match ProjectWithRoles interface
      const transformedProjects = await Promise.all(
        projectsWithRoles.map(async (project) => {
          const teamSize = await getProjectTeamSize(project.id)

          // Extract user's roles and permissions from project_roles
          const userRoles = project.project_roles || []
          const myRoles = userRoles.map(role => role.role)

          // Determine permissions based on roles
          const isOwner = project.creator_id === user.id
          const hasLeadershipRole = myRoles.includes('project-lead') || myRoles.includes('game-designer')

          const myPermissions = {
            can_edit_content: isOwner || hasLeadershipRole || myRoles.length > 0,
            can_manage_team: isOwner || myRoles.includes('project-lead'),
            can_publish: isOwner || myRoles.includes('project-lead'),
            can_merge_projects: isOwner || myRoles.includes('project-lead') || myRoles.includes('game-designer'),
            can_create_milestones: isOwner || hasLeadershipRole,
            can_manage_finances: isOwner || myRoles.includes('project-lead')
          }

          return {
            ...project,
            user_roles: [], // TODO: Implement when we need team member roles
            my_roles: myRoles,
            my_permissions: myPermissions,
            is_owner: isOwner,
            team_size: teamSize
          } as ProjectWithRoles
        })
      )

      return transformedProjects
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  })
}