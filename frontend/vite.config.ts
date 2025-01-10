import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom plugin for server-side logging
const serverLogger = () => ({
  name: 'server-logger',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`\n[${timestamp}] 🌐 ${req.method} ${req.url}`);
      next();
    });
  },
  handleHotUpdate({ file, server }) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n[${timestamp}] 🔄 File changed: ${file}`);
    return [];
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), serverLogger()],
  server: {
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
