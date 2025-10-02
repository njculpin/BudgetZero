"use client";

import { Search, Tag, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Popular/suggested tags for quick filtering - illustration specific
const POPULAR_TAGS = [
  "character-art",
  "map",
  "token",
  "card-art",
  "cover-art",
  "fantasy",
  "sci-fi",
  "portrait",
  "landscape",
  "creature",
  "icon",
  "scene",
  "tabletop",
  "rpg",
  "dnd",
  "watercolor",
  "digital",
  "sketch",
];

export function IllustrationsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tagsParam = searchParams.get("tags");
    return tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search: searchQuery });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, updateFilters]);

  // Update URL when tags change
  useEffect(() => {
    updateFilters({ tags: selectedTags });
  }, [selectedTags, updateFilters]);

  function updateFilters(updates: { search?: string; tags?: string[] }) {
    const params = new URLSearchParams(searchParams.toString());

    // Update or remove search param
    if (updates.search !== undefined) {
      if (updates.search) {
        params.set("search", updates.search);
      } else {
        params.delete("search");
      }
    }

    // Update or remove tags param
    if (updates.tags !== undefined) {
      if (updates.tags.length > 0) {
        params.set("tags", updates.tags.join(","));
      } else {
        params.delete("tags");
      }
    }

    // Reset to page 1 when filters change
    params.delete("page");

    router.push(`/illustrations?${params.toString()}`);
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function removeTag(tag: string) {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  }

  function clearSearch() {
    setSearchQuery("");
    updateFilters({ search: "" });
  }

  function clearAllFilters() {
    setSearchQuery("");
    setSelectedTags([]);
    router.push("/illustrations");
  }

  const hasActiveFilters = searchQuery || selectedTags.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Search illustrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
          aria-label="Search illustrations"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Popular Tags */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">
            Filter by tags:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Badge
                key={tag}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "hover:bg-blue-50 hover:border-blue-300"
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
                {isSelected && <X className="ml-1 h-3 w-3" />}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600 font-medium">
            Active filters:
          </span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchQuery}"
              <button
                onClick={clearSearch}
                className="hover:text-red-600"
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedTags.map((tag) => (
            <Badge key={tag} className="bg-blue-600 gap-1">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-red-200"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-sm ml-auto"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
