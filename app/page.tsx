import { createClient } from '@/lib/supabase/server';
import { QuickProjectForm } from '@/components/forms/quick-project-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md w-full text-center space-y-8 p-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-slate-900">BudgetZero</h1>
            <p className="text-lg text-slate-600">
              Collaborative tabletop game creation platform
            </p>
            <p className="text-slate-500">
              Create games, collaborate with creators, and publish your work
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/auth/sign-up">Start Creating</Link>
            </Button>
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Welcome to BudgetZero
            </h1>
            <p className="text-xl text-slate-600">
              Ready to create your next tabletop game?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <QuickProjectForm userId={user.id} />

              <div className="text-center">
                <Button asChild variant="outline">
                  <Link href="/projects">View My Projects</Link>
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Quick Start</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>1. Create a new game project</li>
                  <li>2. Start writing your rules in the editor</li>
                  <li>3. Invite collaborators to contribute</li>
                  <li>4. Publish when ready</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Features</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Collaborative rulebook editor</li>
                  <li>• Asset library integration</li>
                  <li>• Version control</li>
                  <li>• Revenue sharing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
