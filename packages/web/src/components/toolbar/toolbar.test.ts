// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Toolbar from './toolbar.astro';

describe('Toolbar', () => {
  it('wraps its controls in a single row container', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Toolbar, {
      slots: { default: '<label>Sort</label><div>tags</div>' },
    });

    expect(html).toMatch(/^<div class="toolbar"[^>]*>/);
    expect(html).toContain('<label>Sort</label>');
  });
});
