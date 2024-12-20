<script>
  import Calendar from './Calendar.svelte';
  import ControlsPanel from './ControlsPanel.svelte';
  import ProgressChart from './ProgressChart.svelte';
  import WorkoutLog from './WorkoutLog.svelte';
  import AnalyticsPanel from './AnalyticsPanel.svelte';
  import { schedule } from '../stores/scheduleStore';
  import { onMount } from 'svelte';

  // Initialize the schedule when the app loads
  onMount(() => {
    schedule.initialize();
  });
</script>

<div class="layout">
  <header>
    <h1>90-Day Workout Challenge</h1>
  </header>

  <main>
    <div class="grid-layout">
      <section class="calendar-section">
        <Calendar />
      </section>

      <section class="controls-section">
        <ControlsPanel />
      </section>

      <section class="analytics-section">
        <AnalyticsPanel />
      </section>

      <section class="chart-section">
        <ProgressChart />
      </section>

      <section class="log-section">
        <WorkoutLog />
      </section>
    </div>
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
      "calendar calendar controls"
      "analytics chart chart"
      "log chart chart";
    grid-template-columns: 1fr 2fr 1fr;
  }

  .calendar-section {
    grid-area: calendar;
  }

  .controls-section {
    grid-area: controls;
  }

  .analytics-section {
    grid-area: analytics;
  }

  .chart-section {
    grid-area: chart;
  }

  .log-section {
    grid-area: log;
  }

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
        "calendar"
        "controls"
        "analytics"
        "chart"
        "log";
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
