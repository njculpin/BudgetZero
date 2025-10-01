"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  LICENSE_TEMPLATES,
  SUGGESTED_PRICING,
  formatPrice,
} from "@/lib/constants/licenses";
import { LicenseType, AssetType } from "@/lib/types/database";
import {
  ALLOWED_MODEL_FORMATS,
  ALLOWED_ILLUSTRATION_FORMATS,
  FILE_SIZE_LIMITS,
} from "@/lib/services/storage";
import { FileDropzone } from "@/components/shared/file-upload/file-dropzone";

const formSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  tags: z
    .array(z.string())
    .min(1, "Add at least one tag to help others discover your asset")
    .max(10, "Maximum 10 tags allowed"),
  license_type: z.enum(["free", "attribution", "commercial", "exclusive"]),
  price_cents: z.number(),
  is_public: z.boolean(),
  seeking_collaborators: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssetUploadFormProps {
  assetType: AssetType;
  suggestedTags: string[];
  onSuccess?: (assetId: string) => void;
}

export function AssetUploadForm({ assetType, suggestedTags, onSuccess }: AssetUploadFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  // File states
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const assetLabel = assetType === "model" ? "model" : "illustration";
  const assetLabelCap = assetType === "model" ? "Model" : "Illustration";
  const allowedFormats = assetType === "model" ? ALLOWED_MODEL_FORMATS : ALLOWED_ILLUSTRATION_FORMATS;
  const maxSize = assetType === "model" ? FILE_SIZE_LIMITS.MODEL_MAX : FILE_SIZE_LIMITS.ILLUSTRATION_MAX;
  const uploadEndpoint = `/api/${assetType}s/upload`;
  const browsePath = `/${assetType}s`;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      license_type: "free",
      price_cents: 0,
      is_public: true,
      seeking_collaborators: false,
    },
  });

  const selectedLicense = form.watch("license_type");
  const licenseTemplate = LICENSE_TEMPLATES[selectedLicense];

  async function onSubmit(values: FormValues) {
    if (!primaryFile) {
      setError(`Please select a ${assetLabel} file`);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(10);
      setUploadStatus(`Preparing ${assetLabel} upload...`);

      const formData = new FormData();
      formData.append("primaryFile", primaryFile);
      if (thumbnailFile) {
        formData.append("thumbnailFile", thumbnailFile);
      }

      // Append form values
      formData.append("title", values.title);
      if (values.description) {
        formData.append("description", values.description);
      }
      formData.append("tags", JSON.stringify(values.tags));
      formData.append("license_type", values.license_type);
      formData.append("price_cents", values.price_cents.toString());
      formData.append("is_public", values.is_public ? "true" : "false");
      formData.append("seeking_collaborators", values.seeking_collaborators ? "true" : "false");

      setUploadProgress(30);
      setUploadStatus(`Uploading ${assetLabel} file...`);

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      setUploadProgress(100);
      setUploadStatus("Upload complete!");

      if (onSuccess) {
        onSuccess(result.asset.id);
      } else {
        router.push(`/${assetType}s/${result.asset.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }

  function handlePrimaryFileSelect(file: File) {
    setPrimaryFile(file);
  }

  function handleThumbnailFileSelect(file: File) {
    setThumbnailFile(file);
  }

  function addTag(tag: string) {
    const currentTags = form.getValues("tags");
    if (!currentTags.includes(tag) && currentTags.length < 10) {
      form.setValue("tags", [...currentTags, tag]);
    }
  }

  function removeTag(tag: string) {
    form.setValue(
      "tags",
      form.getValues("tags").filter((t) => t !== tag)
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* File Uploads Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Files</h3>
            <p className="text-sm text-gray-600">
              Upload your {assetLabel} and optional preview images
            </p>
          </div>

          {/* Primary File Upload */}
          <FormItem>
            <FormLabel>
              {assetLabelCap} File <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <FileDropzone
                accept={allowedFormats}
                maxSize={maxSize}
                onFileSelect={handlePrimaryFileSelect}
                currentFile={primaryFile}
                onRemove={() => setPrimaryFile(null)}
                label={`Drop your ${assetLabel} file here`}
                description={`Supported formats: ${allowedFormats.join(", ")}`}
                icon={<Upload className="h-8 w-8" />}
              />
            </FormControl>
          </FormItem>

          {/* Thumbnail Upload */}
          <FormItem>
            <FormLabel>Thumbnail (Optional)</FormLabel>
            <FormControl>
              <FileDropzone
                accept={[".jpg", ".jpeg", ".png", ".webp"]}
                maxSize={FILE_SIZE_LIMITS.THUMBNAIL_MAX}
                onFileSelect={handleThumbnailFileSelect}
                currentFile={thumbnailFile}
                onRemove={() => setThumbnailFile(null)}
                label="Drop a thumbnail image"
                description="Recommended: Square image, at least 800x800px"
                icon={<Upload className="h-6 w-6" />}
              />
            </FormControl>
          </FormItem>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Title <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={`My awesome ${assetLabel}`}
                    {...field}
                  />
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
                    placeholder={`Describe your ${assetLabel}...`}
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional: Tell users about your {assetLabel}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tags</h3>
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tags <span className="text-red-500">*</span>
                </FormLabel>
                <div className="space-y-3">
                  {/* Selected Tags */}
                  {field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                      {field.value.map((tag) => (
                        <Badge
                          key={tag}
                          variant="default"
                          className="gap-1 bg-blue-600"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Suggested Tags */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Suggested tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.map((tag) => {
                        const isSelected = field.value.includes(tag);
                        return (
                          <Badge
                            key={tag}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer ${
                              isSelected
                                ? "bg-blue-600"
                                : "hover:bg-blue-50 hover:border-blue-300"
                            }`}
                            onClick={() =>
                              isSelected ? removeTag(tag) : addTag(tag)
                            }
                          >
                            {tag}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <FormDescription>
                  {field.value.length}/10 tags selected
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* License and Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">License and Pricing</h3>

          <FormField
            control={form.control}
            name="license_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  License Type <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select license type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(LICENSE_TEMPLATES).map((license) => (
                      <SelectItem key={license.type} value={license.type}>
                        {license.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{licenseTemplate.description}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {(selectedLicense === "commercial" ||
            selectedLicense === "exclusive") && (
            <FormField
              control={form.control}
              name="price_cents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="20.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? Math.round(parseFloat(e.target.value) * 100)
                            : 0
                        )
                      }
                      value={field.value ? field.value / 100 : ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Suggested:{" "}
                    {formatPrice(
                      SUGGESTED_PRICING[selectedLicense as LicenseType]
                        .recommended
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Make this {assetLabel} publicly visible</FormLabel>
                  <FormDescription>
                    Uncheck to keep as private/draft
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seeking_collaborators"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg bg-blue-50 border-blue-200">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Seeking Collaborators</FormLabel>
                  <FormDescription>
                    Signal that you want this work used in collaborative game projects with revenue sharing
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <Alert className="border-blue-200 bg-blue-50">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertTitle className="text-blue-900">Uploading your {assetLabel}</AlertTitle>
            <AlertDescription className="space-y-3 mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900">{uploadStatus}</span>
                <span className="font-semibold text-blue-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-blue-700">
                Please don't close this page while uploading...
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isUploading} size="lg">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {assetLabelCap}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push(browsePath)}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
