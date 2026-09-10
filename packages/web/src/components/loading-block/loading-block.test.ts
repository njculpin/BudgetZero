// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import LoadingBlock from './loading-block.astro';

async function render(label = 'Loading balance...') {
  const container = await AstroContainer.create();
  return container.renderToString(LoadingBlock, { props: { label } });
}

describe('LoadingBlock', () => {
  it('announces itself as a status region', async () => {
    // Both blocks this replaced were silent: a screen reader saw an empty card
    // and then, some time later, content that appeared without explanation.
    const html = await render();

    expect(html).toContain('role="status"');
  });

  it('renders the label', async () => {
    const html = await render('Loading history...');

    expect(html).toContain('Loading history...');
  });

  it('hides the spinner from assistive technology', async () => {
    const html = await render();

    const spinner = html.match(/<span class="loading-block__spinner"[^>]*>/)?.[0] ?? '';
    expect(spinner).toContain('aria-hidden="true"');
  });
});
