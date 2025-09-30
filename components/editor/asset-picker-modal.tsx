"use client";

import { useState, useEffect } from "react";
import { Box, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface Asset {
  id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  creator_id: string;
  license_type: string;
  creator: {
    full_name?: string;
    username?: string;
  };
}

interface AssetPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
  projectId: string;
}

export function AssetPickerModal({
  open,
  onClose,
  onSelect,
  projectId,
}: AssetPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { value: "all", label: "All Models" },
    { value: "miniature", label: "Miniatures" },
    { value: "terrain", label: "Terrain" },
    { value: "vehicle", label: "Vehicles" },
    { value: "scenery", label: "Scenery" },
    { value: "token", label: "Tokens" },
  ];

  useEffect(() => {
    if (open) {
      loadAssets();
    }
  }, [open, searchQuery, selectedCategory]);

  async function loadAssets() {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("assets")
      .select(
        `
        id,
        name,
        description,
        thumbnail_url,
        creator_id,
        license_type,
        creator:profiles!assets_creator_id_fkey (
          full_name,
          username
        )
      `
      )
      .eq("is_public", true)
      .eq("asset_type", "model")
      .order("created_at", { ascending: false })
      .limit(20);

    if (searchQuery) {
      query = query.ilike("name", `%${searchQuery}%`);
    }

    if (selectedCategory !== "all") {
      query = query.eq("model_category", selectedCategory);
    }

    const { data, error } = await query;

    if (!error && data) {
      setAssets(data as Asset[]);
    }

    setLoading(false);
  }

  function handleSelect(asset: Asset) {
    onSelect(asset);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Model to Project</DialogTitle>
        </DialogHeader>

        {/* Search and filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={
                  selectedCategory === category.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className="flex-shrink-0"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Assets grid */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading models...</div>
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Box className="h-12 w-12 mb-3 text-gray-300" />
              <p>No models found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleSelect(asset)}
                  className="group text-left border-2 border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition-all"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-3 flex items-center justify-center">
                    {asset.thumbnail_url ? (
                      <img
                        src={asset.thumbnail_url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Box className="h-8 w-8 text-gray-400" />
                    )}
                  </div>

                  {/* Details */}
                  <h4 className="font-medium text-sm truncate group-hover:text-blue-600">
                    {asset.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    by {asset.creator.full_name || asset.creator.username || "Unknown"}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {asset.license_type}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t">
          <p className="text-sm text-gray-500">
            {assets.length} model{assets.length !== 1 ? "s" : ""} available
          </p>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}