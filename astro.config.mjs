// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://gameloopers.com',
  output: 'server',
  adapter: vercel(),
  integrations: [solidJs(), sitemap()],
  vite: {
    resolve: {
      alias: {
        // tsconfig's `@/*` path mapping only informs the type checker. Vite needs
        // the alias declared here too, or a CSS `@import "@/styles/..."` is passed
        // to postcss as a literal relative path and fails to resolve.
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
