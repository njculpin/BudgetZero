"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateUserShareSettingsAction } from "./update-share-settings-action";

interface ProfileVisibilitySettingsProps {
  userId: string;
  initialSettings: {
    show_created_assets: boolean;
    show_created_products: boolean;
  } | null;
}

export function ProfileVisibilitySettings({
  userId,
  initialSettings,
}: ProfileVisibilitySettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showCreatedProducts, setShowCreatedProducts] = useState(
    initialSettings?.show_created_products ?? true,
  );
  const [showCreatedAssets, setShowCreatedAssets] = useState(
    initialSettings?.show_created_assets ?? true,
  );

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await updateUserShareSettingsAction(userId, {
        show_created_products: showCreatedProducts,
        show_created_assets: showCreatedAssets,
      });

      if (result.success) {
        setMessage({
          type: "success",
          text: "Settings saved successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to save settings",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Profile Visibility
        </CardTitle>
        <CardDescription>
          Control what appears on your public profile page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Show Created Products Toggle */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="show-products" className="text-base">
              Show my products
            </Label>
            <p className="text-sm text-muted-foreground">
              Display products you've created on your public profile
            </p>
          </div>
          <Switch
            id="show-products"
            checked={showCreatedProducts}
            onCheckedChange={setShowCreatedProducts}
          />
        </div>

        {/* Show Contributions Toggle */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="show-contributions" className="text-base">
              Show my contributions
            </Label>
            <p className="text-sm text-muted-foreground">
              Display products that use your assets on your public profile
            </p>
          </div>
          <Switch
            id="show-contributions"
            checked={showCreatedAssets}
            onCheckedChange={setShowCreatedAssets}
          />
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`rounded-lg p-4 flex items-start gap-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-900 border border-green-200"
                : "bg-red-50 text-red-900 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="rounded-lg bg-muted p-4 text-sm">
          <div className="flex items-start gap-2">
            <EyeOff className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Privacy Note</p>
              <p className="text-muted-foreground mt-1">
                Visitors can always see your profile header (avatar, bio,
                stats). These settings only control the Products and
                Contributions sections.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
