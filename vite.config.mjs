import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const API_URL = env.VITE_APP_BASE_NAME || '/'; // default to '/' if not set
  const PORT = 3000;

  return {
    base: API_URL,
    build: {
      outDir: 'dist',
    },
    server: {
      open: true,
      port: PORT,
      host: true, // Added missing comma here
      // historyApiFallback is handled by Vite automatically in dev mode.
    },
    preview: {
      open: true,
      host: true,
    },
    define: {
      global: 'window',
    },
    resolve: {
      alias: [
        {
          find: /^~(.+)/,
          replacement: path.join(process.cwd(), 'node_modules/$1'),
        },
        {
          find: /^src(.+)/,
          replacement: path.join(process.cwd(), 'src/$1'),
        },
      ],
    },
    plugins: [react(), jsconfigPaths()],
  };
});
