import { MainLayout } from "@/components/layouts/main-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMe, getUserProfile, getUserShareSettings } from "@/lib/sdk/server";
import { ProfileVisibilitySettings } from "@/components/blocks/users/profile-visibility-settings";
import {
  Activity,
  Award,
  Calendar,
  Globe,
  MapPin,
  Settings,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";

/**
 * TODO: Share Profile Settings (show my products, show products that contain my assets, etc...)
 */

export default async function ProfilePage() {
  const user = await getMe();

  // Fetch user profile data from users table
  const { data: profile } = await getUserProfile(user.id);

  // Fetch user share settings
  const { data: shareSettings } = await getUserShareSettings(user.id);

  const userName =
    profile?.full_name || user.user_metadata?.full_name || user.email || "User";
  const userInitials = userName
    .split(" ")
    .map((name: string) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <MainLayout user={user} breadcrumbs={[{ label: "Profile" }]}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-600 mt-2">
              Manage your creator profile and public information
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage
                      src={
                        profile?.avatar_url || user.user_metadata?.avatar_url
                      }
                      alt={userName}
                    />
                    <AvatarFallback className="text-xl">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-2xl">{userName}</CardTitle>
                      {profile?.is_verified && (
                        <Badge variant="default" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-600">
                      {profile?.username ? `@${profile.username}` : user.email}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        Joined{" "}
                        {new Date(
                          profile?.created_at || user.created_at || "",
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {profile?.bio ? (
                  <p className="text-slate-700">{profile.bio}</p>
                ) : (
                  <p className="text-slate-500 italic">
                    No bio added yet. Tell the community about yourself and your
                    game design experience!
                  </p>
                )}

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
                  {profile?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile?.website_url && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Visibility Settings */}
            <ProfileVisibilitySettings
              userId={user.id}
              initialSettings={shareSettings}
            />

            {/* Recent Activity - Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest actions on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-4">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-slate-900">
                      No Recent Activity
                    </h3>
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
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/products">
                    <Activity className="w-4 h-4 mr-2" />
                    My Products
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
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
                  <p className="text-xs text-slate-400">
                    Create your first project to start earning badges!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
