import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /(.+\.styles)\.scss$/,
        replacement: '$1.module.scss'
      }
    ]
  },
  css: {
    modules: {
      scopeBehaviour: 'local',
      localsConvention: 'camelCaseOnly',
      generateScopedName: process.env.NODE_ENV === 'production' ? '[hash:base64:8]' : '[name]__[local]',
      globalModulePaths: [/global\.scss$/]
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'node'
  }
});
