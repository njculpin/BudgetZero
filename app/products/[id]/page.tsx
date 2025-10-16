import { AssetImageGallery } from "@/components/blocks/assets/asset-image-gallery";
import { ProductBuyButton } from "@/components/blocks/products/product-buy-button";
import { MainLayout } from "@/components/layouts/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getProductByIdWithDetails } from "@/lib/sdk/server/products";
import { getMe } from "@/lib/sdk/server/users";
import { Download, Heart, Shield, Star } from "lucide-react";
import { notFound } from "next/navigation";

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const user = await getMe();

  const { data: product, error } = await getProductByIdWithDetails(id);

  if (error || !product) {
    notFound();
  }

  // Products are public marketplace items
  const breadcrumbs = [
    { label: "Products", href: "/products" },
    { label: product.title },
  ];

  // Get product images for gallery
  const productImages = product.product_images || [];

  // Get pricing from first variant
  const variant = product.product_variants?.[0];
  const price = variant?.product_variant_prices?.[0];
  const priceCents = price?.price_cents || 0;
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Check if product is published
  const isPublished = product.status === "published";

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image Gallery */}
          <AssetImageGallery
            images={productImages}
            productName={product.title}
          />

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                  {product.title}
                </h1>
                {product.is_featured && (
                  <Badge variant="default">Featured</Badge>
                )}
                {!isPublished && <Badge variant="secondary">Draft</Badge>}
              </div>
            </div>

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
                3.0 ({product.product_ratings?.length || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold">
                {formatPrice(priceCents)}
              </span>
              {variant && (
                <span className="text-muted-foreground">{variant.title}</span>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="mb-2 text-lg font-semibold">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <ProductBuyButton
                productId={product.id}
                productTitle={product.title}
                priceCents={priceCents}
                disabled={!isPublished}
              />
              <Button size="lg" variant="outline">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {!isPublished && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                This product is in draft mode and cannot be purchased yet.
              </div>
            )}

            {/* Benefits */}
            <div className="grid gap-4 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Instant digital download</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Secure payment with Stripe</span>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Support independent creators</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
