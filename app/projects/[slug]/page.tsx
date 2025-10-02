import {
  Box,
  Calendar,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Palette,
  Plus,
  Settings,
  Star,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MainLayout } from "@/components/layouts/main-layout";
import { PricingTiersManager } from "@/components/projects/pricing-tiers-manager";
import { ProjectTagsManager } from "@/components/projects/project-tags-manager";
import { RevenueSplitPreview } from "@/components/shared/revenue-split-preview";
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
import { GameProjectService } from "@/lib/services/game-projects";
import { createClient } from "@/lib/supabase/server";

// Collaboration features coming in Phase 1

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

  const gameProjectService = new GameProjectService(supabase);
  const result = await gameProjectService.getProjectBySlug(slug);

  if (result.error || !result.data) {
    notFound();
  }

  const project = result.data;
  const isOwner = project.creator_id === user.id;

  // Check user access permissions
  const accessResult = await gameProjectService.checkProjectAccess(
    project.id,
    user.id,
  );
  const canRead = accessResult.data?.canRead ?? false;

  if (!canRead) {
    notFound();
  }

  // Fetch project documents
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, document_type, status, created_at, updated_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  // Fetch project assets (models and illustrations)
  const { data: assets } = await supabase
    .from("assets")
    .select("id, title, asset_type, thumbnail_url, created_at, updated_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const models = assets?.filter((a) => a.asset_type === "model") || [];
  const illustrations =
    assets?.filter((a) => a.asset_type === "illustration") || [];

  // Fetch pricing tiers
  const { data: pricingTiers } = await supabase
    .from("pricing_tiers")
    .select(`
      *,
      pricing_tier_assets(asset_id),
      pricing_tier_documents(document_id)
    `)
    .eq("project_id", project.id)
    .order("display_order", { ascending: true });

  const enrichedTiers = (pricingTiers || []).map((tier) => ({
    id: tier.id,
    name: tier.name,
    description: tier.description,
    price_cents: tier.price_cents,
    display_order: tier.display_order,
    is_active: tier.is_active,
    included_assets: tier.pricing_tier_assets?.map((a: { asset_id: string }) => a.asset_id) || [],
    included_documents: tier.pricing_tier_documents?.map((d: { document_id: string }) => d.document_id) || [],
  }));

  // Fetch referenced assets (approved references from other creators) - optimized
  const [{ data: refs }, { data: refAssets }, { data: assetCreators }] =
    await Promise.all([
      supabase
        .from("project_asset_references")
        .select("id, royalty_percentage, status, asset_id")
        .eq("project_id", project.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      supabase
        .from("assets")
        .select("id, title, asset_type, thumbnail_url, creator_id"),
      supabase.from("users").select("id, full_name"),
    ]);

  const assetMap = new Map(refAssets?.map((a) => [a.id, a]));
  const creatorMap = new Map(assetCreators?.map((c) => [c.id, c]));

  const enrichedReferences = (refs || [])
    .map((ref) => {
      const asset = assetMap.get(ref.asset_id);
      if (!asset) return null;

      const creator = creatorMap.get(asset.creator_id) || {
        id: asset.creator_id,
        full_name: null,
      };

      return {
        id: ref.id,
        royalty_percentage: ref.royalty_percentage,
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
              {project.is_public ? (
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
              Created by {project.creator.full_name || project.creator.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwner && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${project.slug}/settings`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            )}
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
                  initialTags={project.tags || []}
                  isOwner={isOwner}
                />
              </CardContent>
            </Card>

            {/* Project Components */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  Project Components
                </CardTitle>
                <CardDescription>
                  All the creative content that makes up this game
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add Content - Only show to project owners */}
                  {isOwner && (
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
                      <div className="text-center mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          <Plus className="w-4 h-4 inline mr-2" />
                          Add Content to Your Project
                        </h4>
                        <p className="text-sm text-gray-600">
                          Create documents, upload models, and add illustrations
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/projects/${project.slug}/create-document`}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            New Document
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/projects/${project.slug}/create-asset?type=model`}
                          >
                            <Box className="h-4 w-4 mr-2" />
                            Add Model
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/projects/${project.slug}/create-asset?type=illustration`}
                          >
                            <Palette className="h-4 w-4 mr-2" />
                            Add Illustration
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Documents Gallery */}
                  {documents && documents.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Documents
                      </h4>
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <Link
                            key={doc.id}
                            href={`/projects/${project.slug}/documents/${doc.id}`}
                            className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-blue-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm truncate">
                                {doc.title}
                              </h5>
                              <p className="text-xs text-gray-500 capitalize">
                                {doc.document_type.replace(/_/g, " ")} •{" "}
                                {doc.status}
                              </p>
                            </div>
                            <Edit3 className="w-4 h-4 text-gray-400" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Models Gallery */}
                  {models.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        3D Models
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {models.map((model) => (
                          <Link
                            key={model.id}
                            href={`/projects/${project.slug}/models/${model.id}`}
                            className="group relative aspect-square rounded-lg overflow-hidden border hover:border-purple-300 transition-colors"
                          >
                            {model.thumbnail_url ? (
                              <img
                                src={model.thumbnail_url}
                                alt={model.title}
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
                                  {model.title}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Illustrations Gallery */}
                  {illustrations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Illustrations
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {illustrations.map((illustration) => (
                          <Link
                            key={illustration.id}
                            href={`/projects/${project.slug}/illustrations/${illustration.id}`}
                            className="group relative aspect-square rounded-lg overflow-hidden border hover:border-amber-300 transition-colors"
                          >
                            {illustration.thumbnail_url ? (
                              <img
                                src={illustration.thumbnail_url}
                                alt={illustration.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-amber-50 flex items-center justify-center">
                                <Palette className="w-8 h-8 text-amber-300" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-0 left-0 right-0 p-2">
                                <p className="text-white text-xs font-medium truncate">
                                  {illustration.title}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {(!documents || documents.length === 0) &&
                    models.length === 0 &&
                    illustrations.length === 0 && (
                      <div className="text-center py-8">
                        <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No content yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Add documents, models, or illustrations to get started
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Referenced Assets - Attribution Chain */}
            {enrichedReferences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Referenced Content
                  </CardTitle>
                  <CardDescription>
                    Content from other creators used in this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {enrichedReferences.map((ref) => (
                      <div
                        key={ref.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
                      >
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          {ref.asset.thumbnail_url ? (
                            <img
                              src={ref.asset.thumbnail_url}
                              alt={ref.asset.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              {ref.asset.asset_type === "model" ? (
                                <Box className="w-5 h-5 text-gray-400" />
                              ) : (
                                <Palette className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Content Info */}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm truncate">
                            {ref.asset.title}
                          </h5>
                          <p className="text-xs text-gray-600">
                            by {ref.asset.creator.full_name || "Anonymous"}
                          </p>
                        </div>

                        {/* Royalty Badge */}
                        <Badge variant="secondary" className="text-xs">
                          {ref.royalty_percentage}% royalty
                        </Badge>
                      </div>
                    ))}

                    {/* Revenue Split Summary */}
                    <div className="mt-4">
                      <RevenueSplitPreview
                        royaltyContributors={enrichedReferences.map((ref) => ({
                          name: ref.asset.creator.full_name || "Anonymous",
                          percentage: ref.royalty_percentage,
                        }))}
                        variant="compact"
                        className="bg-blue-50 p-4 rounded-lg"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Game Details */}
            {(project.genre ||
              project.player_count_min ||
              project.play_time_minutes ||
              project.complexity_rating) && (
              <Card>
                <CardHeader>
                  <CardTitle>Game Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {project.genre && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-1">
                          Genre
                        </h4>
                        <p className="text-slate-600 capitalize">
                          {project.genre}
                        </p>
                      </div>
                    )}
                    {(project.player_count_min || project.player_count_max) && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-1">
                          Players
                        </h4>
                        <p className="text-slate-600">
                          {project.player_count_min === project.player_count_max
                            ? project.player_count_min
                            : `${project.player_count_min || "?"}–${project.player_count_max || "?"}`}
                        </p>
                      </div>
                    )}
                    {project.play_time_minutes && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-1">
                          Play Time
                        </h4>
                        <p className="text-slate-600">
                          {project.play_time_minutes} minutes
                        </p>
                      </div>
                    )}
                    {project.complexity_rating && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-1">
                          Complexity
                        </h4>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < (project.complexity_rating || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-slate-600 ml-2">
                            {project.complexity_rating}/5
                          </span>
                        </div>
                      </div>
                    )}
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

            {/* License & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>License & Pricing</CardTitle>
                <CardDescription>
                  Configure pricing tiers and license terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* License Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">
                        License Type
                      </h4>
                      <p className="text-slate-600 capitalize">
                        {project.license_type}
                      </p>
                    </div>
                  </div>
                  {project.license_terms && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">
                        License Terms
                      </h4>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-md">
                        {project.license_terms}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pricing Tiers */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium text-slate-900">Pricing Tiers</h4>
                  <PricingTiersManager
                    projectId={project.id}
                    initialTiers={enrichedTiers}
                    assets={assets || []}
                    documents={documents || []}
                    isOwner={isOwner}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Team & Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team & Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Team Members */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-900">
                    Contributors
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {(project.creator.full_name || project.creator.email)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {project.creator.full_name || project.creator.email}
                      </p>
                      <p className="text-xs text-slate-500">
                        Creator • Active today
                      </p>
                    </div>
                  </div>
                  {/* TODO: Add collaborators when available */}
                </div>

                <Separator />

                {/* Recent Activity */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-900">
                    Recent Activity
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 text-slate-600">
                      <Edit3 className="w-3 h-3 mt-1 text-blue-500" />
                      <div>
                        <span className="font-medium">Rulebook updated</span>
                        <p className="text-xs text-slate-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600">
                      <Calendar className="w-3 h-3 mt-1 text-green-500" />
                      <div>
                        <span className="font-medium">Project created</span>
                        <p className="text-xs text-slate-500">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Indicators */}
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-900">
                    Progress
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Completion</span>
                      <span className="text-slate-900 font-medium">25%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: "25%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
