import { MainLayout } from "@/components/layouts/main-layout";
import { Card } from "@/components/ui/card";
import { useAdminGetMe } from "@/lib/sdk/server";

export default async function TeamsPage() {
  const user = await useAdminGetMe();
  return (
    <MainLayout user={user} breadcrumbs={[{ label: "Teams" }]}>
      <Card className="p-12 text-center">
        <p className="text-red-600">TEAMS</p>
      </Card>
    </MainLayout>
  );
}
