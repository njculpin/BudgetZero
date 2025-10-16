import { AssetImageGallery } from "@/components/blocks/assets/asset-image-gallery";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getAssetByIdWithDetails } from "@/lib/sdk/server/assets";
import { getMe } from "@/lib/sdk/server/users";
import {
  Heart,
  RotateCcw,
  Shield,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { notFound } from "next/navigation";

interface AssetDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssetDetailPage({
  params,
}: AssetDetailPageProps) {
  const { id } = await params;
  const user = await getMe();

  const { data: asset, error } = await getAssetByIdWithDetails(id);

  if (error || !asset) {
    notFound();
  }

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
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image Gallery */}
          <AssetImageGallery
            images={asset.asset_preview_images}
            productName={asset.title}
          />

          {/* Product Info */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              {asset.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((starNumber) => (
                  <Star
                    key={`star-${starNumber}`}
                    className={`h-5 w-5 ${
                      starNumber <= 3
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {asset.rating} ({asset.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold">$10</span>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="mb-2 text-lg font-semibold">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {asset.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button size="lg" className="flex-1">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button size="lg" variant="outline">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Benefits */}
            <div className="grid gap-4 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">
                  Free shipping on orders over $50
                </span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">30-day return policy</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">2-year warranty included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
