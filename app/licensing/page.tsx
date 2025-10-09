import { MainLayout } from "@/components/layouts/main-layout";
import { getUser } from "@/lib/sdk/use-user-get-me";
import { redirect } from "next/navigation";

export default async function LicensingPage() {
  const { data, error } = await getUser();
  const me = data;
  if (!me || error) {
    redirect("/auth/login");
  }
  return (
    <MainLayout user={me} breadcrumbs={[{ label: "Licensing" }]}>
      <div></div>
    </MainLayout>
  );
}
