/**
 * Stripe Checkout Functions
 *
 * Handles creation of checkout sessions and webhook processing.
 * All Stripe SDK interactions are isolated to this payments layer.
 *
 * MOCK MODE: Set MOCK_STRIPE=true to bypass Stripe and use mock responses. That is
 * for local development and tests only — see ./mock-mode, which refuses to boot a
 * production build with it set.
 *
 * The real Stripe calls below were previously commented out with a `throw` in their
 * place. Because mock mode is rejected in production and the real path threw, there
 * was NO configuration in which a production build could take a payment or verify a
 * webhook signature.
 */

import type Stripe from 'stripe';
import { stripe } from './client';

import { USE_MOCK_STRIPE } from './mock-mode';

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
 * Create a Stripe Checkout Session (or mock if USE_MOCK_STRIPE=true)
 *
 * @param params - Checkout session parameters
 * @returns Stripe checkout session object
 */
export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  if (USE_MOCK_STRIPE) {
    // MOCK MODE: Return mock checkout session
    const totalAmount = params.lineItems.reduce(
      (sum, item) => sum + (item.price_data.unit_amount * item.quantity),
      0
    );

    const mockSession: Stripe.Checkout.Session = {
      id: `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      object: 'checkout.session',
      amount_total: totalAmount,
      amount_subtotal: totalAmount,
      currency: params.lineItems[0]?.price_data?.currency || 'usd',
      customer: null,
      customer_email: params.customerEmail || null,
      metadata: params.metadata || {},
      mode: 'payment',
      payment_intent: `pi_mock_${Date.now()}`,
      payment_status: 'unpaid',
      status: 'open',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      url: `${params.cancelUrl}?mock_checkout=true`, // Mock checkout URL
      created: Math.floor(Date.now() / 1000),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      livemode: false,
    } as Stripe.Checkout.Session;

    return mockSession;
  }

  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: params.lineItems,
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    metadata: params.metadata,
  });
}

/**
 * Verify webhook signature (or mock if USE_MOCK_STRIPE=true)
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
  if (USE_MOCK_STRIPE) {
    // MOCK MODE: Return mock Stripe event
    const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString());

    const mockEvent: Stripe.Event = {
      id: `evt_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: parsedPayload.data || { object: {} },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: parsedPayload.type || 'checkout.session.completed',
    } as Stripe.Event;

    return mockEvent;
  }

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
 * Retrieve a checkout session by ID (or mock if USE_MOCK_STRIPE=true)
 *
 * @param sessionId - Stripe session ID
 * @returns Stripe checkout session
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  if (USE_MOCK_STRIPE) {
    // MOCK MODE: Return mock completed checkout session
    const mockSession: Stripe.Checkout.Session = {
      id: sessionId,
      object: 'checkout.session',
      amount_total: 2999, // $29.99 mock amount
      amount_subtotal: 2999,
      currency: 'usd',
      customer: null,
      customer_email: 'mock@example.com',
      metadata: {},
      mode: 'payment',
      payment_intent: `pi_mock_${Date.now()}`,
      payment_status: 'paid', // Mock as completed
      status: 'complete',
      success_url: 'http://localhost:4321/checkout/success',
      cancel_url: 'http://localhost:4321/cart',
      url: null,
      created: Math.floor(Date.now() / 1000),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      livemode: false,
    } as Stripe.Checkout.Session;

    return mockSession;
  }

  return await stripe.checkout.sessions.retrieve(sessionId);
}
