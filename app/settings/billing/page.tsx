import { CreditCard, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Billing & Payment Methods
          </CardTitle>
          <CardDescription>
            Manage your payment methods and view purchase history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Payment Methods Yet
            </h3>
            <p className="text-slate-600 mb-4 max-w-md mx-auto">
              Add a payment method to make purchases faster. Your payment
              information is securely stored with Stripe.
            </p>
            <Button disabled>
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
            <p className="text-xs text-slate-500 mt-2">
              Coming soon - Stripe integration in progress
            </p>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-semibold mb-4">Purchase History</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-between"
                asChild
              >
                <Link href="/orders">
                  View All Orders
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
