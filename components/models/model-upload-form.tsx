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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Upload,
  FileIcon,
  ImageIcon,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Info,
  Package,
} from "lucide-react";
import {
  LICENSE_TEMPLATES,
  SUGGESTED_PRICING,
  formatPrice,
} from "@/lib/constants/licenses";
import { LicenseType } from "@/lib/types/database";
import {
  ALLOWED_MODEL_FORMATS,
  FILE_SIZE_LIMITS,
} from "@/lib/services/storage";
import { FileDropzone } from "./file-dropzone";

const formSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  model_category: z.string().min(1, "Please select a category"),
  tags: z.array(z.string()).default([]),
  license_type: z.enum(["free", "attribution", "commercial", "exclusive"]),
  price_cents: z.number().default(0),
  is_public: z.boolean().default(true),
  polygon_count: z.number().optional(),
  vertex_count: z.number().optional(),
  is_rigged: z.boolean().default(false),
  is_animated: z.boolean().default(false),
  is_textured: z.boolean().default(false),
  is_game_ready: z.boolean().default(false),
  scale_unit: z.enum(["mm", "cm", "m", "inch"]).optional(),
  render_engine_tags: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

const MODEL_CATEGORIES = [
  "miniature",
  "terrain",
  "token",
  "vehicle",
  "building",
  "prop",
  "creature",
  "character",
  "scenery",
  "dice",
  "marker",
  "other",
];

const RENDER_ENGINES = [
  "Unity",
  "Unreal Engine",
  "Blender",
  "Maya",
  "3ds Max",
  "Cinema 4D",
  "Godot",
];

interface ModelUploadFormProps {
  onSuccess?: (assetId: string) => void;
}

