import { Settings } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditorPageClient } from "@/components/editor/editor-page-client";
import { MainLayout } from "@/components/layouts/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectService } from "@/lib/services/project-service";
import { createClient } from "@/lib/supabase/server";
import { DocumentSettingsForm } from "@/components/documents/document-settings-form";

interface DocumentPageProps {
  params: Promise<{
    slug: string;
    document_id: string;
  }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { slug, document_id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get project
  const projectService = new ProjectService(supabase);
  const projectResult = await projectService.getProjectBySlug(slug);

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
            <Link
              href={`/projects/${slug}/documents/${document_id}/settings`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>

        {/* Settings Form */}
        <DocumentSettingsForm
          documentId={document.id}
          projectSlug={slug}
          initialData={{
            title: document.title,
            description: document.description || "",
            document_type: document.document_type,
            status: document.status,
            is_public: document.is_public,
            license_type: document.license_type,
            license_terms: document.license_terms || "",
            royalty_percentage: document.royalty_percentage,
            seeking_collaborators: document.seeking_collaborators,
          }}
        />

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
