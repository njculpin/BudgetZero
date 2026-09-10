import type { APIRoute } from 'astro';

/**
 * `/robots.txt`
 *
 * Crawlers are pointed at both indexes: the sitemap for search engines, and
 * `/llms.txt` for language models. `llms.txt` has no discovery mechanism of its
 * own — the proposal expects a well-known path — so naming it here is the one
 * place a crawler already looks.
 *
 * The signed-in surface is disallowed. Not for secrecy (it is behind auth
 * anyway) but because those paths are all redirects to sign-in for anyone
 * crawling, which is wasted budget and noise in the index.
 */
const getRobotsTxt = (sitemapURL: URL, llmsURL: URL) => `\
User-agent: *
Allow: /

Disallow: /api/
Disallow: /cart
Disallow: /checkout/
Disallow: /purchases
Disallow: /payouts
Disallow: /settings
Disallow: /notifications
Disallow: /admin/

Sitemap: ${sitemapURL.href}
LLM-Index: ${llmsURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  const llmsURL = new URL('llms.txt', site);

  return new Response(getRobotsTxt(sitemapURL, llmsURL), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
