import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MainLayout } from "@/components/layouts/main-layout";
import { DocumentSettingsForm } from "@/components/documents/document-settings-form";
import { ProjectService } from "@/lib/services/project-service";
import { createClient } from "@/lib/supabase/server";

interface DocumentSettingsPageProps {
  params: Promise<{
    slug: string;
    document_id: string;
  }>;
}

export default async function DocumentSettingsPage({
  params,
}: DocumentSettingsPageProps) {
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
    {
      label: document.title,
      href: `/projects/${project.slug}/documents/${document_id}`,
    },
    { label: "Settings" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${slug}/documents/${document_id}`}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Document Settings</h1>
            <p className="text-muted-foreground">{document.title}</p>
          </div>
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
            tags: document.tags || [],
          }}
        />
      </div>
    </MainLayout>
  );
}
