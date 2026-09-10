// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CardGrid from './card-grid.astro';

describe('CardGrid', () => {
  async function render(
    props: { size?: 'sm' | 'md' | 'lg' } = {},
    body = '<article>a</article><article>b</article>'
  ) {
    const container = await AstroContainer.create();
    return container.renderToString(CardGrid, { props, slots: { default: body } });
  }

  it('renders its children inside the grid', async () => {
    const html = await render();

    expect(html).toContain('<article>a</article>');
    expect(html).toContain('<article>b</article>');
  });

  it('defaults to the medium column width', async () => {
    // Every page this replaced sat between 280px and 320px, so the default has
    // to be the one that needs no argument at the call site.
    const html = await render();

    expect(html).toContain('card-grid--md');
  });

  it('carries the requested size modifier', async () => {
    const html = await render({ size: 'lg' });

    expect(html).toContain('card-grid--lg');
    expect(html).not.toContain('card-grid--md');
  });

  it('adds no wrapper of its own around each child', async () => {
    // The cards are already blocks; wrapping each one would break the grid's
    // equal-height rows.
    const html = await render({}, '<article>only</article>');

    expect(html).toMatch(/card-grid[^"]*"[^>]*><article>only<\/article><\/div>/);
  });
});
