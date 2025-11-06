// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['all','abyssmage.ddns.net'], // 👈 add your ngrok domain here
    host: true, // optional: allows network access
    port: 80, // your dev port
  },
})
