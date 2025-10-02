import {
  Download,
  Edit,
  FileText,
  ImageIcon,
  Info,
  Palette,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReferenceAssetButton } from "@/components/assets/reference-asset-button";
import { MainLayout } from "@/components/layouts/main-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice, getLicenseTemplate } from "@/lib/constants/licenses";
import { AssetService } from "@/lib/services/assets";
import { ProjectService } from "@/lib/services/project-service";
import { createClient } from "@/lib/supabase/server";

export default async function IllustrationDetailPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { id, slug } = await params;

  const assetService = new AssetService(supabase);
  const result = await assetService.getAssetById(id);

  if (result.error || !result.data) {
    notFound();
  }

  const illustration = result.data;
  const isOwner = user?.id === illustration.creator_id;
  const licenseTemplate = getLicenseTemplate(illustration.license_type);

  // Fetch project information for breadcrumbs
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, slug")
    .eq("slug", slug)
    .single();

  // Fetch user's projects for reference button
  let userProjects: any[] = [];
  if (user && !isOwner) {
    const projectService = new ProjectService(supabase);
    const projectsResult = await projectService.getUserProjects(user.id);
    userProjects = projectsResult.data || [];
  }

  const breadcrumbs = project
    ? [
        { label: "My Projects", href: "/projects" },
        { label: project.title, href: `/projects/${project.slug}` },
        { label: illustration.title },
      ]
    : [
        { label: "Illustrations", href: "/illustrations" },
        { label: illustration.title },
      ];

  const _ILLUSTRATION_TYPE_LABELS: Record<string, string> = {
    character_art: "Character Art",
    scene: "Scene",
    map: "Map",
    icon: "Icon",
    token: "Token",
    card_art: "Card Art",
    cover_art: "Cover Art",
    diagram: "Diagram",
    sketch: "Sketch",
    concept_art: "Concept Art",
    other: "Other",
  };

  return (
    <MainLayout user={user ?? undefined} breadcrumbs={breadcrumbs}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview */}
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                {illustration.thumbnail_url ? (
                  <img
                    src={illustration.thumbnail_url}
                    alt={illustration.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Palette className="h-24 w-24" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Title and Actions */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {illustration.title}
                </h1>
              </div>
              <div className="flex gap-2">
                {isOwner ? (
                  <Button asChild variant="outline">
                    <Link href={`/illustrations/${illustration.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                ) : (
                  illustration.seeking_collaborators &&
                  user && (
                    <Button variant="outline" disabled>
                      Request Collaboration (Coming Soon)
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Seeking Collaborators Notice */}
            {illustration.seeking_collaborators && !isOwner && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900">
                        Seeking Collaborators
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        This creator is open to collaborative projects with
                        revenue sharing.
                        {user
                          ? " Click 'Propose Collaboration' to get started!"
                          : " Sign in to propose collaboration."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {illustration.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {illustration.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* File Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  File Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {illustration.file_format && (
                    <div>
                      <p className="text-sm text-gray-600">File Format</p>
                      <p className="font-semibold uppercase">
                        {illustration.file_format}
                      </p>
                    </div>
                  )}
                  {illustration.file_size_bytes && (
                    <div>
                      <p className="text-sm text-gray-600">File Size</p>
                      <p className="font-semibold">
                        {(illustration.file_size_bytes / 1024 / 1024).toFixed(
                          2,
                        )}{" "}
                        MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {illustration.tags && illustration.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {illustration.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Stats */}
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Downloads</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {illustration.download_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Uses in Projects</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {illustration.usage_count}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* License Information */}
            {licenseTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    License
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">{licenseTemplate.name}</p>
                    <p className="text-sm text-gray-600">
                      {licenseTemplate.description}
                    </p>
                  </div>
                  <Separator />
                  <div className="text-sm text-gray-700 space-y-2">
                    <p className="font-medium">Terms:</p>
                    <p className="whitespace-pre-wrap">
                      {licenseTemplate.terms}
                    </p>
                  </div>
                  {illustration.license_terms && (
                    <>
                      <Separator />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Additional Terms:</p>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {illustration.license_terms}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price and Download */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatPrice(illustration.price_cents)}
                </p>
              </div>
              <Button className="w-full" size="lg">
                <Download className="h-5 w-5 mr-2" />
                {illustration.price_cents === 0 ? "Download" : "Purchase"}
              </Button>

              {!isOwner && user && (
                <ReferenceAssetButton
                  assetId={illustration.id}
                  assetTitle={illustration.title}
                  assetCreatorName={
                    illustration.creator.full_name ||
                    illustration.creator.username ||
                    "Anonymous"
                  }
                  royaltyPercentage={illustration.royalty_percentage || 0}
                  userProjects={userProjects}
                />
              )}
            </CardContent>
          </Card>

          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Creator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/profiles/${illustration.creator.id}`}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={illustration.creator.avatar_url ?? undefined}
                  />
                  <AvatarFallback>
                    {illustration.creator.full_name?.[0] ||
                      illustration.creator.username?.[0] ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">
                    {illustration.creator.full_name ||
                      illustration.creator.username ||
                      "Anonymous"}
                  </p>
                  {illustration.creator.username && (
                    <p className="text-sm text-gray-600">
                      @{illustration.creator.username}
                    </p>
                  )}
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Uploaded</span>
                <span className="font-medium">
                  {new Date(illustration.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">
                  {new Date(illustration.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Visibility</span>
                <span className="font-medium">
                  {illustration.is_public ? "Public" : "Private"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
