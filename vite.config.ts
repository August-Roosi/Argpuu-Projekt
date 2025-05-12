import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: './', // Ensure the root is set correctly if `index.html` is not in the root
  publicDir: 'src', // If your `index.html` is in the public folder
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js', // No hash in entry file names
        chunkFileNames: 'assets/[name].js', // No hash in chunk files
        assetFileNames: 'assets/[name][extname]', // No hash in other assets
      },
    },
  },
  plugins: [react()],
})
