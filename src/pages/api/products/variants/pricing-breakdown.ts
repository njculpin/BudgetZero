import type { APIRoute } from "astro";
import { z } from "zod";
import { getVariantById, getVariantComponents, getVariantPrices } from "@/lib/data-access/products";
import { getProductRoyalties } from "@/lib/data-access/royalties";
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

    const components = await getVariantComponents(validatedData.variantId);
    const prices = await getVariantPrices(validatedData.variantId);

    // Get the base price (use the lowest min_quantity price)
    const basePrice = prices.length > 0
      ? prices.sort((a, b) => (a.min_quantity || 1) - (b.min_quantity || 1))[0]
      : null;

    if (!basePrice || !basePrice.unit_amount) {
      return new Response(
        JSON.stringify({
          variant,
          components: [],
          breakdown: null,
          message: "No pricing set for this variant"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Calculate breakdown for each product component with flat rates
    const componentBreakdowns = await Promise.all(
      components.map(async (component) => {
        const royalties = await getProductRoyalties(component.id);

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

        // Calculate total flat rate for this component
        const componentFlatRate = royaltiesWithUsers.reduce((sum, r) => sum + r.royalty_value, 0);

        // Calculate what percentage of the product price this component represents
        const componentPercentage = basePrice.unit_amount > 0
          ? Math.round((componentFlatRate / basePrice.unit_amount) * 10000) / 100
          : 0;

        // Calculate actual payout (capped at component flat rate, won't exceed it even if percentage is higher)
        const componentPayout = Math.min(componentFlatRate, Math.round((basePrice.unit_amount * componentPercentage) / 100));

        return {
          component: {
            id: component.id,
            title: component.title,
            handle: component.handle,
          },
          royalties: royaltiesWithUsers,
          flatRate: componentFlatRate,
          percentage: componentPercentage,
          payout: componentPayout,
        };
      })
    );

    // Calculate totals
    const totalComponentFlatRates = componentBreakdowns.reduce((sum, cb) => sum + cb.flatRate, 0);
    const totalComponentPayouts = componentBreakdowns.reduce((sum, cb) => sum + cb.payout, 0);

    // Platform fee (5% of base price)
    const platformFeePercentage = 5;
    const platformFee = Math.round((basePrice.unit_amount * platformFeePercentage) / 100);

    // Net to product owner (remainder after component payouts and platform fee)
    const netToOwner = basePrice.unit_amount - totalComponentPayouts - platformFee;
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
      components: {
        totalFlatRates: totalComponentFlatRates,
        totalPayouts: totalComponentPayouts,
        items: componentBreakdowns,
      },
      netToOwner: {
        amount: netToOwner,
        percentage: netToOwnerPercentage,
      },
      validation: {
        productPrice: basePrice.unit_amount,
        sumOfComponentRates: totalComponentFlatRates,
        isValid: basePrice.unit_amount >= totalComponentFlatRates,
        shortfall: totalComponentFlatRates > basePrice.unit_amount
          ? totalComponentFlatRates - basePrice.unit_amount
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
