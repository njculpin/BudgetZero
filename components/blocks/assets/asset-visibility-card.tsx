"use client";

import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

interface AssetTag {
  id: number;
  namespace: string;
  value: string;
}

interface AssetVisibilityCardProps {
  form: UseFormReturn<{
    title: string;
    description?: string;
    is_public: boolean;
  }>;
  tags: AssetTag[];
}

export function AssetVisibilityCard({ form, tags }: AssetVisibilityCardProps) {
  const handleVisibilityToggle = async (value: boolean) => {
    if (value === true && (!tags || tags.length === 0)) {
      toast.error("Add at least one tag before making your asset public");
      form.setValue("is_public", false);
      return;
    }
    form.setValue("is_public", value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visibility</CardTitle>
        <CardDescription>Control who can see your asset</CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Public Visibility</FormLabel>
                <FormDescription>
                  Make this asset visible to all users
                  {(!tags || tags.length === 0) && (
                    <span className="block text-yellow-600 dark:text-yellow-500 mt-1">
                      ⚠ Add at least one tag before going public
                    </span>
                  )}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(value) => {
                    handleVisibilityToggle(value);
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
