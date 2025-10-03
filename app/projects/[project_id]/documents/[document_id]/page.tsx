import { Settings } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditorPageClient } from "@/components/editor/editor-page-client";
import { MainLayout } from "@/components/layouts/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectService } from "@/lib/services/project-service";
import { createClient } from "@/lib/supabase/server";

interface DocumentPageProps {
  params: Promise<{
    product_id: string;
    document_id: string;
  }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { product_id, document_id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get project
  const projectService = new ProjectService(supabase);
  const projectResult = await projectService.getProjectBySlug(product_id);

  if (projectResult.error || !projectResult.data) {
    notFound();
  }

  const project = projectResult.data;

  // Get document
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", document_id)
    .eq("project_id", project.id)
    .single();

  if (documentError || !document) {
    notFound();
  }

  const isOwner = document.creator_id === user.id;
  const canEdit = isOwner || project.creator_id === user.id;

  if (!canEdit) {
    notFound();
  }

  const breadcrumbs = [
    { label: "Projects", href: "/projects" },
    { label: project.title, href: `/projects/${project.slug}` },
    { label: document.title },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{document.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  {document.document_type.replace(/_/g, " ")}
                </Badge>
                <Badge
                  variant={
                    document.status === "published" ? "default" : "secondary"
                  }
                >
                  {document.status}
                </Badge>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${product_id}/documents/${document_id}/settings`}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>

        {/* Editor */}
        <EditorPageClient
          documentId={document.id}
          initialContent={document.content || { type: "doc", content: [] }}
          canEdit={canEdit}
        />
      </div>
    </MainLayout>
  );
}
