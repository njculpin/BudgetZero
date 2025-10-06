"use client";

import { ShoppingCart, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/contexts/cart-context";

export function CartButton() {
  const { items, removeItem, totalItems, totalPrice, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to proceed to checkout",
      );
      setIsCheckingOut(false);
    }
  };

  if (totalItems === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative" disabled>
        <ShoppingCart className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {totalItems > 9 ? "9+" : totalItems}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {totalItems} item{totalItems !== 1 ? "s" : ""} in your cart
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.projectId}-${item.pricingTierId}`}
              className="flex gap-3 pb-4 border-b"
            >
              {item.coverImageUrl ? (
                <img
                  src={item.coverImageUrl}
                  alt={item.projectTitle}
                  className="w-20 h-20 object-cover rounded"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                  <span className="text-2xl font-bold text-white opacity-50">
                    {item.projectTitle.charAt(0)}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{item.projectTitle}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.pricingTierName}
                </p>
                <p className="text-lg font-semibold mt-1">
                  ${item.price.toFixed(2)}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.projectId, item.pricingTierId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <SheetFooter className="mt-6">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure checkout powered by Stripe
            </p>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
