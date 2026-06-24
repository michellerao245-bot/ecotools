import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'; // Yeh import add karo

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills(), // Yeh plugin zaroori hai browser compatibility ke liye
  ],
});