import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getOrCreateCart, getCartItems, clearCart } from "@/lib/data-access/cart";
import { getProductById, getProductPriceBreakdown, ensureProductDocumentPDFs, getProductComponents } from "@/lib/data-access/products";
import { createSale, createSaleItem } from "@/lib/data-access/sales";

/**
 * Mock checkout endpoint for development/testing
 * Bypasses Stripe and creates a sale directly
 * Use with ?mock_checkout=true parameter
 */
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
  const userEmail = session.data.user.email || `user-${userId}@mock.local`;

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

    // Calculate total price and validate products
    let totalPriceCents = 0;
    const itemsWithPrices = await Promise.all(
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

        const priceBreakdown = await getProductPriceBreakdown(product.id);
        const itemTotal = priceBreakdown.totalPrice * item.quantity;
        totalPriceCents += itemTotal;

        return {
          cartItem: item,
          product,
          priceBreakdown,
        };
      })
    );

    // Create a mock stripe charge ID
    const mockChargeId = `mock_ch_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create the sale
    const sale = await createSale({
      userId,
      userEmail,
      priceCents: totalPriceCents,
      taxCents: 0,
      currency: "usd",
      stripeChargeId: mockChargeId,
      status: "paid", // Mock purchases are immediately paid
      metadata: {
        mock: true,
        cartId: cart.id,
      },
    });

    if (!sale) {
      return new Response(
        JSON.stringify({ error: "Failed to create sale" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create sale items and generate PDFs for each cart item
    for (const { cartItem, product, priceBreakdown } of itemsWithPrices) {
      const saleItem = await createSaleItem({
        saleId: sale.id,
        productId: product.id,
        priceCents: priceBreakdown.totalPrice,
        currency: "usd",
        quantity: cartItem.quantity,
        snapshot: {
          product_title: product.title,
          product_description: product.description,
          product_handle: product.handle,
          files_price: priceBreakdown.filePriceTotal,
          documents_price: priceBreakdown.documentPriceTotal,
          embedded_price: priceBreakdown.embeddedPriceTotal,
          platform_fee: priceBreakdown.platformFee,
        },
      });

      if (!saleItem) {
        console.error(`Failed to create sale item for product ${product.id}`);
      }

      // Generate PDFs for product documents (if not already generated)
      await ensureProductDocumentPDFs(product.id);

      // Also generate PDFs for embedded products' documents
      const embeddedProducts = await getProductComponents(product.id);
      for (const component of embeddedProducts) {
        await ensureProductDocumentPDFs(component.child_product_id);
      }
    }

    // Clear the cart
    await clearCart(cart.id);

    // Get the origin from the request
    const origin = new URL(request.url).origin;

    // Return success with mock session ID
    return new Response(
      JSON.stringify({
        success: true,
        sessionId: `mock_session_${sale.id}`,
        saleId: sale.id,
        redirectUrl: `${origin}/checkout/success?mock=true&sale_id=${sale.id}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Mock checkout error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to process mock checkout",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
