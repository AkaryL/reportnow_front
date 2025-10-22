import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar React y librerías principales
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Separar librerías de mapas (suelen ser grandes)
          'map-vendor': ['leaflet', 'maplibre-gl', 'react-leaflet'],

          // Separar librerías de estado y queries
          'query-vendor': ['@tanstack/react-query'],

          // Separar íconos de Lucide (pueden ser muchos)
          'icons-vendor': ['lucide-react'],
        },
      },
    },
    // Aumentar el límite de advertencia a 1000kb
    chunkSizeWarningLimit: 1000,
  },
})
