"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Plus, Tag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface AssetTag {
  id: number;
  namespace: string;
  value: string;
}

interface AssetTagEditorProps {
  assetId: string;
  tags: AssetTag[];
  isOwner: boolean;
}

const SUGGESTED_TAGS = ["3D Model", "Document", "Illustration"];

export function AssetTagEditor({
  assetId,
  tags,
  isOwner,
}: AssetTagEditorProps) {
  const router = useRouter();
  const [customTag, setCustomTag] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);

  const handleAddTag = async (tagValue: string) => {
    const normalizedTag = tagValue.toLowerCase().trim();

    if (!normalizedTag) {
      toast.error("Tag cannot be empty");
      return;
    }

    if (normalizedTag.length > 50) {
      toast.error("Tag must be less than 50 characters");
      return;
    }

    // Check if tag already exists
    if (tags.some((t) => t.value === normalizedTag)) {
      toast.error("Tag already exists");
      return;
    }

    if (tags.length >= 10) {
      toast.error("Maximum 10 tags allowed");
      return;
    }

    setIsAdding(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.from("asset_tags").insert({
        asset_id: assetId,
        namespace: "general",
        value: normalizedTag,
      });

      if (error) throw error;

      toast.success("Tag added successfully");
      setCustomTag("");
      router.refresh();
    } catch (error) {
      console.error("Add tag error:", error);
      toast.error("Failed to add tag");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    setDeletingTagId(tagId);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("asset_tags")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", tagId);

      if (error) throw error;

      toast.success("Tag removed successfully");
      router.refresh();
    } catch (error) {
      console.error("Delete tag error:", error);
      toast.error("Failed to remove tag");
    } finally {
      setDeletingTagId(null);
    }
  };

  const availableSuggestedTags = SUGGESTED_TAGS.filter(
    (suggestedTag) => !tags.some((t) => t.value === suggestedTag),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Tags
        </CardTitle>
        <CardDescription>
          Add tags to make your asset discoverable ({tags.length}/10)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge
                key={`${tag.id}-${tag.value}-${index}`}
                variant="secondary"
                className="gap-2"
              >
                {tag.value}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(tag.id)}
                    disabled={deletingTagId === tag.id}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}

        {isOwner && tags.length < 10 && (
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
                onClick={() => handleAddTag(customTag)}
                disabled={isAdding || !customTag.trim()}
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
                  {availableSuggestedTags.slice(0, 10).map((suggestedTag) => (
                    <Button
                      key={suggestedTag}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTag(suggestedTag)}
                      disabled={isAdding}
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

        {tags.length === 0 && !isOwner && (
          <p className="text-sm text-muted-foreground">No tags added yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
