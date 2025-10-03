import {
  Archive,
  Copy,
  Crown,
  Download,
  Eye,
  EyeOff,
  Mail,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { MainLayout } from "@/components/layouts/main-layout";
import { ProjectGeneralSettingsForm } from "@/components/projects/project-general-settings-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { GameProjectService } from "@/lib/services/game-projects";
import { createClient } from "@/lib/supabase/server";
import { ProjectSettingsClient } from "./settings-client";

interface ProjectSettingsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectSettingsPage({
  params,
}: ProjectSettingsPageProps) {
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

  // Only project owners can access settings
  if (!isOwner) {
    notFound();
  }

  const breadcrumbs = [
    { label: "My Projects", href: "/projects" },
    { label: project.title, href: `/projects/${project.slug}` },
    { label: "Settings" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Project Settings
            </h1>
            <p className="text-slate-600 mt-2">
              Manage {project.title} settings, team access, and project
              lifecycle
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 px-2">Settings</h3>
            <nav className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                General
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Team & Access
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Privacy
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
              >
                <Archive className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* General Project Settings */}
            <ProjectGeneralSettingsForm project={project} />

            {/* Team & Access Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team & Access Control
                </CardTitle>
                <CardDescription>
                  Manage who can view and edit this project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Team Members */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">Team Members</h4>
                    <Button size="sm" variant="outline">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Member
                    </Button>
                  </div>

                  {/* Project Owner */}
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {(project.creator.full_name || project.creator.email)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {project.creator.full_name || project.creator.email}
                        </p>
                        <p className="text-sm text-slate-600">
                          {project.creator.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="default"
                        className="flex items-center gap-1"
                      >
                        <Crown className="w-3 h-3" />
                        Owner
                      </Badge>
                    </div>
                  </div>

                  {/* Placeholder for future collaborators */}
                  <div className="text-center py-8 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No collaborators yet</p>
                    <p className="text-xs">
                      Invite team members to collaborate on this project
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Invite New Member Form */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">
                    Invite Collaborator
                  </h4>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input placeholder="Enter email address" type="email" />
                    </div>
                    <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invite
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    • Viewer: Can view project and make comments
                    <br />• Editor: Can edit content and manage sections
                    <br />• Admin: Can manage team and project settings
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Visibility */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {project.is_public ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                  Privacy & Visibility
                </CardTitle>
                <CardDescription>
                  Control who can discover and access your project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Public Project</Label>
                    <p className="text-sm text-slate-600">
                      Make this project discoverable in the public marketplace
                    </p>
                  </div>
                  <Switch defaultChecked={project.is_public} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Allow Comments</Label>
                    <p className="text-sm text-slate-600">
                      Let viewers leave feedback and suggestions
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Looking for Collaborators</Label>
                    <p className="text-sm text-slate-600">
                      Display a badge showing you're open to collaboration
                    </p>
                  </div>
                  <Switch
                    name="seeking_collaborators"
                    defaultChecked={project.seeking_collaborators}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>SEO Indexing</Label>
                    <p className="text-sm text-slate-600">
                      Allow search engines to index this project
                    </p>
                  </div>
                  <Switch defaultChecked={project.is_public} />
                </div>

                <Separator />

                {/* Sharing & Export */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">
                    Sharing & Export
                  </h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings & Danger Zone */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>
                  Project lifecycle, data management, and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProjectSettingsClient project={project} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
