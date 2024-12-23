<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { theme } from '$lib/stores/themeStore';
  import { userPreferences } from '$lib/stores/userPreferencesStore';
  import { browser } from '$app/environment';

  onMount(async () => {
    // Initialize auth first
    await authStore.initialize();

    // Initialize user preferences
    userPreferences.initialize();

    // Initialize theme only in browser
    if (browser && !localStorage.getItem('theme')) {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme.set(systemPrefersDark ? 'dark' : 'light');
    }
  });
</script>