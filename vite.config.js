import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all local IPs
    port: 5050, 
    allowedHosts: ['localhost', 'ticket.tutelartechlabs.com', 'tutelartechlabs.com'] // Allow requests from these hosts
  }
})