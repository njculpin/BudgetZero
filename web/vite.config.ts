import { defineConfig } from 'vite'

export default defineConfig({
  assetsInclude: ['**/*.html'],
  // No JSX configuration needed for vanilla DOM
  server: {
    // Handle client-side routing by serving index.html for all routes
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})
