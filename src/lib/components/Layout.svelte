<script>
  import Calendar from './Calendar.svelte';
  import ControlsPanel from './ControlsPanel.svelte';
  import ProgressChart from './ProgressChart.svelte';
  import WorkoutLog from './WorkoutLog.svelte';
  import AnalyticsPanel from './AnalyticsPanel.svelte';
  import Auth from './Auth.svelte';
  import { authStore } from '../stores/authStore';
  import { onMount } from 'svelte';
  import { schedule } from '../stores/scheduleStore';
  import { Button } from "$lib/components/UI/button";

  let showWorkoutModal = false;
  let selectedDate = null;
  let proposedDuration = 30;

  function handleWorkoutClick(event) {
    const { date, proposedDuration: duration } = event.detail;
    selectedDate = date;
    proposedDuration = duration;
    showWorkoutModal = true;
  }

  function openWorkoutLog(date = null) {
    selectedDate = date;
    proposedDuration = 30; // Reset to default when manually opening
    showWorkoutModal = true;
  }

  function closeModal() {
    showWorkoutModal = false;
    selectedDate = null;
    proposedDuration = 30;
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && showWorkoutModal) {
      closeModal();
    }
  }

  onMount(() => {
    schedule.initialize();
  });
</script>

<svelte:window on:keydown={handleKeydown}/>

<div class="min-h-screen bg-background">
  <div class="border-b">
    <div class="flex h-16 items-center px-4">
      <h1 class="text-2xl font-bold text-primary">90-Day Workout Challenge</h1>
      <div class="ml-auto flex items-center space-x-4">
        {#if $authStore.user}
          <Button variant="outline" on:click={() => openWorkoutLog()}>
            Add Workout
          </Button>
          <Button variant="ghost" on:click={() => authStore.signOut()}>
            Sign Out
          </Button>
        {/if}
      </div>
    </div>
  </div>

  <main class="p-4 md:p-6 space-y-6">
    {#if $authStore.loading}
      <div class="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    {:else if !$authStore.user}
      <Auth />
    {:else}
      <div class="grid gap-6 dashboard-grid">
        <!-- Top Row -->
        <div class="col-span-full">
          <AnalyticsPanel />
        </div>

        <!-- Main Content Area -->
        <div class="col-span-2 space-y-6">
          <!-- Progress Chart - Now Larger -->
          <div class="rounded-lg border bg-card p-6 h-[500px]">
            <ProgressChart on:workoutClick={handleWorkoutClick} />
          </div>
        </div>

        <!-- Right Sidebar -->
        <div class="col-span-1 space-y-6">
          <div class="rounded-lg border bg-card p-6 sticky top-6">
            <ControlsPanel />
          </div>
        </div>
      </div>
    {/if}
  </main>

  <footer class="border-t py-6 md:px-8 md:py-0">
    <div class="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
      <p class="text-sm text-muted-foreground">
        Track your progress and stay motivated! 💪
      </p>
    </div>
  </footer>

  {#if showWorkoutModal}
    <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" on:click={closeModal}>
      <div 
        class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-center sticky top-0 bg-background pb-4 border-b">
          <h2 class="text-lg font-semibold">Log Workout</h2>
          <Button 
            variant="ghost" 
            class="h-8 w-8 p-0" 
            on:click={closeModal}
          >
            ✕
          </Button>
        </div>
        <div class="overflow-y-auto">
          <WorkoutLog 
            selectedDate={selectedDate}
            proposedDuration={proposedDuration}
            onComplete={closeModal}
          />
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 1280px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }

  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
      Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  :global(.modal-content) {
    max-height: 90vh;
    overflow-y: auto;
  }

  :global(.modal-header) {
    position: sticky;
    top: 0;
    background: var(--background);
    z-index: 1;
  }
</style>
