"use client";

import { createCheckoutSession } from "@/app/products/[id]/actions";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProductBuyButtonProps {
  productId: string;
  productTitle: string;
  priceCents: number;
  disabled?: boolean;
}

export function ProductBuyButton({
  productId,
  productTitle,
  priceCents,
  disabled,
}: ProductBuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    try {
      setIsLoading(true);

      const result = await createCheckoutSession(productId);

      if (!result.success || !result.checkoutUrl) {
        toast.error(result.error || "Failed to start checkout");
        return;
      }

      // Redirect to Stripe checkout
      window.location.href = result.checkoutUrl;
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <Button
      size="lg"
      className="flex-1"
      onClick={handlePurchase}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Buy Now - {formatPrice(priceCents)}
        </>
      )}
    </Button>
  );
}
