"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, FileImage, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

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

interface AssetSelectorProps {
  assets: Asset[];
  selectedAssetIds: string[];
  onSelectionChange: (assetIds: string[]) => void;
}

export function AssetSelector({
  assets,
  selectedAssetIds,
  onSelectionChange,
}: AssetSelectorProps) {
  const [search, setSearch] = useState("");

  const filteredAssets = assets.filter((asset) =>
    search
      ? asset.title.toLowerCase().includes(search.toLowerCase()) ||
        asset.description?.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const toggleAsset = (assetId: string) => {
    if (selectedAssetIds.includes(assetId)) {
      onSelectionChange(selectedAssetIds.filter((id) => id !== assetId));
    } else {
      onSelectionChange([...selectedAssetIds, assetId]);
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Search and Selection Summary */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedAssetIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedAssetIds.length} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-8"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Asset Grid */}
      {filteredAssets.length > 0 ? (
        <div className="h-[400px] overflow-y-auto rounded-lg p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAssets.map((asset) => {
              const isSelected = selectedAssetIds.includes(asset.id);
              const primaryImage =
                asset.asset_images?.find((img) => img.position === 0) ||
                asset.asset_images?.[0];
              const hasRoyalties =
                asset.asset_royalties && asset.asset_royalties.length > 0;

              return (
                <Card
                  key={asset.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => toggleAsset(asset.id)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      {/* Image Preview */}
                      <div className="relative aspect-square rounded-md bg-muted overflow-hidden">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.image_url}
                            alt={asset.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FileImage className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {/* Selection Indicator */}
                        <div className="absolute top-2 right-2">
                          <div
                            className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-background/80 backdrop-blur"
                            }`}
                          >
                            {isSelected && <Check className="h-4 w-4" />}
                          </div>
                        </div>
                        {/* Royalty Badge */}
                        {hasRoyalties && (
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="text-xs">
                              Has Royalties
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Asset Info */}
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {asset.title}
                        </h4>
                        {asset.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {asset.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">
            {search ? "No assets found" : "No assets yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search
              ? "Try adjusting your search terms"
              : "Upload some assets first to include them in products"}
          </p>
          {!search && (
            <Button variant="outline" asChild>
              <a href="/assets/upload">Upload Asset</a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
