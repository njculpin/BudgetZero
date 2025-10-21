import { MainLayout } from "@/components/layouts/main-layout";
import { getMe, getProductByHandleWithDetails } from "@/lib/sdk";
import { notFound } from "next/navigation";

interface ProductEditorPageProps {
  params: Promise<{
    handle: string;
  }>;
}

export default async function ShopProductDetailPage({
  params,
}: ProductEditorPageProps) {
  const { handle } = await params;
  const user = await getMe();

  const { data: product, error } = await getProductByHandleWithDetails(handle);

  if (error || !product) {
    console.error("[PRODUCT EDITOR] Failed to load product:", error);
    notFound();
  }

  return (
    <MainLayout user={user}>
      <div>
        <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
      </div>
    </MainLayout>
  );
}
