"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface AssetImage {
  id: number;
  image_url: string;
  caption: string | null;
  position: number;
  storage_path: string;
}

interface AssetImageManagerProps {
  assetId: string;
  userId: string;
  images: AssetImage[];
  isOwner: boolean;
}

export function AssetImageManager({
  assetId,
  userId,
  images,
  isOwner,
}: AssetImageManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const validFiles = files.filter((file) => {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} is larger than 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      const supabase = createClient();

      // Get next position
      const nextPosition =
        images.length > 0
          ? Math.max(...images.map((img) => img.position)) + 1
          : 0;

      // Upload files in parallel
      const uploadPromises = validFiles.map(async (file, index) => {
        const imagePath = `${userId}/${assetId}/images/${Date.now()}-${index}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("assets")
          .upload(imagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("assets").getPublicUrl(imagePath);

        // Create database record
        const { error: dbError } = await supabase.from("asset_images").insert({
          asset_id: assetId,
          image_url: publicUrl,
          storage_path: imagePath,
          position: nextPosition + index,
          file_size_bytes: file.size,
        });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);

      toast.success(`${validFiles.length} image(s) uploaded successfully`);
      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = async (image: AssetImage) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    setDeletingImageId(image.id);

    try {
      const supabase = createClient();

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("assets")
        .remove([image.storage_path]);

      if (storageError) throw storageError;

      // Soft delete from database
      const { error: dbError } = await supabase
        .from("asset_images")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", image.id);

      if (dbError) throw dbError;

      toast.success("Image deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Preview Images</CardTitle>
            <CardDescription>
              {images.length > 0
                ? `${images.length} image(s) uploaded`
                : "Add images to showcase your asset"}
            </CardDescription>
          </div>
          {isOwner && (
            <Button
              onClick={handleUploadClick}
              disabled={isUploading}
              size="sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Add Images
                </>
              )}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </CardHeader>
      <CardContent>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images
              .sort((a, b) => a.position - b.position)
              .map((image, index) => (
                <div
                  key={image.id}
                  className="aspect-square bg-muted rounded-lg overflow-hidden relative group"
                >
                  <Image
                    src={image.image_url}
                    alt={image.caption || `Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Thumbnail
                    </div>
                  )}
                  {isOwner && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteImage(image)}
                        disabled={deletingImageId === image.id}
                      >
                        {deletingImageId === image.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ImagePlus className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">
              No preview images yet.
              {isOwner && " Click 'Add Images' to upload."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
