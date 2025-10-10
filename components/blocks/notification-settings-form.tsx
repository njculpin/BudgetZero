"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const notificationSchema = z.object({
  email_enabled: z.boolean(),
  in_app_enabled: z.boolean(),
  collaboration_requests: z.boolean(),
  project_updates: z.boolean(),
  marketplace_sales: z.boolean(),
  playtest_reviews: z.boolean(),
  comments: z.boolean(),
  marketing: z.boolean(),
  frequency: z.enum(["instant", "daily", "weekly"]),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

interface NotificationSettingsFormProps {
  preferences: NotificationFormData | null;
}

const defaultPreferences: NotificationFormData = {
  email_enabled: true,
  in_app_enabled: true,
  collaboration_requests: true,
  project_updates: true,
  marketplace_sales: true,
  playtest_reviews: true,
  comments: true,
  marketing: false,
  frequency: "instant",
};

export function NotificationSettingsForm({
  preferences,
}: NotificationSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: preferences || defaultPreferences,
  });

  async function onSubmit(data: NotificationFormData) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/profile/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification preferences");
      }

      toast.success("Notification preferences updated");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update notification preferences",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Choose what updates you'd like to receive and how often
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div className="space-y-1">
                      <FormLabel>Email Notifications</FormLabel>
                      <FormDescription>
                        Receive emails about your projects and collaborations
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
                name="in_app_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div className="space-y-1">
                      <FormLabel>In-App Notifications</FormLabel>
                      <FormDescription>
                        Show notifications in the application
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

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Types</h4>

                <FormField
                  control={form.control}
                  name="collaboration_requests"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <FormLabel>Collaboration Requests</FormLabel>
                        <FormDescription>
                          When someone wants to use your assets or collaborate
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

                <FormField
                  control={form.control}
                  name="project_updates"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <FormLabel>Project Updates</FormLabel>
                        <FormDescription>
                          When collaborators make changes to your projects
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

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <FormLabel>Comments & Replies</FormLabel>
                        <FormDescription>
                          When someone comments on your work or replies to you
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

                <FormField
                  control={form.control}
                  name="marketplace_sales"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <FormLabel>Marketplace Sales</FormLabel>
                        <FormDescription>
                          When your projects are purchased
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

                <FormField
                  control={form.control}
                  name="playtest_reviews"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <FormLabel>Playtest Reviews</FormLabel>
                        <FormDescription>
                          When someone reviews your project
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
                  name="marketing"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <FormLabel>Marketing Updates</FormLabel>
                        <FormDescription>
                          Occasional updates about new features and platform
                          news
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
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="instant">
                          Instant (as they happen)
                        </SelectItem>
                        <SelectItem value="daily">Daily digest</SelectItem>
                        <SelectItem value="weekly">Weekly digest</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often you want to receive email notifications
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Preferences"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
