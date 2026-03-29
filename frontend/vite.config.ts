import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "localhost", // ensure correct binding
    port: 5173,
    strictPort: true,  // prevents random port switching

    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
    },

    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})