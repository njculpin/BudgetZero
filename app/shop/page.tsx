import { Search as SearchIcon, ShoppingBag, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MainLayout } from "@/components/layouts/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAdminGetAllProducts, useAdminGetMe } from "@/lib/sdk/server";

interface ShopPageProps {
  searchParams: Promise<{
    collection?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const search = params.search;
  const page = Number.parseInt(params.page || "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  const user = await useAdminGetMe();

  const { data: products, count } = await useAdminGetAllProducts({
    search,
    limit,
    offset,
  });

  const totalPages = count ? Math.ceil(count / limit) : 0;
  const breadcrumbs = [{ label: "Shop" }];

  // Helper function to format price
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Helper function to get cheapest variant price
  const getCheapestPrice = (product: NonNullable<typeof products>[number]) => {
    if (!product.product_variants || product.product_variants.length === 0) {
      return null;
    }

    const prices = product.product_variants
      .flatMap(
        (variant: {
          product_variant_prices?: Array<{
            is_active: boolean;
            currency_code: string;
            amount_cents: number;
            compare_at_amount_cents?: number | null;
          }>;
        }) => variant.product_variant_prices || [],
      )
      .filter(
        (price: { is_active: boolean; currency_code: string }) =>
          price.is_active && price.currency_code === "USD",
      );

    if (prices.length === 0) return null;

    const cheapest = Math.min(
      ...prices.map((p: { amount_cents: number }) => p.amount_cents),
    );
    const hasDiscount = prices.some(
      (p: { compare_at_amount_cents?: number | null; amount_cents: number }) =>
        p.compare_at_amount_cents && p.compare_at_amount_cents > p.amount_cents,
    );

    return { cheapest, hasDiscount };
  };

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground mt-2">
              Browse and purchase tabletop game projects
            </p>
          </div>
        </div>

        {/* Results count */}
        {products && products.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {count} {count === 1 ? "product" : "products"} found
          </div>
        )}

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const priceInfo = getCheapestPrice(product);
                const primaryImage =
                  product.product_images?.find(
                    (img: { is_primary?: boolean }) => img.is_primary,
                  ) || product.product_images?.[0];

                return (
                  <Link key={product.id} href={`/shop/${product.handle}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                      <div className="aspect-square bg-muted relative">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.file_url}
                            alt={primaryImage.alt_text || product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {product.is_featured && (
                          <div className="absolute top-2 left-2">
                            <Badge
                              variant="default"
                              className="flex items-center gap-1"
                            >
                              <Star className="h-3 w-3" />
                              Featured
                            </Badge>
                          </div>
                        )}
                        {priceInfo?.hasDiscount && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="destructive">Sale</Badge>
                          </div>
                        )}
                      </div>
                      <CardHeader className="flex-grow">
                        <CardTitle className="line-clamp-2 text-base">
                          {product.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {product.description}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-0">
                        {priceInfo && (
                          <div className="text-lg font-bold">
                            {formatPrice(priceInfo.cheapest)}
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {page > 1 && (
                  <Button variant="outline" asChild>
                    <Link
                      href={`/shop?${new URLSearchParams({
                        ...(search && { search }),
                        page: (page - 1).toString(),
                      }).toString()}`}
                    >
                      Previous
                    </Link>
                  </Button>
                )}
                <div className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                {page < totalPages && (
                  <Button variant="outline" asChild>
                    <Link
                      href={`/shop?${new URLSearchParams({
                        ...(search && { search }),
                        page: (page + 1).toString(),
                      }).toString()}`}
                    >
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <Card>
            <EmptyState
              icon={
                search ? (
                  <SearchIcon className="w-6 h-6" />
                ) : (
                  <ShoppingBag className="w-6 h-6" />
                )
              }
              title="No products found"
              description={
                search
                  ? "Try adjusting your search terms or browse all products"
                  : "Products will appear here when creators publish them to the marketplace"
              }
              action={
                search ? (
                  <Button variant="outline" asChild>
                    <Link href="/shop">View All Products</Link>
                  </Button>
                ) : undefined
              }
            />
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
