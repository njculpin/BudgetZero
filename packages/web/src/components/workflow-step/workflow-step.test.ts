// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import WorkflowStep from './workflow-step.astro';

describe('WorkflowStep', () => {
  async function render(
    props: { step: number; title: string },
    body = 'What happens here.'
  ) {
    const container = await AstroContainer.create();
    return container.renderToString(WorkflowStep, { props, slots: { default: body } });
  }

  it('renders the step number, title and body', async () => {
    const html = await render(
      { step: 2, title: 'Build Products' },
      'Combine your assets.'
    );

    expect(html).toContain('2');
    expect(html).toContain('Build Products');
    expect(html).toContain('Combine your assets.');
  });

  it('puts the title in a heading', async () => {
    const html = await render({ step: 1, title: 'Create Assets' });

    expect(html).toMatch(/<h3[^>]*>Create Assets<\/h3>/);
  });

  it('hides the step number from assistive technology', async () => {
    // Order is already conveyed by the surrounding sequence. Without this a
    // screen reader announces a bare digit before each heading.
    const html = await render({ step: 3, title: 'Publish & Earn' });

    const numberTag =
      html.match(/<div class="workflow-step__number[^"]*"[^>]*>/)?.[0] ?? '';
    expect(numberTag).toContain('aria-hidden="true"');
  });

  it('escapes an ampersand in the title', async () => {
    const html = await render({ step: 3, title: 'Publish & Earn' });

    expect(html).toContain('Publish &amp; Earn');
  });
});
