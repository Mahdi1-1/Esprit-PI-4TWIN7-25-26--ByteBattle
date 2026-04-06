import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor core — toujours chargé
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          // Éditeur de code — très lourd, chargé uniquement sur /problems/:id
          if (id.includes('node_modules/monaco-editor') || id.includes('node_modules/@monaco-editor')) {
            return 'vendor-monaco';
          }
          // Excalidraw — canvas collaboratif, lourd
          if (id.includes('node_modules/@excalidraw')) {
            return 'vendor-excalidraw';
          }
          // Charts — chargé uniquement sur dashboard/leaderboard
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          // Socket — chargé uniquement sur pages temps-réel
          if (id.includes('node_modules/socket.io-client') || id.includes('node_modules/engine.io-client')) {
            return 'vendor-socket';
          }
          // Lucide icons — regroupés
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // Framer motion
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // Radix UI components
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix';
          }
          // i18n — chargé uniquement si l10n activée
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'vendor-i18n';
          }
          // Yjs collaboration
          if (id.includes('node_modules/yjs') || id.includes('node_modules/y-monaco') || id.includes('node_modules/lib0')) {
            return 'vendor-yjs';
          }
          // Reste des node_modules
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
  },
});