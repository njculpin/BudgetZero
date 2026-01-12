import type { APIRoute } from "astro";
import { verifyWebhookSignature, type Stripe } from "@/lib/payments";
import { createSale, createSaleItem, getSaleByStripeChargeId, refundSale, createSaleItemAsset } from "@/lib/data-access/sales";
import { getCartItems, clearCart } from "@/lib/data-access/cart";
import { getProductById, getProductPriceBreakdown, getProductFiles, getProductComponents } from "@/lib/data-access/products";
import { sendPurchaseConfirmation } from "@/lib/email/purchase-confirmation";
import { markSaleRoyaltiesAsRefunded, createRoyaltyTransactionsForProduct } from "@/lib/data-access/royalties";

// Mock mode flag - automatically enabled in development, or set MOCK_STRIPE=true
const USE_MOCK_STRIPE = import.meta.env.MODE === 'development' || import.meta.env.MOCK_STRIPE === 'true';

const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

if (!USE_MOCK_STRIPE && !webhookSecret) {
  console.error('STRIPE_WEBHOOK_SECRET is not set');
}

export const POST: APIRoute = async ({ request }) => {
  if (!USE_MOCK_STRIPE && !webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Get the raw body and signature
  const signature = request.headers.get('stripe-signature');

  if (!USE_MOCK_STRIPE && !signature) {
    return new Response('No signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = verifyWebhookSignature(
      body,
      signature || 'mock_signature',
      webhookSecret || 'mock_secret'
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new Response(
      `Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract metadata
        const userId = session.metadata?.userId;
        const cartId = session.metadata?.cartId;
        const userEmail = session.customer_email;

        if (!userId || !cartId) {
          console.error('Missing userId or cartId in session metadata');
          return new Response('Missing metadata', { status: 400 });
        }

        if (!userEmail) {
          console.error('Missing customer email');
          return new Response('Missing customer email', { status: 400 });
        }

        if (!session.amount_total) {
          console.error('Missing amount total');
          return new Response('Missing amount total', { status: 400 });
        }

        // Get cart items
        const cartItems = await getCartItems(cartId);

        if (cartItems.length === 0) {
          console.error('Cart is empty');
          return new Response('Cart is empty', { status: 400 });
        }

        try {
          // 1. Create Sale record
          const sale = await createSale({
            userId,
            userEmail,
            priceCents: session.amount_total,
            taxCents: 0,
            currency: session.currency || 'usd',
            stripeChargeId: session.payment_intent as string || session.id,
            status: 'paid',
          });

          if (!sale) {
            throw new Error('Failed to create sale record');
          }

          // Collect items for email
          const emailItems: Array<{
            productTitle: string;
            quantity: number;
            priceCents: number;
          }> = [];

          // 2. Create SaleItems and link files for each cart item
          for (const cartItem of cartItems) {
            // Get product details and pricing
            const product = await getProductById(cartItem.product_id);

            if (!product) {
              console.error(`Product not found: ${cartItem.product_id}`);
              continue;
            }

            // Get product price breakdown
            const priceBreakdown = await getProductPriceBreakdown(product.id);

            if (priceBreakdown.totalPrice === 0) {
              console.error(`Product has no price: ${product.id}`);
              continue;
            }

            // Create sale item with product snapshot
            const saleItem = await createSaleItem({
              saleId: sale.id,
              productId: cartItem.product_id,
              priceCents: priceBreakdown.totalPrice,
              currency: 'usd',
              quantity: cartItem.quantity,
              snapshot: {
                product_title: product.title,
                product_description: product.description,
                files_price: priceBreakdown.filePriceTotal,
                documents_price: priceBreakdown.documentPriceTotal,
                embedded_price: priceBreakdown.embeddedPriceTotal,
              },
            });

            if (!saleItem) {
              console.error(`Failed to create sale item for cart item: ${cartItem.id}`);
              continue;
            }

            // Add to email items
            emailItems.push({
              productTitle: product.title,
              quantity: cartItem.quantity,
              priceCents: priceBreakdown.totalPrice * cartItem.quantity,
            });

            // 3. Grant download access by creating sale_item_asset record
            // This treats the product as an asset for backward compatibility with download system
            const saleItemAsset = await createSaleItemAsset(saleItem.id, product.id);

            if (!saleItemAsset) {
              console.error(`Failed to create download access for product: ${product.id}`);
              continue;
            }

            // 4. Create royalty transactions for product-level royalties
            const productRoyalties = await createRoyaltyTransactionsForProduct({
              saleId: sale.id,
              saleItemId: saleItem.id,
              saleItemAssetId: saleItemAsset.id,
              productId: product.id,
              saleItemPriceCents: priceBreakdown.totalPrice,
              currency: 'usd',
            });

            // 5. Create royalty transactions for embedded products
            const components = await getProductComponents(product.id);

            for (const component of components) {
              // Create sale_item_asset for embedded product
              const embeddedSaleItemAsset = await createSaleItemAsset(saleItem.id, component.child_product_id);

              if (!embeddedSaleItemAsset) {
                console.error(`Failed to create download access for embedded product: ${component.child_product_id}`);
                continue;
              }

              // Create royalty transactions for the embedded product
              const embeddedRoyalties = await createRoyaltyTransactionsForProduct({
                saleId: sale.id,
                saleItemId: saleItem.id,
                saleItemAssetId: embeddedSaleItemAsset.id,
                productId: component.child_product_id,
                saleItemPriceCents: component.inherited_price_cents,
                currency: 'usd',
              });
            }
          }

          // 6. Clear the cart
          await clearCart(cartId);

          // 7. Send purchase confirmation email
          const origin = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:4321';

          await sendPurchaseConfirmation({
            to: userEmail,
            saleId: sale.id,
            totalCents: session.amount_total,
            currency: session.currency || 'usd',
            items: emailItems,
            purchaseUrl: `${origin}/purchases/${sale.id}`,
          });

          return new Response(
            JSON.stringify({ received: true, saleId: sale.id }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error processing checkout:', error);
          // Return 500 so Stripe retries
          throw error;
        }
      }

      case 'payment_intent.succeeded': {
        // Payment intent succeeded - main processing happens in checkout.session.completed
        break;
      }

      case 'payment_intent.payment_failed': {
        // Payment failed - could add notification system here in the future
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;

        // Get the payment intent ID (used as stripe_charge_id in our sales)
        const paymentIntentId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id;

        if (!paymentIntentId) {
          console.error('No payment intent ID found on refunded charge');
          return new Response('No payment intent', { status: 400 });
        }

        // Find the sale by stripe charge ID
        const sale = await getSaleByStripeChargeId(paymentIntentId);

        if (!sale) {
          // This might be a charge we don't track - not an error
          return new Response(
            JSON.stringify({ received: true, message: 'No matching sale found' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Determine refund reason
        const refundReason = charge.refunds?.data?.[0]?.reason || 'Customer requested refund';

        // Mark the sale as refunded
        await refundSale(sale.id, refundReason);

        // Mark all pending royalty transactions as refunded
        const refundedCount = await markSaleRoyaltiesAsRefunded(sale.id);

        return new Response(
          JSON.stringify({ received: true, saleId: sale.id, royaltiesRefunded: refundedCount }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      default:
        // Unhandled event type - acknowledge receipt
        break;
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      `Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
};
