import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const API_URL =  '/'; // Use ENV variable for API URL
  const PORT = 3000;

  return {
    server: {
      open: true,
      port: PORT,
      host: true
    },
    preview: {
      open: true,
      host: true
    },
    resolve: {
      alias: {
        '@': '/src', // ✅ Correct alias usage
        'src': '/src' // ✅ Keep consistent with '@'
      }
    },
    build: {
      rollupOptions: {
        external: ['react', 'react-dom'] // ✅ Prevent Rollup from bundling these
      }
    },
    define: {
      global: 'window' // ⚠️ Keep only if necessary
    },
    base: API_URL,
    plugins: [react(), jsconfigPaths()]
  };
});
