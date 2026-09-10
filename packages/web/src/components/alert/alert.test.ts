// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Alert from './alert.astro';

async function render(
  props: { tone: 'success' | 'error' | 'warning' | 'info'; title?: string },
  slots: Record<string, string> = { default: 'Item added to cart!' }
) {
  const container = await AstroContainer.create();
  return container.renderToString(Alert, { props, slots });
}

describe('Alert', () => {
  it('renders its message', async () => {
    const html = await render({ tone: 'success' });

    expect(html).toContain('Item added to cart!');
  });

  it('carries the tone as a modifier', async () => {
    const html = await render({ tone: 'warning' });

    expect(html).toContain('alert--warning');
  });

  it('interrupts a screen reader only for an error', async () => {
    // role="alert" preempts whatever is being read. That is right for a
    // failure and wrong for "Item added to cart!".
    const bad = await render({ tone: 'error' });
    const ok = await render({ tone: 'success' });

    expect(bad).toContain('role="alert"');
    expect(ok).toContain('role="status"');
  });

  it('omits the title paragraph when there is none', async () => {
    const html = await render({ tone: 'success' });

    expect(html).not.toContain('alert__title');
  });

  it('renders a title above the message when given one', async () => {
    const html = await render(
      { tone: 'success', title: 'Bank Account Connected' },
      {
        default: 'Ready to receive payouts.',
      }
    );

    expect(html.indexOf('Bank Account Connected')).toBeLessThan(
      html.indexOf('Ready to receive payouts.')
    );
  });

  it('omits the icon wrapper when the slot is empty', async () => {
    const html = await render({ tone: 'success' });

    expect(html).not.toContain('alert__icon');
  });

  it('hides a supplied icon from assistive technology', async () => {
    const html = await render(
      { tone: 'success' },
      {
        default: 'Done',
        icon: '<svg></svg>',
      }
    );

    const icon = html.match(/<span class="alert__icon"[^>]*>/)?.[0] ?? '';
    expect(icon).toContain('aria-hidden="true"');
  });
});
