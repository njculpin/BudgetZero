import type { APIRoute } from "astro";
import { z } from "zod";
import { getVariantById, getVariantAssets, getVariantPrices } from "@/lib/data-access/products";
import { getAssetRoyalties } from "@/lib/data-access/royalties";
import { getUserById } from "@/lib/data-access/users";

const pricingBreakdownSchema = z.object({
  variantId: z.string().uuid(),
});

export const GET: APIRoute = async ({ url }) => {
  try {
    const variantId = url.searchParams.get("variantId");

    if (!variantId) {
      return new Response(JSON.stringify({ error: "Variant ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedData = pricingBreakdownSchema.parse({ variantId });

    // Get variant, assets, and prices
    const variant = await getVariantById(validatedData.variantId);
    if (!variant) {
      return new Response(JSON.stringify({ error: "Variant not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const assets = await getVariantAssets(validatedData.variantId);
    const prices = await getVariantPrices(validatedData.variantId);

    // Get the base price (use the lowest min_quantity price)
    const basePrice = prices.length > 0
      ? prices.sort((a, b) => (a.min_quantity || 1) - (b.min_quantity || 1))[0]
      : null;

    if (!basePrice || !basePrice.unit_amount) {
      return new Response(
        JSON.stringify({
          variant,
          assets: [],
          breakdown: null,
          message: "No pricing set for this variant"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Calculate breakdown for each asset with flat rates
    const assetBreakdowns = await Promise.all(
      assets.map(async (asset) => {
        const royalties = await getAssetRoyalties(asset.id);

        // Get user info for each royalty recipient
        const royaltiesWithUsers = await Promise.all(
          royalties.map(async (royalty) => {
            const user = await getUserById(royalty.user_id);
            return {
              ...royalty,
              user: user ? {
                id: user.id,
                name: user.name,
                handle: user.handle,
              } : null,
            };
          })
        );

        // Calculate total flat rate for this asset
        const assetFlatRate = royaltiesWithUsers.reduce((sum, r) => sum + r.royalty_value, 0);

        // Calculate what percentage of the product price this asset represents
        const assetPercentage = basePrice.unit_amount > 0
          ? Math.round((assetFlatRate / basePrice.unit_amount) * 10000) / 100
          : 0;

        // Calculate actual payout (capped at asset flat rate, won't exceed it even if percentage is higher)
        const assetPayout = Math.min(assetFlatRate, Math.round((basePrice.unit_amount * assetPercentage) / 100));

        return {
          asset: {
            id: asset.id,
            title: asset.title,
            handle: asset.handle,
          },
          royalties: royaltiesWithUsers,
          flatRate: assetFlatRate,
          percentage: assetPercentage,
          payout: assetPayout,
        };
      })
    );

    // Calculate totals
    const totalAssetFlatRates = assetBreakdowns.reduce((sum, ab) => sum + ab.flatRate, 0);
    const totalAssetPayouts = assetBreakdowns.reduce((sum, ab) => sum + ab.payout, 0);

    // Platform fee (5% of base price)
    const platformFeePercentage = 5;
    const platformFee = Math.round((basePrice.unit_amount * platformFeePercentage) / 100);

    // Net to product owner (remainder after assets and platform fee)
    const netToOwner = basePrice.unit_amount - totalAssetPayouts - platformFee;
    const netToOwnerPercentage = basePrice.unit_amount > 0
      ? Math.round((netToOwner / basePrice.unit_amount) * 10000) / 100
      : 0;

    const breakdown = {
      basePrice: {
        amount: basePrice.unit_amount,
        currency: basePrice.currency || "usd",
      },
      platformFee: {
        amount: platformFee,
        percentage: platformFeePercentage,
      },
      assets: {
        totalFlatRates: totalAssetFlatRates,
        totalPayouts: totalAssetPayouts,
        items: assetBreakdowns,
      },
      netToOwner: {
        amount: netToOwner,
        percentage: netToOwnerPercentage,
      },
      validation: {
        productPrice: basePrice.unit_amount,
        sumOfAssetRates: totalAssetFlatRates,
        isValid: basePrice.unit_amount >= totalAssetFlatRates,
        shortfall: totalAssetFlatRates > basePrice.unit_amount
          ? totalAssetFlatRates - basePrice.unit_amount
          : 0,
      },
    };

    return new Response(
      JSON.stringify({
        variant,
        breakdown,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Pricing breakdown error:", error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to calculate pricing breakdown",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
