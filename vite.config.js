import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

const API_TARGET = process.env.VITE_API_TARGET ?? 'http://43.202.193.39:4000/';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  server: {
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/users': { target: API_TARGET, changeOrigin: true },
      '/capsules': { target: API_TARGET, changeOrigin: true },
      '/auth': { target: API_TARGET, changeOrigin: true },
      '/oauth2': { target: API_TARGET, changeOrigin: true },
    },
  },
});
