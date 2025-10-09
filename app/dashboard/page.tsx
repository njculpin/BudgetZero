import { AttributionRequestCard } from "@/components/blocks/projects/project-request-card";
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
import {
  useAdminCountUserAssets,
  useAdminCountUserProjects,
  useAdminGetAssetReferences,
  useAdminGetAssetRoyalties,
  useAdminGetAssetStats,
  useAdminGetAssets,
  useAdminGetProjects,
  useAdminGetUserAssets,
  useAdminGetUsers,
} from "@/lib/sdk/server";
import { useAdminGetMe } from "@/lib/sdk/server/use-admin-get-me";
import type { EnrichedAssetReference } from "@/lib/types/database";
import {
  CheckCircle,
  DollarSign,
  Eye,
  FileBox,
  FolderOpen,
  Search,
  Upload,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await useAdminGetMe();

  // Fetch user stats in parallel using SDK
  const [{ count: projectCount }, { count: assetCount }, { data: userAssets }] =
    await Promise.all([
      useAdminCountUserProjects(user.id),
      useAdminCountUserAssets(user.id),
      useAdminGetUserAssets(user.id),
    ]);

  // Get asset stats for user's assets
  const assetIds = userAssets?.map((a) => a.id) || [];

  // Always call SDK functions unconditionally - they handle empty arrays
  const { data: assetStatsData } = await useAdminGetAssetStats(assetIds);

  const totalViews =
    assetStatsData?.reduce((sum, stat) => sum + (stat.view_count || 0), 0) || 0;
  const totalDownloads =
    assetStatsData?.reduce(
      (sum, stat) => sum + (stat.download_count || 0),
      0,
    ) || 0;

  // Fetch pending asset references using SDK
  const [
    { data: refs },
    { data: assets },
    { data: projects },
    { data: creators },
  ] = await Promise.all([
    useAdminGetAssetReferences({ assetIds, status: "pending" }),
    useAdminGetAssets(assetIds),
    useAdminGetProjects([]),
    useAdminGetUsers([]),
  ]);

  // Get royalty percentages if they exist
  const royaltyIds =
    refs
      ?.map((r: { asset_royalty_id?: string }) => r.asset_royalty_id)
      .filter(Boolean) || [];

  const { data: royalties } = await useAdminGetAssetRoyalties(
    royaltyIds as string[],
  );

  // Build asset references
  let assetReferences: EnrichedAssetReference[] = [];

  if (assetIds.length > 0) {
    const assetMap = new Map(assets?.map((a) => [a.id, a]));
    const projectMap = new Map(projects?.map((p) => [p.id, p]));
    const creatorMap = new Map(creators?.map((c) => [c.id, c]));
    const royaltyMap = new Map(royalties?.map((r) => [r.id, r.percentage]));

    const enrichedRefs: EnrichedAssetReference[] = [];

    for (const ref of refs || []) {
      const asset = assetMap.get(ref.asset_id);
      const project = projectMap.get(ref.project_id);
      if (!asset || !project) continue;

      const projectCreator = creatorMap.get(project.creator_id) || {
        id: project.creator_id,
        full_name: null,
      };

      const royaltyPercentage = (ref as { asset_royalty_id?: string })
        .asset_royalty_id
        ? royaltyMap.get(
            (ref as { asset_royalty_id: string }).asset_royalty_id,
          ) || 0
        : 0;

      enrichedRefs.push({
        id: ref.id,
        royalty_percentage: royaltyPercentage,
        status: "pending",
        requested_at: ref.requested_at,
        asset: {
          ...asset,
          asset_type: asset.asset_type || "model",
        },
        project: { ...project, creator: projectCreator },
      });
    }

    assetReferences = enrichedRefs;
  }

  const pendingCount = assetReferences.length;

  const breadcrumbs = [{ label: "Dashboard" }];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to Workshop</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Projects Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Your active projects
              </p>
            </CardContent>
          </Card>

          {/* Assets Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assets</CardTitle>
              <FileBox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assetCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Models, illustrations, and more
              </p>
            </CardContent>
          </Card>

          {/* Total Views Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalViews.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalDownloads.toLocaleString()} downloads
              </p>
            </CardContent>
          </Card>

          {/* Earnings Card - Placeholder */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Attribution Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Attribution Requests</CardTitle>
                <CardDescription>
                  Creators want to use your content in their projects
                </CardDescription>
              </div>
              {pendingCount > 0 && (
                <Badge variant="default" className="ml-auto">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingCount === 0 ? (
              <EmptyState
                icon={<CheckCircle className="w-6 h-6" />}
                title="No pending requests"
                description="Attribution requests appear when creators want to use your assets"
                action={
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/assets/upload">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Assets
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/assets">
                        <Search className="w-4 h-4 mr-2" />
                        Browse Library
                      </Link>
                    </Button>
                  </div>
                }
              />
            ) : (
              <div className="space-y-4">
                {/* Asset References */}
                {assetReferences?.map((reference) => (
                  <AttributionRequestCard
                    key={reference.id}
                    referenceId={reference.id}
                    referenceType="asset"
                    contentTitle={reference.asset.title}
                    contentType={reference.asset.asset_type}
                    thumbnailUrl={reference.asset.thumbnail_url}
                    projectTitle={reference.project.title}
                    projectSlug={reference.project.slug}
                    requesterName={
                      reference.project.creator.full_name || "Anonymous"
                    }
                    royaltyPercentage={reference.royalty_percentage}
                    requestedAt={reference.requested_at}
                    currentUserId={user.id}
                    status={reference.status}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
