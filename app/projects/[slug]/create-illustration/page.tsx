import { redirect } from "next/navigation";

interface CreateIllustrationPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CreateIllustrationPage({
  params,
}: CreateIllustrationPageProps) {
  const { slug } = await params;
  // Redirect to unified create-asset page with type parameter
  redirect(`/projects/${slug}/create-asset?type=illustration`);
}
