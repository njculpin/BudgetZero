import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProductByIdWithDetails } from "@/lib/sdk/server/products";
import { getMe } from "@/lib/sdk/server/users";
import { CheckCircle2, Download, Home } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

interface ProductSuccessPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function ProductSuccessPage({
  params,
  searchParams,
}: ProductSuccessPageProps) {
  const { id } = await params;
  const { session_id } = await searchParams;
  const user = await getMe();

  // Verify the Stripe session
  if (!session_id) {
    notFound();
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    notFound();
  }

  // Verify session belongs to this product and user
  if (
    session.metadata?.product_id !== id ||
    session.metadata?.user_id !== user.id
  ) {
    notFound();
  }

  // Get product details
  const { data: product, error } = await getProductByIdWithDetails(id);

  if (error || !product) {
    notFound();
  }

  const breadcrumbs = [
    { label: "Products", href: "/products" },
    { label: product.title, href: `/products/${id}` },
    { label: "Purchase Complete" },
  ];

  // Get variant and pricing info
  const variant = product.product_variants?.[0];
  const price = variant?.product_variant_prices?.[0];
  const priceCents = price?.price_cents || 0;
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Get assets from variant
  const variantAssets = variant?.product_variant_assets || [];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Success Message */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <CardTitle className="text-2xl text-green-900">
                  Purchase Complete!
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-green-900">
              <p>
                Thank you for your purchase! Your payment has been processed
                successfully.
              </p>
              <div className="rounded-lg border border-green-300 bg-white p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Product
                    </div>
                    <div className="font-semibold">{product.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Amount Paid
                    </div>
                    <div className="font-semibold text-lg">
                      {formatPrice(priceCents)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Assets */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Your Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {variantAssets.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    Your purchased assets are ready to download. These assets
                    are also available in your library at any time.
                  </p>
                  <div className="space-y-2">
                    {variantAssets.map((variantAsset: {
                      id: number;
                      assets: {
                        id: string;
                        title: string;
                        description: string | null;
                      } | null;
                    }) => {
                      const asset = variantAsset.assets;
                      return (
                        <div
                          key={variantAsset.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div>
                            <div className="font-medium">{asset?.title}</div>
                            {asset?.description && (
                              <div className="text-sm text-muted-foreground">
                                {asset.description}
                              </div>
                            )}
                          </div>
                          <Button asChild>
                            <Link href={`/assets/${asset?.id}`}>
                              View Asset
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No assets available for download.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Access Your Assets</div>
                  <div className="text-sm text-muted-foreground">
                    All purchased assets are available in your asset library
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Receipt Sent</div>
                  <div className="text-sm text-muted-foreground">
                    A receipt has been sent to {user.email}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Support Creators</div>
                  <div className="text-sm text-muted-foreground">
                    Your purchase supports independent creators through
                    automatic royalty distribution
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <Button asChild size="lg">
              <Link href="/assets">
                <Download className="mr-2 h-5 w-5" />
                View My Assets
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/products">
                <Home className="mr-2 h-5 w-5" />
                Browse More Products
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
