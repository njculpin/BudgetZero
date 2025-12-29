import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getOrCreateCart, getCartItems } from "@/lib/data-access/cart";
import { getProductById, getProductPriceBreakdown, getProductFiles } from "@/lib/data-access/products";
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

    // Build line items for Stripe and validate products
    const lineItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await getProductById(item.product_id);

        if (!product) {
          throw new Error(`Product not found for cart item ${item.id}`);
        }

        // Validate product status - only private and public products can be purchased
        if (product.status !== 'private' && product.status !== 'public') {
          throw new Error(
            `Product "${product.title}" cannot be purchased. Only products with status "private" or "public" can be purchased. Current status: ${product.status}`
          );
        }

        // Get product price breakdown (files + documents + embedded products)
        const priceBreakdown = await getProductPriceBreakdown(product.id);

        if (priceBreakdown.totalPrice === 0) {
          throw new Error(`Product ${product.id} has no price set`);
        }

        // Get product files to include in metadata (for download access)
        const productFiles = await getProductFiles(product.id);
        const fileIds = productFiles.map(f => f.id);

        return {
          price_data: {
            currency: 'usd', // Default to USD, can be enhanced with multi-currency support
            unit_amount: priceBreakdown.totalPrice,
            product_data: {
              name: product.title,
              description: product.description || undefined,
              images: product.cover_image_url ? [product.cover_image_url] : [],
              metadata: {
                product_id: product.id,
                file_ids: fileIds.join(','),
                files_price: priceBreakdown.filePriceTotal.toString(),
                documents_price: priceBreakdown.documentPriceTotal.toString(),
                embedded_price: priceBreakdown.embeddedPriceTotal.toString(),
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
