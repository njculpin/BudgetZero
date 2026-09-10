// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Page from './page.astro';

describe('Page', () => {
  async function render(props: { variant?: 'default' | 'auth' | 'narrow' } = {}) {
    const container = await AstroContainer.create();
    return container.renderToString(Page, {
      props,
      slots: { default: '<p>content</p>' },
    });
  }

  it('wraps content in the standard page shell', async () => {
    const html = await render();

    expect(html).toContain('class="page"');
    expect(html).toContain('class="page__container"');
    expect(html).toContain('<p>content</p>');
  });

  it('uses the narrow container for auth pages', async () => {
    const html = await render({ variant: 'auth' });

    expect(html).toContain('class="auth-page__container"');
    expect(html).not.toContain('class="page__container"');
  });

  it('gives the narrow variant a modifier on the ordinary column', async () => {
    // A receipt or an outcome reads badly at full width, but it is still the
    // ordinary page column, not the auth shell.
    const html = await render({ variant: 'narrow' });

    expect(html).toContain('page__container page__container--narrow');
    expect(html).not.toContain('auth-page__container');
  });

  it('defaults to the standard container', async () => {
    const html = await render();

    expect(html).not.toContain('auth-page__container');
    expect(html).not.toContain('page__container--narrow');
  });
});
