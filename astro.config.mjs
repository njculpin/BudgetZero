// @ts-check
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
});