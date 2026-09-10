import type { Controller } from './context';

/**
 * The API routing table.
 *
 * Routes used to exist because a file existed at the right path under
 * `src/pages/api/`, which meant 68 four-line adapter files whose only job was to
 * be in the right place. The table below is that same information, declared once
 * and mounted by a single catch-all — so the routing lives next to the
 * controllers rather than in the shape of another package's directory tree.
 *
 * Two things this has to do that Astro's file router did for free:
 *
 *  1. **Prefer static segments over dynamic ones.** `/products/search-products`
 *     and `/products/:productId` have the same shape. Matching in declaration
 *     order would read the former as `productId = 'search-products'`. There are
 *     21 such pairs in this table and 4 of them share a method.
 *
 *  2. **Distinguish "no such path" from "wrong method".** A file-based router
 *     gets this from the exported handler names; here it needs saying.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RouteDefinition {
  method: HttpMethod;
  /**
   * Path below `/api`, with a leading slash. Dynamic segments are `:name`.
   * e.g. `/products/:productId/files`
   */
  path: string;
  controller: Controller;
  /**
   * Anonymous callers are allowed through. Defaults to false, so a route added
   * without thinking about it is protected rather than exposed — the same
   * default the middleware's catch-all used to provide.
   *
   * Declared here, beside the controller, rather than in a separate list in
   * another package. Two routes were previously protected *only* by their
   * absence from that list, with no check of their own.
   */
  public?: boolean;
}

export interface RouteMatch {
  route: RouteDefinition;
  params: Record<string, string>;
}

/** Distinguishes an unknown path from a known path called with the wrong verb. */
export type MatchResult =
  | { kind: 'match'; match: RouteMatch }
  | { kind: 'method-not-allowed'; allowed: HttpMethod[] }
  | { kind: 'not-found' };

interface CompiledRoute {
  route: RouteDefinition;
  segments: string[];
  /** Higher wins. Static segments are worth more the earlier they appear. */
  specificity: number;
}

function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/**
 * Score a path so that more specific patterns sort first.
 *
 * A static segment outranks a dynamic one at the same position, and an earlier
 * position outranks a later one — so `/products/search-products` beats
 * `/products/:productId`, and `/a/b/:c` beats `/a/:b/:c`.
 */
function specificityOf(segments: string[]): number {
  let score = 0;
  segments.forEach((segment, index) => {
    if (!segment.startsWith(':')) {
      score += 1 << (16 - Math.min(index, 15));
    }
  });
  return score;
}

export function compileRoutes(routes: readonly RouteDefinition[]): CompiledRoute[] {
  const seen = new Set<string>();
  for (const route of routes) {
    const key = `${route.method} ${route.path}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate route: ${key}`);
    }
    seen.add(key);

    if (!route.path.startsWith('/')) {
      throw new Error(`Route path must start with "/": ${key}`);
    }
  }

  return routes
    .map((route) => {
      const segments = splitPath(route.path);
      return { route, segments, specificity: specificityOf(segments) };
    })
    .sort((a, b) => b.specificity - a.specificity);
}

function matchSegments(
  pattern: string[],
  actual: string[]
): Record<string, string> | null {
  if (pattern.length !== actual.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    if (p.startsWith(':')) {
      params[p.slice(1)] = decodeURIComponent(actual[i]);
    } else if (p !== actual[i]) {
      return null;
    }
  }
  return params;
}

export interface Router {
  match(method: string, pathname: string): MatchResult;
  readonly routes: readonly RouteDefinition[];
}

/**
 * Build a router from a route table.
 *
 * `pathname` is the path below `/api`, e.g. `/products/abc/files`. Compilation
 * happens once, at construction, so matching a request is a scan of a
 * pre-sorted list.
 */
export function createRouter(routes: readonly RouteDefinition[]): Router {
  const compiled = compileRoutes(routes);

  return {
    routes,
    match(method: string, pathname: string): MatchResult {
      const actual = splitPath(pathname);
      const upper = method.toUpperCase();

      // HEAD is GET without a body; the platform strips the body for us.
      const wanted = upper === 'HEAD' ? 'GET' : upper;

      const pathMatches: CompiledRoute[] = [];

      for (const candidate of compiled) {
        const params = matchSegments(candidate.segments, actual);
        if (params === null) continue;

        pathMatches.push(candidate);
        if (candidate.route.method === wanted) {
          return { kind: 'match', match: { route: candidate.route, params } };
        }
      }

      if (pathMatches.length > 0) {
        return {
          kind: 'method-not-allowed',
          allowed: [...new Set(pathMatches.map((c) => c.route.method))],
        };
      }

      return { kind: 'not-found' };
    },
  };
}
