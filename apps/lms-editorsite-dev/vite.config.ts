import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /api/* to the local Azure Functions host in dev.
      // In production, Azure Static Web Apps handles this proxy automatically.
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@azure/msal-browser') || id.includes('@azure/msal-react') || id.includes('@azure/msal-common')) {
            return 'vendor-msal';
          }
          if (id.includes('@dnd-kit')) {
            return 'vendor-dnd';
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
})
