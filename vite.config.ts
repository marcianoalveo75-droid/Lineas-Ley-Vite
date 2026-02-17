import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Ley Lines PWA",
        short_name: "LeyLines",
        description: "Trace and analyze Ley Lines on maps",
        theme_color: "#ffffff",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
    legacy({
      targets: ['defaults', 'not IE 11', 'chrome 60', 'safari 11', 'ios 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    }),
  ],
  build: { outDir: "dist" },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // Remove /api prefix when sending to backend
      }
    }
  },
});
