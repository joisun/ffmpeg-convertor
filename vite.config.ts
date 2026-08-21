import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: fileURLToPath(new URL('./node_modules/@ffmpeg/core/dist/esm/*', import.meta.url)),
          dest: 'ffmpeg-core/st',
        },
      ],
    }),
  ],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: { exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"], },
})
