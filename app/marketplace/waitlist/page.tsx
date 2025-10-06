import { Rocket, Check } from "lucide-react";
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

export default async function WaitlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const breadcrumbs = [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Waitlist" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Rocket className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl">You're on the Waitlist!</CardTitle>
            <CardDescription className="text-base">
              Marketplace payments are coming soon. We'll notify you when you
              can purchase projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* What's Coming */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge variant="default">Coming Soon</Badge>
                What to Expect
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    <strong>Secure Payments:</strong> Stripe integration for
                    safe transactions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    <strong>Instant Delivery:</strong> Download links for all
                    project assets
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    <strong>Revenue Splits:</strong> Automatic distribution to
                    all co-owners
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    <strong>Purchase History:</strong> Track all your
                    transactions
                  </span>
                </li>
              </ul>
            </div>

            {/* Timeline */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Launch Timeline
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>✅ Marketplace Browse</span>
                  <span className="font-medium">Live Now</span>
                </div>
                <div className="flex justify-between">
                  <span>✅ Project Publishing</span>
                  <span className="font-medium">Live Now</span>
                </div>
                <div className="flex justify-between">
                  <span>✅ Shopping Cart</span>
                  <span className="font-medium">Live Now</span>
                </div>
                <div className="flex justify-between">
                  <span>🚧 Payment Integration</span>
                  <span className="font-medium">Week of Dec 9</span>
                </div>
                <div className="flex justify-between">
                  <span>🚧 First Transactions</span>
                  <span className="font-medium">Week of Dec 16</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full" size="lg" asChild>
                <a href="/marketplace">Continue Browsing</a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="/projects/new">Create a Project</a>
              </Button>
            </div>

            {/* Contact Info */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Questions? Contact us at{" "}
                <a
                  href="mailto:support@workshop.com"
                  className="text-primary hover:underline"
                >
                  support@workshop.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Value Prop for Creators */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">For Creators</CardTitle>
            <CardDescription className="text-green-700">
              While you wait, maximize your earnings potential
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-green-800">
            <p className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Publish your projects now</strong> so they're ready when
                payments launch
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Gather playtest reviews</strong> to build trust and
                visibility
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Collaborate with other creators</strong> to expand your
                network
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Set up pricing tiers</strong> to maximize revenue
                options
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
