import { ArrowLeft, Box, Clock, Image } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssetSearch } from "@/components/assets/asset-search";
import { AddAssetButton } from "@/components/projects/add-asset-button";
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

interface AddAssetPageProps {
  params: Promise<{
    project_id: string;
  }>;
  searchParams: Promise<{
    type?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AddAssetPage({
  params,
  searchParams,
}: AddAssetPageProps) {
  const { project_id } = await params;
  const queryParams = await searchParams;

  const assetType = queryParams.type;
  const search = queryParams.search;
  const page = Number.parseInt(queryParams.page || "1", 10);
  const limit = 24;
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch project to verify ownership
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, title, creator_id")
    .eq("id", project_id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  if (project.creator_id !== user.id) {
    redirect(`/projects/${project_id}`);
  }

  // Fetch existing references for this project WITH status
  const { data: existingReferences } = await supabase
    .from("project_asset_references")
    .select("asset_id, status")
    .eq("project_id", project_id);

  // Use Map for O(1) lookup with status information
  const existingAssetMap = new Map(
    existingReferences?.map((ref) => [ref.asset_id, ref.status]) || [],
  );

  // Build asset query
  let query = supabase
    .from("assets")
    .select(
      `
      *,
      creator:profiles!creator_id(id, full_name, username, avatar_url)
    `,
      { count: "exact" },
    )
    .eq("is_public", true)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (assetType) {
    query = query.eq("asset_type", assetType);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data: assets, count } = await query;

  const totalPages = count ? Math.ceil(count / limit) : 0;

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/projects/${project_id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {project.title}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add Assets to Project</h1>
        <p className="text-muted-foreground mt-2">
          Browse and add 3D models, illustrations, and other assets to your
          project
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <AssetSearch />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Button variant={!assetType ? "default" : "outline"} size="sm" asChild>
          <Link href={`/projects/${project_id}/add-asset`}>All Assets</Link>
        </Button>
        <Button
          variant={assetType === "model" ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link href={`/projects/${project_id}/add-asset?type=model`}>
            <Box className="mr-2 h-4 w-4" />
            Models
          </Link>
        </Button>
        <Button
          variant={assetType === "illustration" ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link href={`/projects/${project_id}/add-asset?type=illustration`}>
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
            {assets.map((asset) => {
              const referenceStatus = existingAssetMap.get(asset.id);
              const alreadyAdded = referenceStatus !== undefined;

              return (
                <Card
                  key={asset.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col"
                >
                  <div className="aspect-square bg-muted relative">
                    {asset.asset_type === "illustration" ||
                    asset.asset_type === "photo" ||
                    asset.asset_type === "texture" ? (
                      <img
                        src={asset.file_url}
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
                        {asset.asset_type}
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
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline" className="capitalize text-xs">
                          {asset.license_type}
                        </Badge>
                        {asset.royalty_percentage > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {asset.royalty_percentage}% royalty
                          </span>
                        )}
                      </div>
                      {alreadyAdded ? (
                        <div className="space-y-1">
                          <Button
                            variant={
                              referenceStatus === "pending"
                                ? "outline"
                                : "secondary"
                            }
                            size="sm"
                            className={`w-full ${
                              referenceStatus === "pending"
                                ? "border-amber-500 text-amber-700 hover:bg-amber-50"
                                : ""
                            }`}
                            disabled
                          >
                            {referenceStatus === "pending" &&
                              "Pending Approval"}
                            {referenceStatus === "approved" && "Already Added"}
                            {referenceStatus === "rejected" &&
                              "Request Rejected"}
                          </Button>
                          {referenceStatus === "pending" && (
                            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3" />
                              Waiting for asset owner
                            </p>
                          )}
                        </div>
                      ) : (
                        <AddAssetButton
                          projectId={project_id}
                          assetId={asset.id}
                          assetTitle={asset.title}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {page > 1 && (
                <Button variant="outline" asChild>
                  <Link
                    href={`/projects/${project_id}/add-asset?${new URLSearchParams(
                      {
                        ...(assetType && { type: assetType }),
                        ...(search && { search }),
                        page: (page - 1).toString(),
                      },
                    ).toString()}`}
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
                    href={`/projects/${project_id}/add-asset?${new URLSearchParams(
                      {
                        ...(assetType && { type: assetType }),
                        ...(search && { search }),
                        page: (page + 1).toString(),
                      },
                    ).toString()}`}
                  >
                    Next
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>No assets found</CardTitle>
            <CardDescription>
              {search
                ? "Try adjusting your search terms"
                : "No public assets available yet"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
