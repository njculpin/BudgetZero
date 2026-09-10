// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import TagCard from './tag-card.astro';

interface TagCardProps {
  value: string;
  count: number;
  productCount: number;
  assetCount: number;
}

async function render(props: Partial<TagCardProps> = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(TagCard, {
    props: { value: 'rpg', count: 7, productCount: 5, assetCount: 2, ...props },
  });
}

describe('TagCard', () => {
  it('links to the tag page, url-encoding the value', async () => {
    const html = await render({ value: 'sci fi' });

    expect(html).toContain('href="/tags/sci%20fi"');
  });

  it('hides the decorative hash from assistive technology', async () => {
    // A screen reader announcing "number sign rpg" is noise.
    const html = await render();

    const hash = html.match(/<span class="tag-card__hash"[^>]*>/)?.[0] ?? '';
    expect(hash).toContain('aria-hidden="true"');
  });

  it('pluralises each breakdown independently', async () => {
    const html = await render({ productCount: 1, assetCount: 3 });

    expect(html).toContain('1 product');
    expect(html).not.toContain('1 products');
    expect(html).toContain('3 assets');
  });

  it('omits a breakdown that is zero', async () => {
    const html = await render({ productCount: 4, assetCount: 0 });

    expect(html).toContain('4 products');
    expect(html).not.toContain('asset');
  });
});
