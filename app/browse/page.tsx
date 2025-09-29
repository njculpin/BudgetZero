import { createClient } from "@/lib/supabase/server";
import { GameProjectService } from "@/lib/services/game-projects";
import { MainLayout } from "@/components/layouts/main-layout";
import { redirect } from "next/navigation";
import { ProjectDiscovery } from "@/components/projects/project-discovery";

export default async function BrowseProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const gameProjectService = new GameProjectService(supabase);
  const result = await gameProjectService.getPublicProjects();

  const projects = result.data?.data || [];

  // Extract all unique tags from projects for filter options
  const allTags = Array.from(
    new Set(projects.flatMap((project) => project.tags))
  ).sort();

  return (
    <MainLayout user={user} breadcrumbs={[{ label: "Browse Projects" }]}>
      <ProjectDiscovery initialProjects={projects} availableTags={allTags} />
    </MainLayout>
  );
}