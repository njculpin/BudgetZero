import { ProductCreateForm } from "@/components/blocks/products/product-create-form";
import { MainLayout } from "@/components/layouts/main-layout";
import { getMe } from "@/lib/sdk/server/users";
import { createClient } from "@/lib/supabase/server";
import { listAssets, getAssetImages, getAssetRoyalties } from "@/lib/sdk/server/assets";

export default async function ProductCreatePage() {
  const user = await getMe();
  const supabase = await createClient();

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
    { label: "Create Product" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Product</h1>
          <p className="text-muted-foreground">
            Bundle your assets into a sellable product for the marketplace
          </p>
        </div>
        <ProductCreateForm userId={user.id} userAssets={assets} />
      </div>
    </MainLayout>
  );
}
