import type { LicenseType } from "@/lib/types/database";

/**
 * License compatibility matrix for merging projects
 *
 * Rules:
 * - Free licenses are compatible with other free licenses
 * - Attribution licenses require all merged projects to maintain attribution
 * - Commercial licenses can merge with other commercial or free licenses
 * - Exclusive licenses cannot be merged (they're exclusive!)
 */

interface LicenseCompatibility {
  compatible: boolean;
  reason?: string;
  warnings?: string[];
}

export function checkLicenseCompatibility(
  licenses: LicenseType[]
): LicenseCompatibility {
  // Remove duplicates
  const uniqueLicenses = Array.from(new Set(licenses));

  // If only one license type, it's always compatible
  if (uniqueLicenses.length === 1) {
    return { compatible: true };
  }

  // Check for exclusive licenses
  if (uniqueLicenses.includes("exclusive")) {
    return {
      compatible: false,
      reason:
        "Exclusive licenses cannot be merged with other projects. Exclusive means sole ownership and usage rights.",
    };
  }

  // Check for incompatible combinations
  const hasCommercial = uniqueLicenses.includes("commercial");
  const hasFree = uniqueLicenses.includes("free");
  const hasAttribution = uniqueLicenses.includes("attribution");

  // Commercial + Free requires careful consideration
  if (hasCommercial && hasFree) {
    return {
      compatible: true,
      warnings: [
        "Merging commercial and free licenses: The resulting project should honor the more restrictive terms.",
        "Free license content cannot be sold independently but can be part of a commercial product.",
      ],
    };
  }

  // Attribution with anything else
  if (hasAttribution) {
    return {
      compatible: true,
      warnings: [
        "Attribution required: All contributors must be credited in the merged project.",
        "Attribution terms from all source projects must be maintained.",
      ],
    };
  }

  // All other combinations are compatible
  return { compatible: true };
}

/**
 * Suggest the best license for a merged collaborative project
 */
export function suggestMergedLicense(licenses: LicenseType[]): {
  suggestedLicense: LicenseType;
  reason: string;
} {
  const uniqueLicenses = Array.from(new Set(licenses));

  // If all same, use that license
  if (uniqueLicenses.length === 1) {
    return {
      suggestedLicense: uniqueLicenses[0],
      reason: "All source projects use the same license.",
    };
  }

  // If any exclusive, cannot merge (but this should be caught by compatibility check)
  if (uniqueLicenses.includes("exclusive")) {
    return {
      suggestedLicense: "exclusive",
      reason: "Exclusive licenses cannot be merged.",
    };
  }

  // If any attribution, use attribution to honor all contributors
  if (uniqueLicenses.includes("attribution")) {
    return {
      suggestedLicense: "attribution",
      reason:
        "Attribution license ensures all contributors are properly credited.",
    };
  }

  // If mixing commercial and free, use commercial but note restrictions
  if (uniqueLicenses.includes("commercial") && uniqueLicenses.includes("free")) {
    return {
      suggestedLicense: "commercial",
      reason:
        "Commercial license for the merged work, honoring free content terms.",
    };
  }

  // If only commercial
  if (uniqueLicenses.includes("commercial")) {
    return {
      suggestedLicense: "commercial",
      reason: "All source projects allow commercial use.",
    };
  }

  // Default to free
  return {
    suggestedLicense: "free",
    reason: "Free license provides the most flexibility for collaborators.",
  };
}

/**
 * Get human-readable explanation of license compatibility
 */
export function getLicenseCompatibilityExplanation(
  license1: LicenseType,
  license2: LicenseType
): string {
  if (license1 === license2) {
    return "Both projects use the same license - fully compatible!";
  }

  if (license1 === "exclusive" || license2 === "exclusive") {
    return "Exclusive licenses cannot be merged. Exclusive means the creator retains sole rights.";
  }

  if (license1 === "attribution" || license2 === "attribution") {
    return "Attribution must be maintained for all contributors in the merged project.";
  }

  if (
    (license1 === "commercial" && license2 === "free") ||
    (license1 === "free" && license2 === "commercial")
  ) {
    return "Commercial and free licenses can be merged, but the free content cannot be sold separately.";
  }

  return "These licenses are compatible for merging.";
}

/**
 * Get list of restrictions for a license
 */
export function getLicenseRestrictions(license: LicenseType): string[] {
  switch (license) {
    case "free":
      return [
        "Can be used freely",
        "No attribution required",
        "Can be modified",
        "Cannot be resold individually",
      ];
    case "attribution":
      return [
        "Can be used freely",
        "Attribution required",
        "Can be modified",
        "Creator must be credited",
      ];
    case "commercial":
      return [
        "Can be used commercially",
        "Can be sold",
        "Can be modified",
        "May require revenue sharing",
      ];
    case "exclusive":
      return [
        "Exclusive to creator",
        "Cannot be merged",
        "All rights reserved",
        "Requires explicit permission",
      ];
    default:
      return [];
  }
}