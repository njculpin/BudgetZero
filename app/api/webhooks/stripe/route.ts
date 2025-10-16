import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createSale,
  createSaleItem,
  createSaleItemAsset,
  createSaleRoyaltyTransaction,
} from "@/lib/sdk/server/sales";
import { getAssetRoyalties } from "@/lib/sdk/server/assets";
import { getProductVariantAssets } from "@/lib/sdk/server/products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(supabase, paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(supabase, paymentIntent);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutCompleted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: Stripe.Checkout.Session,
) {
  const metadata = session.metadata;
  const userId = metadata?.user_id;
  const productId = metadata?.product_id;
  const variantId = metadata?.variant_id;

  if (!userId || !productId || !variantId) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  // Create sale record
  const { data: sale, error: saleError } = await createSale(supabase, {
    user_id: userId,
    stripe_charge_id: session.payment_intent as string,
    price_cents: session.amount_total || 0,
    currency: session.currency?.toUpperCase() || "USD",
    status: "paid",
  });

  if (saleError || !sale) {
    console.error("Failed to create sale for session:", session.id, saleError);
    return;
  }

  // Create sale item with snapshot
  const { data: saleItem, error: saleItemError } = await createSaleItem(
    supabase,
    {
      sale_id: sale.id,
      product_id: productId,
      variant_id: Number.parseInt(variantId, 10),
      quantity: 1,
      price_cents: session.amount_total || 0,
      currency: session.currency?.toUpperCase() || "USD",
      snapshot: {
        session_id: session.id,
        product_id: productId,
        variant_id: variantId,
        customer_email: session.customer_email,
        timestamp: new Date().toISOString(),
      },
    },
  );

  if (saleItemError || !saleItem) {
    console.error("Failed to create sale item:", session.id, saleItemError);
    return;
  }

  // Get assets associated with this variant
  const { data: variantAssets, error: variantAssetsError } =
    await getProductVariantAssets(supabase, Number.parseInt(variantId, 10));

  if (variantAssetsError || !variantAssets) {
    console.error("Failed to get variant assets:", variantAssetsError);
    return;
  }

  // Link each asset to the sale item
  const saleItemAssets = [];
  for (const variantAsset of variantAssets) {
    const { data: saleItemAsset, error: saleItemAssetError } =
      await createSaleItemAsset(supabase, {
        sale_item_id: saleItem.id,
        asset_id: variantAsset.asset_id,
      });

    if (saleItemAssetError || !saleItemAsset) {
      console.error("Failed to create sale item asset:", saleItemAssetError);
      continue;
    }

    saleItemAssets.push(saleItemAsset);
  }

  // Calculate and create royalty transactions
  const totalPriceCents = session.amount_total || 0;
  const royaltyMap = new Map<
    string,
    {
      percentage: number;
      assetRoyaltyIds: number[];
      saleItemAssetIds: number[];
    }
  >();

  // Collect royalty information from all assets
  for (const saleItemAsset of saleItemAssets) {
    if (!saleItemAsset.asset_id) continue;

    const { data: assetRoyalties } = await getAssetRoyalties(
      supabase,
      saleItemAsset.asset_id,
    );

    if (!assetRoyalties || assetRoyalties.length === 0) {
      // No royalties configured - skip for now
      // In production, you might want to attribute 100% to the asset owner
      continue;
    }

    // Add each royalty to the map, distributed across all assets
    for (const royalty of assetRoyalties) {
      if (royalty.royalty_type === "percentage") {
        // Divide royalty percentage by number of assets in product
        const adjustedPercentage =
          royalty.royalty_value / saleItemAssets.length;

        const existing = royaltyMap.get(royalty.user_id);

        if (existing) {
          existing.percentage += adjustedPercentage;
          existing.assetRoyaltyIds.push(royalty.id);
          existing.saleItemAssetIds.push(saleItemAsset.id);
        } else {
          royaltyMap.set(royalty.user_id, {
            percentage: adjustedPercentage,
            assetRoyaltyIds: [royalty.id],
            saleItemAssetIds: [saleItemAsset.id],
          });
        }
      }
    }
  }

  // Create royalty transaction records
  for (const [recipientUserId, royaltyInfo] of royaltyMap.entries()) {
    const calculatedCents = Math.round(
      (totalPriceCents * royaltyInfo.percentage) / 100,
    );

    const { error: royaltyError } = await createSaleRoyaltyTransaction(
      supabase,
      {
        sale_id: sale.id,
        sale_item_id: saleItem.id,
        sale_item_asset_id: royaltyInfo.saleItemAssetIds[0],
        asset_royalty_id: royaltyInfo.assetRoyaltyIds[0],
        recipient_user_id: recipientUserId,
        royalty_type: "percentage",
        royalty_value: royaltyInfo.percentage,
        calculated_cents: calculatedCents,
        status: "pending",
      },
    );

    if (royaltyError) {
      console.error("Failed to create royalty transaction:", royaltyError);
    }
  }

  // TODO: Grant license access to purchased assets
  // TODO: Send confirmation email

  console.log(
    `Successfully processed checkout: ${session.id}, sale: ${sale.id}, royalties: ${royaltyMap.size}`,
  );
}

async function handlePaymentSucceeded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paymentIntent: Stripe.PaymentIntent,
) {
  // Update sale status
  const { error } = await supabase
    .from("sales")
    .update({ status: "paid" })
    .eq("stripe_charge_id", paymentIntent.id);

  if (error) {
    console.error("Failed to update sale status:", error);
  }
}

async function handlePaymentFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paymentIntent: Stripe.PaymentIntent,
) {
  // Update sale status
  const { error } = await supabase
    .from("sales")
    .update({ status: "failed" })
    .eq("stripe_charge_id", paymentIntent.id);

  if (error) {
    console.error("Failed to update sale status:", error);
  }
}

async function handleSubscriptionChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  subscription: Stripe.Subscription,
) {
  // TODO: Handle subscription lifecycle
  // - Create/update subscription records
  // - Grant/revoke access to subscription assets
  // - Update user_stripe_subscriptions table

  console.log(`Subscription ${subscription.status}: ${subscription.id}`);
}
