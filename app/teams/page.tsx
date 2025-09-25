import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layouts/main-layout';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Users,
  Plus,
  UserPlus,
  Mail,
  Crown,
  Settings,
  Activity,
  Calendar,
  MessageSquare
} from 'lucide-react';

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // TODO: Implement team fetching when collaboration features are built
  const teams = []; // Placeholder for future implementation

  return (
    <MainLayout user={user} breadcrumbs={[{ label: 'Teams' }]}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Teams</h1>
            <p className="text-slate-600 mt-2">Manage your collaborative teams and invitations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Join Team
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">My Teams</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Projects</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Invites</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Team Members</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <UserPlus className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {teams.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-lg mx-auto space-y-6">
              <Users className="w-20 h-20 text-slate-300 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-slate-900">Start Collaborating</h3>
                <p className="text-slate-600">
                  Teams allow you to collaborate with other creators on game projects. Create or join a team to get started.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <Card className="p-4 border-2 border-dashed">
                    <div className="space-y-2">
                      <Crown className="w-8 h-8 text-blue-500" />
                      <h4 className="font-semibold">Create a Team</h4>
                      <p className="text-sm text-slate-600">
                        Lead your own team and invite collaborators to work on your game projects.
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4 border-2 border-dashed">
                    <div className="space-y-2">
                      <UserPlus className="w-8 h-8 text-green-500" />
                      <h4 className="font-semibold">Join a Team</h4>
                      <p className="text-sm text-slate-600">
                        Accept invitations or request to join existing teams with your skills.
                      </p>
                    </div>
                  </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Team
                  </Button>
                  <Button size="lg" variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Existing Team
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h4 className="font-semibold mb-3">What you can do with teams:</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span>Collaborate on projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>Team communication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-500" />
                    <span>Manage permissions</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Team cards would go here when implemented */}
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common team management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                <Users className="w-6 h-6" />
                <span>Find Collaborators</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                <Mail className="w-6 h-6" />
                <span>Send Invitations</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                <Calendar className="w-6 h-6" />
                <span>Schedule Meeting</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                <Activity className="w-6 h-6" />
                <span>View Activity</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}