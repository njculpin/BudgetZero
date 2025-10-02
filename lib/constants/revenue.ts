// Revenue and pricing constants for Workshop platform

export const REVENUE_CONSTANTS = {
  // Platform fee percentage (2%)
  PLATFORM_FEE_PERCENTAGE: 0.02,

  // Example sale price for revenue split previews
  EXAMPLE_SALE_PRICE: 30,

  // Minimum payout threshold
  MINIMUM_PAYOUT_DOLLARS: 10,

  // Royalty percentage limits
  MIN_ROYALTY_PERCENTAGE: 0,
  MAX_ROYALTY_PERCENTAGE: 50,
} as const;

// Type-safe access to constants
export type RevenueConstants = typeof REVENUE_CONSTANTS;
