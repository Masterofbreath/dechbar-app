import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // HMR optimalizace - lepší Hot Module Replacement stability
    hmr: {
      overlay: true,  // Zobrazí chyby přímo v browseru
    },
    watch: {
      // File watching optimalizace pro macOS
      usePolling: false,  // Rychlejší native file watching
      interval: 100,      // Check interval v ms
    },
    allowedHosts: [
      'cerebellar-celestine-debatingly.ngrok-free.dev', // Current ngrok URL
      '.ngrok-free.dev', // All ngrok domains
      '.ngrok.io', // Legacy ngrok domains
    ],
  },
  // Cache optimalizace
  cacheDir: 'node_modules/.vite',  // Explicitní cache directory
  
  // Pre-bundle heavy dependencies pro rychlejší start
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
