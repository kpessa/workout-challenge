<script lang="ts">
  import '../app.postcss';
  import AppInit from '$lib/components/AppInit.svelte';
  import { authStore } from '$lib/stores/authStore';
</script>

<AppInit />

{#if $authStore.loading}
  <div class="min-h-screen bg-background text-foreground antialiased">
    <div class="flex items-center justify-center h-screen">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-background text-foreground antialiased">
    <slot />
  </div>
{/if} 

<style>
  /* Prevent pull-to-refresh and bounce effects on iOS */
  :global(html), :global(body) {
    overscroll-behavior-y: none;
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
  }

  :global(#svelte) {
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
</style> 