// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Section from './section.astro';

describe('Section', () => {
  async function render(
    props: {
      title?: string;
      description?: string;
      align?: 'left' | 'center';
      titleHidden?: boolean;
    } = {},
    slots: Record<string, string> = {}
  ) {
    const container = await AstroContainer.create();
    return container.renderToString(Section, {
      props,
      slots: { default: '<p>body</p>', ...slots },
    });
  }

  it('renders its content inside a section landmark', async () => {
    const html = await render();

    expect(html).toMatch(/<section[^>]*class="section"/);
    expect(html).toContain('<p>body</p>');
  });

  it('omits the heading entirely when untitled', async () => {
    // An empty h2 would put a blank entry in the document outline.
    const html = await render();

    expect(html).not.toContain('section__title');
    expect(html).not.toContain('<h2');
  });

  it('omits the header row when there is neither a title nor actions', async () => {
    // The header is a flex row with a bottom margin. Rendering it empty pushes
    // the content down for nothing.
    const html = await render();

    expect(html).not.toContain('section__header');
  });

  it('renders the title as an h2', async () => {
    const html = await render({ title: 'How It Works' });

    expect(html).toMatch(/<h2[^>]*>How It Works<\/h2>/);
  });

  it('defaults to left alignment', async () => {
    const html = await render({ title: 'How It Works' });

    expect(html).toContain('section__title--left');
  });

  it('centres the title when asked', async () => {
    const html = await render({ title: 'How It Works', align: 'center' });

    expect(html).toContain('section__title--center');
    expect(html).toContain('section__header--center');
  });

  it('keeps a hidden title in the outline but out of the header row', async () => {
    // The browse page wants no visible section heading, and dropping the h2
    // left the page going h1 -> h3 straight to the product cards.
    const html = await render({ title: 'All products', titleHidden: true });

    expect(html).toMatch(/<h2 class="sr-only"[^>]*>All products<\/h2>/);
    expect(html).not.toContain('section__header');
    expect(html).not.toContain('section__title');
  });

  it('still renders the header for actions when the title is hidden', async () => {
    const html = await render(
      { title: 'All products', titleHidden: true },
      { actions: '<a href="/x">more</a>' }
    );

    expect(html).toContain('sr-only');
    expect(html).toContain('section__actions');
    expect(html).not.toContain('section__title');
  });

  it('renders a description under the heading', async () => {
    const html = await render({ title: 'Your Downloads', description: 'Click below.' });

    expect(html).toContain('section__description');
    expect(html.indexOf('Your Downloads')).toBeLessThan(html.indexOf('Click below.'));
  });

  it('renders a description with no title without pulling it out of the block', async () => {
    // The description used to carry a negative top margin that assumed a
    // header above it.
    const html = await render({ description: 'Click below.' });

    expect(html).toContain('Click below.');
    expect(html).not.toContain('section__header');
  });

  it('omits the description paragraph when there is none', async () => {
    const html = await render({ title: 'Your Downloads' });

    expect(html).not.toContain('section__description');
  });

  it('omits the actions wrapper when nothing fills the slot', async () => {
    const html = await render({ title: 'New Launches' });

    expect(html).not.toContain('section__actions');
  });

  it('renders the actions slot beside the title', async () => {
    // This slot is why the home page kept its own copy of the section markup.
    const html = await render(
      { title: 'New Launches' },
      { actions: '<a href="/products">See more</a>' }
    );

    const header = html.match(/section__header[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? '';
    expect(header).toContain('New Launches');
    expect(header).toContain('See more');
  });

  it('renders the header for actions alone, with no empty heading', async () => {
    const html = await render({}, { actions: '<a href="/products">See more</a>' });

    expect(html).toContain('section__header');
    expect(html).toContain('See more');
    expect(html).not.toContain('<h2');
  });
});
