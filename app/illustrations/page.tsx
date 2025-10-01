import { createClient } from "@/lib/supabase/server";
import { MainLayout } from "@/components/layouts/main-layout";
import { AssetService } from "@/lib/services/assets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IllustrationsFilters } from "@/components/illustrations/illustrations-filters";
import Link from "next/link";
import { Plus, Download, ImageIcon, Palette, Users } from "lucide-react";
import { formatPrice } from "@/lib/constants/licenses";

export const metadata = {
  title: "Illustrations | Workshop",
  description: "Browse and download illustrations for your tabletop games",
};

export default async function IllustrationsPage({
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
  const search = params.search as string | undefined;
  const tagsParam = params.tags as string | undefined;
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;

  const assetService = new AssetService(supabase);
  const result = await assetService.getPublicAssets({
    asset_type: "illustration",
    tags,
    search,
    page,
    limit: 20,
  });

  const illustrations = result.data?.data || [];
  const totalCount = result.data?.count || 0;
  const hasMore = result.data?.has_more || false;

  const breadcrumbs = [{ label: "Illustrations" }];

  return (
    <MainLayout user={user ?? undefined} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Illustrations</h1>
            <p className="text-gray-600 mt-1">
              Browse and download community illustrations
            </p>
          </div>
          {user && (
            <Button asChild>
              <Link href="/illustrations/new">
                <Plus className="h-4 w-4 mr-2" />
                Upload Illustration
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <IllustrationsFilters />

        {/* Stats */}
        <div className="text-sm text-gray-600">
          Showing {illustrations.length} of {totalCount} illustrations
        </div>

        {/* Illustrations Grid */}
        {illustrations.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Palette className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  No illustrations found
                </h3>
                <p className="text-gray-600 mb-6">
                  {search || tags
                    ? "Try adjusting your search or filters"
                    : "Be the first to share your artwork with the community"}
                </p>
                {user && !search && !tags && (
                  <Button asChild size="lg">
                    <Link href="/illustrations/new">
                      <Plus className="h-5 w-5 mr-2" />
                      Upload First Illustration
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {illustrations.map((illustration) => (
              <Link
                key={illustration.id}
                href={`/illustrations/${illustration.id}`}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  {/* Thumbnail */}
                  <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
                    {illustration.thumbnail_url ? (
                      <img
                        src={illustration.thumbnail_url}
                        alt={illustration.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="h-12 w-12" />
                      </div>
                    )}
                    {/* Seeking Collaborators Badge */}
                    {illustration.seeking_collaborators && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                          <Users className="h-3 w-3 mr-1" />
                          Seeking Collab
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">
                      {illustration.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      by{" "}
                      {illustration.creator.full_name ||
                        illustration.creator.username ||
                        "Anonymous"}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Tags */}
                    {illustration.tags && illustration.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {illustration.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {illustration.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{illustration.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Illustration Info */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{illustration.download_count}</span>
                      </div>
                      {illustration.file_format && (
                        <span className="text-xs uppercase">
                          {illustration.file_format}
                        </span>
                      )}
                    </div>


                    {/* Price */}
                    <div className="pt-2 border-t">
                      <p className="font-semibold text-lg">
                        {formatPrice(illustration.price_cents)}
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
                <Link href={`/illustrations?page=${page - 1}`}>Previous</Link>
              </Button>
            )}
            {hasMore && (
              <Button asChild variant="outline">
                <Link href={`/illustrations?page=${page + 1}`}>Next</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
