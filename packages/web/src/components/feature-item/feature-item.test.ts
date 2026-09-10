// @vitest-environment node
//
// Astro components render on the server, so the container needs Node globals.
// Under the suite-wide jsdom environment the .astro import does not come back
// as a component factory at all, and the container fails with
// "NoMatchingRenderer: Unable to render ``" — an error that points nowhere near
// the actual cause.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import FeatureItem from './feature-item.astro';

describe('FeatureItem', () => {
  async function render(
    props: { icon: string; title: string },
    body = 'Some description'
  ) {
    const container = await AstroContainer.create();
    return container.renderToString(FeatureItem, {
      props,
      slots: { default: body },
    });
  }

  it('renders the icon, title and body', async () => {
    const html = await render(
      { icon: '💰', title: 'Transparent Royalties' },
      'Everyone gets paid fairly.'
    );

    expect(html).toContain('💰');
    expect(html).toContain('Transparent Royalties');
    expect(html).toContain('Everyone gets paid fairly.');
  });

  it('puts the title in a heading, not a styled div', async () => {
    // The five copies this replaced all used <h3>. Losing that in the
    // extraction would break the page's heading outline silently.
    const html = await render({ icon: '🔒', title: 'License Protection' });

    expect(html).toMatch(/<h3[^>]*>License Protection<\/h3>/);
  });

  it('hides the decorative icon from assistive technology', async () => {
    // The icon is an emoji restating the adjacent heading. A screen reader
    // announcing "money bag, Transparent Royalties" is noise.
    const html = await render({ icon: '💰', title: 'Transparent Royalties' });

    expect(html).toMatch(/aria-hidden="true"[^>]*>💰|💰[^<]*<\/div>/);
    const iconTag = html.match(/<div class="feature-item__icon[^"]*"[^>]*>/)?.[0] ?? '';
    expect(iconTag).toContain('aria-hidden="true"');
  });
});
