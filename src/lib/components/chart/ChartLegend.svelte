<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import * as Tabs from "$lib/components/ui/tabs";
  import type { ViewMode } from '$lib/types/chart';

  /**
   * Chart legend and view mode selector component
   * Displays workout type legend and view mode toggle
   */

  export let workoutTypesData: any[] = [];
  export let viewMode: ViewMode = 'week';
  export let showDataTable: boolean = false;

  const dispatch = createEventDispatcher();

  function handleViewModeChange(value: ViewMode) {
    dispatch('viewModeChange', { viewMode: value });
  }

  function toggleDataTable() {
    dispatch('toggleDataTable');
  }
</script>

<div class="chart-legend">
  <!-- Legend -->
  {#if workoutTypesData && workoutTypesData.length > 0}
    <div class="legend-container" role="img" aria-label="Chart legend showing workout types and their colors">
      {#each workoutTypesData as type}
        <div class="legend-item">
          <div 
            class="legend-dot" 
            style="background-color: {type.color};"
            aria-hidden="true"
          />
          <span class="legend-label">{type.name}</span>
        </div>
      {/each}
      <div class="legend-item">
        <div class="legend-dot legend-dot-proposed" aria-hidden="true" />
        <span class="legend-label">Proposed</span>
      </div>
    </div>
  {/if}

  <!-- Controls container -->
  <div class="controls-container">
    <!-- View mode toggle -->
    <div class="view-mode-toggle" role="group" aria-label="Chart view mode selection">
      <Tabs.Root value={viewMode} onValueChange={handleViewModeChange}>
        <Tabs.List aria-label="Select chart view mode">
          <Tabs.Trigger value="week" class="tab-trigger" aria-describedby="week-description">Week</Tabs.Trigger>
          <Tabs.Trigger value="month" class="tab-trigger" aria-describedby="month-description">Month</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
      <div id="week-description" class="sr-only">Show workout data for one week at a time</div>
      <div id="month-description" class="sr-only">Show workout data for one month at a time</div>
    </div>

    <!-- Data table toggle -->
    <div class="data-table-toggle">
      <label class="toggle-label">
        <input 
          type="checkbox" 
          checked={showDataTable}
          on:change={toggleDataTable}
          aria-describedby="table-toggle-description"
        />
        <span>Show data table</span>
      </label>
      <div id="table-toggle-description" class="sr-only">
        Toggle between chart view and accessible data table view
      </div>
    </div>
  </div>
</div>

<style>
  .chart-legend {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .controls-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .legend-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem 1.5rem;
    padding: 0 0.5rem;
    font-size: 0.875rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    white-space: nowrap;
  }

  .legend-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    border: 1px solid hsl(var(--border));
    flex-shrink: 0;
  }

  .legend-dot-proposed {
    background: transparent;
    border: 2px dashed hsl(var(--primary));
    border-radius: 50%;
  }

  .legend-label {
    color: hsl(var(--muted-foreground));
    font-size: 0.875rem;
  }

  .view-mode-toggle {
    display: flex;
    justify-content: center;
  }

  .data-table-toggle {
    display: flex;
    justify-content: center;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: hsl(var(--muted-foreground));
    cursor: pointer;
  }

  .toggle-label input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: hsl(var(--primary));
    cursor: pointer;
  }

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

  /* Responsive adjustments */
  @media (max-height: 500px) {
    .chart-legend {
      gap: 0.25rem;
    }

    .controls-container {
      gap: 0.5rem;
    }

    .legend-container {
      gap: 0.25rem 1.5rem;
      margin: 0;
    }

    .legend-label {
      font-size: 0.65rem;
    }

    .legend-dot {
      width: 0.5rem;
      height: 0.5rem;
    }

    .toggle-label {
      font-size: 0.75rem;
    }
  }

  @container (width < 800px) {
    .legend-container {
      gap: 0.5rem 1rem;
      padding: 0 0.5rem;
    }

    .legend-label {
      font-size: 0.7rem;
    }

    .legend-dot {
      width: 0.625rem;
      height: 0.625rem;
    }
  }

  /* Tab styling overrides */
  :global(.chart-legend .tab-trigger) {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
    height: 1.75rem;
  }

  @media (max-height: 500px) {
    :global(.chart-legend .tab-trigger) {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      height: 1.5rem;
    }
  }

  @container (width < 800px) {
    :global(.chart-legend .tab-trigger) {
      font-size: 0.75rem;
      padding: 0.5rem 0.75rem;
      height: 1.75rem;
    }
  }
</style>