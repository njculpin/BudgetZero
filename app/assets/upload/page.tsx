import { AssetUploadForm } from "@/components/blocks/assets/asset-upload-form";
import { MainLayout } from "@/components/layouts/main-layout";
import { useAdminGetMe } from "@/lib/sdk/server/use-admin-get-me";

export default async function AssetUploadPage() {
  const user = await useAdminGetMe();

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
            Upload documents, models, illustrations, photos, audio, or any other
            media for your projects
          </p>
        </div>
        <AssetUploadForm />
      </div>
    </MainLayout>
  );
}
