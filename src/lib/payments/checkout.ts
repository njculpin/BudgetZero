/**
 * Stripe Checkout Functions
 *
 * Handles creation of checkout sessions and webhook processing.
 * All Stripe SDK interactions are isolated to this payments layer.
 */

import { stripe } from './client';
import type Stripe from 'stripe';

interface CheckoutSessionParams {
  lineItems: Array<{
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: {
        name: string;
        description?: string;
        images?: string[];
      };
    };
    quantity: number;
  }>;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

/**
 * Create a Stripe Checkout Session
 *
 * @param params - Checkout session parameters
 * @returns Stripe checkout session object
 */
export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: params.lineItems,
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    metadata: params.metadata,
  });

  return session;
}

/**
 * Verify webhook signature
 *
 * @param payload - Raw webhook payload
 * @param signature - Stripe signature header
 * @param secret - Webhook signing secret
 * @returns Verified Stripe event
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Handle successful checkout session
 *
 * @param session - Stripe checkout session
 * @returns Session metadata for processing
 */
export function extractSessionData(session: Stripe.Checkout.Session) {
  return {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    customerEmail: session.customer_email,
    amountTotal: session.amount_total,
    currency: session.currency,
    metadata: session.metadata,
  };
}

/**
 * Retrieve a checkout session by ID
 *
 * @param sessionId - Stripe session ID
 * @returns Stripe checkout session
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.retrieve(sessionId);
}
