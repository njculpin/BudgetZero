import { notFound, redirect } from "next/navigation";
import { MainLayout } from "@/components/layouts/main-layout";
import { AssetUploadForm } from "@/components/shared/forms/asset-upload-form";
import { ProjectService } from "@/lib/services/project-service";
import { createClient } from "@/lib/supabase/server";
import type { AssetType } from "@/lib/types/database";

interface CreateAssetPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    type?: AssetType;
  }>;
}

const ASSET_CONFIG = {
  model: {
    title: "Add 3D Model",
    description: "Upload a 3D model to",
    breadcrumbLabel: "Add Model",
  },
  illustration: {
    title: "Add Illustration",
    description: "Upload artwork to",
    breadcrumbLabel: "Add Illustration",
  },
  photo: {
    title: "Add Photo",
    description: "Upload a photo to",
    breadcrumbLabel: "Add Photo",
  },
  texture: {
    title: "Add Texture",
    description: "Upload a texture to",
    breadcrumbLabel: "Add Texture",
  },
  audio: {
    title: "Add Audio",
    description: "Upload audio to",
    breadcrumbLabel: "Add Audio",
  },
} as const;

export default async function CreateAssetPage({
  params,
  searchParams,
}: CreateAssetPageProps) {
  const { slug } = await params;
  const { type = "model" } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Validate asset type
  if (!ASSET_CONFIG[type]) {
    notFound();
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

  const config = ASSET_CONFIG[type];
  const breadcrumbs = [
    { label: "My Projects", href: "/projects" },
    { label: project.title, href: `/projects/${project.slug}` },
    { label: config.breadcrumbLabel },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{config.title}</h1>
          <p className="text-muted-foreground mt-2">
            {config.description} {project.title}
          </p>
        </div>

        <AssetUploadForm
          assetType={type}
          projectId={project.id}
          onSuccess={(assetId) => {
            redirect(`/projects/${slug}/${type}s/${assetId}`);
          }}
        />
      </div>
    </MainLayout>
  );
}
