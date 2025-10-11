import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminGetMe } from "@/lib/sdk/server";

export default async function CreateLicensePage() {
  const user = await useAdminGetMe();

  const breadcrumbs = [
    { label: "Licensing", href: "/licensing" },
    { label: "Create License" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-2xl space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/licensing">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Licensing
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold">Create Custom License</h1>
          <p className="text-muted-foreground mt-2">
            Create a custom license agreement for your assets
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Custom license creation coming soon. For now, use the built-in
              license types (Free, Attribution, Commercial, Exclusive) when
              editing your assets.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
