import { createClient } from '@/lib/supabase/server';
import { GameProjectService } from '@/lib/services/game-projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/layouts/main-layout';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import {
  Calendar,
  Eye,
  EyeOff,
  Edit3,
  Users,
  Tag,
  Clock,
  Star,
  Settings
} from 'lucide-react';

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const gameProjectService = new GameProjectService(supabase);
  const result = await gameProjectService.getProjectBySlug(slug);

  if (result.error || !result.data) {
    notFound();
  }

  const project = result.data;
  const isOwner = project.creator_id === user.id;

  // Check user access permissions
  const accessResult = await gameProjectService.checkProjectAccess(project.id, user.id);
  const canRead = accessResult.data?.canRead ?? false;
  const canEdit = accessResult.data?.canEdit ?? false;

  if (!canRead) {
    notFound();
  }

  const breadcrumbs = [
    { label: 'My Projects', href: '/projects' },
    { label: project.title }
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-slate-900">{project.title}</h1>
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
            {project.is_public ? (
              <Badge variant="outline" className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Public
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                Private
              </Badge>
            )}
          </div>
          <p className="text-slate-600">
            Created by {project.creator.full_name || project.creator.email}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/projects/${project.slug}/editor`}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Rulebook
              </Link>
            </Button>
          )}
          {isOwner && (
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {project.description ? (
                <p className="text-slate-700 whitespace-pre-wrap">{project.description}</p>
              ) : (
                <p className="text-slate-500 italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Game Details */}
          {(project.genre || project.player_count_min || project.play_time_minutes || project.complexity_rating) && (
            <Card>
              <CardHeader>
                <CardTitle>Game Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {project.genre && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-1">Genre</h4>
                      <p className="text-slate-600 capitalize">{project.genre}</p>
                    </div>
                  )}
                  {(project.player_count_min || project.player_count_max) && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-1">Players</h4>
                      <p className="text-slate-600">
                        {project.player_count_min === project.player_count_max
                          ? project.player_count_min
                          : `${project.player_count_min || '?'}–${project.player_count_max || '?'}`
                        }
                      </p>
                    </div>
                  )}
                  {project.play_time_minutes && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-1">Play Time</h4>
                      <p className="text-slate-600">{project.play_time_minutes} minutes</p>
                    </div>
                  )}
                  {project.complexity_rating && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-1">Complexity</h4>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < project.complexity_rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-slate-600 ml-2">
                          {project.complexity_rating}/5
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* License & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>License & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">License Type</h4>
                  <p className="text-slate-600 capitalize">{project.license_type}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Price</h4>
                  <p className="text-slate-600">
                    {project.price_cents === 0 ? 'Free' : `$${(project.price_cents / 100).toFixed(2)}`}
                  </p>
                </div>
              </div>
              {project.license_terms && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">License Terms</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-md">
                    {project.license_terms}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <div>
                  <p className="font-medium">Created</p>
                  <p>{new Date(project.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p>{new Date(project.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              <Separator />
              <div className="text-xs text-slate-500">
                Project ID: {project.id.slice(0, 8)}...
              </div>
            </CardContent>
          </Card>

          {/* Collaborators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {(project.creator.full_name || project.creator.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {project.creator.full_name || project.creator.email}
                    </p>
                    <p className="text-xs text-slate-500">Creator</p>
                  </div>
                </div>
                {/* TODO: Add collaborators when available */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </MainLayout>
  );
}