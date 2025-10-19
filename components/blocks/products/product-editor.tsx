"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  deleteProductAction,
  updateProductAction,
} from "@/app/products/[id]/actions";
import { AssetSelector } from "@/components/blocks/products/asset-selector";
import { ProductTagInput } from "@/components/blocks/products/product-tag-input";
import { RoyaltyPreview } from "@/components/blocks/products/royalty-preview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  handle: z
    .string()
    .min(3, "Handle must be at least 3 characters")
    .max(50, "Handle must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Handle can only contain lowercase letters, numbers, and hyphens",
    ),
  variant_name: z.string().min(1, "Variant name is required"),
  price_cents: z.number().min(0, "Price must be 0 or greater"),
  asset_ids: z.array(z.string()).min(1, "Select at least one asset"),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface Asset {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  asset_images?: Array<{
    id: number;
    image_url: string;
    position: number;
  }>;
  asset_royalties?: Array<{
    id: number;
    user_id: string;
    royalty_type: "percentage" | "fixed";
    royalty_value: number;
  }>;
}

interface ExistingProduct {
  id: string;
  title: string;
  description: string | null;
  handle: string;
  product_variants?: Array<{
    title: string;
    product_variant_prices?: Array<{
      price_cents: number;
    }>;
    product_variant_assets?: Array<{
      asset_id: string;
    }>;
  }>;
}

interface ProductEditorProps {
  userId: string;
  userAssets: Asset[];
  existingProduct: ExistingProduct;
}

export function ProductEditor({
  userId,
  userAssets,
  existingProduct,
}: ProductEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract existing data
  const existingVariant = existingProduct?.product_variants?.[0];
  const existingPrice = existingVariant?.product_variant_prices?.[0];
  const existingAssetIds =
    existingVariant?.product_variant_assets?.map((va) => va.asset_id) || [];
  const initialPriceCents = existingPrice?.price_cents || 0;

  const [priceDisplayValue, setPriceDisplayValue] = useState<string>(
    (initialPriceCents / 100).toFixed(2),
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: existingProduct?.title || "",
      description: existingProduct?.description || "",
      handle: existingProduct?.handle || "",
      variant_name: existingVariant?.title || "Standard",
      price_cents: initialPriceCents,
      asset_ids: existingAssetIds,
      tags: [],
    },
  });

  // Get selected assets for royalty preview
  const assetIds = form.watch("asset_ids");
  const selectedAssets = useMemo(() => {
    return userAssets.filter((asset) => assetIds.includes(asset.id));
  }, [assetIds, userAssets]);

  // Auto-generate handle from title
  const handleTitleChange = (title: string) => {
    const handle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);
    form.setValue("handle", handle);
  };

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append("title", values.title);
      if (values.description) {
        formData.append("description", values.description);
      }
      formData.append("handle", values.handle);
      formData.append("variant_name", values.variant_name);
      formData.append("price_cents", values.price_cents.toString());
      formData.append("asset_ids", JSON.stringify(values.asset_ids));
      formData.append("tags", JSON.stringify(values.tags));

      const result = await updateProductAction(existingProduct.id, formData);

      if (!result.success) {
        throw new Error(result.error || "Failed to update product");
      }

      // Refresh the current page to show updated data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteProductAction(existingProduct.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete product");
      }

      toast.success("Product deleted successfully");
      router.push("/products");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete product",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Product Title <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Awesome Product"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleTitleChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Handle <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="my-awesome-product" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL-friendly identifier (lowercase, hyphens only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your product..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="asset_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Select Assets <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormDescription className="mb-4">
                    Choose which assets to include in this product. Royalties
                    will be automatically calculated based on asset
                    contributors.
                  </FormDescription>
                  <FormControl>
                    <AssetSelector
                      assets={userAssets}
                      selectedAssetIds={field.value}
                      onSelectionChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="variant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Variant Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Standard" {...field} />
                  </FormControl>
                  <FormDescription>
                    e.g., "Digital Only", "Print + Digital", "Commercial
                    License"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_cents"
              render={({ field }) => {
                const {
                  value: _value,
                  onChange: fieldOnChange,
                  onBlur: _onBlur,
                  ...restFieldProps
                } = field;
                return (
                  <FormItem>
                    <FormLabel>
                      Price <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={priceDisplayValue}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            setPriceDisplayValue(inputValue);

                            // Only update form value if not empty
                            if (inputValue === "") {
                              fieldOnChange(0);
                            } else {
                              const dollars = Number.parseFloat(inputValue);
                              if (!Number.isNaN(dollars)) {
                                fieldOnChange(Math.round(dollars * 100));
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const inputValue = e.target.value.trim();
                            if (inputValue === "" || inputValue === "0") {
                              setPriceDisplayValue("0.00");
                              fieldOnChange(0);
                            } else {
                              const dollars = Number.parseFloat(inputValue);
                              if (!Number.isNaN(dollars)) {
                                setPriceDisplayValue(dollars.toFixed(2));
                                fieldOnChange(Math.round(dollars * 100));
                              }
                            }
                          }}
                          {...restFieldProps}
                          className="max-w-[200px]"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      One-time purchase price in USD
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </CardContent>
        </Card>

        {/* Royalty Preview */}
        <RoyaltyPreview
          selectedAssets={selectedAssets}
          productPriceCents={form.watch("price_cents")}
          currentUserId={userId}
        />

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Add tags to help users discover your product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ProductTagInput
                      tags={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Preview</CardTitle>
            {/* Price Preview */}
            <CardContent>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Price Preview
              </div>
              <div className="text-2xl font-bold">
                ${((form.watch("price_cents") || 0) / 100).toFixed(2)}
              </div>
            </CardContent>
          </CardHeader>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || isDeleting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push("/products")}
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </Button>
          </div>

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                size="lg"
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Product
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{existingProduct.title}". This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Product
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </Form>
  );
}
