import { Box, Image, Plus, Search as SearchIcon, Upload } from "lucide-react";
import Link from "next/link";
import { AssetSearch } from "@/components/blocks/assets/asset-search";
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
import { useAdminGetAllAssets } from "@/lib/sdk/server/use-admin-get-all-assets";
import { useAdminGetMe } from "@/lib/sdk/server/use-admin-get-me";

interface AssetsPageProps {
  searchParams: Promise<{
    type?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const params = await searchParams;
  const assetType = params.type;
  const search = params.search;
  const page = Number.parseInt(params.page || "1", 10);
  const limit = 24;
  const offset = (page - 1) * limit;

  const user = await useAdminGetMe();

  // Use SDK to get all public assets
  const {
    data: assets,
    count,
    error,
  } = await useAdminGetAllAssets({
    assetType,
    search,
    publicOnly: true,
    limit,
    offset,
  });

  if (error) {
    // Handle error gracefully
    const breadcrumbs = [{ label: "Asset Library" }];
    return (
      <MainLayout user={user} breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Asset Library</h1>
              <p className="text-muted-foreground mt-2">
                Browse and discover 3D models, illustrations, and more
              </p>
            </div>
          </div>
          <Card className="text-center py-12">
            <CardContent>
              <p>Error loading assets. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const totalPages = count ? Math.ceil(count / limit) : 0;

  const breadcrumbs = [{ label: "Asset Library" }];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Asset Library</h1>
            <p className="text-muted-foreground mt-2">
              Browse and discover 3D models, illustrations, and more
            </p>
          </div>
          <Button asChild>
            <Link href="/assets/upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload Asset
            </Link>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <AssetSearch />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={!assetType ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href="/assets">All Assets</Link>
          </Button>
          <Button
            variant={assetType === "model" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href="/assets?type=model">
              <Box className="mr-2 h-4 w-4" />
              Models
            </Link>
          </Button>
          <Button
            variant={assetType === "illustration" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href="/assets?type=illustration">
              <Image className="mr-2 h-4 w-4" />
              Illustrations
            </Link>
          </Button>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {count} {count === 1 ? "asset" : "assets"} found
        </div>

        {/* Assets Grid */}
        {assets && assets.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {assets.map((asset) => (
                <Link key={asset.id} href={`/assets/${asset.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="aspect-square bg-muted relative">
                      {asset.thumbnail_url ? (
                        <img
                          src={asset.thumbnail_url}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      ) : asset.preview_url ? (
                        <img
                          src={asset.preview_url}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Box className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="capitalize">
                          {asset.status}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-1 text-base">
                        {asset.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        By {asset.creator.full_name || asset.creator.username}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {asset.description || "No description provided"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {page > 1 && (
                  <Button variant="outline" asChild>
                    <Link
                      href={`/assets?${new URLSearchParams({
                        ...(assetType && { type: assetType }),
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
                      href={`/assets?${new URLSearchParams({
                        ...(assetType && { type: assetType }),
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
                  <Upload className="w-6 h-6" />
                )
              }
              title="No assets found"
              description={
                search
                  ? "Try adjusting your search terms or browse all assets"
                  : "Start building your library by uploading your first asset"
              }
              action={
                search ? (
                  <Button variant="outline" asChild>
                    <Link href="/assets">View All Assets</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/assets/upload">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Your First Asset
                    </Link>
                  </Button>
                )
              }
            />
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
