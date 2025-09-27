import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layouts/main-layout';
import { CreateProjectForm } from '@/components/projects/create-project-form';

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const breadcrumbs = [
    { label: 'My Projects', href: '/projects' },
    { label: 'Create Project' }
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">Start building your tabletop game</p>
        </div>

        <div className="max-w-2xl">
          <CreateProjectForm />
        </div>
      </div>
    </MainLayout>
  );
}