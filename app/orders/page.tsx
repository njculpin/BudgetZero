import { Package, Calendar, Download, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/orders`,
    {
      headers: {
        cookie: (await import("next/headers")).cookies().toString(),
      },
    },
  );

  const { orders } = await response.json();

  const breadcrumbs = [{ label: "My Orders" }];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">
            View your purchase history and download your content
          </p>
        </div>

        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                Browse the marketplace to find projects you love
              </p>
              <Button asChild>
                <Link href="/marketplace">Browse Marketplace</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: { id: string; order_number: string; total_amount: number; status: string; created_at: string; completed_at: string | null; order_items: { id: string; project_title: string; pricing_tier_name: string; price: number; projects: { slug: string; cover_image_url: string | null } | null }[] }) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order {order.order_number}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span>${order.total_amount.toFixed(2)}</span>
                      </CardDescription>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {order.order_items.map((item) => {
                      const project = item.projects;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0"
                        >
                          {project?.cover_image_url ? (
                            <img
                              src={project.cover_image_url}
                              alt={item.project_title}
                              className="w-20 h-20 object-cover rounded"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                              <span className="text-2xl font-bold text-white opacity-50">
                                {item.project_title.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">
                              {item.project_title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {item.pricing_tier_name}
                            </p>
                            <p className="text-sm font-semibold mt-1">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {order.status === "completed" && (
                    <div className="mt-6 pt-6 border-t">
                      <Button asChild className="w-full" size="lg">
                        <Link href={`/orders/${order.order_number}`}>
                          <Download className="w-4 h-4 mr-2" />
                          View Order & Download Content
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
