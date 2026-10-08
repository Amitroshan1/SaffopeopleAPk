import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Relative base for Capacitor WebView; absolute for hosted web deploys.
  base: mode === 'mobile' ? './' : '/',
  build: {
    assetsDir: 'assets',
    cssCodeSplit: true,
    sourcemap: false,
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5000',
      '/select_role': 'http://127.0.0.1:5000',
      '/static': 'http://127.0.0.1:5000',
    },
  },
}))
