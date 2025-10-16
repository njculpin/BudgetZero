"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AssetRoyalty {
  id: number;
  royalty_type: "fixed" | "percentage";
  royalty_value: number;
  user_id: string;
}

interface AssetRoyaltyCardProps {
  royalty?: AssetRoyalty | null;
}

export function AssetRoyaltyCard({ royalty }: AssetRoyaltyCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Royalty</CardTitle>
        <CardDescription>Revenue share when used in projects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {royalty ? (
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold">
              {royalty.royalty_type === "percentage"
                ? `${royalty.royalty_value}%`
                : `$${(royalty.royalty_value / 100).toFixed(2)}`}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {royalty.royalty_type === "percentage"
                ? "Percentage of revenue"
                : "Fixed amount per use"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No royalty information available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
