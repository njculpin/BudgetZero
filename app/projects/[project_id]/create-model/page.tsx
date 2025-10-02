import { redirect } from "next/navigation";

interface CreateModelPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CreateModelPage({
  params,
}: CreateModelPageProps) {
  const { slug } = await params;
  // Redirect to unified create-asset page with type parameter
  redirect(`/projects/${slug}/create-asset?type=model`);
}
