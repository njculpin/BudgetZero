import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MainLayout } from '@/components/layouts/main-layout';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Edit3,
  MapPin,
  Globe,
  Calendar,
  Star,
  Award,
  Users,
  Activity,
  Settings
} from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const userName = user.user_metadata?.full_name || user.email || 'User';
  const userInitials = userName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // TODO: Fetch user profile data from profiles table when available
  const profile = {
    bio: '',
    location: '',
    website_url: '',
    skills: [],
    creator_roles: [],
    experience_level: 'beginner',
    // Placeholder data
  };

  return (
    <MainLayout user={user} breadcrumbs={[{ label: 'Profile' }]}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-600 mt-2">Manage your creator profile and public information</p>
          </div>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={userName} />
                    <AvatarFallback className="text-xl">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{userName}</CardTitle>
                    <p className="text-slate-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        Joined {new Date(user.created_at || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {profile.bio ? (
                  <p className="text-slate-700">{profile.bio}</p>
                ) : (
                  <p className="text-slate-500 italic">
                    No bio added yet. Tell the community about yourself and your game design experience!
                  </p>
                )}

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website_url && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Creator Roles & Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Creator Profile</CardTitle>
                <CardDescription>Your roles and expertise in game creation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Creator Roles</h4>
                  {profile.creator_roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.creator_roles.map((role) => (
                        <Badge key={role} variant="default" className="capitalize">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No creator roles selected</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Skills</h4>
                  {profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No skills added</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Experience Level</h4>
                  <Badge variant="secondary" className="capitalize">
                    {profile.experience_level || 'Not specified'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity - Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest actions on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-4">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-slate-900">No Recent Activity</h3>
                    <p className="text-sm text-slate-600">
                      Start creating projects to see your activity here.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Projects Created</span>
                  </div>
                  <span className="font-semibold">0</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Collaborations</span>
                  </div>
                  <span className="font-semibold">0</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Published Games</span>
                  </div>
                  <span className="font-semibold">0</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Reputation Score</span>
                  </div>
                  <span className="font-semibold">0</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/projects">
                    <Activity className="w-4 h-4 mr-2" />
                    My Projects
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/teams">
                    <Users className="w-4 h-4 mr-2" />
                    My Teams
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Achievements - Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Unlock badges by being active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 space-y-2">
                  <Award className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500">No achievements yet</p>
                  <p className="text-xs text-slate-400">Create your first project to start earning badges!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}