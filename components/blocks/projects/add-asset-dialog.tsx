"use client";

import { Check, Plus, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Asset {
  id: string;
  title: string;
  asset_type: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  status: string;
  asset_preview_images?: Array<{
    file_url: string;
    display_order: number;
  }>;
}

interface AddAssetDialogProps {
  projectId: string;
  userAssets: Asset[];
  children?: React.ReactNode;
}

export function AddAssetDialog({
  projectId,
  userAssets,
  children,
}: AddAssetDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddExisting = async () => {
    if (!selectedAssetId) return;

    try {
      setIsLoading(true);

      const response = await fetch(`/api/projects/${projectId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: selectedAssetId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add asset");
      }

      toast.success("Asset added to project!");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add asset",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Asset to Project</DialogTitle>
          <DialogDescription>
            Choose an existing asset or upload a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload New Asset Option */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Create New Asset</h3>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/assets/upload?projectId=${projectId}`}>
                <Upload className="mr-2 h-4 w-4" />
                Upload New Asset
              </Link>
            </Button>
          </div>

          <Separator />

          {/* Select Existing Asset Option */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              Add Existing Asset ({userAssets.length})
            </h3>

            {userAssets.length > 0 ? (
              <RadioGroup
                value={selectedAssetId || ""}
                onValueChange={setSelectedAssetId}
              >
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {userAssets.map((asset) => {
                    const previewUrl =
                      asset.asset_preview_images &&
                      asset.asset_preview_images.length > 0
                        ? asset.asset_preview_images.sort(
                            (a, b) => a.display_order - b.display_order,
                          )[0].file_url
                        : asset.thumbnail_url || asset.preview_url;

                    return (
                      <div
                        key={asset.id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                          selectedAssetId === asset.id
                            ? "border-primary bg-accent"
                            : ""
                        }`}
                        onClick={() => setSelectedAssetId(asset.id)}
                      >
                        <RadioGroupItem value={asset.id} id={asset.id} />
                        <div className="w-16 h-16 bg-muted rounded overflow-hidden shrink-0 relative">
                          {previewUrl ? (
                            <Image
                              src={previewUrl}
                              alt={asset.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Plus className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <Label
                          htmlFor={asset.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{asset.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {asset.asset_type && (
                              <Badge variant="outline" className="text-xs">
                                {asset.asset_type}
                              </Badge>
                            )}
                            <Badge
                              variant={
                                asset.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {asset.status}
                            </Badge>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>No assets available.</p>
                <p className="text-xs mt-1">
                  Upload your first asset to get started.
                </p>
              </div>
            )}
          </div>

          {/* Add Button */}
          {selectedAssetId && (
            <>
              <Separator />
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddExisting} disabled={isLoading}>
                  {isLoading ? (
                    "Adding..."
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Add Selected Asset
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
