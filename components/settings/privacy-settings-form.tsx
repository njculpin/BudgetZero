"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertTriangle, Save, Shield, Trash2 } from "lucide-react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const privacySchema = z.object({
  is_profile_public: z.boolean(),
  show_email_public: z.boolean(),
  allow_collaboration_requests: z.boolean(),
});

type PrivacyFormData = z.infer<typeof privacySchema>;

interface PrivacySettingsFormProps {
  profile: {
    is_profile_public?: boolean;
    show_email_public?: boolean;
    allow_collaboration_requests?: boolean;
  } | null;
}

const defaultPrivacy: PrivacyFormData = {
  is_profile_public: true,
  show_email_public: false,
  allow_collaboration_requests: true,
};

export function PrivacySettingsForm({ profile }: PrivacySettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PrivacyFormData>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      is_profile_public: profile?.is_profile_public ?? defaultPrivacy.is_profile_public,
      show_email_public: profile?.show_email_public ?? defaultPrivacy.show_email_public,
      allow_collaboration_requests:
        profile?.allow_collaboration_requests ??
        defaultPrivacy.allow_collaboration_requests,
    },
  });

  async function onSubmit(data: PrivacyFormData) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/profile/privacy", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update privacy settings");
      }

      toast.success("Privacy settings updated");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update privacy settings"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Control your privacy settings and account security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_profile_public"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <FormLabel>Public Profile</FormLabel>
                        <FormDescription>
                          Make your profile visible to other creators and in
                          search results
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="show_email_public"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <FormLabel>Show Email</FormLabel>
                        <FormDescription>
                          Display your email address on your public profile
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="allow_collaboration_requests"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <FormLabel>Allow Collaboration Requests</FormLabel>
                        <FormDescription>
                          Let other creators request to collaborate with you
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-2">
                  <FormLabel>Change Password</FormLabel>
                  <FormDescription>
                    Update your password to keep your account secure
                  </FormDescription>
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <Input type="password" placeholder="Current password" />
                    <Input type="password" placeholder="New password" />
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    Update Password
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Saving..." : "Save Privacy Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div className="space-y-1">
              <p className="font-medium text-red-700">Delete Account</p>
              <p className="text-sm text-slate-600">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
