"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AddAssetButtonProps {
  projectId: string;
  assetId: string;
  assetTitle: string;
}

export function AddAssetButton({
  projectId,
  assetId,
  assetTitle,
}: AddAssetButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleAddAsset() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/project-asset-references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          asset_id: assetId,
          royalty_percentage: 0, // Will be set from asset's royalty percentage by API
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add asset");
      }

      toast.success(`"${assetTitle}" has been requested for your project`, {
        description:
          "The asset owner will be notified to approve your request.",
      });

      router.refresh();
    } catch (error) {
      console.error("Error adding asset:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add asset. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={handleAddAsset}
      disabled={isLoading}
      size="sm"
      className="w-full"
    >
      <Plus className="mr-2 h-4 w-4" />
      {isLoading ? "Adding..." : "Add to Project"}
    </Button>
  );
}
