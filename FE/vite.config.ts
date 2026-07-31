import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    port: 5000,
    host: 'localhost',
    allowedHosts: true,
    hmr: {
      host: 'localhost',
      port: 5000,
      protocol: 'ws',
    },
    proxy: {
      '/api': {
        target: 'https://yarn-shop-be.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Only chunk node_modules
          if (id.includes('node_modules')) {
            // --- Check specific packages FIRST (more specific patterns) ---

            // Radix UI primitives
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            // 3D (three.js + react-three)
            if (id.includes('@react-three') || id.includes('three')) {
              return 'vendor-3d';
            }
            // Form validation resolvers
            if (id.includes('@hookform') || id.includes('react-hook-form')) {
              return 'vendor-forms';
            }
            // UI components that contain "react" in their name (must check before generic "react" rule)
            if (id.includes('react-day-picker') || id.includes('react-resizable-panels')) {
              return 'vendor-ui';
            }
            // Icons (contains "react" but should be separate)
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Animation
            if (id.includes('motion')) {
              return 'vendor-motion';
            }
            // Charts & date utilities
            if (id.includes('recharts') || id.includes('date-fns')) {
              return 'vendor-charts';
            }
            // Maps
            if (id.includes('leaflet')) {
              return 'vendor-maps';
            }
            // Forms & validation (non-react packages)
            if (
              id.includes('class-variance-authority') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge') ||
              id.includes('yup')
            ) {
              return 'vendor-forms';
            }
            // UI component libraries (non-react packages)
            if (
              id.includes('vaul') ||
              id.includes('sonner') ||
              id.includes('cmdk') ||
              id.includes('embla-carousel') ||
              id.includes('input-otp')
            ) {
              return 'vendor-ui';
            }
            // HTTP, state, WebSocket, auth
            if (
              id.includes('axios') ||
              id.includes('socket.io') ||
              id.includes('engine.io') ||
              id.includes('zustand') ||
              id.includes('jwt-decode') ||
              id.includes('@tanstack') ||
              id.includes('use-sync-external-store')
            ) {
              return 'vendor-network';
            }
            // Utilities
            if (id.includes('lodash')) {
              return 'vendor-utils';
            }

            // --- Generic React check (after all specific patterns) ---
            // Include scheduler (react-dom dependency) to avoid circular chunk warning
            if (id.includes('react-dom') || id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }

            // Catch-all for any other node_modules not explicitly handled above
            return 'vendor-other';
          }
        },
      },
    },
    chunkSizeWarningLimit: 300,
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: 'esbuild',
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      'motion',
      'lucide-react',
      'sonner',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
    ],
  },
})