"use client";

import { createProductAction } from "@/app/products/create/actions";
import { AssetSelector } from "@/components/blocks/products/asset-selector";
import { RoyaltyPreview } from "@/components/blocks/products/royalty-preview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

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

interface ProductCreateFormProps {
  userId: string;
  userAssets: Asset[];
}

export function ProductCreateForm({
  userId,
  userAssets,
}: ProductCreateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      handle: "",
      variant_name: "Standard",
      price_cents: 0,
      asset_ids: [],
    },
  });

  // Get selected assets for royalty preview
  const selectedAssets = useMemo(() => {
    const selectedIds = form.watch("asset_ids");
    return userAssets.filter((asset) => selectedIds.includes(asset.id));
  }, [form.watch, userAssets]);

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

      const result = await createProductAction(formData);

      if (!result.success) {
        throw new Error(result.error || "Failed to create product");
      }

      if (result.productId) {
        router.push(`/products/${result.productId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
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
              render={({ field }) => (
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
                        {...field}
                        onChange={(e) => {
                          const dollars =
                            Number.parseFloat(e.target.value) || 0;
                          field.onChange(Math.round(dollars * 100));
                        }}
                        value={
                          field.value ? (field.value / 100).toFixed(2) : ""
                        }
                        className="max-w-[200px]"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    One-time purchase price in USD
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Royalty Preview */}
        <RoyaltyPreview
          selectedAssets={selectedAssets}
          productPriceCents={form.watch("price_cents")}
          currentUserId={userId}
        />

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            {/* Price Preview */}
            <CardContent></CardContent>
          </CardHeader>
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

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Create Product
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/products")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
