import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    host: true,                                  // ascolta anche fuori dal container
    port: 5173,
    proxy: { '/api': 'http://backend:3000' },    // "backend" = nome del servizio nel compose
    watch: { usePolling: true },    
  },
})
