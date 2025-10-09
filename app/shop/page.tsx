import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAdminGetMe } from "@/lib/sdk/server";
import { Search as SearchIcon, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface ShopPageProps {
  searchParams: Promise<{
    collection?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const search = params.search;

  const user = await useAdminGetMe();

  const breadcrumbs = [{ label: "Shop" }];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground mt-2">
              Browse and purchase tabletop game projects
            </p>
          </div>
        </div>

        <Card>
          <EmptyState
            icon={
              search ? (
                <SearchIcon className="w-6 h-6" />
              ) : (
                <ShoppingBag className="w-6 h-6" />
              )
            }
            title="No products found"
            description={
              search
                ? "Try adjusting your search terms or browse all products"
                : "Products will appear here when creators publish them to the marketplace"
            }
            action={
              search ? (
                <Button variant="outline" asChild>
                  <Link href="/shop">View All Products</Link>
                </Button>
              ) : undefined
            }
          />
        </Card>
      </div>
    </MainLayout>
  );
}
