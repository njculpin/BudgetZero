import { MainLayout } from "@/components/layouts/main-layout";
import { useAdminGetMe } from "@/lib/sdk/server";

interface ProductDetailPageProps {
  params: Promise<{
    handle: string;
  }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const user = await useAdminGetMe();
  const breadcrumbs = [
    { label: "Shop", href: "/shop" },
    { label: "product title" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-8"></div>
    </MainLayout>
  );
}
