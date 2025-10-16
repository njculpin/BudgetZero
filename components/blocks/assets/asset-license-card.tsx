"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AssetLicense {
  id: number;
  license_id: string;
  is_active: boolean;
  granted_at: string;
  expires_at: string | null;
}

interface AssetLicenseCardProps {
  license?: AssetLicense | null;
}

export function AssetLicenseCard({ license }: AssetLicenseCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>License</CardTitle>
        <CardDescription>Usage terms for this asset</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {license ? (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              License Granted
            </div>
            <Badge className="text-base px-3 py-1">Active License</Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Granted on {new Date(license.granted_at).toLocaleDateString()}
              {license.expires_at &&
                ` • Expires on ${new Date(license.expires_at).toLocaleDateString()}`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No license information available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
