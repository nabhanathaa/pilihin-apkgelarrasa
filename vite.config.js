import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// BASE diisi oleh GitHub Actions, misalnya "/pilahin/" untuk https://<user>.github.io/pilahin/
const base = process.env.VITE_BASE || './';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Pilahin - Bank Sampah Digital',
        short_name: 'Pilahin',
        description: 'Bank sampah digital dengan pemilah berbasis AI yang berjalan di perangkat, tanpa unggah foto.',
        lang: 'id',
        theme_color: '#053b2c',
        background_color: '#053b2c',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json,woff2}'],
        globIgnores: ['models/**', 'ort/**'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // model dan runtime WASM besar: disimpan saat pertama dipakai, lalu bisa offline
            urlPattern: ({ url }) => /\/(models|ort)\//.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'pilahin-model', expiration: { maxEntries: 12 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 900 },
});
