"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";

const pricingFormSchema = z.object({
  pricing_type: z.enum(["free", "one_time", "subscription"]),
  price_cents: z.number().min(0, "Price must be 0 or greater"),
  billing_interval: z.enum(["month", "year"]).optional(),
});

type PricingFormValues = z.infer<typeof pricingFormSchema>;

interface PricingOption {
  id: string;
  pricing_type: "free" | "one_time" | "subscription";
  price_cents: number;
  billing_interval: "month" | "year" | null;
  is_active: boolean;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AssetPricingManagerProps {
  assetId: string;
  pricingOptions: PricingOption[];
  isOwner: boolean;
}

export function AssetPricingManager({
  assetId,
  pricingOptions,
  isOwner,
}: AssetPricingManagerProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const activePricing = pricingOptions.find((p) => p.is_active);

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      pricing_type: activePricing?.pricing_type || "one_time",
      price_cents: activePricing?.price_cents || 0,
      billing_interval: activePricing?.billing_interval || undefined,
    },
  });

  const pricingType = form.watch("pricing_type");

  // Debounced auto-save function
  const debouncedSave = useCallback(
    async (values: PricingFormValues) => {
      if (!isOwner) return;

      try {
        setIsSaving(true);

        const response = await fetch(`/api/assets/${assetId}/pricing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update pricing");
        }

        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save pricing");
      } finally {
        setIsSaving(false);
      }
    },
    [assetId, isOwner, router],
  );

  // Watch for form changes and trigger auto-save
  useEffect(() => {
    if (!isOwner) return;

    const subscription = form.watch((values) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save (1 second debounce)
      saveTimeoutRef.current = setTimeout(() => {
        const formValues = form.getValues();
        debouncedSave(formValues);
      }, 1000);
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, debouncedSave, isOwner]);

  // Format price for display
  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
            <CardDescription>
              {isOwner
                ? "Set pricing for your asset"
                : "Available pricing options"}
            </CardDescription>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOwner ? (
          <Form {...form}>
            <div className="space-y-4">
              {/* Pricing Type */}
              <FormField
                control={form.control}
                name="pricing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pricing Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">
                          <div className="space-y-1">
                            <div className="font-medium">Free</div>
                            <div className="text-xs text-muted-foreground">
                              No cost to download
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="one_time">
                          <div className="space-y-1">
                            <div className="font-medium">One-Time Purchase</div>
                            <div className="text-xs text-muted-foreground">
                              Single payment for lifetime access
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="subscription">
                          <div className="space-y-1">
                            <div className="font-medium">Subscription</div>
                            <div className="text-xs text-muted-foreground">
                              Recurring payment for continued access
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price (hidden for free) */}
              {pricingType !== "free" && (
                <FormField
                  control={form.control}
                  name="price_cents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const dollars = Number.parseFloat(e.target.value) || 0;
                              field.onChange(Math.round(dollars * 100));
                            }}
                            value={field.value ? (field.value / 100).toFixed(2) : ""}
                            className="max-w-[200px]"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {pricingType === "subscription"
                          ? "Amount charged per billing period"
                          : "One-time purchase price"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Billing Interval (only for subscription) */}
              {pricingType === "subscription" && (
                <FormField
                  control={form.control}
                  name="billing_interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Interval</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "month"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="month">Monthly</SelectItem>
                          <SelectItem value="year">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Preview */}
              <Separator />
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Preview
                </div>
                <div className="text-2xl font-bold">
                  {pricingType === "free"
                    ? "Free"
                    : formatPrice(form.watch("price_cents") || 0)}
                </div>
                {pricingType === "subscription" && (
                  <div className="text-sm text-muted-foreground mt-1">
                    per {form.watch("billing_interval") || "month"}
                  </div>
                )}
              </div>
            </div>
          </Form>
        ) : (
          // Customer view
          <div className="space-y-4">
            {activePricing ? (
              <>
                <div className="rounded-lg border bg-muted/50 p-6 text-center">
                  <div className="text-3xl font-bold mb-2">
                    {activePricing.pricing_type === "free"
                      ? "Free"
                      : formatPrice(activePricing.price_cents)}
                  </div>
                  {activePricing.pricing_type === "subscription" && (
                    <div className="text-sm text-muted-foreground">
                      per {activePricing.billing_interval}
                    </div>
                  )}
                  <Badge className="mt-3 capitalize">
                    {activePricing.pricing_type.replace("_", " ")}
                  </Badge>
                </div>
                <Button className="w-full" size="lg">
                  {activePricing.pricing_type === "free"
                    ? "Download Free"
                    : activePricing.pricing_type === "subscription"
                      ? "Subscribe"
                      : "Purchase"}
                </Button>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No pricing set for this asset
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
