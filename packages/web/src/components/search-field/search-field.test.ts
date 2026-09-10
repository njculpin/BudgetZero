// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SearchField from './search-field.astro';

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(SearchField, { props });
}

describe('SearchField', () => {
  it('gives the input an accessible name', async () => {
    // A placeholder is not a label: it disappears the moment you type.
    const html = await render({ name: 'search', label: 'Search products' });

    expect(html).toContain('aria-label="Search products"');
  });

  it('falls back to the name for the id so a label can point at it', async () => {
    const html = await render({ name: 'search', label: 'Search products' });

    expect(html).toContain('id="search"');
  });

  it('renders no button when no submit label is given', async () => {
    // The creators page filters as you type and has nothing to submit.
    const html = await render({ name: 'creator-search', label: 'Search creators' });

    expect(html).not.toContain('search-field__button');
    expect(html).not.toContain('<button');
  });

  it('renders a submit button when asked', async () => {
    const html = await render({
      name: 'search',
      label: 'Search products',
      submitLabel: 'Search',
    });

    expect(html).toMatch(/<button type="submit"/);
    expect(html).toContain('Search');
  });

  it('hides the magnifier icon from assistive technology', async () => {
    const html = await render({
      name: 'search',
      label: 'Search products',
      submitLabel: 'Search',
    });

    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it('forwards the current value so a submitted search stays in the box', async () => {
    const html = await render({
      name: 'search',
      label: 'Search products',
      value: 'dragons',
    });

    expect(html).toContain('value="dragons"');
  });
});
