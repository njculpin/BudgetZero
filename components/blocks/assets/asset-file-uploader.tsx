"use client";

import {
  Download,
  FileUp,
  Loader2,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
import { createClient } from "@/lib/supabase/client";

interface AssetFile {
  id: number;
  file_url: string;
  caption: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  storage_path: string;
}

interface AssetFileUploaderProps {
  assetId: string;
  userId: string;
  files: AssetFile[];
  isOwner: boolean;
}

export function AssetFileUploader({
  assetId,
  userId,
  files,
  isOwner,
}: AssetFileUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const file = selectedFiles[0]; // Only handle single file for now

    // Validate file size (1GB max)
    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
      toast.error("File size must be less than 1GB");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      // Upload file to storage
      const filePath = `${userId}/${assetId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("assets").getPublicUrl(filePath);

      // Create database record
      const { error: dbError } = await supabase.from("asset_files").insert({
        asset_id: assetId,
        file_url: publicUrl,
        storage_path: filePath,
        file_size_bytes: file.size,
        mime_type: file.type,
        caption: file.name,
      });

      if (dbError) throw dbError;

      toast.success("File uploaded successfully");
      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteFile = async (file: AssetFile) => {
    if (
      !confirm(
        `Are you sure you want to delete "${file.caption || "this file"}"?`,
      )
    ) {
      return;
    }

    setDeletingFileId(file.id);

    try {
      const supabase = createClient();

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("assets")
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      // Soft delete from database
      const { error: dbError } = await supabase
        .from("asset_files")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", file.id);

      if (dbError) throw dbError;

      toast.success("File deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file");
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Files</CardTitle>
            <CardDescription>
              {files.length > 0
                ? `${files.length} file(s) available for download`
                : "Upload the main asset file"}
            </CardDescription>
          </div>
          {isOwner && (
            <Button onClick={handleUploadClick} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="*/*"
          />
        </div>
      </CardHeader>
      <CardContent>
        {files.length > 0 ? (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {file.caption || "Untitled File"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {file.mime_type && (
                      <Badge variant="outline" className="text-xs">
                        {file.mime_type}
                      </Badge>
                    )}
                    {file.file_size_bytes && (
                      <span>
                        {(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  {isOwner && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteFile(file)}
                      disabled={deletingFileId === file.id}
                    >
                      {deletingFileId === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <UploadIcon className="mx-auto h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              No files uploaded yet.
              {isOwner && " Click 'Upload File' to get started."}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports all file types, up to 1GB
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
