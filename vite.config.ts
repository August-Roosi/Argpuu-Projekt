import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'


export default defineConfig({
  root: './', 
  publicDir: 'src', 
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
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
