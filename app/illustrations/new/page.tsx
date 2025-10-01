import { createClient } from "@/lib/supabase/server";
import { MainLayout } from "@/components/layouts/main-layout";
import { AssetUploadForm } from "@/components/shared/forms/asset-upload-form";
import { ILLUSTRATION_SUGGESTED_TAGS } from "@/components/illustrations/illustration-suggested-tags";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Upload Illustration | Workshop",
  description: "Share your artwork with the community",
};

export default async function NewIllustrationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/illustrations/new");
  }

  const breadcrumbs = [
    { label: "Illustrations", href: "/illustrations" },
    { label: "Upload" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Upload Illustration
          </h1>
          <p className="text-gray-600 mt-1">
            Share your artwork with the community and make it available for game
            projects
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <AssetUploadForm
            assetType="illustration"
            suggestedTags={ILLUSTRATION_SUGGESTED_TAGS}
          />
        </div>
      </div>
    </MainLayout>
  );
}
