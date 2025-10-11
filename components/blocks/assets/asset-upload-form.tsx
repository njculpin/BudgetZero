"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FileDropzone } from "@/components/blocks/assets/asset-file-dropzone";
import { MultiImageUploader } from "@/components/blocks/assets/multi-image-uploader";
import { TeamSelector } from "@/components/blocks/teams/team-selector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  ALLOWED_EXTENSIONS,
  FILE_SIZE_LIMITS,
} from "@/lib/constants/file-sizes";

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
});

type FormValues = z.infer<typeof formSchema>;

interface AssetUploadFormProps {
  projectId?: string;
  suggestedTags?: string[];
  onSuccess?: (assetId: string) => void;
}

export function AssetUploadForm({
  projectId,
  suggestedTags = [],
  onSuccess,
}: AssetUploadFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  // File states
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<File[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("personal");

  // All file formats supported
  const allFormats = [
    ...ALLOWED_EXTENSIONS.model,
    ...ALLOWED_EXTENSIONS.illustration,
    ...ALLOWED_EXTENSIONS.photo,
    ...ALLOWED_EXTENSIONS.audio,
    ...ALLOWED_EXTENSIONS.archive,
  ];
  const maxSize = FILE_SIZE_LIMITS.ARCHIVE_MAX; // 1GB max (for compressed files)
  const uploadEndpoint = "/api/assets/upload";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
    },
  });

  async function onSubmit(values: FormValues) {
    if (!primaryFile) {
      setError("Please select a file");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(10);
      setUploadStatus("Preparing upload...");

      const formData = new FormData();
      formData.append("primaryFile", primaryFile);

      // Append preview images
      previewImages.forEach((image) => {
        formData.append("previewImages", image);
      });

      // Append form values
      formData.append("title", values.title);
      if (values.description) {
        formData.append("description", values.description);
      }
      formData.append("tags", JSON.stringify(values.tags));
      if (projectId) {
        formData.append("project_id", projectId);
      }
      if (selectedTeam !== "personal") {
        formData.append("team_id", selectedTeam);
      }

      setUploadProgress(30);
      setUploadStatus("Uploading file...");

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
        router.push(`/assets/${result.asset.id}`);
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

  const [tagInput, setTagInput] = useState("");

  function addTag(tag: string) {
    const currentTags = form.getValues("tags");
    const normalizedTag = tag.trim();
    if (!currentTags.includes(normalizedTag) && currentTags.length < 10 && normalizedTag) {
      form.setValue("tags", [...currentTags, normalizedTag]);
    }
  }

  function removeTag(tag: string) {
    form.setValue(
      "tags",
      form.getValues("tags").filter((t) => t !== tag),
    );
  }

  function handleAddCustomTag() {
    if (tagInput.trim()) {
      addTag(tagInput);
      setTagInput("");
    }
  }

  function handleTagInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomTag();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* File Uploads Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Files</h3>
            <p className="text-sm text-gray-600">
              Upload your media file and optional thumbnail
            </p>
          </div>

          {/* Primary File Upload */}
          <FormItem>
            <FormLabel>
              Asset File <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <FileDropzone
                accept={allFormats}
                maxSize={maxSize}
                onFileSelect={handlePrimaryFileSelect}
                currentFile={primaryFile}
                onRemove={() => setPrimaryFile(null)}
                label="Drop your file here"
                description="Models, illustrations, photos, audio, and compressed files (ZIP, RAR, 7z)"
                icon={<Upload className="h-8 w-8" />}
              />
            </FormControl>
          </FormItem>

          {/* Preview Images Upload */}
          <FormItem>
            <FormLabel>Preview Images (Optional)</FormLabel>
            <FormDescription className="mb-3">
              Upload multiple images to showcase different views of your asset.
              The first image will be used as the thumbnail.
            </FormDescription>
            <FormControl>
              <MultiImageUploader
                images={previewImages}
                onImagesChange={setPreviewImages}
                maxImages={10}
                maxSizeBytes={FILE_SIZE_LIMITS.THUMBNAIL_MAX}
                disabled={isUploading}
              />
            </FormControl>
          </FormItem>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          {/* Team Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Owner</label>
            <TeamSelector
              value={selectedTeam}
              onChange={setSelectedTeam}
              placeholder="Select asset owner"
            />
            <p className="text-xs text-muted-foreground">
              Choose whether this asset belongs to you personally or to a team
            </p>
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Title <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="My awesome asset" {...field} />
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
                    placeholder="Describe your asset..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
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

                  {/* Custom Tag Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      disabled={field.value.length >= 10}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddCustomTag}
                      disabled={!tagInput.trim() || field.value.length >= 10}
                    >
                      Add
                    </Button>
                  </div>

                  {/* Suggested Tags */}
                  {suggestedTags.length > 0 && (
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
                  )}
                </div>
                <FormDescription>
                  {field.value.length}/10 tags selected
                </FormDescription>
                <FormMessage />
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
            <AlertTitle className="text-blue-900">Uploading asset</AlertTitle>
            <AlertDescription className="space-y-3 mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900">
                  {uploadStatus}
                </span>
                <span className="font-semibold text-blue-600">
                  {uploadProgress}%
                </span>
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
                Upload Asset
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/assets")}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
