// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ActionLink from './action-link.astro';

async function render(
  props: { href: string; title: string; description?: string },
  slots: Record<string, string> = {}
) {
  const container = await AstroContainer.create();
  return container.renderToString(ActionLink, { props, slots });
}

describe('ActionLink', () => {
  it('is a single anchor carrying the whole row', async () => {
    const html = await render({ href: '/connect/dashboard', title: 'Payout Settings' });

    expect(html).toMatch(/^<a href="\/connect\/dashboard"/);
  });

  it('renders the description when there is one', async () => {
    const html = await render({
      href: '/products',
      title: 'Back to Products',
      description: 'Browse marketplace',
    });

    expect(html).toContain('Browse marketplace');
  });

  it('omits the description element when there is none', async () => {
    const html = await render({ href: '/products', title: 'Back to Products' });

    expect(html).not.toContain('action-link__description');
  });

  it('hides the icon from the link name', async () => {
    // It is decorative; the title already says where the link goes.
    const html = await render(
      { href: '/products', title: 'Back' },
      {
        icon: '<svg></svg>',
      }
    );

    const icon = html.match(/<span class="action-link__icon"[^>]*>/)?.[0] ?? '';
    expect(icon).toContain('aria-hidden="true"');
  });

  it('omits the icon wrapper when the slot is empty', async () => {
    const html = await render({ href: '/products', title: 'Back' });

    expect(html).not.toContain('action-link__icon');
  });
});
