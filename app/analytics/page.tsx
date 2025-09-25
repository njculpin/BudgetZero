import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layouts/main-layout';
import { redirect } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  DollarSign,
  Users,
  Calendar,
  Activity,
  Star
} from 'lucide-react';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // TODO: Implement analytics data fetching when analytics features are built
  const analytics = {
    totalViews: 0,
    totalDownloads: 0,
    totalRevenue: 0,
    totalProjects: 0,
    // Placeholder data
  };

  return (
    <MainLayout user={user} breadcrumbs={[{ label: 'Analytics' }]}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-600 mt-2">Track your game performance and revenue</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>Last 30 days</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Views</p>
                  <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+0% from last month</span>
                  </div>
                </div>
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Downloads</p>
                  <p className="text-2xl font-bold">{analytics.totalDownloads.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+0% from last month</span>
                  </div>
                </div>
                <Download className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Revenue</p>
                  <p className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <span>+$0.00 from last month</span>
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Projects</p>
                  <p className="text-2xl font-bold">{analytics.totalProjects}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <span>0 published</span>
                  </div>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Placeholder */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              <CardDescription>Daily views for the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center bg-slate-50">
              <div className="text-center space-y-2">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-500">Chart will appear here</p>
                <p className="text-xs text-slate-400">Once you have project data</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Revenue by project and time period</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center bg-slate-50">
              <div className="text-center space-y-2">
                <DollarSign className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-500">Revenue chart will appear here</p>
                <p className="text-xs text-slate-400">After your first sale</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Projects - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Projects</CardTitle>
            <CardDescription>Your most popular games ranked by performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 space-y-4">
              <Star className="w-16 h-16 text-slate-300 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">No Performance Data Yet</h3>
                <p className="text-slate-600">
                  Create and publish your first game to see analytics data here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions on your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 space-y-4">
              <Activity className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900">No Recent Activity</h3>
                <p className="text-sm text-slate-600">
                  Activity will appear here as users interact with your projects.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Features */}
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>Advanced analytics features in development</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border border-dashed border-slate-200 rounded-lg">
                <Users className="w-8 h-8 text-slate-400 mb-2" />
                <h4 className="font-semibold text-slate-700">User Demographics</h4>
                <p className="text-sm text-slate-600">Age, location, and interests of your players</p>
              </div>

              <div className="p-4 border border-dashed border-slate-200 rounded-lg">
                <TrendingUp className="w-8 h-8 text-slate-400 mb-2" />
                <h4 className="font-semibold text-slate-700">Conversion Tracking</h4>
                <p className="text-sm text-slate-600">View-to-download and download-to-purchase rates</p>
              </div>

              <div className="p-4 border border-dashed border-slate-200 rounded-lg">
                <BarChart3 className="w-8 h-8 text-slate-400 mb-2" />
                <h4 className="font-semibold text-slate-700">Advanced Reports</h4>
                <p className="text-sm text-slate-600">Custom date ranges, exports, and comparisons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}