import { getViteConfig } from 'astro/config';
import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config({ path: '.env' });

export default getViteConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.astro', 'e2e'],
    env: {
      MOCK_STRIPE: 'true',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.astro/',
        '**/*.config.{js,ts}',
        '**/types/**',
      ],
    },
  },
});
