import { ShoppingBag, ShoppingCart } from "lucide-react";
import { notFound, redirect } from "next/navigation";
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
import { createClient } from "@/lib/supabase/server";

interface ProductDetailPageProps {
  params: Promise<{
    handle: string;
  }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { handle } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch product with all related data
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      product_tags (tag),
      product_variants (
        *,
        product_variant_prices (*),
        product_variant_options (*),
        product_digital_files (*)
      ),
      product_projects (
        project:project_id (
          id,
          title,
          slug,
          description,
          creator:creator_id (id, full_name, username)
        )
      ),
      product_seo (*)
    `,
    )
    .eq("handle", handle)
    .eq("status", "active")
    .single();

  if (error || !product) {
    notFound();
  }

  const primaryImage =
    product.product_images?.find((img) => img.is_primary) ||
    product.product_images?.[0];

  const sortedImages = product.product_images?.sort(
    (a, b) => a.display_order - b.display_order,
  );

  const defaultVariant = product.product_variants?.[0];
  const usdPrice = defaultVariant?.product_variant_prices?.find(
    (p) => p.currency_code === "USD" && p.is_active,
  );

  const breadcrumbs = [
    { label: "Shop", href: "/shop" },
    { label: product.title },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        {/* Product Header */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden relative">
              {primaryImage ? (
                <img
                  src={primaryImage.file_url}
                  alt={primaryImage.alt_text || product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            {sortedImages && sortedImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {sortedImages.slice(0, 4).map((image) => (
                  <div
                    key={image.id}
                    className="aspect-square bg-muted rounded overflow-hidden cursor-pointer hover:opacity-75 transition"
                  >
                    <img
                      src={image.file_url}
                      alt={image.alt_text || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.is_featured && (
                <Badge variant="default" className="mb-2">
                  Featured
                </Badge>
              )}
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              {product.product_projects?.[0]?.project && (
                <p className="text-muted-foreground">
                  By{" "}
                  {product.product_projects[0].project.creator.full_name ||
                    product.product_projects[0].project.creator.username}
                </p>
              )}
            </div>

            {usdPrice && (
              <div className="text-3xl font-bold">
                ${(usdPrice.amount_cents / 100).toFixed(2)}
                {usdPrice.compare_at_amount_cents && (
                  <span className="text-lg text-muted-foreground line-through ml-2">
                    ${(usdPrice.compare_at_amount_cents / 100).toFixed(2)}
                  </span>
                )}
              </div>
            )}

            {product.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {/* Variants */}
            {product.product_variants && product.product_variants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {product.product_variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-muted cursor-pointer transition"
                    >
                      <div>
                        <div className="font-medium">{variant.name}</div>
                        {variant.product_variant_options &&
                          variant.product_variant_options.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {variant.product_variant_options
                                .map((opt) => `${opt.option_name}: ${opt.option_value}`)
                                .join(", ")}
                            </div>
                          )}
                      </div>
                      <div className="text-sm font-medium">
                        {variant.product_variant_prices?.[0] &&
                          `$${(variant.product_variant_prices[0].amount_cents / 100).toFixed(2)}`}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Button size="lg" className="w-full" disabled>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart (Coming Soon)
            </Button>

            {/* Tags */}
            {product.product_tags && product.product_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {product.product_tags.map((tagObj) => (
                  <Badge key={tagObj.tag} variant="outline">
                    {tagObj.tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Project Info */}
        {product.product_projects &&
          product.product_projects.length > 0 &&
          product.product_projects[0].project && (
            <Card>
              <CardHeader>
                <CardTitle>About This Project</CardTitle>
                <CardDescription>
                  {product.product_projects[0].project.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {product.product_projects[0].project.description ||
                    "No description available"}
                </p>
                <Button variant="outline" asChild>
                  <a
                    href={`/projects/${product.product_projects[0].project.slug}`}
                  >
                    View Project
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

        {/* Digital Files Preview (if applicable) */}
        {defaultVariant?.product_digital_files &&
          defaultVariant.product_digital_files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Included Files</CardTitle>
                <CardDescription>
                  Files you'll receive with this purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {defaultVariant.product_digital_files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <div className="font-medium">{file.file_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {file.file_format?.toUpperCase()}
                          {file.file_size_bytes &&
                            ` • ${(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </MainLayout>
  );
}
