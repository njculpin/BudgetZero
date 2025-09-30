import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainLayout } from "@/components/layouts/main-layout";
import { ModelUploadForm } from "@/components/models/model-upload-form";

export const metadata = {
  title: "Upload 3D Model | Workshop",
  description: "Upload and share your 3D models with the community",
};

export default async function NewModelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const breadcrumbs = [
    { label: "Models", href: "/models" },
    { label: "Upload" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload 3D Model</h1>
          <p className="text-gray-600">
            Share your 3D models with the community. Set licensing terms and pricing
            for your work.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ModelUploadForm />
        </div>
      </div>
    </MainLayout>
  );
}