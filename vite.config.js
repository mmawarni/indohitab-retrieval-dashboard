import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' membuat hasil build bisa di-hosting di root domain maupun subfolder
// (misalnya GitHub Pages: https://<user>.github.io/<repo>/).
export default defineConfig({
  plugins: [react()],
  base: './',
});
