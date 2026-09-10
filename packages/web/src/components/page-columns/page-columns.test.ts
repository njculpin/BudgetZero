// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PageColumns from './page-columns.astro';

async function render(slots: Record<string, string> = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(PageColumns, { slots });
}

describe('PageColumns', () => {
  it('puts the main slot in the first column', async () => {
    const html = await render({ main: '<p>editor</p>', aside: '<p>sidebar</p>' });

    const [first, second] = html.split('page-columns__column').slice(1);
    expect(first).toContain('editor');
    expect(second).toContain('sidebar');
  });

  it('renders both columns even when only one slot is filled', async () => {
    // The grid is 2fr 1fr; dropping the empty column would silently widen the
    // filled one instead of leaving the layout where the page expects it.
    const html = await render({ main: '<p>editor</p>' });

    expect(html.match(/page-columns__column/g)).toHaveLength(2);
  });

  it('ignores unnamed children rather than putting them in a column', async () => {
    // Three pages passed their columns positionally. Named slots are what stop
    // a reordering from silently swapping main and sidebar.
    const html = await render({ default: '<p>stray</p>' });

    expect(html).not.toContain('stray');
  });
});
