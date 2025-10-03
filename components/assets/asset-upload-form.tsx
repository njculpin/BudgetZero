"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

const assetUploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  asset_type: z.enum(["model", "illustration", "texture", "photo"]),
  file: z.instanceof(File).optional(),
});

type AssetUploadFormData = z.infer<typeof assetUploadSchema>;

interface AssetUploadFormProps {
  projectId?: string;
  redirectPath?: string;
}

export function AssetUploadForm({
  projectId,
  redirectPath,
}: AssetUploadFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<AssetUploadFormData>({
    resolver: zodResolver(assetUploadSchema),
    defaultValues: {
      title: "",
      description: "",
      asset_type: "model",
    },
  });

  const assetType = form.watch("asset_type");

  const getAcceptedFileTypes = () => {
    switch (assetType) {
      case "model":
        return ".stl,.obj,.fbx,.glb,.gltf";
      case "illustration":
        return ".png,.jpg,.jpeg,.gif,.svg,.webp,.tiff,.bmp,.psd,.ai,.pdf";
      case "texture":
        return ".png,.jpg,.jpeg,.tga,.hdr";
      case "photo":
        return ".png,.jpg,.jpeg,.webp,.gif";
      default:
        return "*";
    }
  };

  const getMaxFileSize = () => {
    switch (assetType) {
      case "model":
        return "500MB";
      case "illustration":
        return "100MB";
      case "texture":
        return "50MB";
      case "photo":
        return "10MB";
      default:
        return "Unknown";
    }
  };

  const getMaxFileSizeBytes = () => {
    switch (assetType) {
      case "model":
        return 500 * 1024 * 1024; // 500MB
      case "illustration":
        return 100 * 1024 * 1024; // 100MB
      case "texture":
        return 50 * 1024 * 1024; // 50MB
      case "photo":
        return 10 * 1024 * 1024; // 10MB
      default:
        return Number.POSITIVE_INFINITY;
    }
  };

  async function onSubmit(data: AssetUploadFormData) {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    // Client-side file size validation
    const maxSize = getMaxFileSizeBytes();
    if (selectedFile.size > maxSize) {
      toast.error(
        `File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed size of ${getMaxFileSize()}`
      );
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload file to storage
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);
      uploadFormData.append("asset_type", data.asset_type);

      setUploadProgress(30);

      const uploadResponse = await fetch("/api/assets/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Failed to upload file");
      }

      const uploadData = await uploadResponse.json();
      setUploadProgress(60);

      // Step 2: Create asset record
      const createResponse = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          asset_type: data.asset_type,
          file_url: uploadData.file_url,
          file_size_bytes: uploadData.file_size_bytes,
          file_format: uploadData.file_format,
          project_id: projectId,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Failed to create asset");
      }

      const asset = await createResponse.json();
      setUploadProgress(100);

      // Redirect to asset page or custom path
      if (redirectPath) {
        router.push(redirectPath);
      } else if (projectId) {
        router.push(
          `/projects/${projectId}/${data.asset_type === "model" ? "models" : "illustrations"}/${asset.id}`
        );
      } else {
        router.push(`/assets/${asset.id}`);
      }
      router.refresh();
      toast.success("Asset uploaded successfully!");
    } catch (error) {
      console.error("Error uploading asset:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload asset. Please try again."
      );
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Asset</CardTitle>
            <CardDescription>
              Upload a new 3D model, illustration, texture, or photo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="asset_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="model">3D Model</SelectItem>
                      <SelectItem value="illustration">Illustration</SelectItem>
                      <SelectItem value="texture">Texture</SelectItem>
                      <SelectItem value="photo">Photo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="file"
              render={() => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept={getAcceptedFileTypes()}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Validate file size before setting
                              const maxSize = getMaxFileSizeBytes();
                              if (file.size > maxSize) {
                                toast.error(
                                  `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed size of ${getMaxFileSize()}`
                                );
                                e.target.value = ""; // Clear the input
                                return;
                              }

                              setSelectedFile(file);
                              form.setValue("file", file);
                              // Auto-fill title if empty
                              if (!form.getValues("title")) {
                                const titleFromFile = file.name
                                  .split(".")
                                  .slice(0, -1)
                                  .join(".");
                                form.setValue("title", titleFromFile);
                              }
                            }
                          }}
                          disabled={isLoading}
                        />
                        {selectedFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null);
                              form.setValue("file", undefined);
                            }}
                            disabled={isLoading}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      {selectedFile && (
                        <div className="text-sm text-muted-foreground">
                          Selected: {selectedFile.name} (
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </div>
                      )}
                      <FormDescription>
                        Accepted formats: {getAcceptedFileTypes()} (Max size:{" "}
                        {getMaxFileSize()})
                      </FormDescription>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isLoading && uploadProgress > 0 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !selectedFile}>
            <Upload className="mr-2 h-4 w-4" />
            {isLoading ? "Uploading..." : "Upload Asset"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
