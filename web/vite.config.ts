import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // A base simulada (~250 KB de CSV) vai empacotada para o app funcionar offline desde a primeira abertura.
  build: { chunkSizeWarningLimit: 1200 },
  plugins: [
    react(),
    // PWA: depois da primeira visita, o app abre e funciona sem internet (o service worker guarda
    // o app, as fontes e a base simulada, que vai empacotada no JavaScript).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'fonts/*.woff2'],
      manifest: {
        name: 'Monitora — gestão de insumos',
        short_name: 'Monitora',
        description: 'Gestão de insumos do Sítio Bom Futuro (dados simulados).',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#f2f2f3',
        theme_color: '#5980a6',
        icons: [
          { src: '/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
})
