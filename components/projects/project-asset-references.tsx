import { Box, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

interface ProjectAssetReferencesProps {
  projectId: string;
  embedded?: boolean;
}

export async function ProjectAssetReferences({
  projectId,
  embedded = false,
}: ProjectAssetReferencesProps) {
  const supabase = await createClient();

  const { data: references } = await supabase
    .from("project_asset_references")
    .select(
      `
      *,
      asset:assets(
        id,
        title,
        asset_type,
        file_url,
        thumbnail_url,
        preview_url,
        creator:profiles!creator_id(id, full_name, username)
      )
    `,
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (!references || references.length === 0) {
    return null;
  }

  if (embedded) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">
          Referenced Assets
        </h4>
        <div className="space-y-2">
          {references.map((ref) => (
            <div
              key={ref.id}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              {/* Asset Preview */}
              <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                {ref.asset.asset_type === "illustration" ||
                ref.asset.asset_type === "photo" ||
                ref.asset.asset_type === "texture" ? (
                  <img
                    src={ref.asset.file_url}
                    alt={ref.asset.title}
                    className="w-full h-full object-cover"
                  />
                ) : ref.asset.preview_url ? (
                  <img
                    src={ref.asset.preview_url}
                    alt={ref.asset.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Box className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Asset Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-medium text-sm truncate">
                    {ref.asset.title}
                  </h5>
                  <Badge variant="outline" className="text-xs">
                    {ref.asset.creator.full_name || ref.asset.creator.username}{" "}
                    • {ref.royalty_percentage}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize text-xs">
                    {ref.asset.asset_type}
                  </Badge>
                  <Badge
                    variant={
                      ref.status === "approved"
                        ? "default"
                        : ref.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-xs"
                  >
                    {ref.status}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/assets/${ref.asset.id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Original Card mode for standalone use
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select("creator_id")
    .eq("id", projectId)
    .single();

  const isOwner = user?.id === project?.creator_id;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Referenced Assets</CardTitle>
            <CardDescription>
              Assets from other creators used in this project
              {references && references.length > 0 && ` (${references.length})`}
            </CardDescription>
          </div>
          {isOwner && (
            <Button size="sm" asChild>
              <Link href={`/projects/${projectId}/add-asset`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {references && references.length > 0 ? (
          <div className="space-y-4">
            {references.map((ref) => (
              <div
                key={ref.id}
                className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {/* Asset Preview */}
                <div className="w-20 h-20 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                  {ref.asset.asset_type === "illustration" ||
                  ref.asset.asset_type === "photo" ||
                  ref.asset.asset_type === "texture" ? (
                    <img
                      src={ref.asset.file_url}
                      alt={ref.asset.title}
                      className="w-full h-full object-cover"
                    />
                  ) : ref.asset.preview_url ? (
                    <img
                      src={ref.asset.preview_url}
                      alt={ref.asset.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Box className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Asset Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {ref.asset.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        By{" "}
                        {ref.asset.creator.full_name ||
                          ref.asset.creator.username}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        href={`/assets/${ref.asset.id}`}
                        aria-label={`View ${ref.asset.title} details`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">
                          View {ref.asset.title} details
                        </span>
                      </Link>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="capitalize text-xs">
                      {ref.asset.asset_type}
                    </Badge>
                    <Badge
                      variant={
                        ref.status === "approved"
                          ? "default"
                          : ref.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {ref.status}
                    </Badge>
                    {ref.royalty_percentage > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {ref.royalty_percentage}% royalty
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No assets added yet</p>
            {isOwner && (
              <Button variant="link" size="sm" asChild className="mt-2">
                <Link href={`/projects/${projectId}/add-asset`}>
                  Browse asset library
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
