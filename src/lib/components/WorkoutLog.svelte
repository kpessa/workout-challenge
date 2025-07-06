<script lang="ts">
  import { Button } from "$lib/components/UI/button";
  import { Input } from "$lib/components/UI/input";
  import { Label } from "$lib/components/UI/label";
  import { schedule } from "$lib/stores/scheduleStore";
  import { format, parseISO } from "date-fns";
  import { createEventDispatcher, onMount } from "svelte";
  import { X, Settings } from 'lucide-svelte';
  import { workoutTypes } from "$lib/stores/workoutTypeStore";
  import type { WorkoutType, Workout } from "$lib/types";
  import * as Select from "$lib/components/UI/select";
  import WorkoutTypeManager from "./WorkoutTypeManager.svelte";
  import * as Dialog from "$lib/components/UI/dialog";
  import RecentWorkouts from './RecentWorkouts.svelte';

  const dispatch = createEventDispatcher();

  export let selectedDate: string | null = null;
  export let proposedDuration = 30;
  export let editMode = false;
  export let workoutId: string | null = null;
  export let onComplete: () => void;

  let duration = proposedDuration;
  let dateString = format(new Date(), 'yyyy-MM-dd');
  
  // React to selectedDate changes from chart clicks
  $: if (selectedDate) {
    dateString = toLocalDate(selectedDate);
  }
  
  // React to proposedDuration changes from chart clicks
  $: if (proposedDuration && !editMode) {
    duration = proposedDuration;
  }
  
  // Auto-select first workout type when adding new workout
  $: if (!editMode && workoutTypeOptions.length > 0 && !selectedWorkoutType) {
    selectedWorkoutType = {
      label: workoutTypeOptions[0].name,
      value: workoutTypeOptions[0].id
    };
  }
  
  // Reset delete confirmation when not in edit mode
  $: if (!editMode) {
    deleteConfirmState = false;
  }
  
  function toLocalDate(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd');
  }

  // Safely parse date with validation
  $: {
    try {
      if (dateString && dateString.length >= 10) {
        date = parseISO(dateString);
      } else {
        date = new Date();
      }
    } catch (error) {
      date = new Date();
    }
  }
  $: workouts = $schedule || [];
  $: recentWorkouts = workouts.slice(0, 5);
  $: formattedDate = format(date, "MMM d, yyyy");

  let selectedWorkoutType: { label: string; value: string } | null = null;
  let isInitialized = false;
  let deleteConfirmState = false; // Track delete confirmation state
  let date: Date = new Date();
  $: workoutTypeOptions = $workoutTypes || [];
  

  // Initialize workout type when editing
  $: if (!isInitialized && workoutTypeOptions.length > 0 && editMode && workoutId) {
    const workout = workouts.find(w => w.id === workoutId);
    if (workout) {
      const type = workoutTypeOptions.find(t => t.id === workout.type);
      if (type) {
        selectedWorkoutType = {
          label: type.name,
          value: type.id
        };
        isInitialized = true;
      }
    }
  }

  let showWorkoutTypeManager = false;

  onMount(async () => {
    await Promise.all([
      workoutTypes.initialize(),
      schedule.initialize()
    ]);
    
    if (editMode && workoutId) {
      const workout = workouts.find(w => w.id === workoutId);
      if (workout) {
        dateString = toLocalDate(workout.date);
        duration = workout.duration;
        // selectedWorkoutType initialization is handled by reactive statement above
      }
    } else if (!editMode && workoutTypeOptions.length > 0 && !selectedWorkoutType) {
      // Auto-select first workout type when adding new workout
      selectedWorkoutType = {
        label: workoutTypeOptions[0].name,
        value: workoutTypeOptions[0].id
      };
    }
  });

  function handleSelectedChange(selected: { label: string; value: string }) {
    selectedWorkoutType = selected;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!selectedWorkoutType) {
      alert("Please select a workout type");
      return;
    }

    try {
      const isoDate = new Date(dateString + 'T12:00:00').toISOString();
      
      if (editMode && workoutId) {
        await schedule.updateWorkout(workoutId, isoDate, Number(duration), selectedWorkoutType.value);
      } else {
        await schedule.addWorkout(isoDate, Number(duration), selectedWorkoutType.value);
      }
      
      onComplete();
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout. Please try again.');
    }
  }

  async function handleDelete() {
    if (!workoutId) return;
    
    if (!deleteConfirmState) {
      // First click - enter confirmation state
      deleteConfirmState = true;
      // Auto-reset after 3 seconds if no second click
      setTimeout(() => {
        deleteConfirmState = false;
      }, 3000);
    } else {
      // Second click - actually delete
      try {
        await schedule.deleteWorkout(workoutId);
        onComplete(); // Close the modal after successful deletion
      } catch (error) {
        console.error('Error deleting workout:', error);
        alert('Failed to delete workout. Please try again.');
      }
    }
  }

  function handleEdit(workout: Workout) {
    dateString = toLocalDate(workout.date);
    duration = workout.duration;
    workoutId = workout.id;
    selectedWorkoutType = {
      label: workoutTypeOptions.find(t => t.id === workout.type)?.name,
      value: workout.type
    };
    isInitialized = true;
    editMode = true;
    deleteConfirmState = false; // Reset delete confirmation when editing
  }

  function handleClose() {
    onComplete();
  }

  async function handleRecentWorkoutDelete(event: CustomEvent) {
    const { id } = event.detail;
    try {
      await schedule.deleteWorkout(id);
      // No need to close modal since user might want to continue working
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Failed to delete workout. Please try again.');
    }
  }
