"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

const SUGGESTED_TAGS = ["Tactical"];

export function ProductTagInput({
  tags,
  onChange,
  maxTags = 10,
}: ProductTagInputProps) {
  const [customTag, setCustomTag] = useState("");

  const handleAddTag = (tagValue: string) => {
    const normalizedTag = tagValue.toLowerCase().trim();

    if (!normalizedTag) {
      return;
    }

    if (normalizedTag.length > 50) {
      return;
    }

    // Check if tag already exists
    if (tags.some((t) => t === normalizedTag)) {
      return;
    }

    if (tags.length >= maxTags) {
      return;
    }

    onChange([...tags, normalizedTag]);
    setCustomTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const availableSuggestedTags = SUGGESTED_TAGS.filter(
    (suggestedTag) => !tags.some((t) => t === suggestedTag.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Current Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={`${tag}`} variant="secondary" className="gap-2">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {tags.length < maxTags && (
        <>
          {/* Add Custom Tag */}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom tag..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag(customTag);
                }
              }}
              maxLength={50}
            />
            <Button
              type="button"
              onClick={() => handleAddTag(customTag)}
              disabled={!customTag.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Suggested Tags */}
          {availableSuggestedTags.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Suggested tags:
              </p>
              <div className="flex flex-wrap gap-2">
                {availableSuggestedTags.slice(0, 6).map((suggestedTag) => (
                  <Button
                    key={suggestedTag}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTag(suggestedTag)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {suggestedTag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tags.length >= maxTags && (
        <p className="text-sm text-muted-foreground">
          Maximum {maxTags} tags reached
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        {tags.length}/{maxTags} tags added
      </p>
    </div>
  );
}
