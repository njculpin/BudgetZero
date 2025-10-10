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
import { notFound } from "next/navigation";
import { ProjectAssetReferences } from "@/components/blocks/projects/project-asset-references";
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
import {
  useAdminGetApprovedReferences,
  useAdminGetAssetsByIds,
  useAdminGetAssetsByProject,
  useAdminGetMe,
  useAdminGetProjectCollaboratorsWithUsers,
  useAdminGetProjectWithDetails,
  useAdminGetRoyaltiesByIds,
  useAdminGetUsersByIds,
} from "@/lib/sdk/server";

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const user = await useAdminGetMe();

  // Fetch project with settings and tags
  const { data: project, error } = await useAdminGetProjectWithDetails(slug);

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
  const { data: assets } = await useAdminGetAssetsByProject(project.id);

  // Fetch project collaborators with user info
  const { data: collaboratorsRaw } =
    await useAdminGetProjectCollaboratorsWithUsers(project.id);

  type CollaboratorWithUser = {
    id: string;
    contribution_description: string | null;
    joined_at: string;
    user: {
      id: string;
      full_name: string | null;
      username: string | null;
      email: string;
      avatar_url: string | null;
    };
  };

  const collaborators = collaboratorsRaw as unknown as
    | CollaboratorWithUser[]
    | null;

  // Fetch referenced assets (approved references from other creators) - optimized
  const { data: refs } = await useAdminGetApprovedReferences(project.id);

  // Get all asset IDs and user IDs to fetch in bulk
  const assetIds = refs?.map((r) => r.asset_id) || [];
  const { data: refAssets } = await useAdminGetAssetsByIds(assetIds);

  const creatorIds = refAssets?.map((a) => a.creator_id) || [];
  const { data: assetCreators } = await useAdminGetUsersByIds(creatorIds);

  // Get royalty percentages
  const royaltyIds =
    (refs?.map((r) => r.asset_royalty_id).filter(Boolean) as string[]) || [];
  const { data: royalties } = await useAdminGetRoyaltiesByIds(royaltyIds);
  const royaltyMap = new Map(royalties?.map((r) => [r.id, r.percentage]));

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
                    project.project_tags?.map((t: { tag: string }) => t.tag) ||
                    []
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

            {/* Revenue Split Summary - TODO: Create RevenueSplitPreview component */}
            {/* {enrichedReferences.length > 0 && (
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
                  <div className="space-y-2">
                    {enrichedReferences.map((ref) => (
                      <div key={ref.id} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="text-sm">{ref.asset.creator.full_name || ref.asset.creator.username || "Anonymous"}</span>
                        <span className="text-sm font-semibold">{ref.royalty_percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )} */}

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