</script>

<div class="space-y-6">
  <form class="space-y-6" on:submit={handleSubmit}>
    <div class="space-y-4">
      <div class="grid gap-2">
        <Label for="date">Date</Label>
        <Input 
          type="date" 
          id="date"
          bind:value={dateString}
          class="w-full [color-scheme:dark]"
        />
      </div>

      <div class="grid gap-2">
        <Label for="duration">Duration (minutes)</Label>
        <Input 
          type="number" 
          id="duration"
          bind:value={duration}
          min="1"
          inputmode="numeric"
          pattern="[0-9]*"
          class="w-full"
        />
      </div>

      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <Label for="workoutType">Workout Type</Label>
          <Button 
            variant="ghost" 
            size="icon"
            on:click={() => showWorkoutTypeManager = true}
            class="h-8 w-8"
          >
            <Settings class="h-4 w-4" />
            <span class="sr-only">Manage Workout Types</span>
          </Button>
        </div>
        {#if workoutTypeOptions.length > 0}
          <Select.Root
            selected={selectedWorkoutType}
            onSelectedChange={handleSelectedChange}
          >
            <Select.Trigger class="w-full">
              <Select.Value placeholder="Select a workout type" />
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                {#each workoutTypeOptions as type}
                  <Select.Item 
                    value={type.id}
                    label={type.name}
                  >
                    <div class="flex items-center gap-2">
                      <div 
                        class="w-3 h-3 rounded-full" 
                        style="background-color: {type.color};"
                      />
                      {type.name}
                    </div>
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        {/if}
      </div>
    </div>

    <div class="flex justify-between">
      {#if editMode}
        <Button 
          type="button" 
          variant={deleteConfirmState ? "destructive" : "outline"}
          class={deleteConfirmState ? "bg-red-600 hover:bg-red-700" : "text-red-600 border-red-600 hover:bg-red-50"}
          on:click={handleDelete}
        >
          {deleteConfirmState ? 'Confirm Delete' : 'Delete Workout'}
        </Button>
      {:else}
        <div></div>
      {/if}
      
      <Button type="submit">
        {editMode ? 'Update' : 'Add'} Workout
      </Button>
    </div>
  </form>

  <!-- Recent Workouts -->
  <RecentWorkouts 
    {recentWorkouts}
    {workoutTypeOptions}
    on:editWorkout
    on:deleteWorkout={handleRecentWorkoutDelete}
  />
</div>

<Dialog.Root bind:open={showWorkoutTypeManager}>
  <Dialog.Content class="max-w-lg">
    <WorkoutTypeManager />
  </Dialog.Content>
</Dialog.Root>
