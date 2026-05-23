import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  plugins: [react()],
  resolve: {
    extensions: [
      '.web.tsx',
      '.tsx',
      '.web.ts',
      '.ts',
      '.web.jsx',
      '.jsx',
      '.web.js',
      '.js',
      '.css',
      '.json',
    ],
    alias: {
      'expo-av': fileURLToPath(new URL('./src/shims/expo-av.web.ts', import.meta.url)),
      // Swap lucide-react-native for the web-native version BEFORE
      // the general react-native alias runs, so react-native-svg
      // is never loaded during the web build.
      'lucide-react-native': 'lucide-react',
      'react-native': 'react-native-web',
    },
  },
});
