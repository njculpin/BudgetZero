/**
 * Stripe SDK Client Configuration
 *
 * This module initializes and exports the Stripe client instance.
 * Following the SDK isolation pattern - Stripe should ONLY be imported here.
 */

import Stripe from 'stripe';

const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});
