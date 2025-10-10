import { Users } from "lucide-react";
import Link from "next/link";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAdminGetMe } from "@/lib/sdk/server";

export default async function TeamsPage() {
  const user = await useAdminGetMe();

  const breadcrumbs = [{ label: "Teams & Collaborations" }];

  // In a full implementation, we'd fetch:
  // - Projects where user is a collaborator
  // - Projects owned by user with collaborators
  // For now, showing structure with empty state

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teams & Collaborations</h1>
            <p className="text-muted-foreground mt-2">
              Manage your collaborative projects and team members
            </p>
          </div>
        </div>

        {/* My Collaborations Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">My Collaborations</h2>
            <p className="text-sm text-muted-foreground">
              Projects you're collaborating on
            </p>
          </div>

          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<Users className="w-6 h-6" />}
                title="No collaborations yet"
                description="You'll see projects you're collaborating on here when you join a team"
                action={
                  <Button asChild variant="outline">
                    <Link href="/projects">Browse Projects</Link>
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* My Teams Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">My Teams</h2>
            <p className="text-sm text-muted-foreground">
              Projects where you manage team members
            </p>
          </div>

          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<Users className="w-6 h-6" />}
                title="No teams to manage"
                description="Create a project and invite collaborators to build your team"
                action={
                  <Button asChild>
                    <Link href="/projects/new">Create Project</Link>
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
