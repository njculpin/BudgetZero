import { MainLayout } from "@/components/layouts/main-layout";
import { TeamsList } from "@/components/blocks/teams/teams-list";
import { useAdminGetMe } from "@/lib/sdk/server";

export default async function TeamsPage() {
  const user = await useAdminGetMe();

  const breadcrumbs = [{ label: "Teams" }];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teams</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage teams to collaborate on projects and assets
            </p>
          </div>
        </div>

        <TeamsList />
      </div>
    </MainLayout>
  );
}
