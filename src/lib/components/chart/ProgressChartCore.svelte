<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import * as d3 from 'd3';
  import type { 
    ChartDimensions, 
    ChartScales, 
    WorkoutDay, 
    ViewMode, 
    ChartEvents, 
    AccessibilityConfig,
    FocusableChartElement 
  } from '$lib/types/chart';
  import { createChartScales, calculateChartDimensions } from '$lib/utils/chartUtils';
  import {
    setupChartSVG,
    renderChartBackground,
    renderGridLines,
    renderAxes,
    renderWorkoutBars,
    addClickOverlay
  } from '$lib/utils/d3ChartRenderer';
  import {
    generateChartDescription,
    createKeyboardNavigationHandler,
    createLiveRegion,
    updateChartAccessibility,
    generateDataTableHTML
  } from '$lib/utils/chartAccessibility';

  /**
   * Core chart rendering component
   * Handles D3.js chart creation and updates
   */

  export let dailyWorkouts: WorkoutDay[] = [];
  export let viewMode: ViewMode = 'week';
  export let containerWidth: number = 0;
  export let containerHeight: number = 0;
  export let workoutTypesData: any[] = [];
  export let currentPage: number = 0;
  export let showDataTable: boolean = false;

  const dispatch = createEventDispatcher<ChartEvents>();

  let chartContainer: HTMLElement;
  let svgElement: any;
  let chartGroup: any;
  let resizeObserver: ResizeObserver;
  let keyboardCleanup: (() => void) | null = null;
  let liveRegion: { announce: (message: string) => void; cleanup: () => void } | null = null;
  let dataTableContainer: HTMLElement;

  // Reactive dimensions
  $: dimensions = calculateChartDimensions(containerWidth, containerHeight);
  $: scales = createChartScales(dailyWorkouts, dimensions);

  // Chart update trigger
  $: if (chartGroup && dailyWorkouts.length && scales && workoutTypesData.length) {
    updateChart();
  }

  // Accessibility updates
  $: if (chartContainer && dailyWorkouts.length && workoutTypesData.length) {
    // Update accessibility attributes when data changes
    requestAnimationFrame(() => {
      updateChartAccessibility(chartContainer, dailyWorkouts, workoutTypesData);
      updateDataTable();
    });
  }

  // Event handlers to pass to chart
  const chartEvents: ChartEvents = {
    workoutClick: (event) => dispatch('workoutClick', event),
    editWorkout: (event) => dispatch('editWorkout', event),
    deleteWorkout: (event) => dispatch('deleteWorkout', event),
    dateClick: (event) => dispatch('dateClick', event)
  };

  function handleElementSelect(element: FocusableChartElement) {
    switch (element.type) {
      case 'bar':
        chartEvents.editWorkout({
          date: element.data.workout.date.toISOString(),
          duration: element.data.workout.duration,
          id: element.data.workout.id
        });
        break;
      case 'proposed':
        chartEvents.workoutClick({
          date: element.data.dayData.date.toISOString(),
          proposedDuration: element.data.dayData.proposed
        });
        break;
      case 'date':
        const clickedDate = new Date(element.data.dayData.date);
        clickedDate.setHours(12, 0, 0, 0);
        chartEvents.dateClick({
          date: clickedDate.toISOString()
        });
        break;
    }
  }

  function updateDataTable() {
    if (dataTableContainer && dailyWorkouts.length && workoutTypesData.length) {
      const tableHTML = generateDataTableHTML(dailyWorkouts, workoutTypesData, viewMode);
      dataTableContainer.innerHTML = tableHTML;
    }
  }

  function updateChart() {
    if (!chartGroup || !scales || !dailyWorkouts.length || !workoutTypesData.length) {
      return;
    }

    // Update SVG dimensions
    svgElement
      .attr('width', containerWidth)
      .attr('height', containerHeight);

    chartGroup
      .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    // Render chart elements in order
    addClickOverlay(chartGroup, dailyWorkouts, scales, dimensions, chartEvents);
    renderChartBackground(chartGroup, dailyWorkouts, scales, dimensions, viewMode);
    renderGridLines(chartGroup, scales, dimensions, containerWidth);
    renderAxes(chartGroup, scales, dimensions, dailyWorkouts, viewMode, containerWidth);
    renderWorkoutBars(chartGroup, dailyWorkouts, scales, dimensions, containerWidth, workoutTypesData, chartEvents);
  }

  function updateDimensions() {
    if (chartContainer) {
      const rect = chartContainer.getBoundingClientRect();
      containerWidth = rect.width;
      containerHeight = rect.height;
    }
  }

  onMount(() => {
    updateDimensions();

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

      // Create SVG
      const result = setupChartSVG(chartContainer, dimensions);
      svgElement = result.svgElement;
      chartGroup = result.chartGroup;

      // Set up accessibility features
      liveRegion = createLiveRegion(chartContainer);
      
      // Set up keyboard navigation
      keyboardCleanup = createKeyboardNavigationHandler(
        chartContainer,
        dailyWorkouts,
        workoutTypesData,
        handleElementSelect,
        liveRegion.announce
      );

      // Add main chart description
      const chartDescription = generateChartDescription(dailyWorkouts, viewMode, currentPage);
      chartContainer.setAttribute('aria-description', chartDescription);
      
      // Initial data table setup
      updateDataTable();
    }
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    if (svgElement) {
      svgElement.remove();
    }
    if (keyboardCleanup) {
      keyboardCleanup();
    }
    if (liveRegion) {
      liveRegion.cleanup();
    }
  });
</script>

<div class="chart-core" bind:this={chartContainer}>
  <!-- SVG will be added here by D3 -->
  
  <!-- Data table alternative for screen readers -->
  <div 
    bind:this={dataTableContainer}
    class={showDataTable ? 'block' : 'sr-only'}
    aria-label="Chart data in table format"
  >
    <!-- Table will be inserted here -->
  </div>
</div>

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

  /* Accessibility styles */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Focus indicators for chart elements */
  :global(.chart-core .chart-element-focused) {
    outline: 3px solid hsl(var(--primary));
    outline-offset: 2px;
    filter: brightness(1.2) drop-shadow(0 0 4px hsl(var(--primary)));
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    :global(.chart-core .chart-element-focused) {
      outline: 4px solid yellow;
      outline-offset: 3px;
    }
    
    :global(.chart-core .completed-rect) {
      stroke-width: 2px;
    }
    
    :global(.chart-core .proposed-rect) {
      stroke-width: 3px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    :global(.chart-core .completed-rect),
    :global(.chart-core .proposed-rect) {
      transition: none;
    }
  }

  /* Data table styles when visible */
  .block {
    display: block;
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid hsl(var(--border));
    border-radius: 0.5rem;
    background: hsl(var(--card));
  }

  .block :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .block :global(th),
  .block :global(td) {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid hsl(var(--border));
  }

  .block :global(th) {
    font-weight: 600;
    background: hsl(var(--muted));
  }

  .block :global(tr:hover) {
    background: hsl(var(--muted) / 0.5);
  }
</style>