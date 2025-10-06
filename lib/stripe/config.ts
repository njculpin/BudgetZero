import Stripe from "stripe";

// Only initialize Stripe if the secret key is available
// This allows the build to succeed even without Stripe keys
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-09-30.clover",
      typescript: true,
    })
  : null;

export const STRIPE_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  currency: "usd",
  platformFeePercentage: 10, // 10% platform fee
} as const;
