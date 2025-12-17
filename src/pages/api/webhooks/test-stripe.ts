/**
 * Mock Stripe Webhook Test Endpoint
 *
 * This endpoint allows you to simulate Stripe webhook events in development
 * without needing a real Stripe account or using the Stripe CLI.
 *
 * USAGE:
 * POST /api/webhooks/test-stripe
 * Body: {
 *   "type": "checkout.session.completed",
 *   "session": {
 *     "id": "cs_mock_123",
 *     "amount_total": 2999,
 *     "currency": "usd",
 *     "customer_email": "test@example.com",
 *     "metadata": {
 *       "userId": "user-id",
 *       "cartId": "cart-id"
 *     }
 *   }
 * }
 */

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const eventType = body.type || 'checkout.session.completed';
    const sessionData = body.session || {};

    // Create mock webhook payload
    const mockPayload = {
      type: eventType,
      data: {
        object: {
          id: sessionData.id || `cs_mock_${Date.now()}`,
          object: 'checkout.session',
          amount_total: sessionData.amount_total || 2999,
          amount_subtotal: sessionData.amount_subtotal || 2999,
          currency: sessionData.currency || 'usd',
          customer: null,
          customer_email: sessionData.customer_email || 'test@example.com',
          metadata: sessionData.metadata || {},
          mode: 'payment',
          payment_intent: sessionData.payment_intent || `pi_mock_${Date.now()}`,
          payment_status: 'paid',
          status: 'complete',
          success_url: sessionData.success_url || 'http://localhost:4321/checkout/success',
          cancel_url: sessionData.cancel_url || 'http://localhost:4321/cart',
          url: null,
          created: Math.floor(Date.now() / 1000),
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          livemode: false,
        },
      },
    };

    // Forward to the real webhook handler
    const webhookResponse = await fetch('http://localhost:4321/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'mock_test_signature',
      },
      body: JSON.stringify(mockPayload),
    });

    const webhookResult = await webhookResponse.json();

    return new Response(
      JSON.stringify({
        success: webhookResponse.ok,
        status: webhookResponse.status,
        mockEvent: mockPayload,
        webhookResult,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error testing webhook:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
