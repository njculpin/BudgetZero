import type { APIRoute } from 'astro';
import { getAllTags } from '@gameloopers/core/data-access/tags';

/**
 * `/llms.txt` — an index of this site for language models.
 *
 * Follows the llms.txt proposal (https://llmstxt.org): an H1, a blockquote
 * summary, optional prose, then H2 sections holding markdown link lists.
 *
 * Generated rather than checked in as a static file, for two reasons. The tag
 * list is real data, so a static copy would drift the moment someone adds a tag.
 * And the site origin comes from the request, so the links are absolute and
 * correct in development, preview and production without three copies of the
 * file.
 *
 * Deliberately an index, not a dump: it lists the collection pages an agent
 * should crawl rather than every product, which would be unbounded and stale
 * within the hour.
 */

export const prerender = false;

/** Pages any visitor can read, in the order they are useful to a newcomer. */
const PUBLIC_PAGES: Array<{ path: string; title: string; note: string }> = [
  { path: '/', title: 'Home', note: 'What Game Loopers is, and featured products' },
  {
    path: '/products',
    title: 'Products',
    note: 'Every published product, searchable and filterable by tag',
  },
  {
    path: '/users',
    title: 'Creators',
    note: 'Directory of designers, illustrators and 3D modellers',
  },
  { path: '/tags', title: 'Tags', note: 'All tags in use, with product counts' },
  { path: '/about', title: 'About', note: 'Background on the platform' },
];

const LEGAL_PAGES: Array<{ path: string; title: string; note: string }> = [
  {
    path: '/terms',
    title: 'Terms of Service',
    note: 'Terms governing use of the platform',
  },
  { path: '/privacy', title: 'Privacy Policy', note: 'What data is collected and why' },
  {
    path: '/licenses/standard',
    title: 'Standard License',
    note: 'What a buyer may do with a downloaded file, and what a creator grants',
  },
];

function linkList(
  origin: string,
  entries: Array<{ path: string; title: string; note: string }>
): string {
  return entries
    .map(({ path, title, note }) => `- [${title}](${origin}${path}): ${note}`)
    .join('\n');
}

export const GET: APIRoute = async ({ url }) => {
  const origin = url.origin;

  let tagSection = '';
  try {
    const tags = await getAllTags();
    const used = tags
      .filter((tag) => tag.productCount > 0)
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 25);

    if (used.length > 0) {
      tagSection = `
## Browse by tag

${used
  .map(
    (tag) =>
      `- [${tag.value}](${origin}/tags/${encodeURIComponent(tag.value)}): ${tag.productCount} product${tag.productCount === 1 ? '' : 's'}`
  )
  .join('\n')}
`;
    }
  } catch {
    // A tag lookup failure should not take the index down; the rest of the file
    // is static and still useful.
  }

  const body = `# Game Loopers

> A marketplace where tabletop game creators collaborate, publish digital downloads, and share royalties. Designers, illustrators and 3D modellers publish products that other creators can embed in their own — when an embedded product sells, its creator is paid automatically.

Products are digital downloads: rulebooks, art, STL files for 3D printing. A
product can embed other creators' products as components, and the embedded
creator earns a royalty on every sale of the parent. Prices shown include a 10%
platform fee.

## Pages

${linkList(origin, PUBLIC_PAGES)}

## Legal

${linkList(origin, LEGAL_PAGES)}
${tagSection}
## Notes

- Individual products live at \`/products/{handle}\` and creators at \`/users/{handle}\`. Both are linked from the collection pages above.
- Account, cart, checkout, payout and settings pages require signing in and are not useful to crawl.
- \`/api/*\` is a private JSON API for this site's own front end, not a public interface.
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Cheap to regenerate, but there is no reason to rebuild it per request.
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
