// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import EmptyState from './empty-state.astro';

async function render(props: Record<string, unknown> = {}, slots = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(EmptyState, {
    props: {
      icon: 'products',
      title: 'No products yet',
      description: 'Be the first to publish one.',
      ...props,
    },
    slots,
  });
}

describe('EmptyState', () => {
  it('renders the title as an h2', async () => {
    // Every page that uses this has an h1 and nothing between, so an h3 skips
    // a level in the outline.
    const html = await render();

    expect(html).toMatch(/<h2[^>]*>No products yet<\/h2>/);
  });

  it('renders the description', async () => {
    const html = await render();

    expect(html).toContain('Be the first to publish one.');
  });

  it('renders the icon for the name it is given', async () => {
    const html = await render({ icon: 'tags' });

    expect(html).toContain('<svg');
    expect(html).toContain('empty-state__icon');
  });

  it('renders no action area when there is neither a link nor a slot', async () => {
    const html = await render();

    expect(html).not.toContain('empty-state__action');
  });

  it('renders a link action when given text and href', async () => {
    const html = await render({ actionText: 'Browse all tags', actionHref: '/tags' });

    expect(html).toMatch(/<a[^>]*href="\/tags"/);
    expect(html).toContain('Browse all tags');
  });

  it('renders nothing for an action link with text but no href', async () => {
    // Half a link is a control that looks clickable and goes nowhere.
    const html = await render({ actionText: 'Browse all tags' });

    expect(html).not.toContain('Browse all tags');
  });

  it('renders the action slot for controls that are not links', async () => {
    const html = await render({}, { action: '<button>Create</button>' });

    expect(html).toContain('empty-state__action');
    expect(html).toContain('<button>Create</button>');
  });
});
