"use client";

import { CheckCircle2, Circle, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CompletionItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}

interface AssetCompletionChecklistProps {
  asset: {
    description: string | null;
    is_public: boolean;
    asset_images?: Array<{ id: number }>;
    asset_tags?: Array<{ id: number }>;
    asset_files?: Array<{ id: number }>;
  };
  onDismiss: () => void;
}

export function AssetCompletionChecklist({
  asset,
  onDismiss,
}: AssetCompletionChecklistProps) {
  const items: CompletionItem[] = [
    {
      id: "files",
      label: "Upload asset file",
      description: "Upload the main asset file for buyers to download",
      completed: (asset.asset_files?.length ?? 0) > 0,
    },
    {
      id: "images",
      label: "Add preview images",
      description: "Assets with images get 3x more engagement",
      completed: (asset.asset_images?.length ?? 0) > 0,
    },
    {
      id: "description",
      label: "Add description",
      description: "Help buyers understand your asset",
      completed: !!asset.description && asset.description.length > 0,
    },
    {
      id: "tags",
      label: "Add tags",
      description: "Make your asset searchable",
      completed: (asset.asset_tags?.length ?? 0) > 0,
    },
    {
      id: "visibility",
      label: "Set visibility to public",
      description: "Let buyers discover your asset",
      completed: asset.is_public,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const progress = (completedCount / items.length) * 100;

  // Auto-dismiss when complete
  if (completedCount === items.length) {
    return null;
  }

  return (
    <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950 mb-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Complete Your Asset Listing
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              {completedCount} of {items.length} steps complete
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg"
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              {item.completed && (
                <Badge variant="secondary" className="text-xs">
                  Done
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
