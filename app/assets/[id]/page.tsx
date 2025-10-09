import { ArrowLeft, Download, Eye, Heart, MessageSquare } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MainLayout } from "@/components/layouts/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

interface AssetDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssetDetailPage({
  params,
}: AssetDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch asset with all related data
  const { data: asset, error } = await supabase
    .from("assets")
    .select(
      `
      *,
      creator:creator_id(id, full_name, username, avatar_url),
      asset_settings(*),
      asset_stats(*),
      asset_tags(tag),
      asset_images(*),
      asset_files(*),
      asset_royalties(*),
      asset_licenses(*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !asset) {
    notFound();
  }

  // Check if user has access (public or owner)
  const settings = asset.asset_settings?.[0];
  const isOwner = asset.creator_id === user.id;
  const isPublic = settings?.is_public || false;

  if (!isOwner && !isPublic) {
    notFound();
  }

  const stats = asset.asset_stats?.[0];
  const activeRoyalty = asset.asset_royalties?.find((r) => r.is_active);
  const activeLicense = asset.asset_licenses?.find((l) => l.is_active);

  const breadcrumbs = [
    { label: "Assets", href: "/assets" },
    { label: asset.title },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link href="/assets">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assets
          </Link>
        </Button>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Asset Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview Card */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted flex items-center justify-center relative">
                  {asset.thumbnail_url ? (
                    <img
                      src={asset.thumbnail_url}
                      alt={asset.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : asset.preview_url ? (
                    <img
                      src={asset.preview_url}
                      alt={asset.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="text-muted-foreground">
                      No preview available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {asset.description || "No description provided."}
                </p>
              </CardContent>
            </Card>

            {/* Files Section */}
            {asset.asset_files && asset.asset_files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Files</CardTitle>
                  <CardDescription>
                    {asset.asset_files.length} file(s) available for download
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {asset.asset_files
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {file.file_name || "Untitled File"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {file.file_format && (
                                <Badge variant="outline" className="text-xs">
                                  {file.file_format}
                                </Badge>
                              )}
                              {file.file_size_bytes && (
                                <span>
                                  {(file.file_size_bytes / 1024 / 1024).toFixed(
                                    2
                                  )}{" "}
                                  MB
                                </span>
                              )}
                            </div>
                          </div>
                          <Button size="sm" asChild>
                            <a
                              href={file.file_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Images Gallery */}
            {asset.asset_images && asset.asset_images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {asset.asset_images
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((image) => (
                        <div
                          key={image.id}
                          className="aspect-square bg-muted rounded-lg overflow-hidden"
                        >
                          <img
                            src={image.file_url}
                            alt="Asset image"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Info Sidebar */}
          <div className="space-y-6">
            {/* Asset Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {asset.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>By</span>
                      <Link
                        href={`/profile/${asset.creator.id}`}
                        className="font-medium hover:underline"
                      >
                        {asset.creator.full_name || asset.creator.username}
                      </Link>
                    </div>
                  </div>
                  <Badge variant={asset.status === "active" ? "default" : "secondary"}>
                    {asset.status}
                  </Badge>
                </div>
              </CardHeader>

              {/* Tags */}
              {asset.asset_tags && asset.asset_tags.length > 0 && (
                <>
                  <Separator />
                  <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-2">
                      {asset.asset_tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">
                          {tag.tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>

            {/* Stats */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span>Views</span>
                      </div>
                      <span className="font-medium">{stats.view_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Download className="w-4 h-4" />
                        <span>Downloads</span>
                      </div>
                      <span className="font-medium">{stats.download_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        <span>Likes</span>
                      </div>
                      <span className="font-medium">{stats.like_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        <span>Comments</span>
                      </div>
                      <span className="font-medium">{stats.comment_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* License Info */}
            {activeLicense && (
              <Card>
                <CardHeader>
                  <CardTitle>License</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="capitalize">{activeLicense.license_type}</Badge>
                  {activeLicense.license_terms && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {activeLicense.license_terms}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Royalty Info */}
            {activeRoyalty && (
              <Card>
                <CardHeader>
                  <CardTitle>Royalty</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold">
                      {activeRoyalty.percentage}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Revenue share when used in projects
                    </p>
                  </div>
                  {activeRoyalty.notes && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {activeRoyalty.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/assets/${id}/edit`}>Edit Asset</Link>
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
