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
  let showSettingsModal = false;
  let selectedDate = null;
  let proposedDuration = 30;
  let editMode = false;
  let workoutId = null;

  function handleWorkoutClick(event) {
    selectedDate = event.detail.date;
    proposedDuration = event.detail.proposedDuration;
    editMode = false;
    workoutId = null;
    showWorkoutModal = true;
  }

  function handleEditWorkout(event) {
    console.log('Editing workout with data:', event.detail);
    selectedDate = event.detail.date;
    proposedDuration = event.detail.duration;
    workoutId = event.detail.id;
    editMode = true;
    showWorkoutModal = true;
  }

  function openWorkoutLog(date = null) {
    selectedDate = date;
    proposedDuration = 30; // Reset to default when manually opening
    editMode = false;
    showWorkoutModal = true;
  }

  function closeModal() {
    showWorkoutModal = false;
    selectedDate = null;
    proposedDuration = 30;
    editMode = false;
    workoutId = null;
  }

  function toggleSettings() {
    showSettingsModal = !showSettingsModal;
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      if (showWorkoutModal) {
        closeModal();
      }
      if (showSettingsModal) {
        showSettingsModal = false;
      }
    }
  }

  onMount(() => {
    schedule.initialize();
  });
</script>

<svelte:window on:keydown={handleKeydown}/>

<div class="min-h-screen bg-background">
  <!-- Header -->
  <div class="border-b sticky top-0 bg-background z-10">
    <div class="flex flex-col sm:flex-row h-auto sm:h-16 items-center px-3 py-2 sm:py-0 gap-2 sm:gap-4">
      <h1 class="text-lg sm:text-xl font-bold text-primary">90-Day Challenge</h1>
      <div class="flex items-center gap-2 sm:gap-4 sm:ml-auto">
        {#if $authStore.user}
          <Button variant="ghost" size="sm" class="px-2" on:click={toggleSettings}>
            ⚙️
          </Button>
          <Button variant="outline" size="sm" on:click={() => openWorkoutLog()}>
            + Workout
          </Button>
          <Button variant="ghost" size="sm" on:click={() => authStore.signOut()}>
            Sign Out
          </Button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <main class="p-3 sm:p-4 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
    {#if $authStore.loading}
      <div class="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    {:else if !$authStore.user}
      <Auth />
    {:else}
      <div class="flex flex-col gap-4 sm:gap-6">
        <!-- Progress Chart -->
        <div class="w-full">
          <div class="rounded-lg border bg-card p-2 sm:p-4 h-[350px] sm:h-[500px]">
            <ProgressChart 
              on:workoutClick={handleWorkoutClick}
              on:editWorkout={handleEditWorkout}
            />
          </div>
        </div>

        <!-- Analytics Panel -->
        <div class="w-full">
          <div class="rounded-lg border bg-card p-3 sm:p-4">
            <AnalyticsPanel />
          </div>
        </div>
      </div>
    {/if}
  </main>

  <!-- Footer -->
  <footer class="border-t py-3 sm:py-4 mt-auto">
    <div class="container flex flex-col items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4">
      <p class="text-xs sm:text-sm text-muted-foreground text-center">
        Track your progress and stay motivated! 💪
      </p>
    </div>
  </footer>

  <!-- Modals -->
  {#if showWorkoutModal}
    <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" on:click={closeModal}>
      <div 
        class="fixed left-[50%] top-[50%] z-50 w-[95%] sm:w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-3 sm:p-6 shadow-lg duration-200 rounded-lg max-h-[90vh] overflow-y-auto"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-center sticky top-0 bg-background pb-3 sm:pb-4 border-b">
          <h2 class="text-base sm:text-lg font-semibold">{editMode ? 'Edit Workout' : 'Log Workout'}</h2>
          <Button 
            variant="ghost" 
            class="h-8 w-8 p-0" 
            on:click={closeModal}
          >
            ✕
          </Button>
        </div>
        <div class="overflow-y-auto pt-2">
          <WorkoutLog 
            selectedDate={selectedDate}
            proposedDuration={proposedDuration}
            editMode={editMode}
            workoutId={workoutId}
            onComplete={closeModal}
          />
        </div>
      </div>
    </div>
  {/if}

  <!-- Settings Modal -->
  {#if showSettingsModal}
    <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" on:click={() => showSettingsModal = false}>
      <div 
        class="fixed left-[50%] top-[50%] z-50 w-[95%] sm:w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-3 sm:p-6 shadow-lg duration-200 rounded-lg"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-center sticky top-0 bg-background pb-3 sm:pb-4 border-b">
          <h2 class="text-base sm:text-lg font-semibold">Challenge Settings</h2>
          <Button 
            variant="ghost" 
            class="h-8 w-8 p-0" 
            on:click={() => showSettingsModal = false}
          >
            ✕
          </Button>
        </div>
        <div class="overflow-y-auto pt-2">
          <ControlsPanel />
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
      Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    -webkit-text-size-adjust: 100%;
  }

  :global(.modal-content) {
    max-height: 90vh;
    overflow-y: auto;
    width: 95vw;
    max-width: 500px;
    margin: 0 auto;
  }

  :global(.modal-header) {
    position: sticky;
    top: 0;
    background: var(--background);
    z-index: 1;
  }
</style>
