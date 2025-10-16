"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

interface MultiImageUploaderProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
}

export function MultiImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB default
  disabled = false,
}: MultiImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const validateAndAddFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);
      const validFiles: File[] = [];

      for (const file of fileArray) {
        // Check file type
        if (!file.type.startsWith("image/")) {
          setError(`${file.name} is not an image file`);
          continue;
        }

        // Check file size
        if (file.size > maxSizeBytes) {
          setError(
            `${file.name} is too large. Max size is ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB`,
          );
          continue;
        }

        validFiles.push(file);
      }

      // Check total count
      const newTotal = images.length + validFiles.length;
      if (newTotal > maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      if (validFiles.length > 0) {
        onImagesChange([...images, ...validFiles]);
      }
    },
    [images, maxImages, maxSizeBytes, onImagesChange],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <label
            className={`flex flex-col items-center justify-center gap-2 ${
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <ImagePlus className="h-10 w-10 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Drop images here or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WEBP up to {(maxSizeBytes / 1024 / 1024).toFixed(0)}
                MB ({images.length}/{maxImages} uploaded)
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              onChange={handleFileInput}
              disabled={disabled}
            />
          </label>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <Image
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Overlay with controls */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(index)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  {/* Move left */}
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => moveImage(index, index - 1)}
                      disabled={disabled}
                    >
                      ←
                    </Button>
                  )}

                  {/* Move right */}
                  {index < images.length - 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => moveImage(index, index + 1)}
                      disabled={disabled}
                    >
                      →
                    </Button>
                  )}
                </div>

                {/* Display order badge */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
              </div>

              {/* File name */}
              <div className="p-2 text-xs text-gray-600 truncate">
                {image.name}
              </div>
            </Card>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-500">
          Tip: Images will be displayed in this order. Use arrow buttons to
          reorder.
        </p>
      )}
    </div>
  );
}
