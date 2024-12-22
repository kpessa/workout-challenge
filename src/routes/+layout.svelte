<script lang="ts">
  import '../app.css';
  import { theme } from '$lib/stores/themeStore';
  import { onMount } from 'svelte';

  onMount(() => {
    // Default to dark mode
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.add(savedTheme);
    theme.set(savedTheme as 'light' | 'dark');

    // Listen for theme changes
    return theme.subscribe(value => {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(value);
    });
  });
</script>

<div class="min-h-screen bg-background">
  <slot />
</div> 