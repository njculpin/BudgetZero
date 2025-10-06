import {
  CheckCircle2,
  Download,
  Calendar,
  Package,
  FileText,
  Box,
  Palette,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

interface OrderPageProps {
  params: Promise<{
    order_number: string;
  }>;
  searchParams: Promise<{
    success?: string;
  }>;
}

export default async function OrderPage({
  params,
  searchParams,
}: OrderPageProps) {
  const { order_number } = await params;
  const { success } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch order details
  const orderResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/orders/${order_number}`,
    {
      headers: {
        cookie: (await import("next/headers")).cookies().toString(),
      },
    },
  );

  if (!orderResponse.ok) {
    notFound();
  }

  const { order } = await orderResponse.json();

  // Fetch downloads if order is completed
  let downloads = [];
  if (order.status === "completed") {
    const downloadsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/orders/${order.id}/downloads`,
      {
        headers: {
          cookie: (await import("next/headers")).cookies().toString(),
        },
      },
    );

    if (downloadsResponse.ok) {
      const data = await downloadsResponse.json();
      downloads = data.downloads || [];
    }
  }

  const breadcrumbs = [
    { label: "My Orders", href: "/orders" },
    { label: order.order_number },
  ];

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "model":
        return <Box className="h-5 w-5 text-purple-600" />;
      case "illustration":
      case "photo":
        return <Palette className="h-5 w-5 text-amber-600" />;
      default:
        return <FileText className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Message */}
        {success === "true" && order.status === "completed" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900">
                    Payment Successful!
                  </h3>
                  <p className="text-sm text-green-800 mt-1">
                    Your order has been confirmed. You can now download your
                    content below.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  Order {order.order_number}
                </CardTitle>
                <CardDescription className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Placed on{" "}
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {order.completed_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        Completed on{" "}
                        {new Date(order.completed_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  )}
                </CardDescription>
              </div>
              <Badge
                variant={order.status === "completed" ? "default" : "secondary"}
                className="capitalize"
              >
                {order.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items.map((item: { id: string; project_title: string; pricing_tier_name: string; price: number; projects: { slug: string; cover_image_url: string | null; description: string | null } | null }) => {
                const project = item.projects;
                return (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <Link
                      href={project?.slug ? `/projects/${project.slug}` : "#"}
                      className="flex-shrink-0"
                    >
                      {project?.cover_image_url ? (
                        <img
                          src={project.cover_image_url}
                          alt={item.project_title}
                          className="w-24 h-24 object-cover rounded hover:opacity-75 transition-opacity"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center hover:opacity-75 transition-opacity">
                          <span className="text-3xl font-bold text-white opacity-50">
                            {item.project_title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={
                          project?.slug ? `/projects/${project.slug}` : "#"
                        }
                        className="hover:underline"
                      >
                        <h4 className="font-semibold text-lg">
                          {item.project_title}
                        </h4>
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.pricing_tier_name}
                      </p>
                      {project?.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}

              <Separator />

              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Downloads */}
        {order.status === "completed" && downloads.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Your Content
              </CardTitle>
              <CardDescription>
                Click on any file to download. Downloads are available
                indefinitely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {downloads.map((download: { id: string; type: string; title: string; url: string; asset_type?: string; document_type?: string }) => (
                  <a
                    key={download.id}
                    href={download.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {getAssetIcon(download.asset_type || download.document_type || download.type)}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium truncate">
                        {download.title}
                      </h5>
                      <p className="text-xs text-muted-foreground capitalize">
                        {download.asset_type ||
                          download.document_type ||
                          download.type}
                      </p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-blue-800">
              If you have any issues with your order or downloads, please
              contact us at{" "}
              <a
                href="mailto:support@workshop.com"
                className="font-medium underline"
              >
                support@workshop.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
