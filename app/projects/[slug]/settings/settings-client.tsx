"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Archive, Crown, Download, AlertTriangle } from "lucide-react";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";
import { archiveProject } from "@/lib/actions/project-actions";

interface ProjectSettingsClientProps {
  project: {
    id: string;
    title: string;
    slug: string;
    status: string;
  };
}

export function ProjectSettingsClient({ project }: ProjectSettingsClientProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await archiveProject(project.id, project.slug);
    } catch (error) {
      console.error("Failed to archive project:", error);
      setIsArchiving(false);
    }
  };

  return (
    <>
      {/* Safe Actions */}
      <div className="space-y-4">
        {/* Export Data */}
        <div className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50">
          <div className="space-y-1">
            <div className="font-medium text-green-700">Export Project Data</div>
            <p className="text-sm text-slate-600">
              Download all project content and metadata
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Transfer Ownership */}
        <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="space-y-1">
            <div className="font-medium text-blue-700">Transfer Ownership</div>
            <p className="text-sm text-slate-600">
              Transfer this project to another user
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
            <Crown className="w-4 h-4 mr-2" />
            Transfer
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-700">Danger Zone</h3>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          These actions are irreversible. Please proceed with caution.
        </p>

        <div className="space-y-4">
          {/* Archive Project */}
          <div className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
            <div className="space-y-1">
              <div className="font-medium text-orange-700">Archive Project</div>
              <p className="text-sm text-slate-600">
                Hide this project from your active projects list
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
              onClick={handleArchive}
              disabled={isArchiving || project.status === "archived"}
            >
              <Archive className="w-4 h-4 mr-2" />
              {project.status === "archived" ? "Archived" : isArchiving ? "Archiving..." : "Archive"}
            </Button>
          </div>

          {/* Delete Project */}
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="space-y-1">
              <div className="font-medium text-red-700">Delete Project</div>
              <p className="text-sm text-slate-600">
                Permanently delete this project and all associated content
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Project
            </Button>
          </div>
        </div>
      </div>

      <DeleteProjectDialog
        projectId={project.id}
        projectSlug={project.slug}
        projectTitle={project.title}
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  );
}