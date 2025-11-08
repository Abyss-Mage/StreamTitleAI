// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['all', 'abyssmage.ddns.net'],
    host: true, 
    port: 80, // Your dev port
    
    // --- ADD THIS PROXY SECTION ---
    proxy: {
      // Proxies any request starting with /api to the backend
      '/api': {
        target: 'http://abyssmage.ddns.net:3001/', // Your backend server address
        changeOrigin: true, // Recommended
        secure: false, // Set to false for http
      }
    }
    // --- END OF ADDITION ---
  },
})
