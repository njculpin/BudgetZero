"use client";

import { useState } from "react";
import { GitFork, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProjectSearchModal } from "./project-search-modal";
import { ForkService } from "@/lib/services/fork-service";
import type { GameProject, ForkType } from "@/lib/types/database";

interface CreateForkRequestProps {
  projectId: string;
  projectTitle: string;
  onSuccess?: () => void;
}

export function CreateForkRequest({
  projectId,
  projectTitle,
  onSuccess,
}: CreateForkRequestProps) {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<GameProject | null>(null);
  const [forkType, setForkType] = useState<ForkType>("merge");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleProjectSelect(project: GameProject) {
    setSelectedProject(project);
    setShowConfirmDialog(true);
  }

  async function handleSubmit() {
    if (!selectedProject) return;

    setSubmitting(true);
    setError(null);

    const result = await ForkService.createForkRequest({
      parent_project_id: projectId,
      child_project_id: selectedProject.id,
      fork_type: forkType,
      message: message || undefined,
    });

    if (result.success) {
      setShowConfirmDialog(false);
      setSelectedProject(null);
      setMessage("");
      onSuccess?.();
    } else {
      setError(result.error || "Failed to create fork request");
    }

    setSubmitting(false);
  }

  return (
    <>
      <Button
        onClick={() => setShowSearchModal(true)}
        className="gap-2"
      >
        <GitFork className="h-4 w-4" />
        Request to Merge
      </Button>

      {/* Project Search Modal */}
      <ProjectSearchModal
        open={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelect={handleProjectSelect}
        excludeProjectIds={[projectId]}
        title="Select Project to Merge With"
        description="Choose another project to create a collaborative merged project"
      />

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Merge Collaboration</DialogTitle>
            <DialogDescription>
              Send a merge request to collaborate on a new project together
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Project Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Your Project:</span>
                <span>{projectTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Their Project:</span>
                <span>{selectedProject?.title}</span>
              </div>
            </div>

            {/* Fork Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Collaboration Type</label>
              <Select
                value={forkType}
                onValueChange={(value) => setForkType(value as ForkType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">
                    Merge - Create a new collaborative project together
                  </SelectItem>
                  <SelectItem value="reference">
                    Reference - Use their content with attribution
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Message (Optional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain why you'd like to collaborate and what you envision for the merged project..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">
                {message.length}/500 characters
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>The project owner will be notified of your request</li>
                <li>They can accept or decline your collaboration proposal</li>
                <li>If accepted, you'll work together to create the merged project</li>
                <li>Revenue will be split equally between co-owners by default</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}