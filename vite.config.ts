import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "localhost", // Listen only on localhost for development
    port: 3000, // Vite dev server port (different from Express)
    fs: {
      strict: true,
      deny: ["**/.*"],
      allow: ['..'] // Allow access to parent directories
    },
    proxy: {
      // Proxy API calls to Express server
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      // Proxy WebSocket connections
      '/ws': {
        target: 'ws://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    }
  },
});
