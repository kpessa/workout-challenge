<script lang="ts">
  export let isLoading: boolean = false;
  export let error: string | null = null;
  export let height: string = '400px';
  export let loadingText: string = 'Loading chart...';
  export let errorText: string = 'Failed to load chart';
</script>

{#if isLoading}
  <div class="chart-loading" style="height: {height}">
    <div class="loading-content">
      <div class="spinner"></div>
      <p class="loading-text">{loadingText}</p>
    </div>
  </div>
{:else if error}
  <div class="chart-error" style="height: {height}">
    <div class="error-content">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <p class="error-text">{errorText}</p>
      <p class="error-detail">{error}</p>
    </div>
  </div>
{/if}

<style>
  .chart-loading {
    @apply flex items-center justify-center bg-background border rounded-lg;
  }

  .loading-content {
    @apply flex flex-col items-center gap-3;
  }

  .spinner {
    @apply w-8 h-8 border-2 border-muted-foreground border-t-primary rounded-full;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    @apply text-muted-foreground text-sm;
  }

  .chart-error {
    @apply flex items-center justify-center bg-background border rounded-lg;
  }

  .error-content {
    @apply flex flex-col items-center gap-3 text-center;
  }

  .error-icon {
    @apply w-12 h-12 text-destructive;
  }

  .error-text {
    @apply text-foreground font-medium;
  }

  .error-detail {
    @apply text-muted-foreground text-sm;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>