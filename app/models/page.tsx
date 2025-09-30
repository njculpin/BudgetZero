import { createClient } from "@/lib/supabase/server";
import { MainLayout } from "@/components/layouts/main-layout";
import { AssetService } from "@/lib/services/assets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelsFilters } from "@/components/models/models-filters";
import Link from "next/link";
import { Plus, Download, Eye, Package } from "lucide-react";
import { formatPrice } from "@/lib/constants/licenses";

export const metadata = {
  title: "3D Models | Workshop",
  description: "Browse and download 3D models for your tabletop games",
};

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const page = params.page ? parseInt(params.page as string) : 1;
  const category = params.category as string | undefined;
  const search = params.search as string | undefined;

  const assetService = new AssetService(supabase);
  const result = await assetService.getPublicAssets({
    asset_type: "model",
    model_category: category,
    search,
    page,
    limit: 20,
  });

  const models = result.data?.data || [];
  const totalCount = result.data?.count || 0;
  const hasMore = result.data?.has_more || false;

  const breadcrumbs = [{ label: "Models" }];

  return (
    <MainLayout user={user ?? undefined} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">3D Models</h1>
            <p className="text-gray-600 mt-1">
              Browse and download community 3D models
            </p>
          </div>
          {user && (
            <Button asChild>
              <Link href="/models/new">
                <Plus className="h-4 w-4 mr-2" />
                Upload Model
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <ModelsFilters />

        {/* Stats */}
        <div className="text-sm text-gray-600">
          Showing {models.length} of {totalCount} models
        </div>

        {/* Models Grid */}
        {models.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  No models found
                </h3>
                <p className="text-gray-600 mb-6">
                  {search || category
                    ? "Try adjusting your search or filters"
                    : "Be the first to share your 3D models with the community"}
                </p>
                {user && !search && !category && (
                  <Button asChild size="lg">
                    <Link href="/models/new">
                      <Plus className="h-5 w-5 mr-2" />
                      Upload First Model
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {models.map((model) => (
              <Link
                key={model.id}
                href={`/models/${model.id}`}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  {/* Thumbnail */}
                  <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                    {model.thumbnail_url ? (
                      <img
                        src={model.thumbnail_url}
                        alt={model.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Eye className="h-12 w-12" />
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">
                      {model.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      by {model.creator.full_name || model.creator.username || "Anonymous"}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Category Badge */}
                    {model.model_category && (
                      <Badge variant="secondary">
                        {model.model_category}
                      </Badge>
                    )}

                    {/* Model Info */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{model.download_count}</span>
                      </div>
                      {model.polygon_count && (
                        <span className="text-xs">
                          {(model.polygon_count / 1000).toFixed(0)}k polys
                        </span>
                      )}
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {model.is_game_ready && (
                        <Badge variant="outline" className="text-xs">
                          Game Ready
                        </Badge>
                      )}
                      {model.is_textured && (
                        <Badge variant="outline" className="text-xs">
                          Textured
                        </Badge>
                      )}
                      {model.is_rigged && (
                        <Badge variant="outline" className="text-xs">
                          Rigged
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    <div className="pt-2 border-t">
                      <p className="font-semibold text-lg">
                        {formatPrice(model.price_cents)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(page > 1 || hasMore) && (
          <div className="flex justify-center gap-2">
            {page > 1 && (
              <Button asChild variant="outline">
                <Link href={`/models?page=${page - 1}`}>Previous</Link>
              </Button>
            )}
            {hasMore && (
              <Button asChild variant="outline">
                <Link href={`/models?page=${page + 1}`}>Next</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}