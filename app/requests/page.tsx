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
import { useAdminGetMe } from "@/lib/sdk/server";
import { CheckCircle } from "lucide-react";

export default async function CollaborationRequestsPage() {
  const user = await useAdminGetMe();
  // const { getAssets } = useUserGetAllAssets();
  // const { data: userAssets } = await getAssets({ creatorId: user.id });
  // const assetIds = userAssets?.map((a) => a.id) || [];

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
              <Badge variant="secondary" className="ml-2">
                0
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              <Badge variant="secondary" className="ml-2">
                0
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              <Badge variant="secondary" className="ml-2">
                0
              </Badge>
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
                <EmptyState
                  icon={<CheckCircle className="w-6 h-6" />}
                  title="No pending requests"
                  description="Attribution requests will appear here when creators reference your work"
                />
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
                <EmptyState
                  icon={<CheckCircle className="w-6 h-6" />}
                  title="No approved requests"
                  description="Approved attribution requests will appear here"
                />
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
                <EmptyState
                  icon={<CheckCircle className="w-6 h-6" />}
                  title="No rejected requests"
                  description="Rejected attribution requests will appear here"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
