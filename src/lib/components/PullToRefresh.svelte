<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { browser } from '$app/environment';

  const dispatch = createEventDispatcher();
  
  let container: HTMLDivElement;
  let refreshIndicator: HTMLDivElement;
  let isRefreshing = false;
  let isPulling = false;
  let pullDistance = 0;
  let startY = 0;
  let maxPullDistance = 80;
  let triggerDistance = 60;

  let touchStartY = 0;
  let touchCurrentY = 0;
  let isAtTop = true;

  onMount(() => {
    if (!browser) return;

    const checkScrollPosition = () => {
      isAtTop = window.scrollY === 0;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!isAtTop || isRefreshing) return;
      
      touchStartY = e.touches[0].clientY;
      startY = touchStartY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop || isRefreshing || touchStartY === 0) return;
      
      touchCurrentY = e.touches[0].clientY;
      const deltaY = touchCurrentY - touchStartY;
      
      if (deltaY > 0) {
        e.preventDefault();
        isPulling = true;
        pullDistance = Math.min(deltaY * 0.5, maxPullDistance);
        
        // Update visual feedback
        if (refreshIndicator) {
          // Start at full height hidden, slide down to fully visible
          const progress = Math.min(pullDistance / maxPullDistance, 1);
          const translateY = -80 + (80 * progress);
          refreshIndicator.style.transform = `translateY(${translateY}px)`;
          refreshIndicator.style.opacity = String(Math.min(pullDistance / triggerDistance, 1));
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling || isRefreshing) return;
      
      if (pullDistance >= triggerDistance) {
        triggerRefresh();
      } else {
        resetPull();
      }
      
      touchStartY = 0;
      isPulling = false;
    };

    // Add scroll listener
    window.addEventListener('scroll', checkScrollPosition, { passive: true });
    
    // Add touch listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  });

  async function triggerRefresh() {
    isRefreshing = true;
    
    // Show loading state
    if (refreshIndicator) {
      refreshIndicator.style.transform = `translateY(0px)`;
      refreshIndicator.style.opacity = '1';
    }
    
    // Dispatch refresh event
    dispatch('refresh');
    
    // Simulate minimum refresh time for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    resetPull();
    isRefreshing = false;
  }

  function resetPull() {
    pullDistance = 0;
    isPulling = false;
    
    if (refreshIndicator) {
      refreshIndicator.style.transform = 'translateY(-80px)';
      refreshIndicator.style.opacity = '0';
      refreshIndicator.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      
      setTimeout(() => {
        if (refreshIndicator) {
          refreshIndicator.style.transition = '';
        }
      }, 300);
    }
  }

  // Export function to stop refreshing from parent
  export function stopRefreshing() {
    resetPull();
    isRefreshing = false;
  }
</script>

<div bind:this={container} class="pull-to-refresh-container">
  <!-- Refresh Indicator -->
  <div 
    bind:this={refreshIndicator}
    class="refresh-indicator"
    class:refreshing={isRefreshing}
  >
    <div class="refresh-icon">
      {#if isRefreshing}
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      {:else}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          <path d="M3 21v-5h5"/>
        </svg>
      {/if}
    </div>
    <span class="refresh-text">
      {#if isRefreshing}
        Refreshing...
      {:else if pullDistance >= triggerDistance}
        Release to refresh
      {:else if isPulling}
        Pull to refresh
      {:else}
        Pull down to refresh
      {/if}
    </span>
  </div>

  <!-- Content Slot -->
  <slot />
</div>

<style>
  .pull-to-refresh-container {
    position: relative;
    min-height: 100vh;
  }

  .refresh-indicator {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: hsl(var(--background) / 0.95);
    border-bottom: 1px solid hsl(var(--border));
    z-index: 100;
    opacity: 0;
    transform: translateY(-80px);
    gap: 8px;
    /* Add backdrop blur to match header styling */
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    /* Smooth edges */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    /* Ensure it starts from the very top */
    margin-top: 0;
    padding-top: 0;
  }

  /* iOS safe area support */
  @supports (padding: max(0px)) {
    .refresh-indicator {
      padding-top: env(safe-area-inset-top);
      height: calc(80px + env(safe-area-inset-top));
      transform: translateY(calc(-80px - env(safe-area-inset-top)));
    }
  }

  .refresh-icon {
    color: hsl(var(--primary));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .refresh-text {
    font-size: 14px;
    color: hsl(var(--muted-foreground));
    font-weight: 500;
  }

  .refreshing .refresh-icon {
    color: hsl(var(--primary));
  }

  /* iOS-specific improvements */
  @supports (-webkit-touch-callout: none) {
    .pull-to-refresh-container {
      -webkit-overflow-scrolling: touch;
    }
  }
</style>