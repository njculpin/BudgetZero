"use client";

import Image from "next/image";
import { useState } from "react";
import { Card } from "@/components/ui/card";

interface ImageGalleryProps {
  images: {
    id: string;
    asset_id: string;
    file_url: string;
    created_at: string;
    updated_at: string;
    file_format: string;
    display_order: number;
    file_size_bytes: number;
  }[];
  productName: string;
}

export function AssetImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <Card className="overflow-hidden">
        <div className="relative aspect-square bg-muted">
          <Image
            src={images[selectedImage].file_url || "/placeholder.svg"}
            alt={`${productName} - View ${selectedImage + 1}`}
            fill
            className="object-cover"
            priority
          />
        </div>
      </Card>

      {/* Thumbnail Selector */}
      <div className="grid grid-cols-4 gap-3">
        {images.map((image, index) => (
          <button
            type="button"
            key={image.id}
            onClick={() => setSelectedImage(index)}
            className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all hover:border-primary ${
              selectedImage === index
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-border"
            }`}
          >
            <Image
              src={image.file_url || "/placeholder.svg"}
              alt={`${productName} thumbnail ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
