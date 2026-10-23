import { defineConfig } from 'vite';

export default defineConfig({
  // Set VITE_BASE_PATH to /<repository-name>/ when building for a Pages project site.
  base: process.env.VITE_BASE_PATH || '/',
});
