import { PayoutConnectButton } from "@/components/blocks/projects/project-payout-connect-button";
import { PayoutScheduleManager } from "@/components/blocks/projects/project-payout-manager";
import { PayoutRequestButton } from "@/components/blocks/projects/project-payout-pay-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Download,
  Settings as SettingsIcon,
  TrendingUp,
} from "lucide-react";
import { redirect } from "next/navigation";

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; refresh?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const showSuccess = params.success === "true";

  // Fetch connected account status
  const accountResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/stripe/connect/account`,
    {
      headers: {
        cookie: (await import("next/headers")).cookies().toString(),
      },
    },
  );
  const { account, hasAccount } = await accountResponse.json();

  // Fetch earnings
  const earningsResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/earnings`,
    {
      headers: {
        cookie: (await import("next/headers")).cookies().toString(),
      },
    },
  );
  const earnings = await earningsResponse.json();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">
                  Account Setup Complete!
                </h3>
                <p className="text-sm text-green-800 mt-1">
                  Your payout account is now active. You can request payouts or
                  set up automatic monthly payments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connect Account Section */}
      {!hasAccount || !account?.details_submitted ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Set Up Payouts</CardTitle>
            <CardDescription className="text-blue-800">
              Connect your bank account to receive earnings from project sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Secure setup powered by Stripe</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Direct deposits to your bank account</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Choose manual or automatic monthly payouts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Minimum payout: $10.00</span>
                </li>
              </ul>
              <PayoutConnectButton
                hasAccount={hasAccount}
                isComplete={account?.details_submitted || false}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Earnings Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Available Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${(earnings.available || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ready to withdraw
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${(earnings.pending || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Processing from recent sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lifetime Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${(earnings.lifetime || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total all-time revenue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payout Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Request Payout</CardTitle>
                  <CardDescription>
                    Withdraw your available balance
                  </CardDescription>
                </div>
                {account?.payouts_enabled ? (
                  <Badge variant="default">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Payouts Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Setup Required
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <PayoutRequestButton
                available={earnings.available || 0}
                payoutsEnabled={account?.payouts_enabled || false}
              />
            </CardContent>
          </Card>

          {/* Automatic Payouts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Automatic Payouts
              </CardTitle>
              <CardDescription>
                Set up recurring automatic payments to your bank account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayoutScheduleManager
                schedule={earnings.schedule}
                payoutsEnabled={account?.payouts_enabled || false}
              />
            </CardContent>
          </Card>

          {/* Recent Earnings */}
          {earnings.recentSplits && earnings.recentSplits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Earnings
                </CardTitle>
                <CardDescription>
                  Your latest revenue from project sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {earnings.recentSplits.map(
                    (split: {
                      id: string;
                      amount: number;
                      percentage: number;
                      status: string;
                      created_at: string;
                      order_items: {
                        project_title: string;
                        price: number;
                      } | null;
                    }) => {
                      const item = split.order_items;
                      return (
                        <div
                          key={split.id}
                          className="flex items-center justify-between pb-3 border-b last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {item?.project_title || "Unknown Project"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {split.percentage.toFixed(1)}% revenue share
                              {item && ` • Sale: $${item.price.toFixed(2)}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(split.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-green-600">
                              +${split.amount.toFixed(2)}
                            </p>
                            {getStatusBadge(split.status)}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payout History */}
          {earnings.payouts && earnings.payouts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Payout History
                </CardTitle>
                <CardDescription>
                  Track your withdrawals and transfers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {earnings.payouts.map(
                    (payout: {
                      id: string;
                      amount: number;
                      status: string;
                      requested_at: string;
                      completed_at: string | null;
                      error_message: string | null;
                    }) => (
                      <div
                        key={payout.id}
                        className="flex items-center justify-between pb-3 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">
                            ${payout.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Requested:{" "}
                            {new Date(payout.requested_at).toLocaleDateString()}
                          </p>
                          {payout.completed_at && (
                            <p className="text-xs text-muted-foreground">
                              Completed:{" "}
                              {new Date(
                                payout.completed_at,
                              ).toLocaleDateString()}
                            </p>
                          )}
                          {payout.error_message && (
                            <p className="text-xs text-red-600">
                              {payout.error_message}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(payout.status)}
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your Stripe Connect account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Account ID</p>
                  <p className="font-mono text-xs mt-1">
                    {account.stripe_account_id}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Country</p>
                  <p className="font-medium mt-1">
                    {account.country?.toUpperCase() || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Currency</p>
                  <p className="font-medium mt-1">
                    {account.currency?.toUpperCase() || "USD"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {account.payouts_enabled ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <PayoutConnectButton
                hasAccount={true}
                isComplete={account.details_submitted}
                variant="outline"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
