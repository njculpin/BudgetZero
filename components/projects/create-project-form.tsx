"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { GameProjectService } from "@/lib/services/game-projects";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, X, Tag, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const projectFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  tags: z
    .array(z.string())
    .min(1, "Add at least one tag to help others discover your project")
    .max(10, "Maximum 10 tags allowed"),
  visibility: z.enum(["public", "private", "unlisted"]),
  seekingCollaborators: z.boolean(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const suggestedTags = [
  "Board Game",
  "Card Game",
  "RPG",
  "Miniatures",
  "Strategy",
  "Party Game",
  "Co-op",
  "Competitive",
  "Family Friendly",
  "Complex",
  "Quick Play",
  "Campaign",
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Historical",
];

const visibilityOptions = [
  {
    value: "private",
    label: "Private",
    description: "Only you and collaborators can see this project",
  },
  {
    value: "unlisted",
    label: "Unlisted",
    description: "Anyone with the link can view this project",
  },
  {
    value: "public",
    label: "Public",
    description: "Anyone can discover and view this project",
  },
];

export function CreateProjectForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      visibility: "private",
      seekingCollaborators: false,
    },
  });

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag) && selectedTags.length < 10) {
      const newTags = [...selectedTags, trimmedTag];
      setSelectedTags(newTags);
      form.setValue("tags", newTags);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter((tag) => tag !== tagToRemove);
    setSelectedTags(newTags);
    form.setValue("tags", newTags);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const onSubmit = async (values: ProjectFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to create a project");
        return;
      }

      const gameProjectService = new GameProjectService(supabase);
      const result = await gameProjectService.createProject(user.id, values);

      if (result.error) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "Failed to create project",
        );
        return;
      }

      // Redirect to the new project
      router.push(`/projects/${result.data?.slug}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
        <CardDescription>
          Provide basic information about your tabletop game project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              placeholder="Enter your game title..."
              {...form.register("title")}
              className={
                form.formState.errors.title ? "border-destructive" : ""
              }
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your game concept, mechanics, and what makes it unique..."
              rows={4}
              {...form.register("description")}
              className={
                form.formState.errors.description ? "border-destructive" : ""
              }
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags * (Press Enter to add)
            </Label>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Tag Input */}
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add tags (e.g., Board Game, Fantasy, Co-op)..."
              disabled={isLoading || selectedTags.length >= 10}
              className={
                form.formState.errors.tags ? "border-destructive" : ""
              }
            />

            {/* Suggested Tags */}
            {selectedTags.length < 10 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">Suggested tags:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags
                    .filter((tag) => !selectedTags.includes(tag))
                    .slice(0, 8)
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => handleAddTag(tag)}
                      >
                        + {tag}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {form.formState.errors.tags && (
              <p className="text-sm text-destructive">
                {form.formState.errors.tags.message}
              </p>
            )}

            <p className="text-xs text-gray-500">
              {selectedTags.length}/10 tags • Tags help others discover your project
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility *</Label>
            <Select
              value={form.watch("visibility")}
              onValueChange={(value: any) => form.setValue("visibility", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.visibility && (
              <p className="text-sm text-destructive">
                {form.formState.errors.visibility.message}
              </p>
            )}
          </div>

          <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Checkbox
                id="seekingCollaborators"
                checked={form.watch("seekingCollaborators")}
                onCheckedChange={(checked) =>
                  form.setValue("seekingCollaborators", checked === true)
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor="seekingCollaborators"
                  className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  Seeking Collaborators
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Let others know you're looking for collaborators. Your project will appear
                  in the "Seeking Collaborators" filter on the browse page.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Project
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
