// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PageHeader from './page-header.astro';

describe('PageHeader', () => {
  async function render(
    props: { title: string; description?: string; titleHidden?: boolean },
    slots: Record<string, string> = {}
  ) {
    const container = await AstroContainer.create();
    return container.renderToString(PageHeader, { props, slots });
  }

  it('renders the title as the page h1', async () => {
    const html = await render({ title: 'Products' });

    expect(html).toMatch(/<h1[^>]*>Products<\/h1>/);
  });

  it('keeps a hidden title in the outline', async () => {
    // The landing page shows no title and had no h1 at all; its outline began
    // at h2.
    const html = await render({ title: 'Game Loopers', titleHidden: true });

    expect(html).toMatch(/<h1 class="sr-only"[^>]*>Game Loopers<\/h1>/);
    expect(html).not.toContain('page-header__title');
  });

  it('omits the description paragraph when there is none', async () => {
    // Rendering an empty <p> pushes the content down for no reason and gives a
    // screen reader an empty node to announce.
    const html = await render({ title: 'Products' });

    expect(html).not.toContain('page-header__description');
  });

  it('renders the description when given one', async () => {
    const html = await render({
      title: 'Products',
      description: 'Browse the marketplace',
    });

    expect(html).toContain('Browse the marketplace');
    expect(html).toContain('page-header__description');
  });

  it('omits the actions wrapper when nothing fills the slot', async () => {
    // The wrapper is a flex row with a gap. Rendering it empty leaves a gap in
    // the layout for content that does not exist.
    const html = await render({ title: 'Products' });

    expect(html).not.toContain('page-header__actions');
  });

  it('renders the actions slot when filled', async () => {
    // This slot is why three pages hand-rolled the markup instead of using the
    // component.
    const html = await render({ title: 'Products' }, { actions: '<button>New</button>' });

    expect(html).toContain('page-header__actions');
    expect(html).toContain('<button>New</button>');
  });

  it('omits the media wrapper when nothing fills the slot', async () => {
    const html = await render({ title: 'Products' });

    expect(html).not.toContain('page-header__media');
  });

  it('renders the media slot before the content column', async () => {
    // The public profile put its avatar here; without the slot it kept a
    // second copy of the whole header block.
    const html = await render({ title: 'Ada' }, { media: '<img src="/a.png" alt="" />' });

    expect(html.indexOf('page-header__media')).toBeLessThan(
      html.indexOf('page-header__content')
    );
    expect(html).toContain('/a.png');
  });

  it('renders the meta slot inside the content column', async () => {
    const html = await render({ title: 'A Document' }, { meta: '<span>by Nick</span>' });

    const content = html.match(/page-header__content[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(content).toContain('by Nick');
  });
});
