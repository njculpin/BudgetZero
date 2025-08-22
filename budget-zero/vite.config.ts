import { defineConfig } from 'vite'

export default defineConfig({
  assetsInclude: ['**/*.html'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})
