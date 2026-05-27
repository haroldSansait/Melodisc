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
    alias: [
      {
        find: /^react-native\/Libraries\/Utilities\/codegenNativeComponent$/,
        replacement: fileURLToPath(new URL('./src/shims/codegenNativeComponent.ts', import.meta.url)),
      },
      {
        find: 'expo-av',
        replacement: fileURLToPath(new URL('./src/shims/expo-av.web.ts', import.meta.url)),
      },
      {
        find: 'expo-linear-gradient',
        replacement: fileURLToPath(new URL('./src/shims/expo-linear-gradient.web.tsx', import.meta.url)),
      },
      {
        find: 'lucide-react-native',
        replacement: 'lucide-react',
      },
      {
        find: '@react-native-google-signin/google-signin',
        replacement: fileURLToPath(new URL('./src/shims/google-signin.web.ts', import.meta.url)),
      },
      {
        find: /^react-native$/,
        replacement: 'react-native-web',
      },
    ],
  },
});
