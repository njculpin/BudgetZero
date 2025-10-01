"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const proposalSchema = z.object({
  message: z
    .string()
    .min(20, "Please provide a detailed message (at least 20 characters)")
    .max(1000, "Message is too long (max 1000 characters)"),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface CollaborationProposalModalProps {
  open: boolean;
  onClose: () => void;
  asset: {
    id: string;
    title: string;
    asset_type: 'model' | 'illustration';
    creator: {
      id: string;
      full_name?: string;
      username?: string;
    };
  };
  currentProject?: {
    id: string;
    title: string;
  };
}

export function CollaborationProposalModal({
  open,
  onClose,
  asset,
  currentProject,
}: CollaborationProposalModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      message: "",
    },
  });

  async function onSubmit(values: ProposalFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/collaboration/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: asset.id,
          project_id: currentProject?.id,
          message: values.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send proposal");
      }

      setSuccess(true);

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        form.reset();
        setSuccess(false);
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error("Proposal error:", err);
      setError(err instanceof Error ? err.message : "Failed to send proposal");
    } finally {
      setIsSubmitting(false);
    }
  }

  const creatorName = asset.creator.full_name || asset.creator.username || "Creator";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Propose Collaboration
          </DialogTitle>
          <DialogDescription>
            Send a collaboration proposal to use this {asset.asset_type} in your game project
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Proposal Sent!</AlertTitle>
            <AlertDescription>
              {creatorName} will be notified and can accept or decline your collaboration request.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Asset Info */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{asset.title}</h4>
                    <p className="text-sm text-gray-600">
                      by {creatorName}
                    </p>
                    <Badge variant="outline" className="mt-2 capitalize">
                      {asset.asset_type}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <h5 className="font-medium text-gray-900">Collaboration Terms (MVP):</h5>
                  <ul className="space-y-1 text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Equal revenue split between all collaborators
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      All collaborators must approve before publishing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Credited as co-creator in marketplace
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Shared ownership of collaborative project
                    </li>
                  </ul>
                </div>
              </div>

              {/* Message Field */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Message *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={`Hi ${creatorName},\n\nI'm working on a tabletop game project and would love to collaborate with you. Your ${asset.asset_type} would be perfect for...\n\nLooking forward to working together!`}
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Introduce yourself and explain how you'd like to use this {asset.asset_type} in your project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Project Info */}
              {currentProject && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Project</AlertTitle>
                  <AlertDescription>
                    This {asset.asset_type} will be added to: <strong>{currentProject.title}</strong>
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Send Proposal
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
