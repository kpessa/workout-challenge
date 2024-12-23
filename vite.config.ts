import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  optimizeDeps: {
    exclude: ['@supabase/supabase-js'],
    include: ['@supabase/postgrest-js']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
}); 