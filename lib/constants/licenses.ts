import { LicenseType } from "@/lib/types/database";

export interface LicenseTemplate {
  type: LicenseType;
  name: string;
  description: string;
  icon: string;
  permissions: {
    personalUse: boolean;
    commercialUse: boolean;
    modification: boolean;
    redistribution: boolean;
    printAndSell: boolean;
    digitalResale: boolean;
    attribution: boolean;
  };
  terms: string;
}

export const LICENSE_TEMPLATES: Record<LicenseType, LicenseTemplate> = {
  free: {
    type: "free",
    name: "Free License",
    description:
      "Free for personal and commercial use. Attribution appreciated but not required.",
    icon: "Gift",
    permissions: {
      personalUse: true,
      commercialUse: true,
      modification: true,
      redistribution: false,
      printAndSell: false,
      digitalResale: false,
      attribution: false,
    },
    terms: `
# Free License

This asset is provided free of charge for both personal and commercial projects.

## You MAY:
- Use in personal tabletop game projects
- Use in commercial tabletop games (rulebooks, cards, components)
- Modify and adapt the asset for your needs
- Include in printed rulebooks or game components
- 3D print models for personal use (if applicable)

## You MAY NOT:
- Resell or redistribute the original digital files
- Include in asset packs or bundles for sale
- Claim the original work as your own
- Sell 3D prints or reproductions of this asset
- Share or sell the digital files

## Attribution:
Attribution is appreciated but not required. If you do attribute, please link back to the creator's Workshop profile.

## Usage Notes:
- Physical prints or reproductions must be for personal use or as components in your published tabletop game
- Digital files remain the property of the creator
    `.trim(),
  },

  attribution: {
    type: "attribution",
    name: "Attribution Required",
    description:
      "Free for personal and commercial use with proper attribution to the creator.",
    icon: "UserCheck",
    permissions: {
      personalUse: true,
      commercialUse: true,
      modification: true,
      redistribution: false,
      printAndSell: false,
      digitalResale: false,
      attribution: true,
    },
    terms: `
# Attribution Required License

This asset is free to use for both personal and commercial projects, but you MUST provide attribution to the creator.

## You MAY:
- Use in personal tabletop game projects
- Use in commercial tabletop games (rulebooks, cards, components)
- Modify and adapt the asset for your needs
- Include in printed rulebooks or game components
- 3D print models for personal use (if applicable)
- Sell 3D prints or reproductions if you provide clear attribution

## You MUST:
- Provide clear attribution to the creator in your project
- Include a link to the creator's Workshop profile when possible
- Mention the creator's name in credits or rulebook
- Include attribution on packaging/listing when selling physical reproductions

## You MAY NOT:
- Resell or redistribute the original digital files
- Include in asset packs or bundles for sale
- Claim the original work as your own
- Share or sell the digital files

## Attribution Format:
"[Asset Title] by [Creator Name] from Workshop (workshop.dev/creators/[username])"

## Usage Notes:
- Attribution must be included in any product using this asset
- Digital files remain the property of the creator
    `.trim(),
  },

  commercial: {
    type: "commercial",
    name: "Commercial License",
    description:
      "Requires purchase for commercial use. Includes print-and-sell rights.",
    icon: "DollarSign",
    permissions: {
      personalUse: true,
      commercialUse: true,
      modification: true,
      redistribution: false,
      printAndSell: true,
      digitalResale: false,
      attribution: false,
    },
    terms: `
# Commercial License

Purchase this license to use this asset in commercial tabletop game projects with extended rights.

## You MAY:
- Use in personal projects
- Use in commercial tabletop games (rulebooks, cards, components)
- Modify and adapt the asset for your needs
- Include in printed rulebooks or game components
- Sell products that include this asset
- 3D print and sell physical prints (if applicable)
- Include reproductions as components in your published game
- Bulk manufacturing with no unit limits

## You MAY NOT:
- Resell or redistribute the original digital files
- Include in asset packs or bundles for sale as raw assets
- Sublicense the asset to others
- Use in competing asset marketplaces
- Sell or share the digital files

## Attribution:
Attribution is appreciated but not required for purchased commercial licenses.

## Scope:
This license is valid for a single project or product line. For use across multiple distinct projects, please purchase multiple licenses or contact the creator for an extended license.

## Usage Notes:
- Print-and-sell rights are included in this commercial license
- You may modify for your manufacturing needs
- Digital files remain the property of the creator
    `.trim(),
  },

  exclusive: {
    type: "exclusive",
    name: "Exclusive License",
    description:
      "Exclusive rights with full control. Creator removes asset from marketplace.",
    icon: "Crown",
    permissions: {
      personalUse: true,
      commercialUse: true,
      modification: true,
      redistribution: false,
      printAndSell: true,
      digitalResale: false,
      attribution: false,
    },
    terms: `
# Exclusive License

Purchase exclusive rights to this asset. The creator will remove it from the marketplace.

## You MAY:
- Use in personal and commercial tabletop game projects
- Use in unlimited projects and products
- Modify and adapt the asset extensively
- Sell products that include this asset
- Request removal from marketplace (creator agrees to delist)
- Have exclusive use in your industry/niche (terms to be negotiated)
- Full print-and-sell rights with no restrictions (if applicable)
- Create derivative works
- Bulk manufacturing with no unit limits

## You MAY NOT:
- Resell or redistribute the original digital files as assets
- Sublicense the asset to competitors
- Use in competing asset marketplaces
- Sell the digital files as assets

## Exclusivity Terms:
- Creator agrees to remove asset from public marketplace
- Creator retains copyright but grants exclusive commercial use
- Duration and scope of exclusivity to be agreed upon in writing
- Exclusivity may be limited by industry, geography, or time period
- Creator will not license this asset to others during exclusivity period

## Attribution:
Not required, but creator may request portfolio credit.

## Note:
Exclusive licenses are typically negotiated directly with the creator. Contact them to discuss specific terms, exclusivity scope, and pricing.

## Usage Notes:
- You may modify extensively for your manufacturing needs
- Digital files remain the property of the creator
    `.trim(),
  },
};

