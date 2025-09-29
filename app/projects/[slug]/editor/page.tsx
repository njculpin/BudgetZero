import { createClient } from "@/lib/supabase/server";
import { GameProjectService } from "@/lib/services/game-projects";
import { EditorPageClient } from "@/components/editor/editor-page-client";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface EditorPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const gameProjectService = new GameProjectService(supabase);
  const projectResult = await gameProjectService.getProjectBySlug(slug);

  if (projectResult.error || !projectResult.data) {
    notFound();
  }

  const project = projectResult.data;

  // Check if user has access to edit this project
  const accessResult = await gameProjectService.checkProjectAccess(
    project.id,
    user.id,
  );

  if (accessResult.error || !accessResult.data?.canRead) {
    redirect("/projects");
  }

  const canEdit = accessResult.data.canEdit;

  // Get the project's rulebook
  const { data: rulebook, error: rulebookError } = await supabase
    .from("rulebooks")
    .select("*")
    .eq("project_id", project.id)
    .single();

  if (rulebookError && rulebookError.code !== "PGRST116") {
    console.error("Error fetching rulebook:", rulebookError);
  }

  const breadcrumbs = [
    { label: "My Projects", href: "/projects" },
    { label: project.title, href: `/projects/${project.slug}` },
    { label: "Editor" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
        <EditorPageClient
          project={project}
          rulebook={rulebook}
          canEdit={canEdit}
        />2
    </MainLayout>
  );
}
