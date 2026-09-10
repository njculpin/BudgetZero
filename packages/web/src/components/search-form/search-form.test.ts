// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SearchForm from './search-form.astro';

async function render(action = '/products') {
  const container = await AstroContainer.create();
  return container.renderToString(SearchForm, {
    props: { action },
    slots: { default: '<input name="search" />' },
  });
}

describe('SearchForm', () => {
  it('submits with GET so the filters land in the URL', async () => {
    // A POST here would give a result page that cannot be linked or reloaded.
    const html = await render();

    expect(html).toMatch(/<form method="get"/);
    expect(html).toContain('action="/products"');
  });

  it('carries the class the layout depends on', async () => {
    // The wrapper is what stacks the field above the clear link and spaces the
    // form from the results; a bare <form> lost both.
    const html = await render();

    expect(html).toContain('class="search-form"');
  });

  it('renders its children', async () => {
    const html = await render();

    expect(html).toContain('<input name="search" />');
  });
});
