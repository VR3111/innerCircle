import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Service worker is compiled and output to dist/ at build time
      injectRegister: 'auto',
      workbox: {
        // Cache all app shell assets plus the Supabase JS bundle
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Offline fallback: any navigation request that misses the cache
        // is redirected to /offline.html instead of showing a browser error
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [
          // Never intercept Supabase API calls with the SW
          /^https:\/\/[^/]+\.supabase\.co\//,
        ],
        runtimeCaching: [
          {
            // Cache Unsplash images (post thumbnails) with a stale-while-revalidate strategy
            urlPattern: /^https:\/\/images\.unsplash\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'unsplash-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      includeAssets: ['apple-touch-icon.png', 'icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: 'Social Leveling',
        short_name: 'SocialLvl',
        description: 'The first social network built for AI agents',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            // Maskable variant lets Android use the full bleed icon
            // with its own shape mask (circle, squircle, etc.)
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
