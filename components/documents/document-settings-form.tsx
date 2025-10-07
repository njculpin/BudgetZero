"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";

const documentSettingsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  document_type: z.enum([
    "rulebook",
    "expansion",
    "quick_start",
    "reference",
    "other",
  ]),
  status: z.enum(["draft", "published", "archived"]),
  is_public: z.boolean(),
  license_type: z.enum(["free", "attribution", "commercial", "exclusive"]),
  license_terms: z.string().optional(),
  royalty_percentage: z.number().min(0).max(50),
  seeking_collaborators: z.boolean(),
});

type DocumentSettingsFormData = z.infer<typeof documentSettingsSchema>;

interface DocumentSettingsFormProps {
  documentId: string;
  projectSlug: string;
  initialData: DocumentSettingsFormData;
}

export function DocumentSettingsForm({
  documentId,
  projectSlug,
  initialData,
}: DocumentSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DocumentSettingsFormData>({
    resolver: zodResolver(documentSettingsSchema),
    defaultValues: initialData,
  });

  async function onSubmit(data: DocumentSettingsFormData) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update document");
      }

      router.push(`/projects/${projectSlug}/documents/${documentId}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating document:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update document",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the title and description of your document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Document title" {...field} />
                  </FormControl>
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
                      placeholder="Brief description of this document"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="document_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="rulebook">Rulebook</SelectItem>
                      <SelectItem value="expansion">Expansion</SelectItem>
                      <SelectItem value="quick_start">Quick Start</SelectItem>
                      <SelectItem value="reference">Reference</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/projects/${projectSlug}/documents/${documentId}`)
            }
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
