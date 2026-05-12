<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { ChartDimensions, ChartScales, WorkoutDay, ViewMode, ChartEvents } from '$lib/types/chart';
  import { calculateChartDimensions, createChartScalesOptimized } from '$lib/utils/chartUtilsOptimized';
  import {
    setupChartSVGOptimized,
    renderChartBackgroundOptimized,
    renderGridLinesOptimized,
    renderAxesOptimized,
    renderWorkoutBarsOptimized,
    addClickOverlayOptimized
  } from '$lib/utils/d3ChartRendererOptimized';
  import { loadD3, type LoadingState } from '$lib/utils/chartLibraryLoader';
  import ChartLoader from './ChartLoader.svelte';

  /**
   * Optimized core chart rendering component with lazy D3 loading
   * Only loads D3.js when the chart is actually rendered
   */

  export let dailyWorkouts: WorkoutDay[] = [];
  export let viewMode: ViewMode = 'week';
  export let containerWidth: number = 0;
  export let containerHeight: number = 0;
  export let workoutTypesData: any[] = [];

  const dispatch = createEventDispatcher<ChartEvents>();

  let chartContainer: HTMLElement;
  let svgElement: any;
  let chartGroup: any;
  let resizeObserver: ResizeObserver;
  let scales: ChartScales | null = null;
  let d3: any = null;
  
  // Loading state management
  let loadingState: LoadingState = {
    isLoading: true,
    error: null
  };
  let isLibraryLoaded = false;

  // Reactive dimensions
  $: dimensions = calculateChartDimensions(containerWidth, containerHeight);

  // Chart update trigger - only when D3 is loaded
  $: if (chartGroup && dailyWorkouts.length && scales && workoutTypesData.length && isLibraryLoaded) {
    updateChart();
  }

  // Update scales when data changes
  $: if (dailyWorkouts.length && dimensions && isLibraryLoaded) {
    updateScales();
  }

  // Event handlers to pass to chart
  const chartEvents: ChartEvents = {
    workoutClick: (event) => dispatch('workoutClick', event),
    editWorkout: (event) => dispatch('editWorkout', event),
    deleteWorkout: (event) => dispatch('deleteWorkout', event),
    dateClick: (event) => dispatch('dateClick', event)
  };

  async function updateScales() {
    if (!isLibraryLoaded || !dailyWorkouts.length || !dimensions) return;
    
    try {
      scales = await createChartScalesOptimized(dailyWorkouts, dimensions);
    } catch (error) {
      // Failed to create chart scales - could implement proper error handling
    }
  }

  async function updateChart() {
    if (!chartGroup || !scales || !dailyWorkouts.length || !workoutTypesData.length || !isLibraryLoaded) {
      return;
    }

    try {
      // Update SVG dimensions
      svgElement
        .attr('width', containerWidth)
        .attr('height', containerHeight);

      chartGroup
        .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

      // Render chart elements in order
      await addClickOverlayOptimized(chartGroup, dailyWorkouts, scales, dimensions, chartEvents);
      await renderChartBackgroundOptimized(chartGroup, dailyWorkouts, scales, dimensions, viewMode);
      await renderGridLinesOptimized(chartGroup, scales, dimensions, containerWidth);
      await renderAxesOptimized(chartGroup, scales, dimensions, dailyWorkouts, viewMode, containerWidth);
      await renderWorkoutBarsOptimized(chartGroup, dailyWorkouts, scales, dimensions, containerWidth, workoutTypesData, chartEvents);
    } catch (error) {
      // Failed to update chart - could implement proper error handling
    }
  }

  function updateDimensions() {
    if (chartContainer) {
      const rect = chartContainer.getBoundingClientRect();
      containerWidth = rect.width;
      containerHeight = rect.height;
    }
  }

  async function initializeChart() {
    if (!chartContainer || !isLibraryLoaded) return;

    try {
      // Create SVG
      const result = await setupChartSVGOptimized(chartContainer, dimensions);
      svgElement = result.svgElement;
      chartGroup = result.chartGroup;
      
      // Update scales and chart
      await updateScales();
    } catch (error) {
      // Failed to initialize chart - set error state
      loadingState = {
        isLoading: false,
        error: 'Failed to initialize chart'
      };
    }
  }

  onMount(async () => {
    updateDimensions();

    // Load D3 library
    try {
      d3 = await loadD3();
      isLibraryLoaded = true;
      
      loadingState = {
        isLoading: false,
        error: null
      };

      // Initialize chart after D3 is loaded
      await initializeChart();
    } catch (error) {
      loadingState = {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load D3.js'
      };
    }

    // Set up resize observer
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === chartContainer) {
          updateDimensions();
        }
      }
    });

    if (chartContainer) {
      resizeObserver.observe(chartContainer);
    }
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    if (svgElement) {
      svgElement.remove();
    }
  });
</script>

<!-- Show loading state while D3 is loading -->
{#if loadingState.isLoading || loadingState.error}
  <ChartLoader 
    isLoading={loadingState.isLoading}
    error={loadingState.error}
    height="{containerHeight}px"
    loadingText="Loading D3.js..."
    errorText="Failed to load progress chart"
  />
{:else}
  <div class="chart-core" bind:this={chartContainer}>
    <!-- SVG will be added here by D3 -->
  </div>
{/if}

<style>
  .chart-core {
    width: 100%;
    height: 100%;
    position: relative;
  }

  :global(.chart-core .chart-svg) {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  /* Chart element styles */
  :global(.chart-core .x-axis),
  :global(.chart-core .y-axis),
  :global(.chart-core .x-axis-top) {
    @apply text-muted-foreground;
  }

  :global(.chart-core .x-axis path),
  :global(.chart-core .y-axis path),
  :global(.chart-core .x-axis-top path),
  :global(.chart-core .x-axis line),
  :global(.chart-core .y-axis line),
  :global(.chart-core .x-axis-top line) {
    stroke: hsl(var(--border));
    stroke-width: 1px;
    stroke-opacity: 0.5;
  }

  :global(.chart-core .x-axis text),
  :global(.chart-core .y-axis text),
  :global(.chart-core .x-axis-top text) {
    @apply text-foreground;
  }

  :global(.chart-core .completed-rect) {
    stroke: hsl(var(--border));
    stroke-width: 1px;
    stroke-opacity: 0.5;
    transition: filter 0.2s ease-in-out;
  }

  :global(.chart-core .completed-rect:hover) {
    filter: brightness(1.1);
  }

  :global(.chart-core .proposed-rect) {
    fill: transparent;
    stroke: hsl(var(--primary));
    stroke-width: 1.5px;
    stroke-opacity: 0.7;
    stroke-dasharray: 4, 4;
    transition: fill 0.2s ease-in-out;
  }

  :global(.chart-core .proposed-rect:hover) {
    fill: hsl(var(--primary) / 0.2);
  }

  :global(.chart-core .current-day-background) {
    pointer-events: none;
  }

  :global(.chart-core .week-boundary-line) {
    pointer-events: none;
  }

  :global(.chart-core .duration-label) {
    pointer-events: none;
    font-family: system-ui, -apple-system, sans-serif;
    @apply text-foreground;
  }

  :global(.chart-core .duration-label.proposed) {
    opacity: 0.9;
    @apply text-foreground;
  }
</style>