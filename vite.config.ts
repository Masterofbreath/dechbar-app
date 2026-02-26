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
    host: '0.0.0.0', // Dostupný z lokální sítě i ngrok
    // HMR přes ngrok: WebSocket musí jít přes ngrok URL (ne localhost),
    // jinak mobile prohlížeč nedostane HMR updaty.
    hmr: {
      overlay: true,
      // Ngrok HTTPS tunnel → WebSocket přes wss:// na portu 443
      host: 'cerebellar-celestine-debatingly.ngrok-free.dev',
      protocol: 'wss',
      clientPort: 443,
    },
    watch: {
      usePolling: false,
      interval: 100,
    },
    allowedHosts: [
      'cerebellar-celestine-debatingly.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
    ],
  },
  // Cache optimalizace
  cacheDir: 'node_modules/.vite',  // Explicitní cache directory
  
  // Pre-bundle heavy dependencies pro rychlejší start
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
