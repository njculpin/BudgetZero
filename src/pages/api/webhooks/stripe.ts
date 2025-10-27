import type { APIRoute } from "astro";
import { verifyWebhookSignature, type Stripe } from "@/lib/payments";
import { createSale, createSaleItem } from "@/lib/data-access/sales";
import { getCartItems, clearCart } from "@/lib/data-access/cart";
import { getProductById, getVariantById, getVariantPrices } from "@/lib/data-access/products";

const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error('STRIPE_WEBHOOK_SECRET is not set');
}

export const POST: APIRoute = async ({ request }) => {
  if (!webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Get the raw body and signature
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = verifyWebhookSignature(body, signature, webhookSecret);
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

        console.log('Processing checkout.session.completed:', session.id);

        // Extract metadata
        const userId = session.metadata?.userId;
        const cartId = session.metadata?.cartId;

        if (!userId || !cartId) {
          console.error('Missing userId or cartId in session metadata');
          return new Response('Missing metadata', { status: 400 });
        }

        // Get cart items
        const cartItems = await getCartItems(cartId);

        if (cartItems.length === 0) {
          console.error('Cart is empty');
          return new Response('Cart is empty', { status: 400 });
        }

        // Note: We need auth tokens to create records, but webhooks don't have user session
        // For MVP, we'll need to use a service account or admin access
        // For now, let's log a TODO and return success

        console.log('TODO: Create sale record for user:', userId);
        console.log('Session ID:', session.id);
        console.log('Amount:', session.amount_total);
        console.log('Cart items:', cartItems.length);

        // In production, you would:
        // 1. Use Supabase service role key to create sale records
        // 2. Create Sale with stripe charge ID
        // 3. Create SaleItems for each cart item
        // 4. Link assets to sale items
        // 5. Create royalty transaction records
        // 6. Clear the cart

        // For now, return success so Stripe doesn't retry
        return new Response(
          JSON.stringify({ received: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      case 'payment_intent.succeeded': {
        console.log('Payment intent succeeded:', event.data.object.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        console.log('Payment failed:', event.data.object.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
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
