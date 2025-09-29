"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GitMerge, Loader2, Plus, X, Search } from "lucide-react";
import { proposeProjectMerge } from "@/lib/actions/collaboration-actions";

interface ProposeProjectMergeDialogProps {
  currentProjectId: string;
  currentProjectTitle: string;
}

export function ProposeProjectMergeDialog({
  currentProjectId,
  currentProjectTitle,
}: ProposeProjectMergeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [proposedTitle, setProposedTitle] = useState("");
  const [proposedDescription, setProposedDescription] = useState("");
  const [mergeTerms, setMergeTerms] = useState("");
  const [sourceProjectIds, setSourceProjectIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // Mock project search results for now - in production this would be an API call
  const mockSearchResults = [
    {
      id: "project-2",
      title: "Fantasy Miniatures Collection",
      creator: "Alice Johnson",
      type: "3D Models",
    },
    {
      id: "project-3",
      title: "Medieval Fantasy Artwork",
      creator: "Bob Wilson",
      type: "Illustrations",
    },
    {
      id: "project-4",
      title: "Game Photography Pack",
      creator: "Carol Davis",
      type: "Photography",
    },
  ].filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProject = (projectId: string) => {
    if (!sourceProjectIds.includes(projectId)) {
      setSourceProjectIds([...sourceProjectIds, projectId]);
    }
  };

  const handleRemoveProject = (projectId: string) => {
    setSourceProjectIds(sourceProjectIds.filter((id) => id !== projectId));
  };

  const handleProposeMerge = async () => {
    if (!proposedTitle.trim()) {
      setError("Please enter a title for the merged project");
      return;
    }

    if (sourceProjectIds.length === 0) {
      setError("Please select at least one project to merge");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await proposeProjectMerge(
        currentProjectId,
        sourceProjectIds,
        proposedTitle.trim(),
        proposedDescription.trim() || undefined,
        mergeTerms.trim() || undefined
      );

      if (result.error) {
        setError(result.error);
      } else {
        // Reset form and close dialog
        setProposedTitle("");
        setProposedDescription("");
        setMergeTerms("");
        setSourceProjectIds([]);
        setSearchQuery("");
        setIsOpen(false);
      }
    } catch (err) {
      setError("Failed to create merge proposal");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProjects = mockSearchResults.filter((project) =>
    sourceProjectIds.includes(project.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled>
          <GitMerge className="w-4 h-4 mr-2" />
          Propose Merge
          <Badge variant="secondary" className="ml-2 text-xs">
            Phase 4
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-green-600" />
            Propose Project Merge
          </DialogTitle>
          <DialogDescription>
            Combine <strong>{currentProjectTitle}</strong> with other projects to create
            a collaborative work with shared ownership and revenue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Merged Project Title</Label>
            <Input
              id="title"
              value={proposedTitle}
              onChange={(e) => setProposedTitle(e.target.value)}
              placeholder="e.g., Epic Fantasy Adventure Complete Edition"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={proposedDescription}
              onChange={(e) => setProposedDescription(e.target.value)}
              placeholder="Describe the merged project and how the components work together..."
              disabled={isLoading}
              className="min-h-20"
            />
          </div>

          <div className="space-y-2">
            <Label>Projects to Merge</Label>

            {/* Search for projects */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for projects to merge..."
                className="pl-10"
                disabled={isLoading}
              />
            </div>

            {/* Selected projects */}
            {selectedProjects.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Selected Projects:</h4>
                {selectedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-green-900">{project.title}</p>
                      <p className="text-xs text-green-700">
                        by {project.creator} • {project.type}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveProject(project.id)}
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Search results */}
            {searchQuery && (
              <div className="space-y-1 max-h-40 overflow-y-auto border rounded-lg">
                {mockSearchResults
                  .filter((project) => !sourceProjectIds.includes(project.id))
                  .map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-sm">{project.title}</p>
                        <p className="text-xs text-gray-600">
                          by {project.creator} • {project.type}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddProject(project.id)}
                        disabled={isLoading}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                {mockSearchResults.length === 0 && searchQuery && (
                  <p className="text-center text-sm text-gray-500 py-4">
                    No projects found matching "{searchQuery}"
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Merge Terms & Conditions (Optional)</Label>
            <Textarea
              id="terms"
              value={mergeTerms}
              onChange={(e) => setMergeTerms(e.target.value)}
              placeholder="Specify any special terms, licensing requirements, or revenue sharing adjustments..."
              disabled={isLoading}
              className="min-h-20"
            />
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-2">How Merging Works:</h4>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• All project owners must approve the merge</li>
              <li>• Revenue is split equally among all creators by default</li>
              <li>• A new collaborative project is created with shared ownership</li>
              <li>• Original projects remain unchanged and can still be used independently</li>
              <li>• All parties must agree before publishing to the marketplace</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProposeMerge}
            disabled={isLoading || !proposedTitle.trim() || sourceProjectIds.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Proposal...
              </>
            ) : (
              <>
                <GitMerge className="w-4 h-4 mr-2" />
                Propose Merge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}