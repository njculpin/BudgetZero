import { createClient } from '@/lib/supabase/server';
import { GameProjectService } from '@/lib/services/game-projects';
import { EditorPageClient } from '@/components/editor/editor-page-client';
import { MainLayout } from '@/components/layouts/main-layout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface EditorPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const gameProjectService = new GameProjectService(supabase);
  const projectResult = await gameProjectService.getProjectBySlug(slug);

  if (projectResult.error || !projectResult.data) {
    notFound();
  }

  const project = projectResult.data;

  // Check if user has access to edit this project
  const accessResult = await gameProjectService.checkProjectAccess(project.id, user.id);

  if (accessResult.error || !accessResult.data?.canRead) {
    redirect('/projects');
  }

  const canEdit = accessResult.data.canEdit;

  // Get the project's rulebook
  const { data: rulebook, error: rulebookError } = await supabase
    .from('rulebooks')
    .select('*')
    .eq('project_id', project.id)
    .single();

  if (rulebookError && rulebookError.code !== 'PGRST116') {
    console.error('Error fetching rulebook:', rulebookError);
  }

  const breadcrumbs = [
    { label: 'My Projects', href: '/projects' },
    { label: project.title, href: `/projects/${project.slug}` },
    { label: 'Editor' }
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/projects/${project.slug}`}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Project
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{project.title}</h1>
              <p className="text-sm text-slate-600">
                {canEdit ? 'Editing rulebook' : 'Viewing rulebook'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${project.slug}`}>
                Project Details
              </Link>
            </Button>
          </div>
        </div>

        <EditorPageClient
          project={project}
          rulebook={rulebook}
          canEdit={canEdit}
        />
      </div>
    </MainLayout>
  );
}