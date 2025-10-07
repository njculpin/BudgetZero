import {
  CheckCircle,
  Search,
  Upload,
  FolderOpen,
  FileBox,
  FileText,
  Eye,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { redirect } from "next/navigation";
import { AttributionRequestCard } from "@/components/blocks/projects/project-request-card";
import { MainLayout } from "@/components/layouts/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type {
  EnrichedAssetReference,
  EnrichedDocumentReference,
} from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user stats in parallel
  const [
    { count: projectCount },
    { count: assetCount },
    { count: documentCount },
    { data: assetStats },
    { data: vpData },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id),
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id),
    supabase
      .from("assets")
      .select("download_count, usage_count")
      .eq("creator_id", user.id),
    supabase
      .from("user_victory_points")
      .select("total_points")
      .eq("user_id", user.id)
      .single(),
  ]);

  // Calculate total views (downloads + usages)
  const totalDownloads =
    assetStats?.reduce((sum, asset) => sum + (asset.download_count || 0), 0) ||
    0;
  const totalUsages =
    assetStats?.reduce((sum, asset) => sum + (asset.usage_count || 0), 0) || 0;
  const totalViews = totalDownloads + totalUsages;

  const victoryPoints = vpData?.total_points || 0;

  // First, get user's asset IDs
  const { data: userAssets } = await supabase
    .from("assets")
    .select("id")
    .eq("creator_id", user.id);

  const assetIds = userAssets?.map((a) => a.id) || [];

  // Fetch pending asset references (optimized - single query with in clause)
  let assetReferences: EnrichedAssetReference[] = [];

  // Shared maps for lookups (used by both assets and documents)
  let projectMap = new Map<
    string,
    { id: string; title: string; slug: string; creator_id: string }
  >();
  let creatorMap = new Map<string, { id: string; full_name: string | null }>();

  if (assetIds.length > 0) {
    const [
      { data: refs },
      { data: assets },
      { data: projects },
      { data: creators },
    ] = await Promise.all([
      supabase
        .from("project_asset_references")
        .select(
          "id, royalty_percentage, status, requested_at, asset_id, project_id",
        )
        .eq("status", "pending")
        .in("asset_id", assetIds)
        .order("requested_at", { ascending: false }),
      supabase
        .from("assets")
        .select("id, title, asset_type, thumbnail_url, creator_id")
        .in("id", assetIds),
      supabase.from("projects").select("id, title, slug, creator_id"),
      supabase.from("users").select("id, full_name"),
    ]);

    const assetMap = new Map(assets?.map((a) => [a.id, a]));
    projectMap = new Map(projects?.map((p) => [p.id, p]));
    creatorMap = new Map(creators?.map((c) => [c.id, c]));

    const enrichedRefs: EnrichedAssetReference[] = [];

    for (const ref of refs || []) {
      const asset = assetMap.get(ref.asset_id);
      const project = projectMap.get(ref.project_id);
      if (!asset || !project) continue;

      const projectCreator = creatorMap.get(project.creator_id) || {
        id: project.creator_id,
        full_name: null,
      };

      enrichedRefs.push({
        id: ref.id,
        royalty_percentage: ref.royalty_percentage,
        status: "pending",
        requested_at: ref.requested_at,
        asset,
        project: { ...project, creator: projectCreator },
      });
    }

    assetReferences = enrichedRefs;
  }

  // Get user's document IDs
  const { data: userDocuments } = await supabase
    .from("documents")
    .select("id")
    .eq("creator_id", user.id);

  const documentIds = userDocuments?.map((d) => d.id) || [];

  // Fetch pending document references (optimized - batch query with maps)
  let documentReferences: EnrichedDocumentReference[] = [];

  if (documentIds.length > 0) {
    const [{ data: refs }, { data: documents }] = await Promise.all([
      supabase
        .from("project_document_references")
        .select(
          "id, royalty_percentage, status, requested_at, document_id, project_id",
        )
        .eq("status", "pending")
        .in("document_id", documentIds)
        .order("requested_at", { ascending: false }),
      supabase
        .from("documents")
        .select("id, title, document_type, creator_id")
        .in("id", documentIds),
    ]);

    const documentMap = new Map(documents?.map((d) => [d.id, d]));

    // Reuse project and creator data from asset references if available
    const projectIds =
      refs?.map((r) => r.project_id).filter((id) => !projectMap.has(id)) || [];

    if (projectIds.length > 0) {
      const [{ data: newProjects }, { data: newCreators }] = await Promise.all([
        supabase
          .from("projects")
          .select("id, title, slug, creator_id")
          .in("id", projectIds),
        supabase.from("users").select("id, full_name"),
      ]);

      for (const p of newProjects || []) {
        projectMap.set(p.id, p);
      }
      for (const c of newCreators || []) {
        creatorMap.set(c.id, c);
      }
    }

    const enrichedDocRefs: EnrichedDocumentReference[] = [];

    for (const ref of refs || []) {
      const document = documentMap.get(ref.document_id);
      const project = projectMap.get(ref.project_id);
      if (!document || !project) continue;

      const projectCreator = creatorMap.get(project.creator_id) || {
        id: project.creator_id,
        full_name: null,
      };

      enrichedDocRefs.push({
        id: ref.id,
        royalty_percentage: ref.royalty_percentage,
        status: "pending",
        requested_at: ref.requested_at,
        document,
        project: { ...project, creator: projectCreator },
      });
    }

    documentReferences = enrichedDocRefs;
  }

  const pendingCount =
    (assetReferences?.length || 0) + (documentReferences?.length || 0);

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

          {/* Documents Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Rulebooks and documents
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
                {totalDownloads.toLocaleString()} downloads,{" "}
                {totalUsages.toLocaleString()} uses
              </p>
            </CardContent>
          </Card>

          {/* Victory Points Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Victory Points
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {victoryPoints.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Earn more by playtesting
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
              <div className="py-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No pending requests</p>
                <p className="text-sm mb-4">
                  Attribution requests appear when creators want to use your
                  assets
                </p>
                <div className="flex gap-3 justify-center mt-4">
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
              </div>
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

                {/* Document References */}
                {documentReferences?.map((reference) => (
                  <AttributionRequestCard
                    key={reference.id}
                    referenceId={reference.id}
                    referenceType="document"
                    contentTitle={reference.document.title}
                    contentType={reference.document.document_type}
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
