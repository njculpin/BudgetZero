import type { APIRoute } from "astro";
import { setSession } from "@/lib/auth";
import { getOrCreateCart, getCartItems, clearCart } from "@/lib/data-access/cart";
import { getProductById, getProductPriceBreakdown, getProductComponents, ensureProductDocumentPDFs } from "@/lib/data-access/products";
import { createSale, createSaleItem } from "@/lib/data-access/sales";
import { getUserById } from "@/lib/data-access/users";
import { serverClient } from "@/lib/data-access/client";
import type { ShippingAddress } from "@/types";

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
    // Parse request body for shipping address and notes
    const body = await request.json();
    const shippingAddress = body.shipping_address as ShippingAddress | null;
    const orderNotes = body.order_notes as string | null;

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

    // Get user's current credits balance
    const user = await getUserById(userId);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has enough credits
    if (user.credits_balance < totalPriceCents) {
      return new Response(
        JSON.stringify({
          error: "Insufficient credits",
          required: totalPriceCents,
          available: user.credits_balance,
          shortfall: totalPriceCents - user.credits_balance,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Deduct credits from buyer
    const { error: deductError } = await serverClient
      .from('users')
      .update({
        credits_balance: user.credits_balance - totalPriceCents,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (deductError) {
      throw new Error(`Failed to deduct credits: ${deductError.message}`);
    }

    // Create a mock charge ID for credits payment
    const mockChargeId = `credits_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create sale record
    const sale = await createSale({
      userId,
      userEmail,
      priceCents: totalPriceCents,
      taxCents: 0,
      currency: "credits",
      stripeChargeId: mockChargeId,
      status: "paid",
      paymentMethod: "credits",
      shippingAddress: shippingAddress || null,
      orderNotes: orderNotes || null,
      completedAt: new Date().toISOString(),
    });

    if (!sale) {
      // Refund credits if sale creation failed
      await serverClient
        .from('users')
        .update({
          credits_balance: user.credits_balance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return new Response(JSON.stringify({ error: "Failed to create sale" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create sale items and generate PDFs for each cart item
    for (const { cartItem, product, priceBreakdown } of itemsWithPrices) {
      const saleItem = await createSaleItem({
        saleId: sale.id,
        productId: product.id,
        priceCents: priceBreakdown.totalPrice,
        currency: "credits",
        quantity: cartItem.quantity,
        snapshot: {
          product_title: product.title,
          product_handle: product.handle,
          product_type: product.product_type,
          price_breakdown: priceBreakdown,
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

      // Distribute credits to product owner and royalty recipients
      const platformFee = Math.floor(priceBreakdown.totalPrice * 0.10); // 10% platform fee
      const netRevenue = priceBreakdown.totalPrice - platformFee;

      // Calculate owner share (net revenue minus all royalties)
      const totalRoyalties = priceBreakdown.embeddedPriceTotal;
      const ownerShare = netRevenue - totalRoyalties;

      // Pay product owner
      if (ownerShare > 0) {
        const productOwner = await getUserById(product.user_id);
        if (productOwner) {
          await serverClient
            .from('users')
            .update({
              credits_balance: productOwner.credits_balance + ownerShare,
              updated_at: new Date().toISOString(),
            })
            .eq('id', product.user_id);
        }
      }

      // Pay royalties to embedded product owners
      for (const component of embeddedProducts) {
        const embeddedProduct = await getProductById(component.child_product_id);
        if (embeddedProduct && embeddedProduct.embedding_royalty_cents) {
          const royaltyAmount = embeddedProduct.embedding_royalty_cents;
          const embeddedOwner = await getUserById(embeddedProduct.user_id);

          if (embeddedOwner) {
            await serverClient
              .from('users')
              .update({
                credits_balance: embeddedOwner.credits_balance + royaltyAmount,
                updated_at: new Date().toISOString(),
              })
              .eq('id', embeddedProduct.user_id);
          }
        }
      }
    }

    // Clear the cart
    await clearCart(cart.id);

    return new Response(
      JSON.stringify({
        success: true,
        saleId: sale.id,
        totalPriceCents,
        creditsRemaining: user.credits_balance - totalPriceCents,
        redirectUrl: `/checkout/success?sale_id=${sale.id}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Credits checkout error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to process credits checkout",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
