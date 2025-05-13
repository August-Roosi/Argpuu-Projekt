import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'


export default defineConfig({
  root: './', // Ensure the root is set correctly if `index.html` is not in the root
  publicDir: 'src', // If your `index.html` is in the public folder
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        preview: path.resolve(__dirname, 'preview.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js', 
        chunkFileNames: 'assets/[name].js', 
        assetFileNames: 'assets/[name][extname]', 
      },
    },
  },
  plugins: [react()],
})
