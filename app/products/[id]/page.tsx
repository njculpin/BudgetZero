import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/blocks/products/product-editor";
import { MainLayout } from "@/components/layouts/main-layout";
import {
  getAssetImages,
  getAssetRoyalties,
  listAssets,
} from "@/lib/sdk/server/assets";
import { getProductByIdWithDetails } from "@/lib/sdk/server/products";
import { getMe } from "@/lib/sdk/server/users";
import { createClient } from "@/lib/supabase/server";

interface ProductEditorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductEditorPage({
  params,
}: ProductEditorPageProps) {
  const { id } = await params;
  const user = await getMe();
  const supabase = await createClient();

  const { data: product, error } = await getProductByIdWithDetails(id);

  if (error || !product) {
    console.error("[PRODUCT EDITOR] Failed to load product:", error);
    notFound();
  }

  // Fetch user's assets with images and royalties
  const { data: assetsData } = await listAssets(supabase, { userId: user.id });

  // Enrich assets with images and royalties
  const assets = await Promise.all(
    (assetsData?.data || []).map(async (asset) => {
      const { data: images } = await getAssetImages(supabase, asset.id);
      const { data: royalties } = await getAssetRoyalties(supabase, asset.id);
      return {
        ...asset,
        asset_images: images || [],
        asset_royalties: royalties || [],
      };
    }),
  );

  const breadcrumbs = [
    { label: "Products", href: "/products" },
    { label: product.title },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
          <p className="text-muted-foreground">
            Configure your product details, pricing, and asset bundles
          </p>
        </div>
        <ProductEditor
          userId={user.id}
          userAssets={assets}
          existingProduct={product}
        />
      </div>
    </MainLayout>
  );
}
