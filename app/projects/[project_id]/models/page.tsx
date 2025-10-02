import { Download, Eye, Package, Plus } from "lucide-react";
import Link from "next/link";
import { MainLayout } from "@/components/layouts/main-layout";
import { ModelsFilters } from "@/components/models/models-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/constants/licenses";
import { AssetService } from "@/lib/services/assets";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "3D Models | Workshop",
  description: "Browse and download 3D printable models for tabletop games",
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
  const page = params.page ? parseInt(params.page as string, 10) : 1;
  const search = params.search as string | undefined;
  const tagsParam = params.tags as string | undefined;
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;

  const assetService = new AssetService(supabase);
  const result = await assetService.getPublicAssets({
    asset_type: "model",
    tags,
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
              Browse and download 3D printable models for tabletop games
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
                  {search || tags
                    ? "Try adjusting your search or filters"
                    : "Be the first to share your 3D printable models for tabletop games"}
                </p>
                {user && !search && !tags && (
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
                      by{" "}
                      {model.creator.full_name ||
                        model.creator.username ||
                        "Anonymous"}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Tags */}
                    {model.tags && model.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {model.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {model.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{model.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Model Info */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{model.download_count}</span>
                      </div>
                      {model.file_format && (
                        <span className="text-xs uppercase">
                          {model.file_format}
                        </span>
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
