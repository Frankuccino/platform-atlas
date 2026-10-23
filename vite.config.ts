import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static marketing/catalog site. No framework beyond React, no SSR, no API.
// The Vite entry stays at the project root so the deployed entry and the
// Vite entry remain the same file.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
  },
});
