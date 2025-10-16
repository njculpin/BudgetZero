"use client";

import type { UseFormReturn } from "react-hook-form";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AssetMetadataCardProps {
  form: UseFormReturn<{
    title: string;
    description?: string;
    is_public: boolean;
  }>;
}

export function AssetMetadataCard({ form }: AssetMetadataCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Details</CardTitle>
        <CardDescription>Edit your asset information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Title your asset..." {...field} />
              </FormControl>
              <FormDescription>Maximum 100 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your asset..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>Maximum 500 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
