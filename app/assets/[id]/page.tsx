import { AssetDetailView } from "@/components/blocks/assets/asset-detail-view";
import { MainLayout } from "@/components/layouts/main-layout";
import { getAssetByIdWithDetails } from "@/lib/sdk/server/assets";
import { getMe } from "@/lib/sdk/server/users";
import { notFound } from "next/navigation";

interface AssetDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    onboarding?: string;
  }>;
}

export default async function AssetDetailPage({
  params,
  searchParams,
}: AssetDetailPageProps) {
  const { id } = await params;
  const { onboarding } = await searchParams;
  const user = await getMe();

  const { data: asset, error } = await getAssetByIdWithDetails(id);

  if (error || !asset) {
    notFound();
  }

  // Check if user has access (public or owner)
  const isOwner = asset.user_id === user.id;
  const isPublic = asset.is_public || false;

  if (!isOwner && !isPublic) {
    notFound();
  }

  const showOnboarding = onboarding === "true";

  const breadcrumbs = [
    { label: "Asset Library", href: "/assets" },
    { label: asset.title },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-5xl">
        <AssetDetailView
          asset={asset}
          isOwner={isOwner}
          showOnboarding={showOnboarding}
        />
      </div>
    </MainLayout>
  );
}
