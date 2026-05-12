<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import ProgressChartCoreOptimized from './chart/ProgressChartCoreOptimized.svelte';
  import ChartNavigation from './chart/ChartNavigation.svelte';
  import ChartLegend from './chart/ChartLegend.svelte';
  import { schedule } from '$lib/stores/scheduleStoreRealtime';
  import { userPreferences } from '$lib/stores/userPreferencesStore';
  import { workoutTypes } from '$lib/stores/workoutTypeStore';
  import { calculateWorkoutDays, calculateCurrentPage } from '$lib/utils/workoutDataProcessor';
  import { preloadD3ForCharts } from '$lib/utils/d3ChartRendererOptimized';
  import type { ViewMode, WorkoutDay } from '$lib/types/chart';

  /**
   * Optimized Progress Chart Component with lazy-loaded D3.js
   * Reduces initial bundle size by loading D3 only when needed
   */

  const dispatch = createEventDispatcher();

  export let isFullScreen = false;

  let chartContainer: HTMLElement;
  let currentPage = 0;
  let dailyWorkouts: WorkoutDay[] = [];
  let containerWidth: number = 0;
  let containerHeight: number = 0;
  let containerObserver: ResizeObserver;
  let isMonthView: boolean;
  let viewMode: ViewMode;
  let isInitialized = false;

  // Reactive data processing
  $: userPreferencesData = $userPreferences;
  $: scheduleData = $schedule;
  $: workoutTypesData = $workoutTypes;
  $: isDataReady = userPreferencesData && scheduleData && workoutTypesData?.length > 0;

  $: {
    viewMode = isMonthView ? 'month' : 'week';
    if (isDataReady) {
      processWorkoutDays();
    }
  }

  $: {
    if (isDataReady) {
      currentPage = calculateCurrentPageForUser();
    }
  }

  function updateDimensions() {
    if (chartContainer) {
      const rect = chartContainer.getBoundingClientRect();
      containerWidth = rect.width;
      containerHeight = rect.height;
      
      if (!isInitialized && containerWidth) {
        isMonthView = containerWidth >= 800;
        viewMode = isMonthView ? 'month' : 'week';
        isInitialized = true;
        
        if (isDataReady) {
          currentPage = calculateCurrentPage();
          processWorkoutDays();
        }
      }
    }
  }

  function calculateCurrentPageForUser(): number {
    if (!isDataReady || !userPreferencesData) return 0;
    
    return calculateCurrentPage(userPreferencesData, viewMode);
  }

  function processWorkoutDays() {
    if (!isDataReady || !userPreferencesData?.startDate) {
      dailyWorkouts = [];
      return;
    }

    try {
      dailyWorkouts = calculateWorkoutDays(
        userPreferencesData,
        scheduleData,
        currentPage,
        viewMode
      );
    } catch (error) {
      // Error processing workout data - set empty array as fallback
      dailyWorkouts = [];
    }
  }

  function previousPeriod() {
    if (currentPage > 0) {
      currentPage--;
      processWorkoutDays();
    }
  }

  function nextPeriod() {
    const maxPages = viewMode === 'month' ? 3 : 12;
    if (currentPage < maxPages - 1) {
      currentPage++;
      processWorkoutDays();
    }
  }

  function toggleViewMode() {
    isMonthView = !isMonthView;
    viewMode = isMonthView ? 'month' : 'week';
    currentPage = calculateCurrentPage();
    calculateWorkoutDays();
  }

  // Chart event handlers
  function handleWorkoutClick(event: CustomEvent) {
    dispatch('workoutClick', event.detail);
  }

  function handleEditWorkout(event: CustomEvent) {
    dispatch('editWorkout', event.detail);
  }

  function handleDeleteWorkout(event: CustomEvent) {
    dispatch('deleteWorkout', event.detail);
  }

  function handleDateClick(event: CustomEvent) {
    dispatch('dateClick', event.detail);
  }

  onMount(() => {
    updateDimensions();
    
    // Preload D3 in the background for better UX
    preloadD3ForCharts();

    // Set up resize observer
    containerObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === chartContainer) {
          updateDimensions();
        }
      }
    });

    if (chartContainer) {
      containerObserver.observe(chartContainer);
    }
  });

  function onDestroy() {
    if (containerObserver) {
      containerObserver.disconnect();
    }
  }
</script>

<div 
  class="progress-chart-container" 
  class:fullscreen={isFullScreen}
  role="region"
  aria-label="Workout progress chart"
>
  <!-- Chart Header -->
  <div class="chart-header">
    <ChartNavigation
      {viewMode}
      {currentPage}
      maxPages={viewMode === 'month' ? 3 : 12}
      on:previous={previousPeriod}
      on:next={nextPeriod}
      on:toggleView={toggleViewMode}
    />
  </div>

  <!-- Chart Content -->
  <div 
    class="chart-content" 
    bind:this={chartContainer}
    role="img"
    aria-label="Workout progress visualization showing {dailyWorkouts.length} days of data"
  >
    {#if containerWidth && containerHeight && dailyWorkouts.length}
      <ProgressChartCoreOptimized
        {dailyWorkouts}
        {viewMode}
        {containerWidth}
        {containerHeight}
        {workoutTypesData}
        on:workoutClick={handleWorkoutClick}
        on:editWorkout={handleEditWorkout}
        on:deleteWorkout={handleDeleteWorkout}
        on:dateClick={handleDateClick}
      />
    {:else if isDataReady}
      <div class="no-data" role="status" aria-live="polite">
        <p>No workout data available for this period</p>
      </div>
    {:else}
      <div class="loading-data" role="status" aria-live="polite" aria-busy="true">
        <p>Loading workout data...</p>
      </div>
    {/if}
  </div>

  <!-- Chart Legend -->
  <div class="chart-footer">
    <ChartLegend {viewMode} />
  </div>
</div>

<style>
  .progress-chart-container {
    @apply flex flex-col w-full bg-background border rounded-lg;
    min-height: 300px;
  }

  .progress-chart-container.fullscreen {
    @apply fixed inset-0 z-50 rounded-none;
    min-height: 100vh;
  }

  .chart-header {
    @apply p-4 border-b;
  }

  .chart-content {
    @apply flex-1 p-4;
    min-height: 250px;
    position: relative;
  }

  .chart-footer {
    @apply p-4 border-t;
  }

  .no-data, .loading-data {
    @apply flex items-center justify-center h-full text-muted-foreground;
  }

  .fullscreen .chart-content {
    min-height: calc(100vh - 200px);
  }
</style>