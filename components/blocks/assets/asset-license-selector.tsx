"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface AssetLicense {
  id: number;
  license_id: string;
  is_active: boolean;
  granted_at: string;
  expires_at: string | null;
}

interface AssetLicenseSelectorProps {
  assetId: string;
  currentLicense?: AssetLicense | null;
  isOwner: boolean;
}

const LICENSE_OPTIONS = [
  {
    id: "1",
    name: "Public",
    description:
      "No rights reserved. Free for any use, commercial or personal.",
  },
  {
    id: "2",
    name: "Platform Standard License",
    description: "Used on Platform only",
  },
];

export function AssetLicenseSelector({
  assetId,
  currentLicense,
  isOwner,
}: AssetLicenseSelectorProps) {
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);

  const selectedLicense = LICENSE_OPTIONS.find(
    (l) => l.id === currentLicense?.license_id,
  );

  const handleLicenseChange = async (licenseId: string) => {
    setIsChanging(true);

    try {
      const supabase = createClient();

      // Deactivate current license if exists
      if (currentLicense) {
        await supabase
          .from("asset_licenses")
          .update({ is_active: false })
          .eq("id", currentLicense.id);
      }

      // Create new license
      const { error } = await supabase.from("asset_licenses").insert({
        asset_id: assetId,
        license_id: licenseId,
        is_active: true,
        granted_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("License updated successfully");
      router.refresh();
    } catch (error) {
      console.error("License change error:", error);
      toast.error("Failed to update license");
    } finally {
      setIsChanging(false);
    }
  };

  if (!isOwner && !currentLicense) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>License</CardTitle>
          <CardDescription>Usage terms for this asset</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No license has been set for this asset yet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isOwner && currentLicense) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>License</CardTitle>
          <CardDescription>Usage terms for this asset</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              License Type
            </div>
            <Badge className="text-base px-3 py-1">
              {selectedLicense?.name || currentLicense.license_id}
            </Badge>
            {selectedLicense && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedLicense.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Granted on{" "}
              {new Date(currentLicense.granted_at).toLocaleDateString()}
              {currentLicense.expires_at &&
                ` • Expires on ${new Date(currentLicense.expires_at).toLocaleDateString()}`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Owner view with selector
  return (
    <Card>
      <CardHeader>
        <CardTitle>License</CardTitle>
        <CardDescription>
          Set the licensing terms for your asset
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">License Type</div>
          <Select
            value={currentLicense?.license_id || ""}
            onValueChange={handleLicenseChange}
            disabled={isChanging}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a license..." />
            </SelectTrigger>
            <SelectContent>
              {LICENSE_OPTIONS.map((license) => (
                <SelectItem key={license.id} value={license.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{license.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {license.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentLicense && selectedLicense && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{selectedLicense.name}</strong>
              <br />
              {selectedLicense.description}
            </AlertDescription>
          </Alert>
        )}

        {!currentLicense && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Setting a license is required before making your asset public.
              This defines how others can use your work.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
