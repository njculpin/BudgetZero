import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layouts/main-layout";
import { createClient } from "@/lib/supabase/server";
import { AssetUploadForm } from "@/components/shared/forms/asset-upload-form";

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Asset</h1>
          <p className="text-muted-foreground">
            Upload models, illustrations, photos, audio, or any other media for your projects
          </p>
        </div>
        <AssetUploadForm />
      </div>
    </MainLayout>
  );
}
