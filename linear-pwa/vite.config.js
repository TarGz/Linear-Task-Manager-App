import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isProd = process.env.NODE_ENV === 'production'
const base = isProd ? '/Linear-Task-Manager-App/' : '/'

export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(new Date().toISOString())
  },
  preview: {
    allowedHosts: ['.ngrok.io', '.ngrok-free.app', 'localhost']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        additionalManifestEntries: [{
          url: base,
          revision: Date.now().toString()
        }],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.linear\.app/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'linear-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Linear Task Manager',
        short_name: 'Linear Tasks',
        description: 'Manage your Linear projects and tasks with favorites, offline support, and more',
        theme_color: '#FFF9FA',
        background_color: '#FFF9FA',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  base
})
