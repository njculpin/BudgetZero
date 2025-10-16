"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { updateAsset } from "@/app/assets/[id]/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { AssetActionsCard } from "./asset-actions-card";
import { AssetCompletionChecklist } from "./asset-completion-checklist";
import { AssetFileUploader } from "./asset-file-uploader";
import { AssetImageManager } from "./asset-image-manager";
import { AssetLicenseSelector } from "./asset-license-selector";
import { AssetMetadataCard } from "./asset-metadata-card";
import { AssetRoyaltySelector } from "./asset-royalty-selector";
import { AssetTagEditor } from "./asset-tag-editor";
import { AssetVisibilityCard } from "./asset-visibility-card";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  is_public: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssetDetailViewProps {
  asset: {
    id: string;
    title: string;
    description: string | null;
    is_public: boolean;
    user_id: string;
    creator: {
      id: string;
      username: string | null;
      full_name: string | null;
    };
    asset_royalties?: Array<{
      id: number;
      royalty_type: "fixed" | "percentage";
      royalty_value: number;
      user_id: string;
    }>;
    asset_licenses?: Array<{
      id: number;
      license_id: string;
      is_active: boolean;
      granted_at: string;
      expires_at: string | null;
    }>;
    asset_tags?: Array<{
      id: number;
      namespace: string;
      value: string;
    }>;
    asset_files?: Array<{
      id: number;
      file_url: string;
      caption: string | null;
      mime_type: string | null;
      file_size_bytes: number | null;
      storage_path: string;
    }>;
    asset_images?: Array<{
      id: number;
      image_url: string;
      caption: string | null;
      position: number;
      file_size_bytes: number | null;
      storage_path: string;
    }>;
  };
  isOwner: boolean;
  showOnboarding?: boolean;
}

export function AssetDetailView({
  asset,
  isOwner,
  showOnboarding = false,
}: AssetDetailViewProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddToProjectDialog, setShowAddToProjectDialog] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);

  const activeRoyalty = asset.asset_royalties?.[0];
  const activeLicense = asset.asset_licenses?.find((l) => l.is_active);

  // Determine if we should show editable fields
  const showEditableFields = isOwner;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: asset.title,
      description: asset.description || "",
      is_public: asset.is_public || false,
    },
  });

  // Debounced auto-save function
  const debouncedSave = useCallback(
    async (values: FormValues) => {
      try {
        setIsSaving(true);
        setError(null);

        const result = await updateAsset(asset.id, values);

        if (!result.success) {
          throw new Error(result.error || "Failed to update asset");
        }

        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        toast.error("Failed to save changes");
      } finally {
        setIsSaving(false);
      }
    },
    [asset.id, router],
  );

  // Watch for form changes and trigger auto-save (only when not viewing as customer)
  useEffect(() => {
    if (!showEditableFields) return;

    const subscription = form.watch(() => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save (1 second debounce)
      saveTimeoutRef.current = setTimeout(() => {
        const formValues = form.getValues();
        debouncedSave(formValues);
      }, 1000);
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, debouncedSave, showEditableFields]);

  return (
    <>
      <Form {...form}>
        <div className="flex flex-col space-y-8">
          {/* Onboarding Checklist */}
          {showOnboarding && isOwner && (
            <AssetCompletionChecklist
              asset={asset}
              onDismiss={() => {
                router.replace(`/assets/${asset.id}`);
              }}
            />
          )}

          {/* Asset Metadata */}
          <AssetMetadataCard form={form} />

          {/* File Uploader */}
          <AssetFileUploader
            assetId={asset.id}
            userId={asset.user_id}
            files={asset.asset_files || []}
            isOwner={isOwner}
          />

          {/* Image Manager */}
          <AssetImageManager
            assetId={asset.id}
            userId={asset.user_id}
            images={asset.asset_images || []}
            isOwner={isOwner}
          />

          {/* Tag Editor */}
          <AssetTagEditor
            assetId={asset.id}
            tags={asset.asset_tags || []}
            isOwner={isOwner}
          />

          {/* License */}
          <AssetLicenseSelector
            assetId={asset.id}
            currentLicense={activeLicense}
            isOwner={isOwner}
          />

          {/* Royalty */}
          <AssetRoyaltySelector
            assetId={asset.id}
            userId={asset.user_id}
            currentRoyalty={activeRoyalty}
            isOwner={isOwner}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Visibility Section */}
          {isOwner && (
            <AssetVisibilityCard form={form} tags={asset.asset_tags || []} />
          )}

          {/* Actions */}
          <AssetActionsCard
            assetId={asset.id}
            isSaving={isSaving}
            isOwner={isOwner}
            onAddToProject={() => setShowAddToProjectDialog(true)}
          />
        </div>
      </Form>
      <Dialog
        open={showAddToProjectDialog}
        onOpenChange={setShowAddToProjectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Product</DialogTitle>
            <DialogDescription>
              Select an existing product or start a new one with this asset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              This feature is coming soon. You'll be able to:
            </div>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Add this asset to your existing products</li>
              <li>Create a new project with this asset</li>
              <li>
                Request permission to use this asset (if not owned by you)
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddToProjectDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
