"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const assetSettingsSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  status: z.enum(["draft", "published", "archived"]),
  is_public: z.boolean(),
  is_featured: z.boolean(),
  license_type: z.enum(["free", "attribution", "commercial", "exclusive"]),
  license_terms: z.string().optional(),
  royalty_percentage: z.number().min(0).max(50),
  price_cents: z.number().min(0),
  seeking_collaborators: z.boolean(),
  tags: z.array(z.string()),
});

type AssetSettingsFormData = z.infer<typeof assetSettingsSchema>;

interface AssetSettingsFormProps {
  assetId: string;
  assetType: "model" | "illustration";
  projectId?: string;
  initialData: AssetSettingsFormData;
}

export function AssetSettingsForm({
  assetId,
  assetType,
  projectId,
  initialData,
}: AssetSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const form = useForm<AssetSettingsFormData>({
    resolver: zodResolver(assetSettingsSchema),
    defaultValues: initialData,
  });

  async function onSubmit(data: AssetSettingsFormData) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update asset");
      }

      toast.success("Asset settings saved successfully");

      // Small delay so user sees the toast
      setTimeout(() => {
        if (projectId) {
          router.push(
            `/projects/${projectId}/${assetType === "model" ? "models" : "illustrations"}/${assetId}`
          );
        } else {
          router.push(`/assets/${assetId}`);
        }
        router.refresh();
      }, 500);
    } catch (error) {
      console.error("Error updating asset:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update asset. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.getValues("tags").includes(tag)) {
      form.setValue("tags", [...form.getValues("tags"), tag]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    form.setValue(
      "tags",
      form.getValues("tags").filter((t) => t !== tag)
    );
  }

  const priceInDollars = form.watch("price_cents") / 100;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the title and description of your{" "}
              {assetType === "model" ? "3D model" : "illustration"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Asset title" {...field} />
                  </FormControl>
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
                      placeholder="Brief description of this asset"
                      rows={3}
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Max 500 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Publication Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Publication Settings</CardTitle>
            <CardDescription>
              Control the visibility and status of your asset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Draft assets are only visible to you
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Public Asset</FormLabel>
                    <FormDescription>
                      Allow anyone to view and use this asset
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

            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Featured Asset</FormLabel>
                    <FormDescription>
                      Highlight this asset in your portfolio
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

            <FormField
              control={form.control}
              name="seeking_collaborators"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Seeking Collaborators
                    </FormLabel>
                    <FormDescription>
                      Show that you're looking for collaborators
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

        {/* Pricing & License */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & License</CardTitle>
            <CardDescription>
              Set the license type, price, and royalty percentage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="license_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="attribution">Attribution</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="exclusive">Exclusive</SelectItem>
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
                  <FormLabel>License Terms</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional license terms or conditions"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_cents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        className="pl-7"
                        value={priceInDollars}
                        onChange={(e) =>
                          field.onChange(
                            Math.round(parseFloat(e.target.value || "0") * 100)
                          )
                        }
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Individual asset price (use pricing tiers for bundles)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="royalty_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Royalty Percentage (0-50%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value || "0"))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Percentage of revenue when used in other projects
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Add tags to help others discover your asset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>

            {form.watch("tags").length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.watch("tags").map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              projectId
                ? router.push(
                    `/projects/${projectId}/${assetType === "model" ? "models" : "illustrations"}/${assetId}`
                  )
                : router.push(`/assets/${assetId}`)
            }
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
