"use client";

import {
  Calendar,
  Clock,
  Eye,
  Filter,
  Search,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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

interface GameProjectWithCreator {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  seeking_collaborators: boolean;
  tags: string[];
  genre: string | null;
  player_count_min: number | null;
  player_count_max: number | null;
  play_time_minutes: number | null;
  license_type: string | null;
  creator: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

interface ProjectDiscoveryProps {
  initialProjects: GameProjectWithCreator[];
  availableTags: string[];
}

type SortOption = "recent" | "updated" | "alphabetical";

export function ProjectDiscovery({
  initialProjects,
  availableTags,
}: ProjectDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [showFilters, setShowFilters] = useState(false);
  const [onlySeekingCollaborators, setOnlySeekingCollaborators] =
    useState(false);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = initialProjects;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.creator.full_name?.toLowerCase().includes(query) ||
          project.creator.email.toLowerCase().includes(query) ||
          project.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Apply tag filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter((project) =>
        selectedTags.every((tag) => project.tags.includes(tag)),
      );
    }

    // Apply seeking collaborators filter
    if (onlySeekingCollaborators) {
      filtered = filtered.filter((project) => project.seeking_collaborators);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "updated":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        case "alphabetical":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [
    initialProjects,
    searchQuery,
    selectedTags,
    sortBy,
    onlySeekingCollaborators,
  ]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSortBy("updated");
    setOnlySeekingCollaborators(false);
  };

  const hasActiveFilters =
    searchQuery.trim() || selectedTags.length > 0 || onlySeekingCollaborators;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Browse Projects</h1>
          <p className="text-slate-600 mt-2">
            Discover amazing tabletop games and find collaborators
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Search Bar and Filter Toggle */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by title, description, creator, or tags..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-600">Active filters:</span>
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-slate-300"
                  onClick={() => handleToggleTag(tag)}
                >
                  {tag}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-slate-300"
                  onClick={() => setSearchQuery("")}
                >
                  Search: "{searchQuery}"
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Expanded Filters */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t">
              {/* Looking for Collaborators Filter */}
              <div>
                <Button
                  variant={onlySeekingCollaborators ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setOnlySeekingCollaborators(!onlySeekingCollaborators)
                  }
                  className="w-full sm:w-auto"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Looking for Collaborators
                  {onlySeekingCollaborators && <X className="w-3 h-3 ml-2" />}
                </Button>
                <p className="text-xs text-slate-600 mt-1">
                  Show only projects open to collaboration
                </p>
              </div>

              {/* Sort Options */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Sort by
                </label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={sortBy === "updated" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("updated")}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Recently Updated
                  </Button>
                  <Button
                    variant={sortBy === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("recent")}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Newest
                  </Button>
                  <Button
                    variant={sortBy === "alphabetical" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("alphabetical")}
                  >
                    A-Z
                  </Button>
                </div>
              </div>

              {/* Tag Filters */}
              {availableTags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Filter by tags ({selectedTags.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={
                          selectedTags.includes(tag) ? "default" : "outline"
                        }
                        className="cursor-pointer hover:bg-blue-100"
                        onClick={() => handleToggleTag(tag)}
                      >
                        {tag}
                        {selectedTags.includes(tag) && (
                          <X className="w-3 h-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing {filteredProjects.length} of {initialProjects.length} projects
        </p>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {hasActiveFilters
                ? "No projects match your filters"
                : "No public projects yet"}
            </h3>
            <p className="text-slate-600">
              {hasActiveFilters
                ? "Try adjusting your search or filters to find more projects."
                : "Be the first to share your tabletop game with the community!"}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearFilters}>Clear Filters</Button>
            ) : (
              <Button asChild>
                <Link href="/projects/new">Create Project</Link>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.slug}`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="line-clamp-2 text-lg">
                          {project.title}
                        </CardTitle>
                        {project.seeking_collaborators && (
                          <Badge
                            variant="outline"
                            className="shrink-0 bg-green-50 text-green-700 border-green-300"
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Open
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2 mt-1">
                        {project.description || "No description"}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        project.status === "published" ? "default" : "secondary"
                      }
                      className="shrink-0"
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Creator Info */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        by {project.creator.full_name || project.creator.email}
                      </span>
                    </div>

                    {/* Game Info */}
                    {(project.genre ||
                      project.player_count_min ||
                      project.play_time_minutes) && (
                      <div className="flex flex-wrap gap-1 text-xs text-slate-600">
                        {project.genre && (
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            {project.genre}
                          </span>
                        )}
                        {(project.player_count_min ||
                          project.player_count_max) && (
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            {project.player_count_min ===
                            project.player_count_max
                              ? `${project.player_count_min}p`
                              : `${project.player_count_min || "?"}–${project.player_count_max || "?"}p`}
                          </span>
                        )}
                        {project.play_time_minutes && (
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            {project.play_time_minutes}min
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{project.license_type}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
