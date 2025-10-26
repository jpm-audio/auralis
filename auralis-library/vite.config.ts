import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@/components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@/controllers': fileURLToPath(new URL('./src/controllers', import.meta.url)),
      '@/core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@/sound': fileURLToPath(new URL('./src/sound', import.meta.url)),
      '@/utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
    }
  },
  build: {
    lib: {
      entry: resolve(fileURLToPath(new URL('./src/index.ts', import.meta.url))),
      name: 'Auralis',
      fileName: 'auralis'
    },
    rollupOptions: {
      external: ['eventemitter3'],
      output: {
        globals: {
          'eventemitter3': 'EventEmitter3'
        }
      }
    }
  }
})