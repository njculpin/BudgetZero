"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MODEL_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "miniature", label: "Miniatures" },
  { value: "terrain", label: "Terrain" },
  { value: "token", label: "Tokens" },
  { value: "vehicle", label: "Vehicles" },
  { value: "building", label: "Buildings" },
  { value: "prop", label: "Props" },
  { value: "creature", label: "Creatures" },
  { value: "character", label: "Characters" },
  { value: "scenery", label: "Scenery" },
  { value: "dice", label: "Dice" },
  { value: "marker", label: "Markers" },
  { value: "other", label: "Other" },
];

export function ModelsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [category, setCategory] = useState(
    searchParams.get("category") || "all"
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search: searchQuery });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  function updateFilters(updates: { search?: string; category?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    // Update or remove search param
    if (updates.search !== undefined) {
      if (updates.search) {
        params.set("search", updates.search);
      } else {
        params.delete("search");
      }
    }

    // Update or remove category param
    if (updates.category !== undefined) {
      if (updates.category && updates.category !== "all") {
        params.set("category", updates.category);
      } else {
        params.delete("category");
      }
    }

    // Reset to page 1 when filters change
    params.delete("page");

    router.push(`/models?${params.toString()}`);
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    updateFilters({ category: value });
  }

  function clearSearch() {
    setSearchQuery("");
    updateFilters({ search: "" });
  }

  function clearAllFilters() {
    setSearchQuery("");
    setCategory("");
    router.push("/models");
  }

  const hasActiveFilters = searchQuery || category;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
            aria-label="Search models"
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

        {/* Category Select */}
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {MODEL_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {searchQuery && (
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              <span>Search: "{searchQuery}"</span>
              <button
                onClick={clearSearch}
                className="hover:text-blue-900"
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {category && (
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              <span>
                Category:{" "}
                {MODEL_CATEGORIES.find((c) => c.value === category)?.label}
              </span>
              <button
                onClick={() => handleCategoryChange("")}
                className="hover:text-blue-900"
                aria-label="Remove category filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-sm"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}