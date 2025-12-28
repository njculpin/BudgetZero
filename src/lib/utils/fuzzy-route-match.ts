/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed to change one string into another
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * All available routes in the application
 * Used for fuzzy matching on 404 pages
 */
export const AVAILABLE_ROUTES = [
  // Main pages
  { path: "/", label: "Homepage", description: "Landing page and site overview" },
  { path: "/about", label: "About", description: "About Game Loopers" },
  { path: "/terms", label: "Terms", description: "Terms of Service" },
  { path: "/privacy", label: "Privacy", description: "Privacy Policy" },

  // Product & Asset pages
  { path: "/products", label: "Products", description: "Browse game products and digital downloads" },
  { path: "/assets", label: "Assets", description: "Digital assets (3D models, PDFs, images)" },
  { path: "/tags", label: "Tags", description: "Browse by tags" },

  // User & Social
  { path: "/users", label: "Creators", description: "Creator directory - Find illustrators, designers, 3D modelers, and more" },
  { path: "/feed", label: "Feed", description: "Activity feed" },

  // Jams
  { path: "/jams", label: "Jams", description: "Game jams and competitions" },

  // Documents (authenticated)
  { path: "/documents", label: "Documents", description: "Collaborative document editor" },

  // Commerce
  { path: "/cart", label: "Cart", description: "Shopping cart" },
  { path: "/purchases", label: "Purchases", description: "Your purchase history" },

  // Auth & Account
  { path: "/sign-in", label: "Sign In", description: "User authentication" },
  { path: "/sign-up", label: "Sign Up", description: "Create an account" },
  { path: "/settings", label: "Settings", description: "Account settings and payout setup" },
];

export interface RouteMatch {
  path: string;
  label: string;
  description: string;
  distance: number;
  similarity: number;
}

/**
 * Find routes that are similar to the requested path
 * @param requestedPath - The path that was not found
 * @param maxDistance - Maximum Levenshtein distance to consider (default: 5)
 * @param maxResults - Maximum number of results to return (default: 3)
 * @returns Array of similar routes sorted by similarity
 */
export function findSimilarRoutes(
  requestedPath: string,
  maxDistance: number = 5,
  maxResults: number = 3
): RouteMatch[] {
  // Normalize the requested path
  const normalizedRequest = requestedPath.toLowerCase().trim();

  // Calculate distance for each route
  const matches: RouteMatch[] = AVAILABLE_ROUTES.map((route) => {
    const normalizedRoute = route.path.toLowerCase();
    const distance = levenshteinDistance(normalizedRequest, normalizedRoute);

    // Calculate similarity percentage (inverse of distance relative to max length)
    const maxLen = Math.max(normalizedRequest.length, normalizedRoute.length);
    const similarity = maxLen > 0 ? ((maxLen - distance) / maxLen) * 100 : 0;

    return {
      ...route,
      distance,
      similarity,
    };
  });

  // Filter by max distance and sort by distance (ascending)
  const filtered = matches
    .filter((match) => match.distance <= maxDistance)
    .sort((a, b) => {
      // Primary sort: by distance (closer is better)
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      // Secondary sort: by similarity percentage (higher is better)
      return b.similarity - a.similarity;
    });

  // Return top N results
  return filtered.slice(0, maxResults);
}

/**
 * Check if a path segment matches common patterns
 * Useful for detecting patterns like /products/:id or /users/:handle
 */
export function detectPatternMatch(requestedPath: string): string | null {
  const segments = requestedPath.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  // Pattern: /products/:something -> suggest /products
  if (segments[0] === "products" && segments.length > 1) {
    return "/products";
  }

  // Pattern: /assets/:something -> suggest /assets
  if (segments[0] === "assets" && segments.length > 1) {
    return "/assets";
  }

  // Pattern: /users/:something -> suggest /users
  if (segments[0] === "users" && segments.length > 1) {
    return "/users";
  }

  // Pattern: /jams/:something -> suggest /jams
  if (segments[0] === "jams" && segments.length > 1) {
    return "/jams";
  }

  // Pattern: /documents/:something -> suggest /documents
  if (segments[0] === "documents" && segments.length > 1) {
    return "/documents";
  }

  return null;
}
