// @vitest-environment node

/**
 * Integrity of the route table.
 *
 * With file-based routing, a route existed because a file existed — the build
 * checked it for us. The table gives that up, so these tests take over the job:
 * every controller must be reachable, every path must resolve to the controller
 * it names, and nothing may be declared twice.
 *
 * The orphan check is the important one. A controller no longer reachable
 * because nobody added it to the table is dead code that still typechecks,
 * still has tests, and serves no traffic — and nothing else would notice.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routes } from '../routes';
import { createRouter, compileRoutes } from '../router';

const CONTROLLERS = fileURLToPath(new URL('../controllers', import.meta.url));

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry !== '__tests__') out.push(...walk(p));
    } else if (p.endsWith('.ts')) {
      out.push(p);
    }
  }
  return out;
}

describe('route table integrity', () => {
  it('compiles without duplicate or malformed entries', () => {
    expect(() => compileRoutes(routes)).not.toThrow();
  });

  it('gives every route a callable controller', () => {
    for (const route of routes) {
      expect(typeof route.controller, `${route.method} ${route.path}`).toBe('function');
    }
  });

  it('uses only lowercase, parameterised paths', () => {
    for (const route of routes) {
      expect(route.path, 'must start with a slash').toMatch(/^\//);
      expect(route.path, 'no trailing slash').not.toMatch(/.\/$/);
      expect(route.path, 'square brackets are file-router syntax').not.toMatch(/[[\]]/);
      expect(route.path, 'the /api prefix is added by the mount point').not.toMatch(/^\/api\//);
    }
  });

  it('leaves no controller file unreachable', () => {
    // Every module under controllers/ should be referenced by the table. A file
    // that is not is either dead or was forgotten when its route was added.
    const files = walk(CONTROLLERS)
      .map((f) => relative(CONTROLLERS, f).split('\\').join('/').replace(/\.ts$/, ''))
      .filter((f) => !f.endsWith('.test'));

    // Read the table's own import specifiers rather than guessing from
    // function names: `index.ts` files export names that share nothing with
    // their filename, and a heuristic there produces false alarms.
    const tableSource = readFileSync(
      fileURLToPath(new URL('../routes.ts', import.meta.url)),
      'utf8'
    );
    const imported = new Set(
      [...tableSource.matchAll(/from '\.\/controllers\/([^']+)'/g)].map((m) => m[1])
    );

    const unreferenced = files.filter((file) => !imported.has(file));

    expect(unreferenced, `unreachable controller files:\n${unreferenced.join('\n')}`).toEqual([]);
  });

  it('resolves every declared path back to its own controller', () => {
    const router = createRouter(routes);

    for (const route of routes) {
      // Substitute a concrete value for each dynamic segment.
      const concrete = route.path.replace(/:([A-Za-z]+)/g, 'sample-value');
      const result = router.match(route.method, concrete);

      expect(result.kind, `${route.method} ${route.path} did not resolve`).toBe('match');
      if (result.kind !== 'match') continue;

      expect(
        result.match.route.controller,
        `${route.method} ${concrete} resolved to ${result.match.route.path}, not ${route.path}`
      ).toBe(route.controller);
    }
  });

  it('protects by default — only deliberately public routes are open', () => {
    const open = routes.filter((r) => r.public).map((r) => `${r.method} ${r.path}`).sort();

    // Pinned deliberately. Adding a route to this list means anyone on the
    // internet can call it, so it should be a visible diff in review.
    expect(open).toEqual([
      'GET /auth/callback',
      'GET /auth/sign-out',
      'GET /tags/suggestions',
      'GET /users/search-users',
      'POST /auth/reset-password',
      'POST /auth/sign-in',
      'POST /auth/sign-out',
      'POST /auth/sign-up',
      'POST /auth/update-password',
      'POST /subscribe',
      'POST /webhooks/stripe',
    ].sort());
  });

  it('names each controller after the path it serves', () => {
    // Without this, pointing a route at the wrong controller is undetectable:
    // the router faithfully returns whatever the table says, so a test that
    // only compares the two agrees with itself. Tying the name to the path
    // gives the table an independent thing to be wrong about.
    //
    // `/products/search-products` -> productsSearchProducts
    // `/products/:productId/files` -> productsProductIdFiles
    // A path with more than one method suffixes it: authSignOutGet / authSignOutPost.
    const methodsPerPath = new Map<string, number>();
    for (const r of routes) {
      methodsPerPath.set(r.path, (methodsPerPath.get(r.path) ?? 0) + 1);
    }

    const mismatches: string[] = [];
    for (const route of routes) {
      const camel = route.path
        .split('/')
        .filter(Boolean)
        .map((seg) => (seg.startsWith(':') ? seg.slice(1) : seg))
        .join('-')
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase());

      const base = camel.charAt(0).toLowerCase() + camel.slice(1);
      const method = route.method;
      const suffixed = base + method.charAt(0) + method.slice(1).toLowerCase();
      const allowed =
        (methodsPerPath.get(route.path) ?? 0) > 1 ? [suffixed] : [base, suffixed];

      if (!allowed.includes(route.controller.name)) {
        mismatches.push(
          `${method} ${route.path} -> ${route.controller.name} (expected ${allowed.join(' or ')})`
        );
      }
    }

    expect(
      mismatches,
      `controller names out of step with their paths:\n${mismatches.join('\n')}`
    ).toEqual([]);
  });

  it('keeps the collision-prone product routes distinct', () => {
    // The four paths that share a method with /products/:productId. If the
    // router ever regresses, these are the ones that break first.
    const router = createRouter(routes);

    for (const path of [
      '/products/embeddable',
      '/products/embedded-usage',
      '/products/search-products',
      '/products/search-embeddable',
    ]) {
      const result = router.match('GET', path);
      expect(result.kind).toBe('match');
      if (result.kind !== 'match') continue;
      expect(result.match.route.path, `${path} was swallowed`).toBe(path);
      expect(result.match.params).toEqual({});
    }
  });
});
