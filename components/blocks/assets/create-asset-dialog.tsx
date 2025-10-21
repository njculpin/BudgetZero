"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateAssetDialogProps {
  userId: string;
  trigger?: React.ReactNode;
}

export function CreateAssetDialog({ userId, trigger }: CreateAssetDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsCreating(true);

    try {
      const supabase = createClient();

      // Verify user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("You must be logged in to create assets");
      }

      // Verify the userId matches the authenticated user
      if (session.user.id !== userId) {
        throw new Error("User ID mismatch. Please refresh the page.");
      }

      // CRITICAL: Verify user profile exists in users table
      const { data: userProfile, error: userCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

      if (userCheckError || !userProfile) {
        // Try to create the profile if it doesn't exist
        if (!session.user.email) {
          throw new Error("User email is required");
        }

        const { error: createProfileError } = await supabase
          .from("users")
          .insert({
            id: userId,
            email: session.user.email,
            username:
              session.user.user_metadata?.username ||
              session.user.email.split("@")[0],
          });

        if (createProfileError) {
          throw new Error(`User profile error: ${createProfileError.message}`);
        }
      }

      const assetId = uuidv4();

      // Create the asset record
      const { data, error } = await supabase
        .from("assets")
        .insert({
          id: assetId,
          user_id: userId,
          title: values.title,
          is_public: false,
        })
        .select();

      if (error) {
        console.error("Create asset error details:", {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw new Error(
          error.message || error.details || "Failed to create asset",
        );
      }

      console.log("Asset created successfully:", data);

      toast.success("Asset created successfully!");
      setOpen(false);
      form.reset();

      // Redirect to asset detail page with onboarding flag
      router.push(`/assets/${assetId}?onboarding=true`);
    } catch (error) {
      console.error("Create asset error:", error);
      let errorMessage = "Unknown error";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        // Supabase error object
        const supabaseError = error as {
          message?: string;
          details?: string;
          hint?: string;
        };
        errorMessage =
          supabaseError.message ||
          supabaseError.details ||
          supabaseError.hint ||
          JSON.stringify(error);
      }

      toast.error(`Failed to create asset: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Asset
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Asset</DialogTitle>
          <DialogDescription>
            Give your asset a name. You'll be able to upload files and add
            details on the next page.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Medieval Castle Model, Fantasy Character Sprites..."
                      {...field}
                      disabled={isCreating}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a clear, descriptive name (3-100 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Asset
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
