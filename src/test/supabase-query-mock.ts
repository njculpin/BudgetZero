import { vi } from 'vitest';

export interface QueryResult {
  data: unknown;
  error: unknown;
}

/**
 * The real PostgREST builder lets you chain `.select().eq().in().order()` in any
 * order and awaits to `{ data, error }`. Hand-rolling that per test produces a
 * stack of nested `vi.fn(() => ({ eq: ... }))` that is hard to read and breaks
 * whenever a filter is added to the query under test — a test should fail because
 * behaviour changed, not because someone appended `.eq('deleted', false)`.
 *
 * Every method on this stand-in returns the same object, and the object is
 * thenable, so it works regardless of which methods the code calls or in what
 * order.
 */

/**
 * Mock `serverClient.from()` so each table name resolves to a fixed result.
 *
 * ```ts
 * mockTables(serverClient, {
 *   sales: { data: [{ id: 'sale-1' }], error: null },
 *   sale_items: { data: [], error: null },
 * });
 * ```
 *
 * A table not listed resolves to an empty successful result, so a test only has
 * to describe the rows it actually cares about.
 */
export function mockTables(
  client: { from: unknown },
  tables: Record<string, QueryResult>
): void {
  const builders = new Map<string, Record<string, unknown>>();

  const build = (result: QueryResult): Record<string, unknown> => {
    const proxy: Record<string, unknown> = new Proxy(
      {
        then: (
          resolve: (value: QueryResult) => unknown,
          reject?: (reason: unknown) => unknown
        ) => Promise.resolve(result).then(resolve, reject),
      } as Record<string, unknown>,
      {
        get(obj, prop) {
          if (prop in obj) return obj[prop as string];
          return () => proxy;
        },
      }
    );
    return proxy;
  };

  vi.mocked(client.from as (table: string) => unknown).mockImplementation(
    (table: string) => {
      if (!builders.has(table)) {
        builders.set(
          table,
          build(tables[table] ?? { data: [], error: null })
        );
      }
      return builders.get(table);
    }
  );
}
