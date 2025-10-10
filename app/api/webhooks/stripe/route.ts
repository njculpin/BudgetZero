import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  useAdminCheckWebhookEvent,
  useAdminCreateNotification,
  useAdminGetOrderByPaymentIntent,
  useAdminGetOrderDetails,
  useAdminGetOrderItems,
  useAdminGetRevenueSplitsByItems,
  useAdminRecordWebhookEvent,
  useAdminUpdateOrder,
  useAdminUpdateRevenueSplits,
} from "@/lib/sdk/server";
import { stripe } from "@/lib/stripe/config";

// POST /api/webhooks/stripe - Handle Stripe webhook events
export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Payment system not configured" },
      { status: 503 },
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook configuration error" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // Check for duplicate webhook events (idempotency)
    const { data: existingEvent } = await useAdminCheckWebhookEvent(event.id);

    if (existingEvent) {
      console.log("Duplicate webhook event, skipping:", event.id);
      return NextResponse.json({ received: true, status: "duplicate" });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;

        if (!orderId) {
          console.error("No order_id in session metadata");
          break;
        }

        // Update order status to completed
        const { error: orderError } = await useAdminUpdateOrder(orderId, {
          status: "completed",
          stripe_payment_intent_id: session.payment_intent as string,
          completed_at: new Date().toISOString(),
        });

        if (orderError) {
          console.error("Error updating order:", orderError);
          break;
        }

        // Update revenue splits to processing
        const { data: orderItems } = await useAdminGetOrderItems(orderId);

        if (orderItems) {
          const itemIds = orderItems.map((item) => item.id);
          await useAdminUpdateRevenueSplits(itemIds, "processing");
        }

        // Get order details for notification
        const { data: order } = await useAdminGetOrderDetails(orderId);

        if (order) {
          // Create notification for buyer
          await useAdminCreateNotification({
            user_id: order.buyer_id,
            type: "purchase_complete",
            title: "Purchase Complete!",
            message: `Your order ${order.order_number} has been completed. You can now download your content.`,
            metadata: {
              order_id: orderId,
              order_number: order.order_number,
            },
          });

          // Create notifications for creators (revenue earned)
          const { data: splits } = await useAdminGetRevenueSplitsByItems(
            orderItems?.map((i) => i.id) || [],
          );

          if (splits) {
            const recipientAmounts = splits.reduce(
              (acc, split) => {
                acc[split.recipient_id] =
                  (acc[split.recipient_id] || 0) + Number(split.amount);
                return acc;
              },
              {} as Record<string, number>,
            );

            for (const [recipientId, amount] of Object.entries(
              recipientAmounts,
            )) {
              await useAdminCreateNotification({
                user_id: recipientId,
                type: "revenue_earned",
                title: "You Earned Revenue!",
                message: `You earned $${amount.toFixed(2)} from a project sale.`,
                metadata: {
                  order_id: orderId,
                  amount,
                },
              });
            }
          }
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;

        if (orderId) {
          await useAdminUpdateOrder(orderId, { status: "failed" });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Find order by payment intent
        const { data: order } = await useAdminGetOrderByPaymentIntent(
          paymentIntent.id,
        );

        if (order) {
          await useAdminUpdateOrder(order.id, { status: "failed" });

          // Notify buyer
          await useAdminCreateNotification({
            user_id: order.buyer_id,
            type: "payment_failed",
            title: "Payment Failed",
            message:
              "Your payment could not be processed. Please try again or contact support.",
            metadata: {
              order_id: order.id,
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Record successful webhook processing
    await useAdminRecordWebhookEvent(event.id, event.type);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
