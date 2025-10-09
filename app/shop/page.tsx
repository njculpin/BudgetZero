import { ShoppingBag, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layouts/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";

interface ShopPageProps {
  searchParams: Promise<{
    collection?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const collectionHandle = params.collection;
  const search = params.search;
  const page = Number.parseInt(params.page || "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Build query for products
  let query = supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      product_variants (
        *,
        product_variant_prices (*)
      ),
      product_projects (
        project:project_id (id, title, slug)
      )
    `,
      { count: "exact" },
    )
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data: products, count } = await query;

  // Get collections
  const { data: collections } = await supabase
    .from("product_collections")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");

  const totalPages = count ? Math.ceil(count / limit) : 0;

  const breadcrumbs = [{ label: "Shop" }];

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

        {/* Collections Filter */}
        {collections && collections.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <Button
              variant={!collectionHandle ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href="/shop">All Products</Link>
            </Button>
            {collections.map((collection) => (
              <Button
                key={collection.id}
                variant={
                  collectionHandle === collection.handle ? "default" : "outline"
                }
                size="sm"
                asChild
              >
                <Link href={`/shop?collection=${collection.handle}`}>
                  {collection.name}
                </Link>
              </Button>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {count} {count === 1 ? "product" : "products"} found
        </div>

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const primaryImage = product.product_images?.find(
                  (img) => img.is_primary,
                ) || product.product_images?.[0];

                const defaultVariant = product.product_variants?.[0];
                const usdPrice = defaultVariant?.product_variant_prices?.find(
                  (p) => p.currency_code === "USD" && p.is_active,
                );

                return (
                  <Link key={product.id} href={`/shop/${product.handle}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <div className="aspect-[4/3] bg-muted relative">
                        {primaryImage ? (
                          <img
                            src={primaryImage.file_url}
                            alt={primaryImage.alt_text || product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {product.is_featured && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="default">Featured</Badge>
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <CardTitle className="line-clamp-2 text-base">
                          {product.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">
                          {product.product_projects?.[0]?.project?.title || "Game Project"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          {usdPrice ? (
                            <span className="text-lg font-bold">
                              ${(usdPrice.amount_cents / 100).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Price varies
                            </span>
                          )}
                          {defaultVariant && (
                            <span className="text-xs text-muted-foreground">
                              {product.product_variants?.length || 0} options
                            </span>
                          )}
                        </div>
                      </CardContent>
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
                        ...(collectionHandle && { collection: collectionHandle }),
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
                        ...(collectionHandle && { collection: collectionHandle }),
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
