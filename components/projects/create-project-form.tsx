'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { GameProjectService } from '@/lib/services/game-projects';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

const projectFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  category: z.enum(['board_game', 'card_game', 'rpg', 'miniatures', 'party_game', 'strategy', 'other']),
  visibility: z.enum(['public', 'private', 'unlisted']),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const categories = [
  { value: 'board_game', label: 'Board Game' },
  { value: 'card_game', label: 'Card Game' },
  { value: 'rpg', label: 'RPG / Tabletop' },
  { value: 'miniatures', label: 'Miniatures' },
  { value: 'party_game', label: 'Party Game' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'other', label: 'Other' },
];

const visibilityOptions = [
  { value: 'private', label: 'Private', description: 'Only you and collaborators can see this project' },
  { value: 'unlisted', label: 'Unlisted', description: 'Anyone with the link can view this project' },
  { value: 'public', label: 'Public', description: 'Anyone can discover and view this project' },
];

export function CreateProjectForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'board_game',
      visibility: 'private',
    },
  });

  const onSubmit = async (values: ProjectFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to create a project');
        return;
      }

      const gameProjectService = new GameProjectService(supabase);
      const result = await gameProjectService.createProject(user.id, values);

      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Failed to create project');
        return;
      }

      // Redirect to the new project
      router.push(`/projects/${result.data?.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
              {...form.register('title')}
              className={form.formState.errors.title ? 'border-destructive' : ''}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your game concept, mechanics, and what makes it unique..."
              rows={4}
              {...form.register('description')}
              className={form.formState.errors.description ? 'border-destructive' : ''}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={form.watch('category')}
              onValueChange={(value: any) => form.setValue('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility *</Label>
            <Select
              value={form.watch('visibility')}
              onValueChange={(value: any) => form.setValue('visibility', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.visibility && (
              <p className="text-sm text-destructive">{form.formState.errors.visibility.message}</p>
            )}
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