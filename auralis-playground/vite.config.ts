import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // Alias para importar directamente desde el código fuente de auralis-library
      'auralis': path.resolve(__dirname, '../auralis-library/src')
    }
  }
})
