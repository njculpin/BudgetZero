import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Download, ExternalLink } from "lucide-react";

interface AssetPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch asset with creator info
  const { data: asset, error } = await supabase
    .from("assets")
    .select(
      `
      *,
      creator:profiles!creator_id(id, full_name, username, avatar_url)
    `
    )
    .eq("id", id)
    .single();

  if (error || !asset) {
    notFound();
  }

  const isOwner = user.id === asset.creator_id;

  const breadcrumbs = [
    { label: "Asset Library", href: "/assets" },
    { label: asset.title },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Asset Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{asset.title}</CardTitle>
                <CardDescription>
                  By{" "}
                  <Link
                    href={`/profiles/${asset.creator.id}`}
                    className="hover:underline"
                  >
                    {asset.creator.full_name || asset.creator.username}
                  </Link>
                </CardDescription>
              </div>
              {isOwner && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/assets/${id}/settings`}>
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-square w-full rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {asset.asset_type === "illustration" ||
              asset.asset_type === "photo" ||
              asset.asset_type === "texture" ? (
                <img
                  src={asset.file_url}
                  alt={asset.title}
                  className="w-full h-full object-contain"
                />
              ) : asset.preview_url ? (
                <img
                  src={asset.preview_url}
                  alt={asset.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <p className="text-sm text-muted-foreground">
                    {asset.asset_type === "model" ? "3D Model" : "Asset"} Preview
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Format: {asset.file_format?.toUpperCase()}
                  </p>
                </div>
              )}
            </div>

            {/* Download Button */}
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" asChild>
                <a href={asset.file_url} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Asset Details */}
        <div className="space-y-6">
          {/* Description */}
          {asset.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {asset.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="secondary" className="capitalize">
                  {asset.asset_type}
                </Badge>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Format</span>
                <span className="font-medium">
                  {asset.file_format?.toUpperCase() || "Unknown"}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">File Size</span>
                <span className="font-medium">
                  {asset.file_size_bytes
                    ? `${(asset.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`
                    : "Unknown"}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={asset.status === "published" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {asset.status}
                </Badge>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Visibility</span>
                <Badge variant={asset.is_public ? "default" : "secondary"}>
                  {asset.is_public ? "Public" : "Private"}
                </Badge>
              </div>

              {asset.seeking_collaborators && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Collaborators</span>
                  <Badge>Seeking</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* License & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>License & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">License Type</span>
                <Badge variant="outline" className="capitalize">
                  {asset.license_type}
                </Badge>
              </div>

              {asset.price_cents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">
                    ${(asset.price_cents / 100).toFixed(2)}
                  </span>
                </div>
              )}

              {asset.royalty_percentage > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Royalty</span>
                  <span className="font-medium">{asset.royalty_percentage}%</span>
                </div>
              )}

              {asset.license_terms && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {asset.license_terms}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {asset.tags && asset.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Downloads</span>
                <span className="font-medium">{asset.download_count || 0}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Used in Projects</span>
                <span className="font-medium">{asset.usage_count || 0}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {new Date(asset.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </MainLayout>
  );
}
