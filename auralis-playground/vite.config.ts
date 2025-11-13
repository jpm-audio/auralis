import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			// Alias para importar directamente desde el código fuente de auralis-library
			auralis: path.resolve(__dirname, '../auralis-library/src'),
		},
	},
});
