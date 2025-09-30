"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { GameProject } from "@/lib/types/database";

interface ProjectSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (project: GameProject) => void;
  excludeProjectIds?: string[];
  title?: string;
  description?: string;
}

export function ProjectSearchModal({
  open,
  onClose,
  onSelect,
  excludeProjectIds = [],
  title = "Search Projects",
  description = "Find a project to collaborate with",
}: ProjectSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open, searchQuery]);

  async function loadProjects() {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("game_projects")
      .select("*")
      .eq("is_public", true)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20);

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    if (excludeProjectIds.length > 0) {
      query = query.not("id", "in", `(${excludeProjectIds.join(",")})`);
    }

    const { data, error } = await query;

    if (!error && data) {
      setProjects(data);
    }

    setLoading(false);
  }

  function handleSelect(project: GameProject) {
    onSelect(project);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Projects list */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading projects...</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p>No projects found</p>
              <p className="text-sm">Try adjusting your search</p>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project)}
                  className="w-full text-left border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base group-hover:text-blue-600 truncate">
                        {project.title}
                      </h4>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {project.genre && (
                          <Badge variant="secondary" className="text-xs">
                            {project.genre}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">
                          {project.license_type}
                        </Badge>
                        {project.price_cents > 0 && (
                          <Badge variant="outline" className="text-xs">
                            ${(project.price_cents / 100).toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t">
          <p className="text-sm text-gray-500">
            {projects.length} project{projects.length !== 1 ? "s" : ""} available
          </p>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}