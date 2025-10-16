"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, DollarSign, Users } from "lucide-react";

interface Asset {
  id: string;
  title: string;
  asset_royalties?: Array<{
    id: number;
    user_id: string;
    royalty_type: "percentage" | "fixed";
    royalty_value: number;
  }>;
}

interface RoyaltyPreviewProps {
  selectedAssets: Asset[];
  productPriceCents: number;
  currentUserId: string;
}

interface RoyaltyRecipient {
  userId: string;
  totalPercentage: number;
  amountCents: number;
  assetCount: number;
}

export function RoyaltyPreview({
  selectedAssets,
  productPriceCents,
  currentUserId,
}: RoyaltyPreviewProps) {
  // Calculate total royalty percentage from all assets
  const calculateRoyalties = () => {
    const recipients = new Map<string, RoyaltyRecipient>();

    selectedAssets.forEach((asset) => {
      if (!asset.asset_royalties || asset.asset_royalties.length === 0) {
        // No royalties defined - asset owner gets 100%
        const existing = recipients.get(currentUserId) || {
          userId: currentUserId,
          totalPercentage: 0,
          amountCents: 0,
          assetCount: 0,
        };
        existing.totalPercentage += 100;
        existing.assetCount += 1;
        recipients.set(currentUserId, existing);
      } else {
        // Sum up royalties for this asset
        asset.asset_royalties.forEach((royalty) => {
          if (royalty.royalty_type === "percentage") {
            const existing = recipients.get(royalty.user_id) || {
              userId: royalty.user_id,
              totalPercentage: 0,
              amountCents: 0,
              assetCount: 0,
            };
            existing.totalPercentage += royalty.royalty_value;
            existing.assetCount += 1;
            recipients.set(royalty.user_id, existing);
          }
        });
      }
    });

    // Calculate actual amounts based on total percentage
    const totalPercentage = Array.from(recipients.values()).reduce(
      (sum, r) => sum + r.totalPercentage,
      0,
    );

    recipients.forEach((recipient) => {
      recipient.amountCents = Math.round(
        (productPriceCents * recipient.totalPercentage) / totalPercentage,
      );
    });

    return {
      recipients: Array.from(recipients.values()).sort(
        (a, b) => b.amountCents - a.amountCents,
      ),
      totalPercentage,
    };
  };

  if (selectedAssets.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No assets selected</AlertTitle>
        <AlertDescription>
          Select assets to see royalty distribution preview
        </AlertDescription>
      </Alert>
    );
  }

  const { recipients, totalPercentage } = calculateRoyalties();
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const isValid = totalPercentage > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Royalty Distribution Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Product Price</div>
            <div className="text-2xl font-bold">
              {formatPrice(productPriceCents)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">
              Assets Included
            </div>
            <div className="text-2xl font-bold">{selectedAssets.length}</div>
          </div>
        </div>

        {/* Status */}
        {isValid ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">
              Royalties Configured
            </AlertTitle>
            <AlertDescription className="text-green-700">
              Revenue will be split among {recipients.length} recipient
              {recipients.length !== 1 ? "s" : ""}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Configuration</AlertTitle>
            <AlertDescription>
              No valid royalties found. At least one asset must have royalty
              settings.
            </AlertDescription>
          </Alert>
        )}

        {/* Recipients List */}
        {recipients.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Revenue Split</div>
            {recipients.map((recipient, index) => {
              const percentage = (
                (recipient.totalPercentage / totalPercentage) *
                100
              ).toFixed(1);
              const isCurrentUser = recipient.userId === currentUserId;

              return (
                <div
                  key={recipient.userId}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">
                          {isCurrentUser ? "You" : `User ${recipient.userId.substring(0, 8)}`}
                        </span>
                      </div>
                      {isCurrentUser && (
                        <Badge variant="secondary">Product Creator</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {formatPrice(recipient.amountCents)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Share from {recipient.assetCount} asset(s)</span>
                      <span>{percentage}%</span>
                    </div>
                    <Progress value={Number.parseFloat(percentage)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4 inline mr-1" />
          Royalties are automatically distributed when someone purchases this
          product.
        </div>
      </CardContent>
    </Card>
  );
}
