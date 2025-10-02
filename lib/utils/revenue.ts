import { REVENUE_CONSTANTS } from "@/lib/constants/revenue";

export interface RoyaltyContributor {
  name: string;
  percentage: number;
}

export interface RevenueBreakdown {
  salePrice: number;
  platformFee: number;
  royalties: Array<{
    name: string;
    percentage: number;
    amount: number;
  }>;
  creatorReceives: number;
  totalRoyalties: number;
}

/**
 * Calculate revenue breakdown for a sale with royalty contributors
 *
 * @param royaltyContributors - Array of contributors with names and royalty percentages
 * @param salePrice - Sale price in dollars (defaults to example price)
 * @returns Detailed revenue breakdown
 */
export function calculateRevenueBreakdown(
  royaltyContributors: RoyaltyContributor[],
  salePrice: number = REVENUE_CONSTANTS.EXAMPLE_SALE_PRICE,
): RevenueBreakdown {
  // Calculate platform fee
  const platformFee = salePrice * REVENUE_CONSTANTS.PLATFORM_FEE_PERCENTAGE;

  // Calculate individual royalties
  const royalties = royaltyContributors.map(({ name, percentage }) => ({
    name,
    percentage,
    amount: (salePrice * percentage) / 100,
  }));

  // Sum total royalties
  const totalRoyalties = royalties.reduce((sum, r) => sum + r.amount, 0);

  // Calculate what the project creator receives
  const creatorReceives = salePrice - platformFee - totalRoyalties;

  return {
    salePrice,
    platformFee,
    royalties,
    totalRoyalties,
    creatorReceives,
  };
}

/**
 * Calculate single royalty amount
 *
 * @param salePrice - Sale price in dollars
 * @param royaltyPercentage - Royalty percentage (0-50)
 * @returns Royalty amount in dollars
 */
export function calculateRoyaltyAmount(
  salePrice: number,
  royaltyPercentage: number,
): number {
  return (salePrice * royaltyPercentage) / 100;
}

/**
 * Calculate platform fee for a sale
 *
 * @param salePrice - Sale price in dollars
 * @returns Platform fee amount in dollars
 */
export function calculatePlatformFee(salePrice: number): number {
  return salePrice * REVENUE_CONSTANTS.PLATFORM_FEE_PERCENTAGE;
}

/**
 * Validate royalty percentage is within allowed range
 *
 * @param percentage - Royalty percentage to validate
 * @returns True if valid, false otherwise
 */
export function isValidRoyaltyPercentage(percentage: number): boolean {
  return (
    percentage >= REVENUE_CONSTANTS.MIN_ROYALTY_PERCENTAGE &&
    percentage <= REVENUE_CONSTANTS.MAX_ROYALTY_PERCENTAGE
  );
}

/**
 * Format currency amount to USD string
 *
 * @param amount - Amount in dollars
 * @returns Formatted currency string (e.g., "$12.50")
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
