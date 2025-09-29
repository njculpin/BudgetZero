import { createClient } from "@/lib/supabase/server";
import { GameProjectService } from "@/lib/services/game-projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MainLayout } from "@/components/layouts/main-layout";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  Calendar,
  Eye,
  EyeOff,
  Edit3,
  Users,
  Tag,
  Clock,
  Star,
  Settings,
  FileText,
  Box,
  UserPlus,
} from "lucide-react";
import { InviteCollaboratorDialog } from "@/components/collaboration/invite-collaborator-dialog";
import { ProposeProjectMergeDialog } from "@/components/collaboration/propose-merge-dialog";

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const gameProjectService = new GameProjectService(supabase);
  const result = await gameProjectService.getProjectBySlug(slug);

  if (result.error || !result.data) {
    notFound();
  }

  const project = result.data;
  const isOwner = project.creator_id === user.id;

  // Check user access permissions
  const accessResult = await gameProjectService.checkProjectAccess(
    project.id,
    user.id,
  );
  const canRead = accessResult.data?.canRead ?? false;
  const canEdit = accessResult.data?.canEdit ?? false;

  if (!canRead) {
    notFound();
  }

  const breadcrumbs = [
    { label: "My Projects", href: "/projects" },
    { label: project.title },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-slate-900">
                {project.title}
              </h1>
              <Badge
                variant={project.status === "active" ? "default" : "secondary"}
              >
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
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${project.slug}/settings`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
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
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {project.description}
                  </p>
                ) : (
                  <p className="text-slate-500 italic">
                    No description provided
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Project Components */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  Project Components
                </CardTitle>
                <CardDescription>
                  All the creative assets and content that make up this game
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Rulebook Component - Always present for game projects */}
                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-blue-900 mb-1">Rulebook</h4>
                      <p className="text-sm text-blue-700 mb-2">Core game rules and mechanics</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                          Active
                        </Badge>
                        <span className="text-xs text-blue-600">
                          Last updated {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/projects/${project.slug}/editor`}
                      className="text-blue-700 hover:text-blue-900 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Collaboration & Growth - Only show to project owners */}
                  {isOwner && (
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
                      <div className="max-w-2xl mx-auto text-center mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          <UserPlus className="w-4 h-4 inline mr-2" />
                          Grow Your Project
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Collaborate with other creators or combine projects for richer experiences
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                        <InviteCollaboratorDialog
                          projectId={project.id}
                          projectTitle={project.title}
                        />

                        <ProposeProjectMergeDialog
                          currentProjectId={project.id}
                          currentProjectTitle={project.title}
                        />
                      </div>

                      <div className="mt-4 p-3 bg-white/60 rounded-lg">
                        <div className="text-xs text-gray-700 space-y-1">
                          <p><strong>Invite Collaborators:</strong> Add team members to work together on this project</p>
                          <p><strong>Propose Merge:</strong> Combine with other projects to create collaborative works with shared ownership</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Game Details */}
            {(project.genre ||
              project.player_count_min ||
              project.play_time_minutes ||
              project.complexity_rating) && (
              <Card>
                <CardHeader>
                  <CardTitle>Game Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {project.genre && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-1">
                          Genre
                        </h4>
                        <p className="text-slate-600 capitalize">
                          {project.genre}
                        </p>
                      </div>
                    )}
                    {(project.player_count_min || project.player_count_max) && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-1">
                          Players
                        </h4>
                        <p className="text-slate-600">
                          {project.player_count_min === project.player_count_max
                            ? project.player_count_min
                            : `${project.player_count_min || "?"}–${project.player_count_max || "?"}`}
                        </p>
                      </div>
                    )}
                    {project.play_time_minutes && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-1">
                          Play Time
                        </h4>
                        <p className="text-slate-600">
                          {project.play_time_minutes} minutes
                        </p>
                      </div>
                    )}
                    {project.complexity_rating && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-1">
                          Complexity
                        </h4>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < (project.complexity_rating || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-slate-300"
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
                    <p className="text-slate-600 capitalize">
                      {project.license_type}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Price</h4>
                    <p className="text-slate-600">
                      {project.price_cents === 0
                        ? "Free"
                        : `$${(project.price_cents / 100).toFixed(2)}`}
                    </p>
                  </div>
                </div>
                {project.license_terms && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">
                      License Terms
                    </h4>
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

            {/* Team & Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team & Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Team Members */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-900">
                    Contributors
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {(project.creator.full_name || project.creator.email)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {project.creator.full_name || project.creator.email}
                      </p>
                      <p className="text-xs text-slate-500">
                        Creator • Active today
                      </p>
                    </div>
                  </div>
                  {/* TODO: Add collaborators when available */}
                </div>

                <Separator />

                {/* Recent Activity */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-900">
                    Recent Activity
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 text-slate-600">
                      <Edit3 className="w-3 h-3 mt-1 text-blue-500" />
                      <div>
                        <span className="font-medium">Rulebook updated</span>
                        <p className="text-xs text-slate-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600">
                      <Calendar className="w-3 h-3 mt-1 text-green-500" />
                      <div>
                        <span className="font-medium">Project created</span>
                        <p className="text-xs text-slate-500">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Indicators */}
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-900">
                    Progress
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Completion</span>
                      <span className="text-slate-900 font-medium">25%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: "25%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
