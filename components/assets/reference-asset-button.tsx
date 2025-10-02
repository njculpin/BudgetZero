"use client";

import { Link2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RevenueSplitPreview } from "@/components/shared/revenue-split-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "@/lib/types/project";

interface ReferenceAssetButtonProps {
  assetId: string;
  assetTitle: string;
  assetCreatorName: string;
  royaltyPercentage: number;
  userProjects: Project[];
  disabled?: boolean;
}

export function ReferenceAssetButton({
  assetId,
  assetTitle,
  assetCreatorName,
  royaltyPercentage,
  userProjects,
  disabled = false,
}: ReferenceAssetButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!selectedProjectId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/project-asset-references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: selectedProjectId,
          asset_id: assetId,
          royalty_percentage: royaltyPercentage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create reference request");
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error creating reference:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProject = userProjects.find((p) => p.id === selectedProjectId);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled || userProjects.length === 0}
        variant="default"
        className="w-full"
      >
        <Link2 className="h-4 w-4 mr-2" />
        Reference in My Project
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reference Asset in Your Project</DialogTitle>
            <DialogDescription>
              Add "{assetTitle}" to one of your projects. The creator will be
              notified and must approve this reference.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project">Select Project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {userProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userProjects.length === 0 && (
                <p className="text-sm text-gray-500">
                  You need to create a project first.
                </p>
              )}
            </div>

            {/* Revenue Split Preview */}
            {selectedProject && (
              <>
                <RevenueSplitPreview
                  royaltyContributors={[
                    { name: assetCreatorName, percentage: royaltyPercentage },
                  ]}
                  variant="card"
                />
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> {assetCreatorName} must approve this
                    reference before it becomes active. You'll be notified once
                    they respond.
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedProjectId || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                "Send Reference Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
