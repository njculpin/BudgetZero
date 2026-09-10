// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import MetaRow from './meta-row.astro';

async function render(body: string) {
  const container = await AstroContainer.create();
  return container.renderToString(MetaRow, { slots: { default: body } });
}

describe('MetaRow', () => {
  it('renders its items', async () => {
    const html = await render('<span>by Ada</span><span>DRAFT</span>');

    expect(html).toContain('by Ada');
    expect(html).toContain('DRAFT');
  });

  it('marks up no separator of its own', async () => {
    // The pages this replaced interleaved a literal <span>•</span>, which a
    // screen reader reads out and which strands itself when a neighbouring
    // item is conditionally hidden.
    const html = await render('<span>by Ada</span><span>DRAFT</span>');

    expect(html).not.toContain('•');
  });

  it('wraps its children in exactly one element', async () => {
    const html = await render('<span>only</span>');

    expect(html).toMatch(/<div class="meta-row"[^>]*><span>only<\/span><\/div>/);
  });
});
