import { MainLayout } from "@/components/layouts/main-layout";
import { useAdminGetMe } from "@/lib/sdk/server";

export default async function LicensingPage() {
  const user = await useAdminGetMe();
  return (
    <MainLayout user={user} breadcrumbs={[{ label: "Licensing" }]}>
      <div></div>
    </MainLayout>
  );
}
