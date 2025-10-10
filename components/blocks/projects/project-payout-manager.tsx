"use client";

import { Calendar, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface PayoutScheduleManagerProps {
  schedule: {
    enabled: boolean;
    frequency: "weekly" | "biweekly" | "monthly";
    minimum_amount: number;
    day_of_month?: number;
    next_payout_at?: string;
  } | null;
  payoutsEnabled: boolean;
}

export function PayoutScheduleManager({
  schedule,
  payoutsEnabled,
}: PayoutScheduleManagerProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(schedule?.enabled || false);
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">(
    schedule?.frequency || "monthly",
  );
  const [minimumAmount, setMinimumAmount] = useState(
    schedule?.minimum_amount?.toString() || "50",
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    schedule?.day_of_month?.toString() || "1",
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/payouts/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled,
          frequency,
          minimum_amount: Number.parseFloat(minimumAmount),
          day_of_month:
            frequency === "monthly" ? Number.parseInt(dayOfMonth) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update schedule");
      }

      toast.success(
        enabled ? "Automatic payouts enabled!" : "Automatic payouts disabled",
      );
      router.refresh();
    } catch (error) {
      console.error("Schedule error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update schedule",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!payoutsEnabled) {
    return (
      <div className="text-center p-6 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Complete your payout setup to enable automatic payouts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="enabled">Enable Automatic Payouts</Label>
          <p className="text-sm text-muted-foreground">
            Automatically receive payouts on a schedule
          </p>
        </div>
        <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <>
          <div className="space-y-2">
            <Label htmlFor="frequency">Payout Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(value: "weekly" | "biweekly" | "monthly") =>
                setFrequency(value)
              }
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === "monthly" && (
            <div className="space-y-2">
              <Label htmlFor="day">Day of Month</Label>
              <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                <SelectTrigger id="day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      Day {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Payouts will be processed on this day each month
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="minimum">Minimum Amount</Label>
            <Input
              id="minimum"
              type="number"
              min="10"
              step="1"
              value={minimumAmount}
              onChange={(e) => setMinimumAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Payouts will only process if your balance is at least this amount
            </p>
          </div>

          {schedule?.next_payout_at && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Calendar className="w-4 h-4" />
                <span>
                  Next automatic payout:{" "}
                  <strong>
                    {new Date(schedule.next_payout_at).toLocaleDateString()}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <Button onClick={handleSave} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            Save Schedule
          </>
        )}
      </Button>
    </div>
  );
}
