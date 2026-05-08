import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/react-router/')
          ) {
            return 'react-vendor'
          }
          if (id.includes('framer-motion') || id.includes('motion-utils')) {
            return 'motion'
          }
          if (id.includes('lucide-react')) {
            return 'icons'
          }
          return undefined
        },
      },
    },
  },
})
