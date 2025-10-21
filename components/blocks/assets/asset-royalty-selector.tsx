"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface AssetRoyalty {
  id: number;
  royalty_type: "fixed" | "percentage";
  royalty_value: number;
  user_id: string;
}

interface AssetRoyaltySelectorProps {
  assetId: string;
  userId: string;
  currentRoyalty?: AssetRoyalty | null;
  isOwner: boolean;
}

const formSchema = z.object({
  royalty_type: z.enum(["percentage", "fixed"]),
  royalty_value: z.number().min(0).max(10000),
});

type FormValues = z.infer<typeof formSchema>;

export function AssetRoyaltySelector({
  assetId,
  userId,
  currentRoyalty,
  isOwner,
}: AssetRoyaltySelectorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      royalty_type: currentRoyalty?.royalty_type || "percentage",
      royalty_value: Number(currentRoyalty?.royalty_value) || 0,
    },
  });

  const royaltyType = form.watch("royalty_type");
  const royaltyValue = form.watch("royalty_value");

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);

    try {
      const supabase = createClient();

      if (currentRoyalty) {
        // Update existing royalty
        const { error } = await supabase
          .from("asset_royalties")
          .update({
            royalty_type: values.royalty_type,
            royalty_value: values.royalty_value,
          })
          .eq("id", currentRoyalty.id);

        if (error) throw error;
      } else {
        // Create new royalty
        const { error } = await supabase.from("asset_royalties").insert({
          asset_id: assetId,
          user_id: userId,
          royalty_type: values.royalty_type,
          royalty_value: values.royalty_value,
        });

        if (error) throw error;
      }

      toast.success("Royalty settings saved successfully");
      router.refresh();
    } catch (error) {
      console.error("Royalty save error:", error);
      toast.error("Failed to save royalty settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOwner && !currentRoyalty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Royalty</CardTitle>
          <CardDescription>Revenue share when used in projects</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No royalty information has been set for this asset.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isOwner && currentRoyalty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Royalty</CardTitle>
          <CardDescription>Revenue share when used in projects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold">
              {currentRoyalty.royalty_type === "percentage"
                ? `${currentRoyalty.royalty_value}%`
                : `$${(currentRoyalty.royalty_value / 100).toFixed(2)}`}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {currentRoyalty.royalty_type === "percentage"
                ? "Percentage of revenue"
                : "Fixed amount per use"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Owner view with configuration
  return (
    <Card>
      <CardHeader>
        <CardTitle>Royalty</CardTitle>
        <CardDescription>
          Configure revenue sharing for this asset
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="royalty_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Royalty Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select royalty type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">
                        Percentage of Revenue
                      </SelectItem>
                      <SelectItem value="fixed">
                        Fixed Amount Per Use
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose how you want to receive royalties when this asset is
                    used in projects that generate revenue.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="royalty_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {royaltyType === "percentage"
                      ? "Percentage"
                      : "Amount (USD)"}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      {royaltyType === "fixed" && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                      )}
                      <Input
                        type="number"
                        min="0"
                        max={royaltyType === "percentage" ? "100" : "10000"}
                        step={royaltyType === "percentage" ? "1" : "0.01"}
                        className={royaltyType === "fixed" ? "pl-7" : ""}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      {royaltyType === "percentage" && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    {royaltyType === "percentage"
                      ? "Enter a percentage between 0-100%"
                      : "Enter amount in dollars (converted to cents)"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Preview</p>
              <div className="text-2xl font-bold">
                {royaltyType === "percentage"
                  ? `${royaltyValue}%`
                  : `$${(royaltyValue || 0).toFixed(2)}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {royaltyType === "percentage"
                  ? "of project revenue"
                  : "per project use"}
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Royalties are paid when projects using your asset generate
                revenue. You'll need a Stripe Connected Account to receive
                payments.
              </AlertDescription>
            </Alert>

            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Royalty Settings"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
