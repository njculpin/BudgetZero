import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetDetailView } from "@/components/blocks/assets/asset-detail-view";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { useAdminGetAssetById } from "@/lib/sdk/server/use-admin-get-asset-by-id";
import { useAdminGetAssetPricing } from "@/lib/sdk/server/use-admin-get-asset-pricing";
import { useAdminGetMe } from "@/lib/sdk/server/use-admin-get-me";

interface AssetDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssetDetailPage({
  params,
}: AssetDetailPageProps) {
  const { id } = await params;
  const user = await useAdminGetMe();

  // Fetch asset with all related data using SDK
  const { data: asset, error } = await useAdminGetAssetById(id);

  if (error || !asset) {
    notFound();
  }

  // Fetch pricing data
  const { data: pricingOptions } = await useAdminGetAssetPricing(id);

  // Check if user has access (public or owner)
  const settings = asset.asset_settings?.[0];
  const isOwner = asset.creator_id === user.id;
  const isPublic = settings?.is_public || false;

  if (!isOwner && !isPublic) {
    notFound();
  }

  const breadcrumbs = [
    { label: "Assets", href: "/assets" },
    { label: asset.title },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link href="/assets">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assets
          </Link>
        </Button>

        {/* Asset Detail View (with edit mode for owners) */}
        <AssetDetailView
          asset={asset}
          isOwner={isOwner}
          currentUserId={user.id}
          pricingOptions={pricingOptions || []}
        />
      </div>
    </MainLayout>
  );
}
