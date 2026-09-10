// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import StatusPanel from './status-panel.astro';

async function render(
  props: { title: string; description?: string; tone?: 'neutral' | 'success' | 'error' },
  slots: Record<string, string> = {}
) {
  const container = await AstroContainer.create();
  return container.renderToString(StatusPanel, { props, slots });
}

describe('StatusPanel', () => {
  it('renders the title as the page h1', async () => {
    // This panel is the whole page; its heading is the page heading.
    const html = await render({ title: 'Order Confirmed!' });

    expect(html).toMatch(/<h1[^>]*>Order Confirmed!<\/h1>/);
  });

  it('renders no icon for the neutral tone', async () => {
    const html = await render({ title: 'Page Not Found' });

    expect(html).not.toContain('status-panel__icon');
  });

  it('draws a tick for success and a cross for failure', async () => {
    const ok = await render({ title: 'Order Confirmed!', tone: 'success' });
    const bad = await render({ title: 'Payment Failed', tone: 'error' });

    expect(ok).toContain('m9 12 2 2 4-4');
    expect(ok).not.toContain('<line');
    expect(bad).toContain('<line');
    expect(bad).not.toContain('m9 12 2 2 4-4');
  });

  it('hides the icon from assistive technology', async () => {
    // It restates the heading directly below it.
    const html = await render({ title: 'Payment Failed', tone: 'error' });

    const icon = html.match(/<div class="status-panel__icon"[^>]*>/)?.[0] ?? '';
    expect(icon).toContain('aria-hidden="true"');
  });

  it('takes a caller-supplied icon over the built-in one', async () => {
    const html = await render(
      { title: 'Mock purchase', tone: 'success' },
      {
        icon: '<img src="/x.png" alt="" />',
      }
    );

    expect(html).toContain('/x.png');
    expect(html).not.toContain('m9 12 2 2 4-4');
  });

  it('omits the description paragraph when there is none', async () => {
    const html = await render({ title: 'Page Not Found' });

    expect(html).not.toContain('status-panel__description');
  });

  it('omits the actions wrapper when nothing fills the slot', async () => {
    const html = await render({ title: 'Page Not Found' });

    expect(html).not.toContain('status-panel__actions');
  });

  it('puts the actions above the extra content', async () => {
    // The buttons are the point of the page; a receipt below them is detail.
    const html = await render(
      { title: 'Order Confirmed!', tone: 'success' },
      { actions: '<a href="/purchases">Purchases</a>', default: '<dl>receipt</dl>' }
    );

    expect(html.indexOf('/purchases')).toBeLessThan(html.indexOf('receipt'));
  });
});
