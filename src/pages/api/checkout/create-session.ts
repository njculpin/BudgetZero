import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getOrCreateCart, getCartItems } from "@/lib/data-access/cart";
import { getProductById, getVariantById, getVariantPrices, getVariantAssets } from "@/lib/data-access/products";
import { createCheckoutSession } from "@/lib/payments";

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check authentication
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let session;
  try {
    session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (session.error || !session.data.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.data.user.id;
  const userEmail = session.data.user.email || "";

  try {
    // Get or create cart
    const cart = await getOrCreateCart(userId);
    if (!cart) {
      return new Response(JSON.stringify({ error: "Failed to get cart" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get cart items
    const cartItems = await getCartItems(cart.id);
    if (!cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build line items for Stripe
    const lineItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await getProductById(item.product_id);
        const variant = await getVariantById(item.variant_id);
        const prices = await getVariantPrices(item.variant_id);

        if (!product || !variant || !prices || prices.length === 0) {
          throw new Error(`Product or variant not found for cart item ${item.id}`);
        }

        // Get the price (use first price for now, could be enhanced with currency selection)
        const price = prices[0];

        // Get variant assets to include in metadata
        const assets = await getVariantAssets(item.variant_id);
        const assetIds = assets.map(a => a.id);

        return {
          price_data: {
            currency: price.currency,
            unit_amount: price.unit_amount,
            product_data: {
              name: `${product.title} - ${variant.title}`,
              description: variant.description || product.description || undefined,
              images: product.cover_image_url ? [product.cover_image_url] : [],
              metadata: {
                product_id: product.id,
                variant_id: variant.id,
                asset_ids: assetIds.join(','),
              },
            },
          },
          quantity: item.quantity,
        };
      })
    );

    // Get the origin from the request
    const origin = new URL(request.url).origin;

    // Create Stripe checkout session
    const checkoutSession = await createCheckoutSession({
      lineItems,
      customerEmail: userEmail,
      successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/cart`,
      metadata: {
        userId: userId,
        cartId: cart.id,
      },
    });

    return new Response(
      JSON.stringify({
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Checkout session creation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to create checkout session",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
