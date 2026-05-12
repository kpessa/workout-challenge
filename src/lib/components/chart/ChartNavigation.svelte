<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from "$lib/components/ui/button";
  import type { ViewMode, NavigationConfig } from '$lib/types/chart';

  /**
   * Chart navigation component
   * Handles period navigation and today button
   */

  export let currentPage: number = 0;
  export let viewMode: ViewMode = 'week';

  const dispatch = createEventDispatcher();

  // Calculate navigation state
  $: maxPages = viewMode === 'month' ? 3 : 12; // 3 months or 12 weeks
  $: canGoBack = currentPage > 0;
  $: canGoForward = currentPage < maxPages - 1;

  function previousPeriod() {
    if (canGoBack) {
      dispatch('navigate', { direction: 'previous', page: currentPage - 1 });
    }
  }

  function nextPeriod() {
    if (canGoForward) {
      dispatch('navigate', { direction: 'next', page: currentPage + 1 });
    }
  }

  function goToToday() {
    dispatch('goToToday');
  }
</script>

<div class="chart-navigation" role="toolbar" aria-label="Chart navigation controls">
  <div class="flex justify-center items-center gap-2">
    <Button 
      variant="outline" 
      size="sm"
      class="h-7 px-2"
      on:click={previousPeriod} 
      disabled={!canGoBack}
      aria-label={`Go to previous ${viewMode}, currently on page ${currentPage + 1}`}
    >
      ←
    </Button>
    
    <Button 
      variant="secondary"
      size="sm"
      class="h-7 px-2"
      on:click={goToToday}
      aria-label="Go to current date"
    >
      Today
    </Button>
    
    <Button 
      variant="outline" 
      size="sm"
      class="h-7 px-2"
      on:click={nextPeriod} 
      disabled={!canGoForward}
      aria-label={`Go to next ${viewMode}, currently on page ${currentPage + 1} of ${maxPages}`}
    >
      →
    </Button>
  </div>
</div>

<style>
  .chart-navigation {
    flex: 0 0 auto;
    margin-bottom: 0.5rem;
  }

  .flex {
    display: flex;
  }

  .justify-center {
    justify-content: center;
  }

  .items-center {
    align-items: center;
  }

  .gap-2 {
    gap: 0.5rem;
  }
</style>