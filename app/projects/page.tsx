import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layouts/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectService } from "@/lib/services/project-service";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const projectService = new ProjectService(supabase);
  const result = await projectService.getUserProjects(user.id);

  if (result.error) {
    return (
      <MainLayout user={user} breadcrumbs={[{ label: "My Projects" }]}>
        <Card className="p-12 text-center">
          <p className="text-red-600">Error loading projects: {result.error}</p>
        </Card>
      </MainLayout>
    );
  }

  const projects = result.data || [];

  return (
    <MainLayout user={user} breadcrumbs={[{ label: "My Projects" }]}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Projects</h1>
            <p className="text-slate-600 mt-2">
              Your game projects and their creative assets
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/projects/new">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold text-slate-900">
                No projects yet
              </h3>
              <p className="text-slate-600">
                Create your first game project to get started
              </p>
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`}>
                <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">
                            Game
                          </Badge>
                        </div>
                        <CardTitle className="line-clamp-2 text-base leading-6 mb-2">
                          {project.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-3 min-h-[3.75rem] text-sm leading-5">
                          {project.description || "No description provided"}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          project.status === "active" ? "default" : "secondary"
                        }
                        className="flex-shrink-0 text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
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
                        <span>{project.is_public ? "Public" : "Private"}</span>
                        <span>
                          {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
