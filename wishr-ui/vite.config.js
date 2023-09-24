import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  watch: {
    usePolling: true,
  },
  server: {
    host: true, //'0.0.0.0' binds the server to all network interfaces
    strictPort: true,
    port: 5173,
  },
})
