import { DollarSign } from "lucide-react";
import { REVENUE_CONSTANTS } from "@/lib/constants/revenue";
import type { RoyaltyContributor } from "@/lib/utils/revenue";
import { calculateRevenueBreakdown, formatCurrency } from "@/lib/utils/revenue";

interface RevenueSplitPreviewProps {
  royaltyContributors: RoyaltyContributor[];
  salePrice?: number;
  variant?: "default" | "compact" | "card";
  showPlatformFee?: boolean;
  showCreatorAmount?: boolean;
  className?: string;
}

export function RevenueSplitPreview({
  royaltyContributors,
  salePrice = REVENUE_CONSTANTS.EXAMPLE_SALE_PRICE,
  variant = "default",
  showPlatformFee = true,
  showCreatorAmount = true,
  className = "",
}: RevenueSplitPreviewProps) {
  const breakdown = calculateRevenueBreakdown(royaltyContributors, salePrice);

  if (variant === "compact") {
    return (
      <div className={`text-sm space-y-1 ${className}`}>
        {showPlatformFee && (
          <div className="flex justify-between">
            <span>
              Platform fee ({REVENUE_CONSTANTS.PLATFORM_FEE_PERCENTAGE * 100}%)
            </span>
            <span className="font-medium">
              {formatCurrency(breakdown.platformFee)}
            </span>
          </div>
        )}
        {breakdown.royalties.map((royalty, index) => (
          <div key={index} className="flex justify-between text-green-700">
            <span>
              {royalty.name}'s royalty ({royalty.percentage}%)
            </span>
            <span className="font-medium">
              {formatCurrency(royalty.amount)}
            </span>
          </div>
        ))}
        {showCreatorAmount && (
          <div className="flex justify-between text-gray-500">
            <span>Project creator receives</span>
            <span className="font-medium">
              {formatCurrency(breakdown.creatorReceives)}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={`p-4 border-2 border-blue-200 rounded-lg bg-blue-50 space-y-3 ${className}`}
      >
        <h4 className="font-semibold text-blue-900">Revenue Split Preview</h4>
        <p className="text-sm text-blue-700">
          When your project sells for ${formatCurrency(breakdown.salePrice)},
          the revenue will be split:
        </p>

        <div className="bg-white rounded-md p-4 space-y-2 text-sm">
          {showPlatformFee && (
            <div className="flex justify-between">
              <span className="text-gray-700">
                Platform fee ({REVENUE_CONSTANTS.PLATFORM_FEE_PERCENTAGE * 100}
                %):
              </span>
              <span className="font-medium text-gray-900">
                ${formatCurrency(breakdown.platformFee)}
              </span>
            </div>
          )}
          {breakdown.royalties.map((royalty, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-gray-700">
                {royalty.name}'s royalty ({royalty.percentage}%):
              </span>
              <span className="font-medium text-green-700">
                ${formatCurrency(royalty.amount)}
              </span>
            </div>
          ))}
          {showCreatorAmount && (
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">You receive:</span>
              <span className="font-bold text-blue-700">
                ${formatCurrency(breakdown.creatorReceives)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-gray-50 rounded-md p-3 space-y-1 text-xs ${className}`}>
      <div className="flex items-center gap-2 font-medium text-gray-700 mb-2">
        <DollarSign className="w-4 h-4" />
        Revenue Split (Example: {formatCurrency(breakdown.salePrice)} sale)
      </div>
      {showPlatformFee && (
        <div className="flex justify-between">
          <span>
            Platform fee ({REVENUE_CONSTANTS.PLATFORM_FEE_PERCENTAGE * 100}%)
          </span>
          <span className="font-medium">
            {formatCurrency(breakdown.platformFee)}
          </span>
        </div>
      )}
      {breakdown.royalties.map((royalty, index) => (
        <div key={index} className="flex justify-between text-green-700">
          <span>
            {royalty.name}'s royalty ({royalty.percentage}%)
          </span>
          <span className="font-medium">{formatCurrency(royalty.amount)}</span>
        </div>
      ))}
      {showCreatorAmount && (
        <div className="flex justify-between text-gray-500">
          <span>Project creator receives</span>
          <span className="font-medium">
            {formatCurrency(breakdown.creatorReceives)}
          </span>
        </div>
      )}
    </div>
  );
}
