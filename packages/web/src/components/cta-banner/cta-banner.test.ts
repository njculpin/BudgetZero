// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CtaBanner from './cta-banner.astro';

describe('CtaBanner', () => {
  async function render(actions = '<a href="/sign-up">Join</a>') {
    const container = await AstroContainer.create();
    return container.renderToString(CtaBanner, {
      props: { title: 'Ready to start?', description: 'Join the community.' },
      slots: { default: actions },
    });
  }

  it('renders title, description and actions', async () => {
    const html = await render();

    expect(html).toContain('Ready to start?');
    expect(html).toContain('Join the community.');
    expect(html).toContain('href="/sign-up"');
  });

  it('uses an h2, not an h1', async () => {
    // This sits below the page heading. A second h1 breaks the outline.
    const html = await render();

    expect(html).toMatch(/<h2[^>]*>Ready to start\?<\/h2>/);
    expect(html).not.toContain('<h1');
  });

  it('is a landmark section', async () => {
    const html = await render();

    expect(html).toMatch(/<section[^>]*class="cta-banner"/);
  });
});
