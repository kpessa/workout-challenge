import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte({
    compilerOptions: {
      dev: true
    }
  })],
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib')
    }
  },
  optimizeDeps: {
    exclude: ['@supabase/supabase-js']
  }
}); 