import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Redirige las llamadas a la API Node durante el desarrollo
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
