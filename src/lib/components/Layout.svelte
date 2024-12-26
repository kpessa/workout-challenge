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
  import * as Dialog from "$lib/components/UI/dialog";
  import AnalyticsGraph from './AnalyticsGraph.svelte';
  import { userPreferences } from '$lib/stores/userPreferencesStore';
  import WeeklyAnalyticsPanel from './WeeklyAnalyticsPanel.svelte';

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
    userPreferences.initialize();
  });
</script>

<svelte:window on:keydown={handleKeydown}/>

<div class="flex min-h-screen flex-col bg-background">
  <!-- Navbar -->
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-14 items-center">
      <div class="flex flex-1 items-center justify-between">
        <div class="flex items-center gap-6 md:gap-8">
          <h1 class="text-lg font-semibold tracking-tight whitespace-nowrap">90-Day&nbsp;Challenge</h1>
        </div>
        <div class="flex items-center gap-2">
          <ThemeToggle />
          {#if $authStore.user}
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
          {/if}
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 container py-6 md:py-8 gap-6 md:gap-8">
    {#if !$authStore.user}
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

        <!-- Daily Analytics Panel -->
        <div class="rounded-lg border bg-card text-card-foreground shadow">
          <div class="p-6">
            <AnalyticsPanel />
          </div>
        </div>

        <!-- Analytics Graph -->
        <div class="rounded-lg border bg-card text-card-foreground shadow">
          <div class="p-6 h-[350px] sm:h-[500px] relative">
            {#if $userPreferences}
              <AnalyticsGraph startDate={$userPreferences.startDate} />
            {/if}
          </div>
        </div>

        <!-- Weekly Analytics Panel -->
        <div class="rounded-lg border bg-card text-card-foreground shadow">
          <div class="p-6">
            <WeeklyAnalyticsPanel />
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
  <Dialog.Root bind:open={showWorkoutModal}>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>
          {editMode ? 'Edit Workout' : 'Log Workout'}
        </Dialog.Title>
      </Dialog.Header>
      <div class="overflow-y-auto">
        <WorkoutLog 
          {selectedDate}
          {proposedDuration}
          {editMode}
          {workoutId}
          onComplete={closeModal}
        />
      </div>
    </Dialog.Content>
  </Dialog.Root>

  <!-- Settings Modal -->
  <SettingsModal 
    bind:open={showSettingsModal} 
    on:openChange={(e) => showSettingsModal = e.detail} 
  />
</div>

<style>
  /* Remove any custom styles that might interfere with theming */
  :global(body) {
    margin: 0;
    -webkit-text-size-adjust: 100%;
  }
</style>
