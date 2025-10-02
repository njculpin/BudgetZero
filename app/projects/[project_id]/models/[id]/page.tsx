import {
  CheckCircle,
  ChevronDown,
  Download,
  Edit,
  Eye,
  FileText,
  Info,
  Package,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReferenceAssetButton } from "@/components/assets/reference-asset-button";
import { MainLayout } from "@/components/layouts/main-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { formatPrice, getLicenseTemplate } from "@/lib/constants/licenses";
import { AssetService } from "@/lib/services/assets";
import { ProjectService } from "@/lib/services/project-service";
import { createClient } from "@/lib/supabase/server";

export default async function ModelDetailPage({
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

  const model = result.data;
  const isOwner = user?.id === model.creator_id;
  const licenseTemplate = getLicenseTemplate(model.license_type);

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
        { label: model.title },
      ]
    : [
        { label: "Models", href: "/models" },
        { label: model.title },
      ];

  return (
    <MainLayout user={user ?? undefined} breadcrumbs={breadcrumbs}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview */}
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                {model.thumbnail_url ? (
                  <img
                    src={model.thumbnail_url}
                    alt={model.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="h-24 w-24" />
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
                  {model.title}
                </h1>
              </div>
              <div className="flex gap-2">
                {isOwner && (
                  <Button asChild variant="outline">
                    <Link href={`/models/${model.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Description */}
            {model.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {model.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Model Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  File Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {model.file_format && (
                    <div>
                      <p className="text-sm text-gray-600">File Format</p>
                      <p className="font-semibold uppercase">
                        {model.file_format}
                      </p>
                    </div>
                  )}
                  {model.file_size_bytes && (
                    <div>
                      <p className="text-sm text-gray-600">File Size</p>
                      <p className="font-semibold">
                        {(model.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {model.tags && model.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {model.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* License Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  License: {licenseTemplate.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  {licenseTemplate.description}
                </p>

                {/* Visual Permissions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Personal use allowed</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {licenseTemplate.permissions.commercialUse ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>Commercial use allowed</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <span>No commercial use</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {licenseTemplate.permissions.modification ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>Can modify</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <span>No modifications</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {licenseTemplate.permissions.printAndSell ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>Can print and sell</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <span>No print-and-sell</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {licenseTemplate.permissions.attribution ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span>Attribution required</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>No attribution needed</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {licenseTemplate.permissions.redistribution ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>Can redistribute</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <span>No redistribution</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Collapsible Full Terms */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Read Full License Terms
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="prose prose-sm max-w-none text-xs">
                        <div className="whitespace-pre-wrap">
                          {licenseTemplate.terms}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                href={`/creators/${model.creator.id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={model.creator.avatar_url || undefined} />
                  <AvatarFallback>
                    {(model.creator.full_name || model.creator.username || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {model.creator.full_name || model.creator.username}
                  </p>
                  <p className="text-sm text-gray-600">
                    @{model.creator.username || "anonymous"}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Price and Download */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {formatPrice(model.price_cents)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {licenseTemplate.name}
                </p>
              </div>

              <Button className="w-full" size="lg">
                <Download className="h-5 w-5 mr-2" />
                {model.price_cents > 0
                  ? `Purchase for ${formatPrice(model.price_cents)}`
                  : "Download Free Model"}
              </Button>

              {!isOwner && user && (
                <ReferenceAssetButton
                  assetId={model.id}
                  assetTitle={model.title}
                  assetCreatorName={
                    model.creator.full_name ||
                    model.creator.username ||
                    "Anonymous"
                  }
                  royaltyPercentage={model.royalty_percentage || 0}
                  userProjects={userProjects}
                />
              )}

              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{model.download_count} downloads</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{model.usage_count} uses</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Downloads</span>
                <span className="font-semibold">{model.download_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Used in Projects</span>
                <span className="font-semibold">{model.usage_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uploaded</span>
                <span className="font-semibold">
                  {new Date(model.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
