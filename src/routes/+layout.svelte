<script lang="ts">
  import '../app.postcss';
  import { theme } from '$lib/stores/themeStore';
  import { onMount } from 'svelte';

  // Apply theme class to HTML element
  const applyTheme = (value: 'light' | 'dark') => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(value);
    localStorage.setItem('theme', value);
  };

  onMount(() => {
    // Check system preference if no theme is saved
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    // Apply initial theme
    applyTheme(initialTheme as 'light' | 'dark');
    theme.set(initialTheme as 'light' | 'dark');

    // Listen for theme changes
    return theme.subscribe(value => {
      applyTheme(value);
    });
  });
</script>

<div class="min-h-screen bg-background text-foreground antialiased">
  <slot />
</div> 