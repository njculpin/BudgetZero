"use client";

import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/contexts/cart-context";

interface PricingTier {
  id: string;
  name: string;
  price: number;
}

interface AddToCartButtonProps {
  projectId: string;
  projectTitle: string;
  pricingTiers: PricingTier[];
  coverImageUrl?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function AddToCartButton({
  projectId,
  projectTitle,
  pricingTiers,
  coverImageUrl,
  variant = "default",
  size = "default",
}: AddToCartButtonProps) {
  const { items, addItem } = useCart();
  const [selectedTierId, setSelectedTierId] = useState<string>(
    pricingTiers[0]?.id || "",
  );

  const selectedTier = pricingTiers.find((t) => t.id === selectedTierId);

  const isInCart = items.some(
    (item) =>
      item.projectId === projectId && item.pricingTierId === selectedTierId,
  );

  const handleAddToCart = () => {
    if (!selectedTier) {
      toast.error("Please select a pricing tier");
      return;
    }

    addItem({
      projectId,
      projectTitle,
      pricingTierId: selectedTier.id,
      pricingTierName: selectedTier.name,
      price: selectedTier.price,
      coverImageUrl,
    });

    toast.success(`Added "${projectTitle}" to cart`);
  };

  if (pricingTiers.length === 0) {
    return (
      <Button disabled variant="outline">
        No pricing available
      </Button>
    );
  }

  if (pricingTiers.length === 1) {
    // Single pricing tier - simple button
    return (
      <Button
        onClick={handleAddToCart}
        disabled={isInCart}
        variant={variant}
        size={size}
      >
        {isInCart ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            In Cart
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart - ${pricingTiers[0].price.toFixed(2)}
          </>
        )}
      </Button>
    );
  }

  // Multiple pricing tiers - with dropdown
  return (
    <div className="flex gap-2">
      <Select value={selectedTierId} onValueChange={setSelectedTierId}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pricingTiers.map((tier) => (
            <SelectItem key={tier.id} value={tier.id}>
              {tier.name} - ${tier.price.toFixed(2)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleAddToCart}
        disabled={isInCart}
        variant={variant}
        size={size}
      >
        {isInCart ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            In Cart
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  );
}
