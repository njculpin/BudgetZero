// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProductCard, { type Props as ProductCardProps } from './product-card.astro';

const BASE: ProductCardProps = {
  handle: 'dungeon-kit',
  title: 'Dungeon Kit',
  creatorName: 'Ada',
};

async function render(props: Partial<ProductCardProps> = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(ProductCard, { props: { ...BASE, ...props } });
}

describe('ProductCard', () => {
  it('links to the product by handle', async () => {
    const html = await render();

    expect(html).toMatch(/<a href="\/products\/dungeon-kit"/);
  });

  it('puts the title in an h3', async () => {
    // The card sits under a section h2, so h3 is what keeps the outline intact.
    const html = await render();

    expect(html).toMatch(/<h3[^>]*>Dungeon Kit<\/h3>/);
  });

  it('hides the price block entirely when no price is given', async () => {
    // The trending grid on the home page passed no price and rendered an empty
    // bordered footer for every card.
    const html = await render();

    expect(html).not.toContain('product-card__footer');
  });

  it('groups a price over $999 the way the rest of the app does', async () => {
    // This used to be `(cents / 100).toFixed(2)`, which produced "$1234.56"
    // here and "$1,234.56" on the product page for the same product.
    const html = await render({ priceCents: 123456 });

    expect(html).toContain('$1,234.56');
  });

  it('says Free rather than $0.00', async () => {
    const html = await render({ priceCents: 0 });

    expect(html).toContain('Free');
    expect(html).not.toContain('$0.00');
  });

  it('falls back to a placeholder when there is no cover image', async () => {
    const html = await render({ imageUrl: null });

    expect(html).toContain('placehold.co');
  });

  it('lazy-loads its image by default', async () => {
    const html = await render();

    expect(html).toContain('loading="lazy"');
  });

  it('loads eagerly when the caller says the card is above the fold', async () => {
    const html = await render({ loading: 'eager' });

    expect(html).toContain('loading="eager"');
    expect(html).not.toContain('loading="lazy"');
  });

  it('omits the description when there is none', async () => {
    const html = await render();

    expect(html).not.toContain('product-card__description');
  });
});