export function ModelUploadForm({ onSuccess }: ModelUploadFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fileErrors, setFileErrors] = useState<{
    model?: string;
    thumbnail?: string;
  }>({});

  // File states
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [textureFiles, setTextureFiles] = useState<File[]>([]);

  // Tag input
  const [tagInput, setTagInput] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      model_category: "",
      tags: [],
      license_type: "free",
      price_cents: 0,
      is_public: true,
      is_rigged: false,
      is_animated: false,
      is_textured: false,
      is_game_ready: false,
      render_engine_tags: [],
    },
  });

  const selectedLicense = form.watch("license_type");
  const licenseTemplate = LICENSE_TEMPLATES[selectedLicense as LicenseType];

  async function onSubmit(values: FormValues) {
    if (!modelFile) {
      setError("Please select a 3D model file to upload");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setUploadStatus("Preparing upload...");

    try {
      // Upload model file
      const formData = new FormData();
      formData.append("modelFile", modelFile);
      if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
      textureFiles.forEach((file, index) => {
        formData.append(`texture_${index}`, file);
      });

      // Add metadata
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : String(value)
          );
        }
      });

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
          if (percentComplete < 50) {
            setUploadStatus("Uploading files...");
          } else if (percentComplete < 90) {
            setUploadStatus("Processing model...");
          } else {
            setUploadStatus("Almost done...");
          }
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(
              new Error(JSON.parse(xhr.responseText).error || "Upload failed")
            );
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error occurred"));
        });

        xhr.open("POST", "/api/models/upload");
        xhr.send(formData);
      });

      setUploadStatus("Finalizing...");
      const { assetId } = (await uploadPromise) as { assetId: string };
      setUploadProgress(100);
      setUploadStatus("Upload complete!");

      // Success callback
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(assetId);
        } else {
          router.push(`/models/${assetId}`);
        }
      }, 500);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload model");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }

  function handleModelFileSelect(file: File) {
    setModelFile(file);
    setFileErrors((prev) => ({ ...prev, model: undefined }));
    // Auto-populate title from filename if empty
    if (!form.getValues("title")) {
      const titleFromFile = file.name.replace(/\.[^/.]+$/, "");
      form.setValue("title", titleFromFile);
    }
  }

  function handleThumbnailFileSelect(file: File) {
    setThumbnailFile(file);
    setFileErrors((prev) => ({ ...prev, thumbnail: undefined }));
  }

  function handleTextureFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setTextureFiles((prev) => [...prev, ...files]);
  }

  function removeTextureFile(index: number) {
    setTextureFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function addTag() {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags");
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue("tags", [...currentTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    const currentTags = form.getValues("tags");
    form.setValue(
      "tags",
      currentTags.filter((t) => t !== tag)
    );
  }

  function toggleRenderEngine(engine: string) {
    const current = form.getValues("render_engine_tags");
    if (current.includes(engine)) {
      form.setValue(
        "render_engine_tags",
        current.filter((e) => e !== engine)
      );
    } else {
      form.setValue("render_engine_tags", [...current, engine]);
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
              Upload your 3D model and optional preview images
            </p>
          </div>

          {/* Model File Upload with Dropzone */}
          <FormItem>
            <FormLabel>
              3D Model File <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <FileDropzone
                accept={ALLOWED_MODEL_FORMATS}
                maxSize={FILE_SIZE_LIMITS.MODEL_MAX}
                onFileSelect={handleModelFileSelect}
                currentFile={modelFile}
                onRemove={() => setModelFile(null)}
                label="3D Model"
                description={`Supported: ${ALLOWED_MODEL_FORMATS.join(", ")} (Max 500MB)`}
                error={fileErrors.model}
                icon={<Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />}
              />
            </FormControl>
          </FormItem>

          {/* Thumbnail Upload with Preview */}
          <FormItem>
            <FormLabel>Thumbnail Image (Recommended)</FormLabel>
            <FormDescription>
              Preview image helps users discover your model
            </FormDescription>
            <FormControl>
              <div className="space-y-4">
                <FileDropzone
                  accept={[".png", ".jpg", ".jpeg", ".webp"]}
                  maxSize={FILE_SIZE_LIMITS.THUMBNAIL_MAX}
                  onFileSelect={handleThumbnailFileSelect}
                  currentFile={thumbnailFile}
                  onRemove={() => setThumbnailFile(null)}
                  label="Thumbnail"
                  description="PNG, JPG, or WebP (Max 5MB)"
                  error={fileErrors.thumbnail}
                  icon={<ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />}
                />
                {thumbnailFile && (
                  <div className="relative w-full max-w-md mx-auto">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={URL.createObjectURL(thumbnailFile)}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </FormControl>
          </FormItem>

          {/* Texture Files Upload */}
          <FormItem>
            <FormLabel>Texture Files (Optional)</FormLabel>
            <FormDescription>
              Upload any texture or material files
            </FormDescription>
            <FormControl>
              <div className="space-y-2">
                <label
                  htmlFor="texture-files"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 w-fit"
                >
                  <Upload className="h-4 w-4" />
                  Add Textures
                </label>
                <input
                  id="texture-files"
                  type="file"
                  accept=".png,.jpg,.jpeg,.tga,.dds,.exr"
                  multiple
                  onChange={handleTextureFilesChange}
                  className="hidden"
                />
                {textureFiles.length > 0 && (
                  <div className="space-y-1">
                    {textureFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTextureFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormControl>
          </FormItem>
        </div>

        {/* Basic Information */}
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
                    placeholder="Dragon Miniature"
                    {...field}
                    maxLength={100}
                  />
                </FormControl>
                <div className="flex justify-between">
                  <FormDescription>
                    A clear, descriptive name for your model
                  </FormDescription>
                  <span className="text-xs text-gray-500">
                    {field.value?.length || 0}/100
                  </span>
                </div>
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
                    placeholder="Describe your 3D model, its features, intended use, and any special details..."
                    rows={4}
                    {...field}
                    maxLength={500}
                  />
                </FormControl>
                <div className="flex justify-between">
                  <FormDescription>
                    Help others understand what makes your model unique
                  </FormDescription>
                  <span className="text-xs text-gray-500">
                    {field.value?.length || 0}/500
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Category <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MODEL_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tags */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormDescription>
                  Add tags to help others find your model (max 10)
                </FormDescription>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter a tag (e.g., 'fantasy', 'miniature')"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      disabled={field.value.length >= 10}
                      aria-label="Add tag"
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      disabled={!tagInput.trim() || field.value.length >= 10}
                    >
                      Add
                    </Button>
                  </div>
                  {field.value.length >= 10 && (
                    <p className="text-xs text-amber-600">
                      Maximum of 10 tags reached
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {field.value.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-red-600 p-1"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Model Properties */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Model Properties</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="polygon_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Polygon Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 50000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vertex_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vertex Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 25000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="scale_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scale Unit</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scale unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="mm">Millimeters (mm)</SelectItem>
                    <SelectItem value="cm">Centimeters (cm)</SelectItem>
                    <SelectItem value="m">Meters (m)</SelectItem>
                    <SelectItem value="inch">Inches</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Checkboxes for model features */}
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="is_textured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Includes Textures</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_rigged"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Rigged (has skeleton/armature)</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_animated"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Includes Animations</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_game_ready"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Game Ready (optimized for game engines)</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Render Engine Tags */}
          <FormField
            control={form.control}
            name="render_engine_tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compatible Render Engines</FormLabel>
                <FormDescription>
                  Select engines this model has been tested with
                </FormDescription>
                <div className="flex flex-wrap gap-2">
                  {RENDER_ENGINES.map((engine) => (
                    <Button
                      key={engine}
                      type="button"
                      variant={
                        field.value.includes(engine) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => toggleRenderEngine(engine)}
                    >
                      {engine}
                    </Button>
                  ))}
                </div>
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
                  <FormLabel>Make this model publicly visible</FormLabel>
                  <FormDescription>
                    Uncheck to keep as private/draft
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
            <AlertTitle className="text-blue-900">Uploading your model</AlertTitle>
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
                Upload Model
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/models")}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}