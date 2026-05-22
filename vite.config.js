import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
  },
  server: {
    proxy: {
      '/jio-api': {
        target: 'https://www.jiosaavn.com/api.php',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jio-api/, ''),
      },
    },
  },
})
