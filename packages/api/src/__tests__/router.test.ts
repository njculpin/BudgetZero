import { describe, it, expect } from 'vitest';
import { createRouter, compileRoutes, type RouteDefinition } from '../router';
import type { Controller } from '../context';
import { json } from '../responses';

const stub: Controller = async () => json({ ok: true });

function route(
  method: RouteDefinition['method'],
  path: string,
  extra: Partial<RouteDefinition> = {}
): RouteDefinition {
  return { method, path, controller: stub, ...extra };
}

describe('createRouter — specificity', () => {
  /**
   * The reason this router needs to exist rather than a loop over a list. These
   * exact pairs are in the real table: 21 static paths overlap a dynamic
   * pattern, and four of them share a method with it.
   */
  it('prefers a static segment over a dynamic one regardless of declaration order', () => {
    const dynamicFirst = createRouter([
      route('GET', '/products/:productId'),
      route('GET', '/products/search-products'),
    ]);
    const staticFirst = createRouter([
      route('GET', '/products/search-products'),
      route('GET', '/products/:productId'),
    ]);

    for (const router of [dynamicFirst, staticFirst]) {
      const result = router.match('GET', '/products/search-products');
      expect(result.kind).toBe('match');
      if (result.kind !== 'match') return;
      expect(result.match.route.path).toBe('/products/search-products');
      expect(result.match.params).toEqual({});
    }
  });

  it.each([
    '/products/embeddable',
    '/products/embedded-usage',
    '/products/search-products',
    '/products/search-embeddable',
  ])('does not swallow %s as a productId', (path) => {
    const router = createRouter([
      route('GET', '/products/:productId'),
      route('GET', '/products/embeddable'),
      route('GET', '/products/embedded-usage'),
      route('GET', '/products/search-products'),
      route('GET', '/products/search-embeddable'),
    ]);

    const result = router.match('GET', path);
    expect(result.kind).toBe('match');
    if (result.kind !== 'match') return;
    expect(result.match.route.path).toBe(path);
  });

  it('still matches a genuine id against the dynamic route', () => {
    const router = createRouter([
      route('GET', '/products/:productId'),
      route('GET', '/products/search-products'),
    ]);

    const result = router.match('GET', '/products/8f3a-not-a-keyword');
    expect(result.kind).toBe('match');
    if (result.kind !== 'match') return;
    expect(result.match.route.path).toBe('/products/:productId');
    expect(result.match.params).toEqual({ productId: '8f3a-not-a-keyword' });
  });

  it('prefers the pattern with more static segments', () => {
    const router = createRouter([
      route('GET', '/a/:b/:c'),
      route('GET', '/a/b/:c'),
    ]);

    const result = router.match('GET', '/a/b/c');
    expect(result.kind).toBe('match');
    if (result.kind !== 'match') return;
    expect(result.match.route.path).toBe('/a/b/:c');
  });

  it('breaks a tie on equal static counts by the earlier static segment', () => {
    // Both patterns have two static segments, so counting alone cannot choose.
    // The convention is that the leftmost static segment wins, which makes
    // matching left-to-right and therefore predictable to read.
    const router = createRouter([
      route('GET', '/a/:b/c'),
      route('GET', '/a/b/:c'),
    ]);

    const result = router.match('GET', '/a/b/c');
    expect(result.kind).toBe('match');
    if (result.kind !== 'match') return;
    expect(result.match.route.path).toBe('/a/b/:c');
  });
});

describe('createRouter — matching', () => {
  const router = createRouter([
    route('GET', '/notifications'),
    route('DELETE', '/notifications/:id'),
    route('POST', '/notifications/:id/read'),
    route('GET', '/products/:productId/files'),
    route('POST', '/webhooks/stripe', { public: true }),
  ]);

  it('extracts multiple and nested params', () => {
    const result = router.match('POST', '/notifications/abc-123/read');
    expect(result.kind).toBe('match');
    if (result.kind !== 'match') return;
    expect(result.match.params).toEqual({ id: 'abc-123' });
  });

  it('url-decodes param values', () => {
    const result = router.match('GET', '/products/a%2Fb/files');
    expect(result.kind).toBe('match');
    if (result.kind !== 'match') return;
    expect(result.match.params).toEqual({ productId: 'a/b' });
  });

  it('reports method-not-allowed rather than not-found for a known path', () => {
    // A 404 here would be a lie, and would send someone hunting for a route
    // that exists.
    const result = router.match('PUT', '/notifications/abc');
    expect(result.kind).toBe('method-not-allowed');
    if (result.kind !== 'method-not-allowed') return;
    expect(result.allowed).toEqual(['DELETE']);
  });

  it('reports not-found for a path in no route', () => {
    expect(router.match('GET', '/nope').kind).toBe('not-found');
    expect(router.match('GET', '/notifications/a/b/c/d').kind).toBe('not-found');
  });

  it('treats HEAD as GET', () => {
    const result = router.match('HEAD', '/notifications');
    expect(result.kind).toBe('match');
  });

  it('accepts a lowercase method', () => {
    expect(router.match('post', '/notifications/x/read').kind).toBe('match');
  });

  it('collapses a double slash rather than matching an empty param', () => {
    // Empty segments are dropped when the path is split, so this is a two
    // segment path and matches nothing three segments long.
    expect(router.match('GET', '/products//files').kind).toBe('not-found');
  });

  it('is indifferent to a trailing slash on the request', () => {
    expect(router.match('GET', '/notifications/').kind).toBe('match');
  });

  it('carries the public flag through to the match', () => {
    const result = router.match('POST', '/webhooks/stripe');
    expect(result.kind).toBe('match');
    if (result.kind !== 'match') return;
    expect(result.match.route.public).toBe(true);
  });

  it('defaults a route to protected when public is not set', () => {
    const result = router.match('GET', '/notifications');
    expect(result.kind).toBe('match');
    if (result.kind !== 'match') return;
    expect(result.match.route.public).toBeUndefined();
  });
});

describe('compileRoutes — table integrity', () => {
  it('rejects two routes claiming the same method and path', () => {
    expect(() =>
      compileRoutes([route('GET', '/products'), route('GET', '/products')])
    ).toThrow(/Duplicate route: GET \/products/);
  });

  it('allows the same path under different methods', () => {
    expect(() =>
      compileRoutes([route('GET', '/products'), route('POST', '/products')])
    ).not.toThrow();
  });

  it('rejects a path without a leading slash', () => {
    expect(() => compileRoutes([route('GET', 'products')])).toThrow(/must start with/);
  });
});
