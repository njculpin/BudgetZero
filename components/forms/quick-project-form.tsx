'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { GameProjectService } from '@/lib/services/game-projects';

const QuickProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
});

type QuickProjectFormData = z.infer<typeof QuickProjectSchema>;

interface QuickProjectFormProps {
  userId: string;
}

export function QuickProjectForm({ userId }: QuickProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const gameProjectService = new GameProjectService(supabase);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickProjectFormData>({
    resolver: zodResolver(QuickProjectSchema),
  });

  const onSubmit = async (data: QuickProjectFormData) => {
    setIsLoading(true);

    try {
      const result = await gameProjectService.createProject(userId, {
        title: data.title,
        description: `A new tabletop game project: ${data.title}`,
        is_public: false, // Start private
        license_type: 'free',
        tags: [],
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      if (result.data) {
        // Redirect to the project's rulebook editor
        router.push(`/projects/${result.data.slug}/editor`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Start Building</CardTitle>
        <CardDescription>
          Create your tabletop game project and start writing rules immediately
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Game Title</Label>
            <Input
              id="title"
              placeholder="Enter your game title..."
              {...register('title')}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Project...' : 'Start Building'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}