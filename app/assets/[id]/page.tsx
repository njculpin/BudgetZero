import { MainLayout } from "@/components/layouts/main-layout";
import { AssetImageManager } from "@/components/blocks/assets/asset-image-manager";
import { AssetRoyaltySelector } from "@/components/blocks/assets/asset-royalty-selector";
import { AssetLicenseSelector } from "@/components/blocks/assets/asset-license-selector";
import { AssetActionsCard } from "@/components/blocks/assets/asset-actions-card";
import { getAssetById, getAssetImages, getAssetRoyalties, getAssetLicenses } from "@/lib/sdk/server/assets";
import { getMe } from "@/lib/sdk/server/users";
import { createClient } from "@/lib/supabase/server";
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
}: AssetDetailPageProps) {
  const { id } = await params;
  const user = await getMe();
  const client = await createClient();

  const { data: asset, error } = await getAssetById(id);

  if (error || !asset) {
    notFound();
  }

  // Check if user has access (public or owner)
  const isOwner = asset.user_id === user.id;

  if (!isOwner) {
    notFound();
  }

  // Fetch all asset data
  const [imagesResult, royaltiesResult, licensesResult] = await Promise.all([
    getAssetImages(client, id),
    getAssetRoyalties(client, id),
    getAssetLicenses(client, id),
  ]);

  const images = imagesResult.data || [];
  const royalties = royaltiesResult.data || [];
  const assetLicenses = licensesResult.data || [];

  // Get current royalty (first one for the current user)
  const currentRoyalty = royalties.find(r => r.user_id === user.id) || null;

  // Get active license
  const activeLicense = assetLicenses.find(l => l.is_active) || null;

  const breadcrumbs = [
    { label: "Assets", href: "/assets" },
    { label: asset.title },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{asset.title}</h1>
          <p className="text-muted-foreground">
            Configure your asset details, royalties, and licensing terms
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <AssetImageManager
              assetId={id}
              userId={user.id}
              images={images}
              isOwner={isOwner}
            />

            {/* Royalties */}
            <AssetRoyaltySelector
              assetId={id}
              userId={user.id}
              currentRoyalty={currentRoyalty}
              isOwner={isOwner}
            />

            {/* Licensing */}
            <AssetLicenseSelector
              assetId={id}
              currentLicense={activeLicense}
              isOwner={isOwner}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <AssetActionsCard
              assetId={id}
              isSaving={false}
              isOwner={isOwner}
              onAddToProject={() => {}}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
