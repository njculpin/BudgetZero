"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useState } from "react";

const SUGGESTED_TAGS = ["Game", "Expansion", "Illustration", "3D Models"];

interface ProjectTagsManagerProps {
  projectId: string;
  initialTags: string[];
  isOwner: boolean;
}

export function ProjectTagsManager({
  projectId,
  initialTags,
  isOwner,
}: ProjectTagsManagerProps) {
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Normalize tag: trim whitespace, capitalize first letter
  function normalizeTag(tag: string): string {
    const trimmed = tag.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }

  // Check if tag already exists (case-insensitive)
  function tagExists(tag: string): boolean {
    const normalized = normalizeTag(tag);
    return tags.some((t) => normalizeTag(t) === normalized);
  }

  async function updateTags(newTags: string[]) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tags");
      }

      setTags(newTags);
    } catch (error) {
      console.error("Error updating tags:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddTag() {
    if (!inputValue.trim()) return;

    const normalized = normalizeTag(inputValue);

    if (tagExists(normalized)) {
      setInputValue("");
      return;
    }

    const newTags = [...tags, normalized];
    updateTags(newTags);
    setInputValue("");
  }

  function handleRemoveTag(tagToRemove: string) {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    updateTags(newTags);
  }

  function handleToggleSuggestedTag(suggestedTag: string) {
    if (tagExists(suggestedTag)) {
      handleRemoveTag(
        tags.find((t) => normalizeTag(t) === normalizeTag(suggestedTag)) || ""
      );
    } else {
      const newTags = [...tags, suggestedTag];
      updateTags(newTags);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-sm flex items-center gap-1"
            >
              {tag}
              {isOwner && (
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No tags yet</p>
        )}
      </div>

      {isOwner && (
        <>
          {/* Add Tag Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <Button
              onClick={handleAddTag}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
            >
              Add
            </Button>
          </div>

          {/* Suggested Tags */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Suggested tags:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((suggestedTag) => {
                const isActive = tagExists(suggestedTag);
                return (
                  <Button
                    key={suggestedTag}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleSuggestedTag(suggestedTag)}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    {isActive && <X className="mr-1 h-3 w-3" />}
                    {suggestedTag}
                  </Button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
