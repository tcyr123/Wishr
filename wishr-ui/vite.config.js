import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const envDir = "./config";
  const env = loadEnv(mode, envDir, 'VITE_')

  return {
    plugins: [react()],
    envDir: envDir,
    base: env?.VITE_BASE || '/', // controls where assets are looked for in the case of a subdirectory
    // define: { //can make global vars here
    //   __APP_ENV__: JSON.stringify(env),
    // }, 
    watch: {
      usePolling: true,
    },
    server: {
      host: true, // '0.0.0.0' binds the server to all network interfaces
      strictPort: true,
      port: 5173,
    },
  }
})
