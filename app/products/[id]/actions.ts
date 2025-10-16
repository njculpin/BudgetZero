"use server";

import { getMe } from "@/lib/sdk/server/users";
import { getProductByIdWithDetails } from "@/lib/sdk/server/products";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

interface CreateCheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}

export async function createCheckoutSession(
  productId: string,
): Promise<CreateCheckoutResult> {
  try {
    const user = await getMe();

    // Get product details
    const { data: product, error: productError } =
      await getProductByIdWithDetails(productId);

    if (productError || !product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Get the first variant and its price
    const variant = product.product_variants?.[0];
    if (!variant) {
      return {
        success: false,
        error: "Product has no variants",
      };
    }

    const price = variant.product_variant_prices?.[0];
    if (!price) {
      return {
        success: false,
        error: "Product has no price",
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: price.currency.toLowerCase(),
            product_data: {
              name: product.title,
              description: product.description || undefined,
              images: product.product_images
                ?.slice(0, 1)
                .map((img: { file_url: string }) => img.file_url),
            },
            unit_amount: price.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${productId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${productId}`,
      metadata: {
        user_id: user.id,
        product_id: productId,
        variant_id: variant.id.toString(),
      },
      customer_email: user.email,
    });

    if (!session.url) {
      return {
        success: false,
        error: "Failed to create checkout session",
      };
    }

    return {
      success: true,
      checkoutUrl: session.url,
    };
  } catch (error) {
    console.error("Checkout error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create checkout",
    };
  }
}
