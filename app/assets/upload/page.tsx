import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainLayout } from "@/components/layouts/main-layout";
import { AssetUploadForm } from "@/components/assets/asset-upload-form";

export default async function AssetUploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const breadcrumbs = [
    { label: "Asset Library", href: "/assets" },
    { label: "Upload Asset" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl">
        <AssetUploadForm />
      </div>
    </MainLayout>
  );
}
