import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    jsxImportSource: '@emotion/react',
    babel: {
      plugins: ['@emotion/babel-plugin'],
    },
  })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      'src': resolve(__dirname, 'src/renderer/src'),
      // Mirror the alias defined in electron.vite.config.ts. Without this,
      // any test importing from `@shared/*` fails to resolve.
      '@shared': resolve(__dirname, 'src/shared')
    }
  }
})