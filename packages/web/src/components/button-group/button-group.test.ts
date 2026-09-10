// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ButtonGroup from './button-group.astro';

async function render(props: { align?: 'start' | 'center' | 'end' } = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(ButtonGroup, {
    props,
    slots: { default: '<button>a</button><button>b</button>' },
  });
}

describe('ButtonGroup', () => {
  it('renders its buttons in one wrapper', async () => {
    const html = await render();

    expect(html).toMatch(/^<div class="button-group[^"]*"/);
    expect(html).toContain('<button>a</button><button>b</button>');
  });

  it('aligns to the start by default', async () => {
    const html = await render();

    expect(html).toContain('button-group--start');
  });

  it('carries the requested alignment', async () => {
    const html = await render({ align: 'center' });

    expect(html).toContain('button-group--center');
    expect(html).not.toContain('button-group--start');
  });
});
