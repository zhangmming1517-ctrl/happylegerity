import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { envKeys } from './env.config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const define: Record<string, string> = {};
  for (const opt of envKeys) {
    const value = env[opt.key] ?? '';
    define[`process.env.${opt.key}`] = JSON.stringify(value);
    if (opt.alias) {
      define[`process.env.${opt.alias}`] = JSON.stringify(value);
    }
  }
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        strategies: 'injectManifest',
        srcDir: '.',
        filename: 'sw.ts',
        includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
        manifest: {
          name: 'AI 极简饮食助手',
          short_name: '极简饮食',
          description: '基于 AI 的极简一周饮食与采购计划',
          theme_color: '#10B981',
          background_color: '#ffffff',
          display: 'fullscreen',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          categories: ['health', 'productivity'],
          screenshots: [
            {
              src: '/screenshot-540x720.png',
              sizes: '540x720',
              form_factor: 'narrow',
              type: 'image/png',
            },
            {
              src: '/screenshot-1280x720.png',
              sizes: '1280x720',
              form_factor: 'wide',
              type: 'image/png',
            },
          ],
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdn\.tailwindcss\.com/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tailwind-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 7 * 24 * 60 * 60,
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
              },
            },
          ],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    define,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
          },
        },
      },
    },
  };
});
