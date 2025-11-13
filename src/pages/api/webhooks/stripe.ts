import type { APIRoute } from "astro";
import { verifyWebhookSignature, type Stripe } from "@/lib/payments";
import { createSale, createSaleItem, createSaleItemAsset } from "@/lib/data-access/sales";
import { getCartItems, clearCart } from "@/lib/data-access/cart";
import { getProductById, getVariantById, getVariantPrices } from "@/lib/data-access/products";
import { serverClient } from "@/lib/data-access/client";

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

          console.log('Created sale:', sale.id);

          // 2. Create SaleItems and link assets for each cart item
          for (const cartItem of cartItems) {
            // Get product and variant details
            const product = await getProductById(cartItem.product_id);
            const variant = await getVariantById(cartItem.variant_id);
            const prices = variant ? await getVariantPrices(variant.id) : [];
            const price = prices.length > 0 ? prices[0] : null;

            if (!product || !variant || !price) {
              console.error(`Invalid cart item: ${cartItem.id}`);
              continue;
            }

            // Create sale item with product snapshot
            const saleItem = await createSaleItem({
              saleId: sale.id,
              productId: cartItem.product_id,
              variantId: cartItem.variant_id,
              priceCents: price.unit_amount,
              currency: price.currency,
              quantity: cartItem.quantity,
              snapshot: {
                product_title: product.title,
                variant_title: variant.title,
                variant_sku: variant.sku,
                product_description: product.description,
                variant_description: variant.description,
              },
            });

            if (!saleItem) {
              console.error(`Failed to create sale item for cart item: ${cartItem.id}`);
              continue;
            }

            console.log('Created sale item:', saleItem.id);

            // 3. Get variant assets and link them to the sale item
            const { data: productAssets } = await serverClient
              .from('product_assets')
              .select('asset_id')
              .eq('variant_id', cartItem.variant_id);

            if (productAssets && productAssets.length > 0) {
              for (const productAsset of productAssets) {
                const saleItemAsset = await createSaleItemAsset(
                  saleItem.id,
                  productAsset.asset_id
                );

                if (saleItemAsset) {
                  console.log('Linked asset to sale item:', productAsset.asset_id);
                }
              }
            }
          }

          // 4. Clear the cart
          const cleared = await clearCart(cartId);
          if (cleared) {
            console.log('Cart cleared:', cartId);
          }

          console.log('Purchase fulfillment complete for sale:', sale.id);

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
