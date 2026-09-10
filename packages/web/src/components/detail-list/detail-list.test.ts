// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import DetailList from './detail-list.astro';
import DetailRow from './detail-row/detail-row.astro';

const container = () => AstroContainer.create();

describe('DetailList', () => {
  it('is a definition list, not a stack of divs', async () => {
    // Two of the three blocks this replaced used anonymous divs, so the
    // label/value pairing existed only in the styling.
    const html = await (
      await container()
    ).renderToString(DetailList, {
      slots: { default: '<div>row</div>' },
    });

    expect(html).toMatch(/^<dl class="detail-list"/);
  });
});

describe('DetailRow', () => {
  async function render(props: { label: string; mono?: boolean }, body = 'value') {
    return (await container()).renderToString(DetailRow, {
      props,
      slots: { default: body },
    });
  }

  it('marks up the label as a <dt> and the value as a <dd>', async () => {
    const html = await render({ label: 'Order Date:' }, '4 May 2026');

    expect(html).toMatch(/<dt[^>]*>Order Date:<\/dt>/);
    expect(html).toMatch(/<dd[^>]*>[\s\S]*4 May 2026/);
  });

  it('is not monospaced by default', async () => {
    const html = await render({ label: 'Email:' }, 'a@b.com');

    expect(html).not.toContain('detail-list__value--mono');
  });

  it('monospaces a value when asked', async () => {
    const html = await render({ label: 'Payment ID:', mono: true }, 'ch_123');

    expect(html).toContain('detail-list__value--mono');
  });
});
