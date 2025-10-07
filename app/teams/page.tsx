import { MainLayout } from "@/components/layouts/main-layout";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function TeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <MainLayout user={user} breadcrumbs={[{ label: "Teams" }]}>
      <Card className="p-12 text-center">
        <p className="text-red-600">TEAMS</p>
      </Card>
    </MainLayout>
  );
}
