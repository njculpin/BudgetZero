import { ProjectAssetReferences } from "@/components/blocks/projects/project-asset-references";
import { RevenueSplitPreview } from "@/components/blocks/projects/project-revenue-split";
import { ProjectTagsManager } from "@/components/blocks/projects/project-tags-manager";
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
import {
  Box,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Plus,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch project with settings and tags
  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      project_settings (*),
      project_tags (tag),
      creator:creator_id (id, full_name, username, email)
    `,
    )
    .eq("slug", slug)
    .single();

  if (error || !project) {
    notFound();
  }

  const isOwner = project.creator_id === user.id;
  const settings = project.project_settings?.[0];
  const isPublic = settings?.is_public || false;

  // Check access: owner OR public project
  if (!isOwner && !isPublic) {
    notFound();
  }

  // Fetch project assets
  const { data: assets } = await supabase
    .from("assets")
    .select("id, title, asset_type, thumbnail_url, created_at, updated_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  // Fetch project collaborators with user info
  const { data: collaborators } = await supabase
    .from("project_collaborators")
    .select(
      `
      id,
      contribution_description,
      joined_at,
      user:user_id (id, full_name, username, email, avatar_url)
    `,
    )
    .eq("project_id", project.id)
    .eq("is_active", true)
    .eq("invitation_status", "accepted")
    .order("joined_at", { ascending: true });

  // Fetch referenced assets (approved references from other creators) - optimized
  const [{ data: refs }, { data: refAssets }, { data: assetCreators }] =
    await Promise.all([
      supabase
        .from("project_asset_references")
        .select("id, asset_id, asset_royalty_id, status")
        .eq("project_id", project.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      supabase
        .from("assets")
        .select("id, title, asset_type, thumbnail_url, creator_id"),
      supabase.from("users").select("id, full_name, username"),
    ]);

  // Get royalty percentages
  const royaltyIds = refs?.map((r) => r.asset_royalty_id).filter(Boolean) || [];
  let royaltyMap = new Map<string, number>();

  if (royaltyIds.length > 0) {
    const { data: royalties } = await supabase
      .from("asset_royalties")
      .select("id, percentage")
      .in("id", royaltyIds);

    royaltyMap = new Map(royalties?.map((r) => [r.id, r.percentage]));
  }

  const assetMap = new Map(refAssets?.map((a) => [a.id, a]));
  const creatorMap = new Map(assetCreators?.map((c) => [c.id, c]));

  const enrichedReferences = (refs || [])
    .map((ref) => {
      const asset = assetMap.get(ref.asset_id);
      if (!asset) return null;

      const creator = creatorMap.get(asset.creator_id) || {
        id: asset.creator_id,
        full_name: null,
        username: null,
      };

      const royaltyPercentage = ref.asset_royalty_id
        ? royaltyMap.get(ref.asset_royalty_id) || 0
        : 0;

      return {
        id: ref.id,
        royalty_percentage: royaltyPercentage,
        status: ref.status,
        asset: { ...asset, creator },
      };
    })
    .filter((ref): ref is NonNullable<typeof ref> => ref !== null);

  const breadcrumbs = [
    { label: "My Projects", href: "/projects" },
    { label: project.title },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-slate-900">
                {project.title}
              </h1>
              <Badge
                variant={project.status === "active" ? "default" : "secondary"}
              >
                {project.status}
              </Badge>
              {isPublic ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  Private
                </Badge>
              )}
            </div>
            <p className="text-slate-600">
              Created by{" "}
              {project.creator.full_name ||
                project.creator.username ||
                project.creator.email}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                {project.description ? (
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {project.description}
                  </p>
                ) : (
                  <p className="text-slate-500 italic">
                    No description provided
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Tags
                </CardTitle>
                <CardDescription>
                  Categorize your project for better discovery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectTagsManager
                  projectId={project.id}
                  initialTags={
                    project.project_tags?.map((t) => t.tag) || []
                  }
                  isOwner={isOwner}
                />
              </CardContent>
            </Card>

            {/* Project Content - Consolidated View */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="w-5 h-5" />
                      Project Content
                    </CardTitle>
                    <CardDescription>
                      All assets in this project - owned and referenced
                    </CardDescription>
                  </div>
                  {isOwner && (
                    <Button asChild>
                      <Link href="/assets/upload">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Asset
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Asset Gallery */}
                  {assets && assets.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Assets
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {assets.map((asset) => (
                          <Link
                            key={asset.id}
                            href={`/assets/${asset.id}`}
                            className="group relative aspect-square rounded-lg overflow-hidden border hover:border-purple-300 transition-colors"
                          >
                            <Badge
                              variant="secondary"
                              className="absolute top-2 left-2 z-10 text-xs"
                            >
                              {asset.asset_type || "Asset"}
                            </Badge>
                            {asset.thumbnail_url ? (
                              <img
                                src={asset.thumbnail_url}
                                alt={asset.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-purple-50 flex items-center justify-center">
                                <Box className="w-8 h-8 text-purple-300" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-0 left-0 right-0 p-2">
                                <p className="text-white text-xs font-medium truncate">
                                  {asset.title}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Referenced Assets */}
                  {enrichedReferences.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Referenced Assets
                      </h4>
                      <ProjectAssetReferences
                        projectId={project.id}
                        embedded={true}
                      />
                    </div>
                  )}

                  {/* Empty State */}
                  {(!assets || assets.length === 0) &&
                    enrichedReferences.length === 0 && (
                      <div className="text-center py-8">
                        <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No content yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Add assets or reference work from other creators
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Split Summary - Only show if there are approved references */}
            {enrichedReferences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Revenue Split Preview
                  </CardTitle>
                  <CardDescription>
                    How project earnings would be distributed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RevenueSplitPreview
                    royaltyContributors={enrichedReferences.map((ref) => ({
                      name:
                        ref.asset.creator.full_name ||
                        ref.asset.creator.username ||
                        "Anonymous",
                      percentage: ref.royalty_percentage,
                    }))}
                    variant="compact"
                    className="bg-blue-50 p-4 rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Collaborators */}
            {collaborators && collaborators.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Collaborators
                  </CardTitle>
                  <CardDescription>
                    People working on this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {collaborators.map((collab) => (
                      <div
                        key={collab.id}
                        className="flex items-center gap-3 p-3 border rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {collab.user.full_name ||
                              collab.user.username ||
                              collab.user.email}
                          </p>
                          {collab.contribution_description && (
                            <p className="text-sm text-muted-foreground">
                              {collab.contribution_description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined{" "}
                            {new Date(collab.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Created</p>
                    <p>{new Date(project.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p>{new Date(project.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <Separator />
                <div className="text-xs text-slate-500">
                  Project ID: {project.id.slice(0, 8)}...
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Visibility</span>
                    <Badge variant={isPublic ? "default" : "secondary"}>
                      {isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                  {settings?.allow_comments && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Comments</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                  )}
                  {settings?.allow_forks && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Forks</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                  )}
                  {settings?.allow_downloads && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Downloads</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
