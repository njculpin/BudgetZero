"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteAsset } from "@/app/assets/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AssetActionsCardProps {
  assetId: string;
  isSaving: boolean;
  isOwner: boolean;
  onAddToProject: () => void;
}

export function AssetActionsCard({
  assetId,
  isSaving,
  isOwner,
  onAddToProject,
}: AssetActionsCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this asset? This will also delete all associated files, images, and tags. This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteAsset(assetId);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete asset");
      }

      toast.success("Asset deleted successfully");
      router.push("/assets");
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete asset",
      );
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>Manage your asset</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button className="w-full" onClick={onAddToProject}>
          <Plus className="mr-2 h-4 w-4" />
          Add to Project
        </Button>
        {isOwner && (
          <Button
            className="w-full"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Asset
              </>
            )}
          </Button>
        )}
        {isSaving && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
