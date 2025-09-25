import { createClient } from '@/lib/supabase/server';
import { GameProjectService } from '@/lib/services/game-projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layouts/main-layout';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const gameProjectService = new GameProjectService(supabase);
  const result = await gameProjectService.getUserProjects(user.id);

  if (result.error) {
    return (
      <MainLayout user={user} breadcrumbs={[{ label: 'My Projects' }]}>
        <Card className="p-12 text-center">
          <p className="text-red-600">Error loading projects: {result.error}</p>
        </Card>
      </MainLayout>
    );
  }

  const projects = result.data?.data || [];

  return (
    <MainLayout user={user} breadcrumbs={[{ label: 'My Projects' }]}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Projects</h1>
            <p className="text-slate-600 mt-2">Manage your tabletop game projects</p>
          </div>
          <Button asChild>
            <Link href="/">Create New Project</Link>
          </Button>
        </div>

      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">No projects yet</h3>
            <p className="text-slate-600">
              Create your first tabletop game project to get started
            </p>
            <Button asChild>
              <Link href="/">Create Your First Project</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {project.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {project.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>{project.is_public ? 'Public' : 'Private'}</span>
                    <span>
                      {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Button asChild className="w-full" size="sm">
                      <Link href={`/projects/${project.slug}/editor`}>
                        Open Editor
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full" size="sm">
                      <Link href={`/projects/${project.slug}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </MainLayout>
  );
}