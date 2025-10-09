import { MainLayout } from "@/components/layouts/main-layout";
import { useUserGetMe } from "@/lib/sdk/use-user-get-me";
import { redirect } from "next/navigation";

export default async function LicensingPage() {
  const { getUser } = useUserGetMe();
  const userData = await getUser();
  const me = userData.data;
  if (!me) {
    redirect("/auth/login");
  }
  return (
    <MainLayout user={me} breadcrumbs={[{ label: "Licensing" }]}>
      <div></div>
    </MainLayout>
  );
}
