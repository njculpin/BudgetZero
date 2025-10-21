import { ShoppingBag, Package, Star, MapPin, Globe, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MainLayout } from "@/components/layouts/main-layout";
import {
  getUserProfileByHandle,
  getUserShareSettings,
  listProductsByUserId,
  listProductsWithUserAssets,
} from "@/lib/sdk/server";
import { listAssets } from "@/lib/sdk/server/assets";
import { getMe } from "@/lib/sdk/server/users";
import { createClient } from "@/lib/supabase/server";

/**
 * Public User Profile Page & Personal Storage Page
 *
 * This page serves dual purposes:
 * 1. Public profile view - Shows user's public information, created products, and contributions
 * 2. Personal storage - When authenticated user views their own handle, shows private storage/assets
 *
 * Route: /u/[handle]
 */

interface PublicUserProfilePageProps {
  params: Promise<{
    handle: string;
  }>;
}

export default async function PublicUserProfilePage({
  params,
}: PublicUserProfilePageProps) {
  const { handle } = await params;

  // Get the profile user
  const { data: profileUser, error: profileError } =
    await getUserProfileByHandle(handle);

  if (profileError || !profileUser) {
    notFound();
  }

  // Check if viewing own profile
  let currentUser = null;
  try {
    currentUser = await getMe();
  } catch {
    // Not authenticated - public view only
  }
  const isOwnProfile = currentUser?.id === profileUser.id;

  // Get user's share settings (defaults to showing both if not set)
  const { data: shareSettings } = await getUserShareSettings(profileUser.id);
  const showProducts = (shareSettings as any)?.show_created_products ?? true;
  const showContributions = (shareSettings as any)?.show_created_assets ?? true;

  // Fetch user's products (only if allowed by settings or viewing own profile)
  let createdProducts = null;
  if (isOwnProfile || showProducts) {
    const result = await listProductsByUserId(profileUser.id, {
      limit: 12,
    });
    createdProducts = result.data;
  }

  // Fetch products containing user's assets (only if allowed by settings or viewing own profile)
  let contributionProducts = null;
  if (isOwnProfile || showContributions) {
    const result = await listProductsWithUserAssets(profileUser.id, {
      limit: 12,
    });
    contributionProducts = result.data;
  }

  // If viewing own profile, fetch private assets
  let privateAssets = null;
  if (isOwnProfile) {
    const client = await createClient();
    const { data } = await listAssets(client, {
      userId: profileUser.id,
      limit: 12,
    });
    privateAssets = data?.data || [];
  }

  const userName = profileUser.full_name || profileUser.handle || "User";
  const userInitials = userName
    .split(" ")
    .map((name: string) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <MainLayout user={currentUser || undefined}>
      <div className="space-y-8">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileUser.avatar_url} alt={userName} />
                <AvatarFallback className="text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold">{userName}</h1>
                    {profileUser.is_verified && (
                      <Badge variant="default">Verified</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{profileUser.handle}</p>
                </div>

                {profileUser.bio && (
                  <p className="text-base">{profileUser.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profileUser.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profileUser.location}</span>
                    </div>
                  )}
                  {profileUser.website_url && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <a
                        href={profileUser.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined {new Date(profileUser.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="font-bold">{createdProducts?.length || 0}</span>{" "}
                    <span className="text-muted-foreground">Products Created</span>
                  </div>
                  <div>
                    <span className="font-bold">
                      {contributionProducts?.length || 0}
                    </span>{" "}
                    <span className="text-muted-foreground">Contributions</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Created by User */}
        {(isOwnProfile || showProducts) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Products Created</h2>
                <p className="text-muted-foreground">
                  Products published by {userName}
                </p>
              </div>
            </div>

          {createdProducts && createdProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {createdProducts.map((product) => {
                const primaryImage = product.product_images?.find(
                  (img: any) => img.is_primary,
                ) || product.product_images?.[0];
                const cheapestPrice = product.product_variants
                  ?.flatMap((v: any) => v.product_variant_prices || [])
                  .filter((p: any) => p.is_active && p.currency_code === "USD")
                  .sort((a: any, b: any) => a.amount_cents - b.amount_cents)[0];

                return (
                  <Link key={product.id} href={`/${product.handle}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                      <div className="aspect-square bg-muted relative">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.file_url}
                            alt={primaryImage.alt_text || product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {product.is_featured && (
                          <div className="absolute top-2 left-2">
                            <Badge className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Featured
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardHeader className="flex-grow">
                        <CardTitle className="line-clamp-2 text-base">
                          {product.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {product.description}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-0">
                        {cheapestPrice && (
                          <div className="text-lg font-bold">
                            {formatPrice(cheapestPrice.amount_cents)}
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={<Package className="w-6 h-6" />}
                title="No products yet"
                description={`${userName} hasn't published any products yet`}
              />
            </Card>
          )}
          </div>
        )}

        {/* Products with User's Assets (Contributions) */}
        {(isOwnProfile || showContributions) && (
          <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Contributions</h2>
              <p className="text-muted-foreground">
                Products featuring assets by {userName}
              </p>
            </div>
          </div>

          {contributionProducts && contributionProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {contributionProducts.map((product) => {
                const primaryImage = product.product_images?.find(
                  (img: any) => img.is_primary,
                ) || product.product_images?.[0];
                const cheapestPrice = product.product_variants
                  ?.flatMap((v: any) => v.product_variant_prices || [])
                  .filter((p: any) => p.is_active && p.currency_code === "USD")
                  .sort((a: any, b: any) => a.amount_cents - b.amount_cents)[0];

                return (
                  <Link key={product.id} href={`/${product.handle}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                      <div className="aspect-square bg-muted relative">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.file_url}
                            alt={primaryImage.alt_text || product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="flex-grow">
                        <CardTitle className="line-clamp-2 text-base">
                          {product.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {product.description}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-0">
                        {cheapestPrice && (
                          <div className="text-lg font-bold">
                            {formatPrice(cheapestPrice.amount_cents)}
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={<Star className="w-6 h-6" />}
                title="No contributions yet"
                description={`${userName} hasn't contributed assets to any published products yet`}
              />
            </Card>
          )}
          </div>
        )}

        {/* Personal Storage (only for own profile) */}
        {isOwnProfile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Personal Storage</h2>
                <p className="text-muted-foreground">
                  Your private assets and files
                </p>
              </div>
              <Button asChild>
                <Link href="/assets">Manage Assets</Link>
              </Button>
            </div>

            {privateAssets && privateAssets.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {privateAssets.map((asset) => (
                  <Link key={asset.id} href={`/assets/${asset.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="line-clamp-2 text-base">
                          {asset.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {asset.description || "No description"}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex justify-between items-center">
                        <Badge variant={asset.is_public ? "default" : "secondary"}>
                          {asset.is_public ? "Public" : "Private"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(asset.created_at).toLocaleDateString()}
                        </span>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState
                  icon={<ShoppingBag className="w-6 h-6" />}
                  title="No assets yet"
                  description="Create your first asset to get started"
                  action={
                    <Button asChild>
                      <Link href="/assets">Create Asset</Link>
                    </Button>
                  }
                />
              </Card>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
