import { notFound, redirect } from "next/navigation";
import { DocumentForm } from "@/components/documents/document-form";
import { MainLayout } from "@/components/layouts/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectService } from "@/lib/services/project-service";
import { createClient } from "@/lib/supabase/server";

interface CreateDocumentPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CreateDocumentPage({
  params,
}: CreateDocumentPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const projectService = new ProjectService(supabase);
  const result = await projectService.getProjectBySlug(slug);

  if (result.error || !result.data) {
    notFound();
  }

  const project = result.data;
  const isOwner = project.creator_id === user.id;

  if (!isOwner) {
    notFound();
  }

  const breadcrumbs = [
    { label: "Projects", href: "/projects" },
    { label: project.title, href: `/projects/${project.slug}` },
    { label: "New Document" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Document</CardTitle>
            <CardDescription>
              Add a rulebook, expansion, or reference guide to {project.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentForm projectId={project.id} projectSlug={project.slug} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
