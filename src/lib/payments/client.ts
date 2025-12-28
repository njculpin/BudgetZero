/**
 * Stripe SDK Client Configuration
 *
 * This module initializes and exports the Stripe client instance.
 * Following the SDK isolation pattern - Stripe should ONLY be imported here.
 *
 * MOCK MODE: Set USE_MOCK_STRIPE=true to bypass Stripe client initialization
 */

import Stripe from 'stripe';

// Mock mode flag - set to true to bypass Stripe
const USE_MOCK_STRIPE = true;

const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

if (!USE_MOCK_STRIPE && !stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

// Export stripe client (only initialized if not in mock mode)
export const stripe = USE_MOCK_STRIPE
  ? (null as unknown as Stripe) // Mock mode - client not used
  : new Stripe(stripeSecretKey!, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    });
