import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // El cliente pide siempre a `/api`, del mismo origen. En desarrollo lo
    // reenvía Vite; en producción, nginx. Así no hay CORS ni una URL de API
    // incrustada en el bundle que haya que cambiar al desplegar.
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_DESTINO || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
