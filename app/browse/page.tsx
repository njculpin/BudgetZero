import { createClient } from '@/lib/supabase/server';
import { GameProjectService } from '@/lib/services/game-projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layouts/main-layout';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search, Filter, Eye, Users, Calendar } from 'lucide-react';

export default async function BrowseProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const gameProjectService = new GameProjectService(supabase);
  const result = await gameProjectService.getPublicProjects();

  const projects = result.data?.data || [];

  return (
    <MainLayout user={user} breadcrumbs={[{ label: 'Browse Projects' }]}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Browse Projects</h1>
            <p className="text-slate-600 mt-2">Discover amazing tabletop games from the community</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search projects by name, genre, or creator..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </Card>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">No public projects yet</h3>
              <p className="text-slate-600">
                Be the first to share your tabletop game with the community!
              </p>
              <Button asChild>
                <Link href="/">Create Project</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {project.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Creator Info */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4" />
                      <span>by {project.creator.full_name || project.creator.email}</span>
                    </div>

                    {/* Game Info */}
                    {(project.genre || project.player_count_min || project.play_time_minutes) && (
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        {project.genre && (
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            {project.genre}
                          </span>
                        )}
                        {(project.player_count_min || project.player_count_max) && (
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            {project.player_count_min === project.player_count_max
                              ? `${project.player_count_min} players`
                              : `${project.player_count_min || '?'}–${project.player_count_max || '?'} players`
                            }
                          </span>
                        )}
                        {project.play_time_minutes && (
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            {project.play_time_minutes}min
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tags */}
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

                    {/* Updated Date */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{project.license_type}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <Button asChild className="w-full" size="sm">
                        <Link href={`/projects/${project.slug}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Project
                        </Link>
                      </Button>
                      {project.price_cents > 0 && (
                        <div className="text-center text-sm font-semibold text-green-600">
                          ${(project.price_cents / 100).toFixed(2)}
                        </div>
                      )}
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