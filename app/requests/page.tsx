import { CheckCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { AttributionRequestCard } from "@/components/blocks/projects/project-request-card";
import { MainLayout } from "@/components/layouts/main-layout";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import type { EnrichedAssetReference } from "@/lib/types/database";

export default async function CollaborationRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // First, get user's asset IDs
  const { data: userAssets } = await supabase
    .from("assets")
    .select("id")
    .eq("creator_id", user.id);

  const assetIds = userAssets?.map((a) => a.id) || [];

  // Shared maps for lookups
  const projectMap = new Map<
    string,
    { id: string; title: string; slug: string; creator_id: string }
  >();
  const creatorMap = new Map<
    string,
    { id: string; full_name: string | null }
  >();

  // Fetch all asset references (pending, approved, rejected)
  let pendingAssetRefs: EnrichedAssetReference[] = [];
  let approvedAssetRefs: EnrichedAssetReference[] = [];
  let rejectedAssetRefs: EnrichedAssetReference[] = [];

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
    projects?.forEach((p) => projectMap.set(p.id, p));
    creators?.forEach((c) => creatorMap.set(c.id, c));

    const pending: EnrichedAssetReference[] = [];
    const approved: EnrichedAssetReference[] = [];
    const rejected: EnrichedAssetReference[] = [];

    for (const ref of refs || []) {
      const asset = assetMap.get(ref.asset_id);
      const project = projectMap.get(ref.project_id);
      if (!asset || !project) continue;

      const projectCreator = creatorMap.get(project.creator_id) || {
        id: project.creator_id,
        full_name: null,
      };

      const enrichedRef: EnrichedAssetReference = {
        id: ref.id,
        royalty_percentage: ref.royalty_percentage,
        status: ref.status as "pending" | "approved" | "rejected",
        requested_at: ref.requested_at,
        asset,
        project: { ...project, creator: projectCreator },
      };

      if (ref.status === "pending") pending.push(enrichedRef);
      else if (ref.status === "approved") approved.push(enrichedRef);
      else if (ref.status === "rejected") rejected.push(enrichedRef);
    }

    pendingAssetRefs = pending;
    approvedAssetRefs = approved;
    rejectedAssetRefs = rejected;
  }

  const pendingCount = pendingAssetRefs.length;
  const approvedCount = approvedAssetRefs.length;
  const rejectedCount = rejectedAssetRefs.length;

  const breadcrumbs = [{ label: "Collaboration Requests" }];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Collaboration Requests
          </h1>
          <p className="text-gray-600">
            Manage requests from creators who want to use your content
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              {approvedCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {approvedCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              {rejectedCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {rejectedCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>
                  Review and respond to attribution requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingCount === 0 ? (
                  <EmptyState
                    icon={<CheckCircle className="w-6 h-6" />}
                    title="No pending requests"
                    description="Attribution requests will appear here when creators reference your work"
                  />
                ) : (
                  <div className="space-y-4">
                    {pendingAssetRefs.map((reference) => (
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
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Requests</CardTitle>
                <CardDescription>
                  Content you've approved for use in other projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvedCount === 0 ? (
                  <EmptyState
                    icon={<CheckCircle className="w-6 h-6" />}
                    title="No approved requests"
                    description="Approved attribution requests will appear here"
                  />
                ) : (
                  <div className="space-y-4">
                    {approvedAssetRefs.map((reference) => (
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
          </TabsContent>

          {/* Rejected Tab */}
          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Requests</CardTitle>
                <CardDescription>
                  Requests you've declined for your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rejectedCount === 0 ? (
                  <EmptyState
                    icon={<CheckCircle className="w-6 h-6" />}
                    title="No rejected requests"
                    description="Rejected attribution requests will appear here"
                  />
                ) : (
                  <div className="space-y-4">
                    {rejectedAssetRefs.map((reference) => (
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
                        currentUserId={user.id}
                        status={reference.status}
                        requestedAt={reference.requested_at}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
