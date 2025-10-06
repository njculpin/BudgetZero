"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PayoutConnectButtonProps {
  hasAccount: boolean;
  isComplete: boolean;
  variant?: "default" | "outline";
}

export function PayoutConnectButton({
  hasAccount,
  isComplete,
  variant = "default",
}: PayoutConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create onboarding link");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Connect error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start onboarding",
      );
      setIsLoading(false);
    }
  };

  const buttonText = hasAccount
    ? isComplete
      ? "Update Payout Details"
      : "Complete Setup"
    : "Connect Bank Account";

  return (
    <Button
      onClick={handleConnect}
      disabled={isLoading}
      variant={variant}
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {buttonText}
          <ExternalLink className="w-4 h-4 ml-2" />
        </>
      )}
    </Button>
  );
}
