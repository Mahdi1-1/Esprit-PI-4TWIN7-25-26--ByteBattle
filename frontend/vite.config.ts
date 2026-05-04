import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    cssCodeSplit: true,
    reportCompressedSize: false,
  },
  server: {
    port: 3000,
    watch: {
      // Avoid ENOSPC on Linux when inotify watcher limits are reached.
      usePolling: true,
      interval: 300,
    },
  },
});
