import { CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { MainLayout } from "@/components/layouts/main-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminGetAssetReferences,
  useAdminGetAssetsByIds,
  useAdminGetMe,
  useAdminGetProjects,
  useAdminGetUserAssets,
  useAdminGetUsers,
} from "@/lib/sdk/server";

export default async function CollaborationRequestsPage() {
  const user = await useAdminGetMe();

  // Get user's asset IDs
  const { data: userAssetIds } = await useAdminGetUserAssets(user.id);
  const assetIds = userAssetIds?.map((a) => a.id) || [];

  // Get full asset data
  const { data: userAssets } = await useAdminGetAssetsByIds(assetIds);

  // Get all references for user's assets
  const { data: pendingRefs } = await useAdminGetAssetReferences({
    assetIds,
    status: "pending",
  });
  const { data: approvedRefs } = await useAdminGetAssetReferences({
    assetIds,
    status: "approved",
  });
  const { data: rejectedRefs } = await useAdminGetAssetReferences({
    assetIds,
    status: "rejected",
  });

  // Get related projects and users for display
  const allRefs = [
    ...(pendingRefs || []),
    ...(approvedRefs || []),
    ...(rejectedRefs || []),
  ];
  const projectIds = [...new Set(allRefs.map((r) => r.project_id))];
  const { data: projects } = await useAdminGetProjects(projectIds);

  // Get requesting users
  const requestingUserIds = [
    ...new Set(projects?.map((p) => p.creator_id) || []),
  ];
  const { data: requestingUsers } = await useAdminGetUsers(requestingUserIds);

  // Create lookup maps
  const projectMap = new Map(projects?.map((p) => [p.id, p]));
  const userMap = new Map(requestingUsers?.map((u) => [u.id, u]));
  const assetMap = new Map(userAssets?.map((a) => [a.id, a]));

  const breadcrumbs = [{ label: "Collaboration Requests" }];

  // Helper to render request card
  const renderRequestCard = (ref: (typeof allRefs)[0]) => {
    const project = projectMap.get(ref.project_id);
    const asset = assetMap.get(ref.asset_id);
    const requestingUser = project ? userMap.get(project.creator_id) : null;

    if (!project || !asset) return null;

    return (
      <Card key={ref.id}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <Avatar>
                <AvatarFallback>
                  {requestingUser?.full_name?.[0] ||
                    requestingUser?.username?.[0] ||
                    "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">
                  {requestingUser?.full_name || requestingUser?.username}
                </CardTitle>
                <CardDescription>
                  wants to use{" "}
                  <Link
                    href={`/assets/${asset.id}`}
                    className="text-primary hover:underline"
                  >
                    {asset.title}
                  </Link>{" "}
                  in{" "}
                  <Link
                    href={`/projects/${project.slug}`}
                    className="text-primary hover:underline"
                  >
                    {project.title}
                  </Link>
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={
                ref.status === "pending"
                  ? "secondary"
                  : ref.status === "approved"
                    ? "default"
                    : "destructive"
              }
            >
              {ref.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Requested {new Date(ref.requested_at).toLocaleDateString()}
          </div>
          {ref.status === "pending" && (
            <>
              <Separator className="my-4" />
              <div className="flex gap-2">
                <Button size="sm" variant="default">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button size="sm" variant="outline">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

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
              <Badge variant="secondary" className="ml-2">
                {pendingRefs?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              <Badge variant="secondary" className="ml-2">
                {approvedRefs?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              <Badge variant="secondary" className="ml-2">
                {rejectedRefs?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending">
            <div className="space-y-4">
              {pendingRefs && pendingRefs.length > 0 ? (
                pendingRefs.map(renderRequestCard)
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={<CheckCircle className="w-6 h-6" />}
                      title="No pending requests"
                      description="Attribution requests will appear here when creators reference your work"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved">
            <div className="space-y-4">
              {approvedRefs && approvedRefs.length > 0 ? (
                approvedRefs.map(renderRequestCard)
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={<CheckCircle className="w-6 h-6" />}
                      title="No approved requests"
                      description="Approved attribution requests will appear here"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Rejected Tab */}
          <TabsContent value="rejected">
            <div className="space-y-4">
              {rejectedRefs && rejectedRefs.length > 0 ? (
                rejectedRefs.map(renderRequestCard)
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={<XCircle className="w-6 h-6" />}
                      title="No rejected requests"
                      description="Rejected attribution requests will appear here"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
