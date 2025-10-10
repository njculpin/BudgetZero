import { FileText, Plus, Shield } from "lucide-react";
import Link from "next/link";
import { MainLayout } from "@/components/layouts/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAdminGetAllLicenses, useAdminGetMe } from "@/lib/sdk/server";

export default async function LicensingPage() {
  const user = await useAdminGetMe();

  // Get platform default licenses
  const { data: platformLicenses } = await useAdminGetAllLicenses({
    isPlatformDefault: true,
  });

  // Get user's custom licenses
  const { data: customLicenses } = await useAdminGetAllLicenses({
    creatorId: user.id,
  });

  const breadcrumbs = [{ label: "Licensing" }];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">License Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage license agreements for your assets and projects
            </p>
          </div>
          <Button asChild>
            <Link href="/licensing/create">
              <Plus className="mr-2 h-4 w-4" />
              Create License
            </Link>
          </Button>
        </div>

        {/* Platform Licenses Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">Platform Licenses</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Pre-defined license templates provided by Workshop
          </p>

          {platformLicenses && platformLicenses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {platformLicenses.map((license) => (
                <Card key={license.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <FileText className="h-5 w-5 text-primary" />
                      <Badge variant="secondary">Platform</Badge>
                    </div>
                    <CardTitle className="mt-4">{license.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {license.agreement.substring(0, 100)}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full"
                    >
                      <Link href={`/licensing/${license.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No platform licenses available
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Custom Licenses Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">My Custom Licenses</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Custom license agreements you&apos;ve created
          </p>

          {customLicenses && customLicenses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customLicenses.map((license) => (
                <Card key={license.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <FileText className="h-5 w-5" />
                      <Badge>Custom</Badge>
                    </div>
                    <CardTitle className="mt-4">{license.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {license.agreement.substring(0, 100)}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full"
                    >
                      <Link href={`/licensing/${license.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full"
                    >
                      <Link href={`/licensing/${license.id}/edit`}>
                        Edit License
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={<FileText className="w-6 h-6" />}
                title="No custom licenses yet"
                description="Create your first custom license agreement to get started"
                action={
                  <Button asChild>
                    <Link href="/licensing/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First License
                    </Link>
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
