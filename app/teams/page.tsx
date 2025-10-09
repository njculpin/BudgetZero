import { MainLayout } from "@/components/layouts/main-layout";
import { Card } from "@/components/ui/card";
import { getUser } from "@/lib/sdk/use-user-get-me";
import { redirect } from "next/navigation";

export default async function TeamsPage() {
  const { data: me, error: meError } = await getUser();
  console.log("me", me, "meError", meError);
  if (!me || meError) {
    redirect("/auth/login");
  }
  return (
    <MainLayout user={me} breadcrumbs={[{ label: "Teams" }]}>
      <Card className="p-12 text-center">
        <p className="text-red-600">TEAMS</p>
      </Card>
    </MainLayout>
  );
}
