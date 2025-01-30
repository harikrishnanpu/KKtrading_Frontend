import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const API_URL = `${env.VITE_APP_BASE_NAME}`;
  const PORT = 3000;

  return {
    server: {
      open: true,
      port: PORT,
      host: true,
    },
    build: {
      rollupOptions: {
        external: [], // No unnecessary external modules
      },
    },
    preview: {
      open: true,
      host: true,
    },
    define: {
      global: 'window',
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'), // Alias for 'src'
        'components': path.resolve(process.cwd(), 'src/components'),
        'pages': path.resolve(process.cwd(), 'src/pages'),
        '~': path.resolve(process.cwd(), 'node_modules'), // SCSS handling
      },
    },
    base: API_URL,
    plugins: [react(), jsconfigPaths()],
  };
});
