import {
  Activity,
  BookOpen,
  Box,
  Eye,
  Palette,
  Plus,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-6xl mx-auto p-6">
          <Card className="max-w-md mx-auto text-center p-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-slate-900">Workshop</h1>
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
          </Card>
        </div>
      </div>
    );
  }

  return (
    <MainLayout user={user} breadcrumbs={[{ label: "Home" }]}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back!</h1>
            <p className="text-slate-600 mt-2">
              Ready to continue working on your tabletop games?
            </p>
          </div>
          <Button asChild>
            <Link href="/projects">
              <Eye className="w-4 h-4 mr-2" />
              View All Projects
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    My Projects
                  </p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Published
                  </p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Collaborations
                  </p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Views</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Eye className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity - Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest actions and updates
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
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/browse">
                    <Eye className="w-4 h-4 mr-2" />
                    Browse Community Projects
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/teams">
                    <Users className="w-4 h-4 mr-2" />
                    Find Collaborators
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
