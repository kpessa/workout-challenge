<script>
  import Calendar from './Calendar.svelte';
  import ControlsPanel from './ControlsPanel.svelte';
  import ProgressChart from './ProgressChart.svelte';
  import WorkoutLog from './WorkoutLog.svelte';
  import AnalyticsPanel from './AnalyticsPanel.svelte';
  import { schedule } from '../stores/scheduleStore';
  import { onMount } from 'svelte';
  import Auth from './Auth.svelte';
  import { authStore } from '../stores/authStore';

  // Initialize the schedule when the app loads
  onMount(() => {
    schedule.initialize();
  });
</script>

<div class="layout">
  <header>
    <h1>90-Day Workout Challenge</h1>
    {#if $authStore.user}
      <button on:click={() => authStore.signOut()}>Sign Out</button>
    {/if}
  </header>

  <main>
    {#if $authStore.loading}
      <div class="loading">Loading...</div>
    {:else if !$authStore.user}
      <Auth />
    {:else}
      <div class="grid-layout">
        <div class="log">
          <WorkoutLog />
        </div>
        <div class="calendar">
          <Calendar />
        </div>
        <div class="controls">
          <ControlsPanel />
        </div>
        <div class="chart">
          <ProgressChart />
        </div>
        <div class="analytics">
          <AnalyticsPanel />
        </div>
      </div>
    {/if}
  </main>

  <footer>
    <p>Track your progress and stay motivated! 💪</p>
  </footer>
</div>

<style>
  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
    color: #fff;
  }

  header {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  h1 {
    margin: 0;
    color: #ff3e00;
    font-size: 2rem;
  }

  main {
    flex: 1;
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  .grid-layout {
    display: grid;
    gap: 2rem;
    grid-template-areas:
      "log log"
      "calendar controls"
      "chart analytics";
    grid-template-columns: 1fr 300px;
  }

  .calendar { grid-area: calendar; }
  .controls { grid-area: controls; }
  .chart { grid-area: chart; }
  .analytics { grid-area: analytics; }
  .log { grid-area: log; }

  footer {
    text-align: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  footer p {
    margin: 0;
    color: #888;
  }

  @media (max-width: 1200px) {
    .grid-layout {
      grid-template-areas:
        "log"
        "calendar"
        "controls"
        "chart"
        "analytics";
      grid-template-columns: 1fr;
    }

    main {
      padding: 1rem;
    }
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 1.5rem;
    }
  }

  :global(body) {
    margin: 0;
    background: #1a1a1a;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
      Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style>
