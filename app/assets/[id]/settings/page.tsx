import { notFound, redirect } from "next/navigation";
import { AssetSettingsForm } from "@/components/assets/asset-settings-form";
import { MainLayout } from "@/components/layouts/main-layout";
import { createClient } from "@/lib/supabase/server";

interface AssetSettingsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssetSettingsPage({
  params,
}: AssetSettingsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch asset
  const { data: asset, error } = await supabase
    .from("assets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !asset) {
    notFound();
  }

  // Check ownership
  if (asset.creator_id !== user.id) {
    redirect(`/assets/${id}`);
  }

  const initialData = {
    title: asset.title,
    description: asset.description || "",
    status: asset.status as "draft" | "published" | "archived",
    is_public: asset.is_public,
    is_featured: asset.is_featured,
    license_type: asset.license_type as
      | "free"
      | "attribution"
      | "commercial"
      | "exclusive",
    license_terms: asset.license_terms || "",
    royalty_percentage: asset.royalty_percentage,
    price_cents: asset.price_cents,
    seeking_collaborators: asset.seeking_collaborators,
    tags: asset.tags || [],
  };

  const breadcrumbs = [
    { label: "Asset Library", href: "/assets" },
    { label: asset.title, href: `/assets/${id}` },
    { label: "Settings" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Asset Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage settings for {asset.title}
          </p>
        </div>

        <AssetSettingsForm
          assetId={id}
          assetType={asset.asset_type as "model" | "illustration"}
          projectId={asset.project_id || ""}
          initialData={initialData}
        />
      </div>
    </MainLayout>
  );
}
