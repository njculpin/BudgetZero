"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Download,
  Eye,
  Heart,
  Loader2,
  MessageSquare,
  Plus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { AssetPricingManager } from "./asset-pricing-manager";
import { AssetViewAsToggle } from "./asset-view-as-toggle";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  is_public: z.boolean(),
  royalty_percentage: z
    .number()
    .min(0, "Minimum 0%")
    .max(50, "Maximum 50%")
    .optional(),
  royalty_notes: z.string().max(500).optional(),
  license_type: z
    .enum(["free", "attribution", "commercial", "exclusive"])
    .optional(),
  license_terms: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PricingOption {
  id: string;
  pricing_type: "free" | "one_time" | "subscription";
  price_cents: number;
  billing_interval: "month" | "year" | null;
  is_active: boolean;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AssetDetailViewProps {
  asset: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    creator_id: string;
    thumbnail_url: string | null;
    preview_url: string | null;
    creator: {
      id: string;
      username: string;
      full_name: string | null;
    };
    asset_settings?: Array<{
      is_public: boolean;
    }>;
    asset_stats?: Array<{
      view_count: number;
      download_count: number;
      like_count: number;
      comment_count: number;
    }>;
    asset_royalties?: Array<{
      percentage: number;
      notes: string | null;
      is_active: boolean;
    }>;
    asset_licenses?: Array<{
      license_type: string;
      license_terms: string | null;
      is_active: boolean;
    }>;
    asset_tags?: Array<{ tag: string }>;
    asset_files?: Array<{
      id: string;
      file_name: string | null;
      file_format: string | null;
      file_size_bytes: number | null;
      file_url: string;
      display_order: number;
    }>;
    asset_preview_images?: Array<{
      id: string;
      file_url: string;
      display_order: number;
    }>;
    asset_images?: Array<{
      id: string;
      file_url: string;
      display_order: number;
    }>;
  };
  isOwner: boolean;
  pricingOptions: PricingOption[];
}

