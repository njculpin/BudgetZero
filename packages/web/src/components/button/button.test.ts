// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Button, { type Props as ButtonProps } from './button.astro';

async function render(props: ButtonProps = {}, text = 'Go') {
  const container = await AstroContainer.create();
  return container.renderToString(Button, {
    props,
    slots: { text: `<span>${text}</span>` },
  });
}

describe('Button', () => {
  it('renders a <button> when there is no href', async () => {
    const html = await render();

    expect(html).toMatch(/<button[^>]*class="[^"]*button[^"]*"/);
    expect(html).not.toContain('<a ');
  });

  it('renders a single <a> when given an href', async () => {
    // Call sites used to wrap this component in an anchor, which nests
    // interactive content inside a link: invalid HTML and two tab stops.
    const html = await render({ href: '/products' });

    expect(html).toMatch(/<a[^>]*href="\/products"/);
    expect(html).not.toContain('<button');
  });

  it('applies the variant and size modifiers to the link itself', async () => {
    const html = await render({ href: '/sign-up', variant: 'outline', size: 'lg' });

    const tag = html.match(/<a [^>]*>/)?.[0] ?? '';
    expect(tag).toContain('button--outline');
    expect(tag).toContain('button--lg');
  });

  it('never puts a disabled attribute on a link', async () => {
    // `disabled` is not an anchor attribute; a browser ignores it and the link
    // would still navigate.
    const html = await render({ href: '/products', disabled: true });

    const tag = html.match(/<a [^>]*>/)?.[0] ?? '';
    expect(tag).not.toBe('');
    // `aria-disabled` is expected; a bare `disabled` attribute is not.
    expect(tag).not.toMatch(/\sdisabled[=\s>]/);
  });

  it('drops the href of a disabled link rather than leaving it live', async () => {
    const html = await render({ href: '/products', disabled: true });

    expect(html).not.toContain('href=');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('button--disabled');
  });

  it('disables the underlying button when loading', async () => {
    const html = await render({ loading: true });

    expect(html).toContain('button--loading');
    expect(html).toMatch(/<button[^>]*disabled/);
  });

  it('hides the spinner from assistive technology', async () => {
    const html = await render({ loading: true });

    const spinner = html.match(/<span class="button__spinner"[^>]*>/)?.[0] ?? '';
    expect(spinner).toContain('aria-hidden="true"');
  });

  it('renders no spinner when not loading', async () => {
    const html = await render();

    expect(html).not.toContain('button__spinner');
  });

  it('keeps a caller-supplied class alongside the generated ones', async () => {
    const html = await render({ class: 'cart__checkout' });

    expect(html).toContain('cart__checkout');
    expect(html).toContain('button--primary');
  });
});
