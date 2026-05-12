import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'happy-dom',
    setupFiles: ['./vitest-setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.svelte-kit/',
        'src/**/*.d.ts',
        'src/**/*.config.ts',
        'src/app.html'
      ]
    }
  },
  resolve: {
    alias: {
      $lib: '/src/lib',
      $app: '/src/app'
    }
  }
});