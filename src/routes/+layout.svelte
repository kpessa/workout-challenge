<script lang="ts">
  import '../app.postcss';
  import { theme } from '$lib/stores/themeStore';
  import { onMount } from 'svelte';

  onMount(() => {
    // Check system preference if no theme is saved
    if (!localStorage.getItem('theme')) {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme.set(systemPrefersDark ? 'dark' : 'light');
    }
  });
</script>

<div class="min-h-screen bg-background text-foreground antialiased">
  <slot />
</div> 