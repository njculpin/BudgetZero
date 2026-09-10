// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import TagFilter from './tag-filter.astro';

async function render(body = '<span class="tag">rpg</span>') {
  const container = await AstroContainer.create();
  return container.renderToString(TagFilter, {
    props: { label: 'Filter by tag:' },
    slots: { default: body },
  });
}

describe('TagFilter', () => {
  it('renders the label and the chips', async () => {
    const html = await render();

    expect(html).toContain('Filter by tag:');
    expect(html).toContain('rpg');
  });

  it('puts the chips in the list, not beside the label', async () => {
    const html = await render();

    const list = html.match(/tag-filter__list[\s\S]*$/)?.[0] ?? '';
    expect(list).toContain('rpg');
  });
});