export function AssetDetailView({
  asset,
  isOwner,
  pricingOptions,
}: AssetDetailViewProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddToProjectDialog, setShowAddToProjectDialog] = useState(false);
  const [viewAs, setViewAs] = useState<"owner" | "customer">("owner");
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);

  const settings = asset.asset_settings?.[0];
  const stats = asset.asset_stats?.[0];
  const activeRoyalty = asset.asset_royalties?.find((r) => r.is_active);
  const activeLicense = asset.asset_licenses?.find((l) => l.is_active);

  // Determine if we should show editable fields
  const showEditableFields = isOwner;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: asset.title,
      description: asset.description || "",
      is_public: settings?.is_public || false,
      royalty_percentage: activeRoyalty?.percentage || 0,
      royalty_notes: activeRoyalty?.notes || "",
      license_type:
        (activeLicense?.license_type as
          | "free"
          | "attribution"
          | "commercial"
          | "exclusive") || undefined,
      license_terms: activeLicense?.license_terms || "",
    },
  });

  // Debounced auto-save function
  const debouncedSave = useCallback(
    async (values: FormValues) => {
      try {
        setIsSaving(true);
        setError(null);

        const response = await fetch(`/api/assets/${asset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update asset");
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

    const subscription = form.watch((values) => {
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
        {/* View Mode Toggle (only for owners) */}
        <div className="grid-cols-1 gap-6">
          {/* Left Column - Asset Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview Card */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden rounded-t-lg">
                  {asset.asset_preview_images &&
                  asset.asset_preview_images.length > 0 ? (
                    <Image
                      src={
                        asset.asset_preview_images.sort(
                          (a, b) => a.display_order - b.display_order,
                        )[0].file_url
                      }
                      alt={asset.title}
                      fill
                      className="object-cover"
                    />
                  ) : asset.thumbnail_url ? (
                    <Image
                      src={asset.thumbnail_url}
                      alt={asset.title}
                      fill
                      className="object-cover"
                    />
                  ) : asset.preview_url ? (
                    <Image
                      src={asset.preview_url}
                      alt={asset.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground">
                      No preview available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                {showEditableFields ? (
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your asset..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum 500 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {asset.description || "No description provided."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Files Section */}
            {asset.asset_files && asset.asset_files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Files</CardTitle>
                  <CardDescription>
                    {asset.asset_files.length} file(s) available for download
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {asset.asset_files
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {file.file_name || "Untitled File"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {file.file_format && (
                                <Badge variant="outline" className="text-xs">
                                  {file.file_format}
                                </Badge>
                              )}
                              {file.file_size_bytes && (
                                <span>
                                  {(file.file_size_bytes / 1024 / 1024).toFixed(
                                    2,
                                  )}{" "}
                                  MB
                                </span>
                              )}
                            </div>
                          </div>
                          <Button size="sm" asChild>
                            <a
                              href={file.file_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview Images Gallery */}
            {asset.asset_preview_images &&
              asset.asset_preview_images.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preview Images</CardTitle>
                    <CardDescription>
                      {asset.asset_preview_images.length} image(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {asset.asset_preview_images
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((image, index) => (
                          <div
                            key={image.id}
                            className="aspect-square bg-muted rounded-lg overflow-hidden relative group"
                          >
                            <Image
                              src={image.file_url}
                              alt={`${asset.title} - View ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            {index === 0 && (
                              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                Thumbnail
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Additional Images Gallery (old asset_images table) */}
            {asset.asset_images && asset.asset_images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {asset.asset_images
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((image) => (
                        <div
                          key={image.id}
                          className="aspect-square bg-muted rounded-lg overflow-hidden relative"
                        >
                          <Image
                            src={image.file_url}
                            alt="Asset"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Info Sidebar */}
          <div className="space-y-6">
            {/* Asset Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {showEditableFields ? (
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Asset title"
                                className="text-2xl font-bold"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <CardTitle className="text-2xl mb-2">
                        {asset.title}
                      </CardTitle>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <span>By</span>
                      <Link
                        href={`/profile/${asset.creator.id}`}
                        className="font-medium hover:underline"
                      >
                        {asset.creator.full_name || asset.creator.username}
                      </Link>
                    </div>
                  </div>
                  <Badge
                    variant={
                      asset.status === "active" ? "default" : "secondary"
                    }
                  >
                    {asset.status}
                  </Badge>
                </div>
              </CardHeader>

              {/* Tags */}
              {asset.asset_tags && asset.asset_tags.length > 0 && (
                <>
                  <Separator />
                  <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-2">
                      {asset.asset_tags.map((tag) => (
                        <Badge key={tag.tag} variant="outline">
                          {tag.tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>

            <AssetViewAsToggle as={viewAs} setAs={(as) => setViewAs(as)} />

            {/* Visibility Settings (for owners in edit mode) */}
            {showEditableFields && (
              <Card>
                <CardHeader>
                  <CardTitle>Visibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="is_public"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Public Visibility
                          </FormLabel>
                          <FormDescription>
                            Make this asset visible to all users
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Pricing Manager */}
            <AssetPricingManager
              assetId={asset.id}
              pricingOptions={pricingOptions}
              isOwner={isOwner}
            />

            {/* Stats */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span>Views</span>
                      </div>
                      <span className="font-medium">{stats.view_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Download className="w-4 h-4" />
                        <span>Downloads</span>
                      </div>
                      <span className="font-medium">
                        {stats.download_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        <span>Likes</span>
                      </div>
                      <span className="font-medium">{stats.like_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        <span>Comments</span>
                      </div>
                      <span className="font-medium">{stats.comment_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* License Info */}
            <Card>
              <CardHeader>
                <CardTitle>License</CardTitle>
                <CardDescription>Usage terms for this asset</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showEditableFields ? (
                  <>
                    <FormField
                      control={form.control}
                      name="license_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a license type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="free">
                                <div className="space-y-1">
                                  <div className="font-medium">Free</div>
                                  <div className="text-xs text-muted-foreground">
                                    Use for any purpose, no attribution required
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="attribution">
                                <div className="space-y-1">
                                  <div className="font-medium">Attribution</div>
                                  <div className="text-xs text-muted-foreground">
                                    Free to use with credit to creator
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="commercial">
                                <div className="space-y-1">
                                  <div className="font-medium">Commercial</div>
                                  <div className="text-xs text-muted-foreground">
                                    Requires payment for commercial projects
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="exclusive">
                                <div className="space-y-1">
                                  <div className="font-medium">Exclusive</div>
                                  <div className="text-xs text-muted-foreground">
                                    One-time purchase with exclusive rights
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="license_terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom License Terms (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional license terms..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : activeLicense ? (
                  <>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        License Type
                      </div>
                      <Badge className="capitalize text-base px-3 py-1">
                        {activeLicense.license_type.replace("_", " ")}
                      </Badge>
                    </div>

                    {activeLicense.license_terms && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          Terms & Conditions
                        </div>
                        <div className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">
                          {activeLicense.license_terms}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      {activeLicense.license_type === "free" && (
                        <p>Free to use for any purpose without attribution.</p>
                      )}
                      {activeLicense.license_type === "attribution" && (
                        <p>Free to use with credit to the creator required.</p>
                      )}
                      {activeLicense.license_type === "commercial" && (
                        <p>
                          Payment required for commercial use. Contact creator
                          for pricing.
                        </p>
                      )}
                      {activeLicense.license_type === "exclusive" && (
                        <p>
                          One-time purchase grants exclusive rights. No other
                          licenses will be granted.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No license information available.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Royalty Info */}
            <Card>
              <CardHeader>
                <CardTitle>Royalty</CardTitle>
                <CardDescription>
                  Revenue share when used in projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showEditableFields ? (
                  <>
                    <FormField
                      control={form.control}
                      name="royalty_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Royalty Percentage</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="50"
                                step="0.01"
                                placeholder="0"
                                {...field}
                                onChange={(e) => {
                                  const value =
                                    e.target.value === ""
                                      ? 0
                                      : Number.parseFloat(e.target.value);
                                  field.onChange(value);
                                }}
                                value={field.value || 0}
                                className="max-w-[200px]"
                              />
                              <span className="text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            0-50% of revenue when used in other projects. Set to
                            0 for free use.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="royalty_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional royalty terms or notes..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : activeRoyalty ? (
                  <>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-bold">
                        {activeRoyalty.percentage}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Revenue share when used in projects
                      </p>
                    </div>
                    {activeRoyalty.notes && (
                      <p className="text-sm text-muted-foreground">
                        {activeRoyalty.notes}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No royalty information available.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => setShowAddToProjectDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Project
                </Button>
                {showEditableFields && isSaving && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Form>

      {/* Add to Project Dialog */}
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
