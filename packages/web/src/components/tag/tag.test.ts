// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Tag from './tag.astro';

async function render(props: Record<string, unknown> = {}, body = 'rpg') {
  const container = await AstroContainer.create();
  return container.renderToString(Tag, { props, slots: { default: body } });
}

describe('Tag', () => {
  it('is a plain span when it is only a label', async () => {
    const html = await render();

    expect(html).toMatch(/^<span/);
    expect(html).not.toContain('tag--interactive');
  });

  it('renders an anchor when given an href', async () => {
    // The product page wrapped this component in an <a> instead.
    const html = await render({ href: '/tags/rpg' });

    expect(html).toMatch(/<a[^>]*href="\/tags\/rpg"/);
    expect(html).toContain('tag--interactive');
  });

  it('renders a real button, typed so it cannot submit a form', async () => {
    // The creators page filters on click; a bare <button> inside a form
    // defaults to type="submit" and would reload the page.
    const html = await render({ button: true });

    expect(html).toMatch(/<button[^>]*type="button"/);
  });

  it('marks the applied filter for assistive technology, not just visually', async () => {
    const html = await render({ href: '/products?tag=rpg', active: true });

    expect(html).toContain('tag--active');
    expect(html).toContain('aria-current="true"');
  });

  it('renders the count beside the label', async () => {
    const html = await render({ href: '/tags/rpg', count: 12 });

    expect(html).toContain('(12)');
  });

  it('renders no count element when there is no count', async () => {
    const html = await render({ href: '/tags/rpg' });

    expect(html).not.toContain('tag__count');
  });

  it('shows a zero count rather than swallowing it', async () => {
    // `count && ...` would hide it; a tag with no products is worth saying.
    const html = await render({ href: '/tags/rpg', count: 0 });

    expect(html).toContain('(0)');
  });

  it('passes data attributes through to the element', async () => {
    const html = await render({ button: true, 'data-tag': 'rpg' });

    expect(html).toContain('data-tag="rpg"');
  });
});
