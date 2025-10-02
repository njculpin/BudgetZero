"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteProject } from "@/lib/actions/project-actions";

interface DeleteProjectDialogProps {
  projectId: string;
  projectSlug: string;
  projectTitle: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({
  projectId,
  projectSlug,
  projectTitle,
  isOpen,
  onOpenChange,
}: DeleteProjectDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmText !== projectTitle) {
      setError("Project title doesn't match");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deleteProject(projectId, projectSlug);
      // The server action will redirect, so we don't need to handle success here
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isDeleting) {
      setConfirmText("");
      setError("");
      onOpenChange(open);
    }
  };

  const canDelete = confirmText === projectTitle && !isDeleting;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Delete Project
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            This action cannot be undone. This will permanently delete{" "}
            <strong>{projectTitle}</strong> and all associated data including:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ul className="text-sm text-slate-600 space-y-1 ml-4">
            <li>• All rulebook content and versions</li>
            <li>• Collaborator access and history</li>
            <li>• Comments and feedback</li>
            <li>• Project assets and files</li>
          </ul>

          <div className="space-y-2">
            <Label htmlFor="confirm-title">
              Type <strong>{projectTitle}</strong> to confirm:
            </Label>
            <Input
              id="confirm-title"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError("");
              }}
              placeholder="Enter project title"
              disabled={isDeleting}
              className={error ? "border-red-300 focus:border-red-300" : ""}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
