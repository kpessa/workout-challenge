<script lang="ts">
  import ProgressChart from '$lib/components/ProgressChart.svelte';
  import WorkoutLog from '$lib/components/WorkoutLog.svelte';
  import { Button } from "$lib/components/UI/button";
  import * as Dialog from "$lib/components/UI/dialog";
  import { onMount } from 'svelte';
  import { schedule } from '$lib/stores/scheduleStore';
  import { userPreferences } from '$lib/stores/userPreferencesStore';
  import { workoutTypes } from '$lib/stores/workoutTypeStore';
  import type { WorkoutClickEvent, EditWorkoutEvent } from '$lib/types';
  import type { PageData } from './$types';
  
  export let data: PageData;
  export let form: any = undefined;

  let showWorkoutModal = false;
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
    selectedDate = event.detail.date;
    proposedDuration = event.detail.duration;
    workoutId = event.detail.id;
    editMode = true;
    showWorkoutModal = true;
  }

  function openWorkoutLog(date: string | null = null) {
    selectedDate = date;
    proposedDuration = 30;
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

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && showWorkoutModal) {
      closeModal();
    }
  }

  onMount(() => {
    // Initialize all required stores
    schedule.initialize();
    userPreferences.initialize();
    workoutTypes.initialize();
  });
</script>

<div class="fixed inset-0 bg-background flex flex-col">
  <div class="flex justify-between items-center p-2 sm:p-4 border-b">
    <h1 class="text-xl font-semibold">Workout Progress</h1>
    <Button 
      variant="ghost" 
      size="sm"
      class="h-8"
      on:click={() => window.history.back()}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
      </svg>
      <span class="ml-2">Close</span>
    </Button>
  </div>
  
  <div class="flex-1 p-2 pb-4 sm:p-4">
    <ProgressChart 
      isFullScreen={true}
      on:workoutClick={handleWorkoutClick}
      on:editWorkout={handleEditWorkout}
      on:dateClick={(event) => openWorkoutLog(event.detail.date)}
    />
  </div>
</div>

<!-- Workout Modal -->
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

<svelte:window on:keydown={handleKeydown}/>

<style>
  :global(body) {
    overflow: hidden;
  }
</style> 