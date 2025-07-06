<script lang="ts">
  import '../app.postcss';
  import AppInit from '$lib/components/AppInit.svelte';
  import PullToRefresh from '$lib/components/PullToRefresh.svelte';
  import { authStore } from '$lib/stores/authStore';
  import { schedule } from '$lib/stores/scheduleStore';
  import { userPreferences } from '$lib/stores/userPreferencesStore';
  import { workoutTypes } from '$lib/stores/workoutTypeStore';
  import { initializeLogCapture } from '$lib/utils/logCapture';
  import { onMount } from 'svelte';
  import { dev } from '$app/environment';

  let pullToRefreshComponent: PullToRefresh;

  onMount(() => {
    initializeLogCapture();
    
    // Register service worker for PWA functionality
    if (!dev && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  });

  async function handleRefresh() {
    try {
      // Refresh all stores by re-initializing them
      await Promise.all([
        schedule.initialize(),
        userPreferences.initialize(),
        workoutTypes.initialize()
      ]);
      
      console.log('✅ All stores refreshed successfully');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      // Stop the refreshing indicator even if refresh fails
      if (pullToRefreshComponent) {
        pullToRefreshComponent.stopRefreshing();
      }
    }
  }
</script>

<AppInit />

{#if $authStore.loading}
  <div class="min-h-screen bg-background text-foreground antialiased">
    <div class="flex items-center justify-center h-screen">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  </div>
{:else}
  <PullToRefresh 
    bind:this={pullToRefreshComponent}
    on:refresh={handleRefresh}
  >
    <div class="min-h-screen bg-background text-foreground antialiased">
      <slot />
    </div>
  </PullToRefresh>
{/if} 

<style>
  /* Allow custom pull-to-refresh while preventing browser default */
  :global(html) {
    height: 100%;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  :global(body) {
    height: 100%;
    /* Allow overscroll for our custom pull-to-refresh */
    overscroll-behavior-y: auto;
    /* Prevent default browser pull-to-refresh */
    overscroll-behavior-x: none;
  }

  :global(#svelte) {
    height: 100%;
  }

  /* Disable default browser pull-to-refresh on iOS Safari */
  @supports (-webkit-touch-callout: none) {
    :global(body) {
      /* This prevents the default browser refresh but allows our custom one */
      overscroll-behavior-y: contain;
    }
  }
</style> 