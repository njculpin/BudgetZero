"use client";

import { DollarSign, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PayoutRequestButtonProps {
  available: number;
  payoutsEnabled: boolean;
}

export function PayoutRequestButton({
  available,
  payoutsEnabled,
}: PayoutRequestButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(available.toFixed(2));
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/payouts/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: Number.parseFloat(amount) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request payout");
      }

      toast.success(`Payout of $${amount} is being processed!`);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Payout error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to request payout",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!payoutsEnabled) {
    return (
      <div className="text-center p-6 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Complete your payout setup to withdraw earnings
        </p>
      </div>
    );
  }

  if (available < 10) {
    return (
      <div className="text-center p-6 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Minimum payout amount is $10.00. Your current balance:{" "}
          <span className="font-semibold">${available.toFixed(2)}</span>
        </p>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          <DollarSign className="w-4 h-4 mr-2" />
          Request Payout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Withdraw funds to your connected bank account
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              min="10"
              max={available}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available: ${available.toFixed(2)} • Minimum: $10.00
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p>
              <strong>Processing Time:</strong> Funds typically arrive within
              1-3 business days.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRequest} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Confirm Payout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
