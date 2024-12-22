<script lang="ts">
  import Calendar from './Calendar.svelte';
  import ProgressChart from './ProgressChart.svelte';
  import WorkoutLog from './WorkoutLog.svelte';
  import AnalyticsPanel from './AnalyticsPanel.svelte';
  import Auth from './Auth.svelte';
  import SettingsModal from './SettingsModal.svelte';
  import { authStore } from '$lib/stores/authStore';
  import { onMount } from 'svelte';
  import { schedule } from '$lib/stores/scheduleStore';
  import { Button } from "$lib/components/UI/button";
  import type { WorkoutClickEvent, EditWorkoutEvent } from '$lib/types';
  import ThemeToggle from '$lib/components/UI/theme-toggle.svelte';
  import { Plus, Settings2, LogOut } from 'lucide-svelte';

  let showWorkoutModal = false;
  let showSettingsModal = false;
  let selectedDate: string | null = null;
  let proposedDuration = 30;
  let editMode = false;
  let workoutId: string | null = null;

  function handleWorkoutClick(event: CustomEvent<WorkoutClickEvent>) {
    selectedDate = event.detail.date;
    proposedDuration = event.detail.proposedDuration;
    editMode = false;
    workoutId = null;
    showWorkoutModal = true;
  }

  function handleEditWorkout(event: CustomEvent<EditWorkoutEvent>) {
    console.log('Editing workout with data:', event.detail);
    selectedDate = event.detail.date;
    proposedDuration = event.detail.duration;
    workoutId = event.detail.id;
    editMode = true;
    showWorkoutModal = true;
  }

  function openWorkoutLog(date: string | null = null) {
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

  function openSettings() {
    showSettingsModal = true;
  }

  function signOut() {
    authStore.signOut();
  }

  function handleKeydown(event: KeyboardEvent) {
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

<div class="flex min-h-screen flex-col bg-background">
  <!-- Navbar -->
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-14 items-center">
      <div class="flex flex-1 items-center justify-between">
        <div class="flex items-center gap-6 md:gap-8">
          <h1 class="text-lg font-semibold tracking-tight">90-Day Challenge</h1>
        </div>
        <div class="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" on:click={() => openWorkoutLog()}>
            <Plus class="h-4 w-4" />
            <span class="sr-only">Add workout</span>
          </Button>
          <Button variant="ghost" size="icon" on:click={openSettings}>
            <Settings2 class="h-4 w-4" />
            <span class="sr-only">Settings</span>
          </Button>
          <Button variant="ghost" size="icon" on:click={signOut}>
            <LogOut class="h-4 w-4" />
            <span class="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 container py-6 md:py-8 gap-6 md:gap-8">
    {#if $authStore.loading}
      <div class="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    {:else if !$authStore.user}
      <Auth />
    {:else}
      <div class="flex flex-col gap-6 md:gap-8">
        <!-- Progress Chart -->
        <div class="rounded-lg border bg-card text-card-foreground shadow">
          <div class="p-6 h-[350px] sm:h-[500px] relative">
            <ProgressChart 
              on:workoutClick={handleWorkoutClick}
              on:editWorkout={handleEditWorkout}
              on:dateClick={(event) => openWorkoutLog(event.detail.date)}
            />
          </div>
        </div>

        <!-- Analytics Panel -->
        <div class="rounded-lg border bg-card text-card-foreground shadow">
          <div class="p-6">
            <AnalyticsPanel />
          </div>
        </div>
      </div>
    {/if}
  </main>

  <!-- Footer -->
  <footer class="border-t py-6 md:py-0">
    <div class="container flex h-14 items-center justify-center">
      <p class="text-sm text-muted-foreground">
        Track your progress and stay motivated! 💪
      </p>
    </div>
  </footer>

  <!-- Modals -->
  {#if showWorkoutModal}
    <div 
      class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" 
      on:click={closeModal}
      on:keydown={handleKeydown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-modal-title"
    >
      <div 
        class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 rounded-lg sm:rounded-xl"
        on:click|stopPropagation
        role="document"
      >
        <div class="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 id="workout-modal-title" class="font-semibold leading-none tracking-tight">
            {editMode ? 'Edit Workout' : 'Log Workout'}
          </h2>
        </div>
        <div class="overflow-y-auto">
          <WorkoutLog 
            {selectedDate}
            {proposedDuration}
            {editMode}
            {workoutId}
            onComplete={closeModal}
          />
        </div>
      </div>
    </div>
  {/if}

  <!-- Settings Modal -->
  {#if showSettingsModal}
    <SettingsModal on:close={() => showSettingsModal = false} />
  {/if}
</div>

<style>
  /* Remove any custom styles that might interfere with theming */
  :global(body) {
    margin: 0;
    -webkit-text-size-adjust: 100%;
  }
</style>