export interface UsageRightOption {
  id: string;
  label: string;
  description: string;
  applicableTypes: AssetType[];
}

export const USAGE_RIGHTS_OPTIONS: UsageRightOption[] = [
  {
    id: "personal_use",
    label: "Personal Use Only",
    description: "For personal projects and non-commercial use",
    applicableTypes: ["model", "illustration", "photo", "texture", "audio"],
  },
  {
    id: "commercial_game",
    label: "Commercial Game Use",
    description: "Use in commercial tabletop games and rulebooks",
    applicableTypes: ["model", "illustration", "photo", "texture", "audio"],
  },
  {
    id: "print_personal",
    label: "3D Printing (Personal)",
    description: "Print for personal use, not for sale",
    applicableTypes: ["model"],
  },
  {
    id: "print_commercial",
    label: "3D Printing (Commercial)",
    description: "Print and sell physical copies",
    applicableTypes: ["model"],
  },
  {
    id: "modification",
    label: "Modification Rights",
    description: "Modify, remix, and create derivatives",
    applicableTypes: ["model", "illustration", "photo", "texture", "audio"],
  },
  {
    id: "digital_product",
    label: "Digital Product Inclusion",
    description: "Include in digital products or PDFs",
    applicableTypes: ["model", "illustration", "photo", "texture", "audio"],
  },
  {
    id: "print_product",
    label: "Physical Product Inclusion",
    description: "Include in printed books, cards, or components",
    applicableTypes: ["illustration", "photo"],
  },
];

// Type for the applicableTypes to ensure type safety
type AssetType = "model" | "illustration" | "photo" | "texture" | "audio";

export function getLicenseTemplate(type: LicenseType): LicenseTemplate {
  return LICENSE_TEMPLATES[type];
}

export function getFullLicenseText(
  type: LicenseType
): string {
  const template = LICENSE_TEMPLATES[type];
  return template.terms;
}

export function getLicensePermissions(type: LicenseType) {
  return LICENSE_TEMPLATES[type].permissions;
}

// Helper to validate if a license type allows specific usage
export function canUsageTypeApply(
  licenseType: LicenseType,
  usageType: keyof LicenseTemplate["permissions"]
): boolean {
  return LICENSE_TEMPLATES[licenseType].permissions[usageType];
}

// Pricing suggestions based on license type (in cents)
export const SUGGESTED_PRICING: Record<
  LicenseType,
  { min: number; max: number; recommended: number }
> = {
  free: { min: 0, max: 0, recommended: 0 },
  attribution: { min: 0, max: 0, recommended: 0 },
  commercial: { min: 500, max: 50000, recommended: 2000 }, // $5 - $500, recommended $20
  exclusive: { min: 10000, max: 500000, recommended: 50000 }, // $100 - $5000, recommended $500
};

export function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

export function getSuggestedPrice(licenseType: LicenseType): number {
  return SUGGESTED_PRICING[licenseType].recommended;
}