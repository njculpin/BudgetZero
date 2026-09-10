// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import DocumentCard from './document-card.astro';

interface DocumentCardProps {
  handle: string;
  title: string;
  description?: string | null;
  authorName: string;
  updatedAt: string;
}

async function render(props: Partial<DocumentCardProps> = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(DocumentCard, {
    props: {
      handle: 'rulebook',
      title: 'Rulebook',
      authorName: 'You',
      updatedAt: '2026-05-04T00:00:00.000Z',
      ...props,
    },
  });
}

describe('DocumentCard', () => {
  it('links to the document by handle', async () => {
    const html = await render();

    expect(html).toContain('href="/documents/rulebook"');
  });

  it('truncates a long description', async () => {
    const html = await render({ description: 'x'.repeat(140) });

    expect(html).toContain('x'.repeat(100) + '...');
    expect(html).not.toContain('x'.repeat(101) + '.');
  });

  it('leaves a short description alone', async () => {
    const html = await render({ description: 'Short.' });

    expect(html).toContain('Short.');
    expect(html).not.toContain('...');
  });

  it('omits the description element when there is none', async () => {
    const html = await render();

    expect(html).not.toContain('document-card__description');
  });

  it('draws no literal bullet between the byline items', async () => {
    // The markup this replaced interleaved <span>•</span>, which a screen
    // reader reads out.
    const html = await render();

    expect(html).not.toContain('•');
    expect(html).toContain('meta-row');
  });

  it('hides the decorative file icon', async () => {
    const html = await render();

    const icon = html.match(/<span class="document-card__icon"[^>]*>/)?.[0] ?? '';
    expect(icon).toContain('aria-hidden="true"');
  });
});
