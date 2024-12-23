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

  const dispatch = createEventDispatcher();

  export let selectedDate: string | null = null;
  export let proposedDuration = 30;
  export let editMode = false;
  export let workoutId: string | null = null;
  export let onComplete: () => void;

  let duration = proposedDuration;
  let dateString = selectedDate || format(new Date(), 'yyyy-MM-dd');
  
  function toLocalDate(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return format(localDate, 'yyyy-MM-dd');
  }

  $: date = parseISO(dateString);
  $: workouts = $schedule || [];
  $: recentWorkouts = workouts.slice(0, 5);
  $: formattedDate = format(date, "MMM d, yyyy");

  let selectedWorkoutType: { label: string; value: string } | null = null;
  let isInitialized = false;
  $: workoutTypeOptions = $workoutTypes || [];
  
  // Track state changes
  $: {
    console.log('State update:', {
      selectedWorkoutType,
      workoutTypeOptions
    });
  }

  // Initialize workout type when editing
  $: if (!isInitialized && workoutTypeOptions.length > 0 && editMode && workoutId) {
    const workout = workouts.find(w => w.id === workoutId);
    if (workout) {
      const type = workoutTypeOptions.find(t => t.id === workout.workout_type_id);
      if (type) {
        selectedWorkoutType = {
          label: type.name,
          value: type.id
        };
        isInitialized = true;
        console.log('Initialized workout type:', selectedWorkoutType);
      }
    }
  }

  let showWorkoutTypeManager = false;

  onMount(async () => {
    console.log('Starting initialization...');
    await Promise.all([
      workoutTypes.initialize(),
      schedule.initialize()
    ]);
    console.log('Stores initialized');
    
    if (editMode && workoutId) {
      const workout = workouts.find(w => w.id === workoutId);
      console.log('Found workout:', workout);
      if (workout) {
        dateString = toLocalDate(workout.date);
        duration = workout.duration;
        selectedWorkoutType = {
          label: workoutTypeOptions.find(t => t.id === workout.workout_type_id)?.name,
          value: workout.workout_type_id
        };
        isInitialized = true;
        console.log('Setting initial values:', {
          date: dateString,
          duration,
          workoutType: selectedWorkoutType
        });
      }
    }
  });

  function handleSelectedChange(selected: { label: string; value: string }) {
    console.log('Select value changed:', selected);
    selectedWorkoutType = selected;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    console.log('Form submitted with:', {
      date: dateString,
      duration,
      workoutType: selectedWorkoutType
    });
    
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

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this workout?")) {
      await schedule.deleteWorkout(id);
    }
  }

  function handleEdit(workout: Workout) {
    console.log('Editing workout:', workout);
    dateString = toLocalDate(workout.date);
    duration = workout.duration;
    workoutId = workout.id;
    selectedWorkoutType = {
      label: workoutTypeOptions.find(t => t.id === workout.workout_type_id)?.name,
      value: workout.workout_type_id
    };
    isInitialized = true;
    editMode = true;
    console.log('Set workout values:', {
      date: dateString,
      duration,
      workoutType: selectedWorkoutType
    });
  }

  function handleClose() {
    onComplete();
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between border-b pb-4">
    <h2 class="text-lg font-semibold">{editMode ? 'Edit' : 'Log'} Workout</h2>
    <Button 
      variant="ghost" 
      size="icon"
      on:click={handleClose}
    >
      <X class="h-4 w-4" />
      <span class="sr-only">Close</span>
    </Button>
  </div>

  <form class="space-y-6" on:submit={handleSubmit}>
    <div class="space-y-4">
      <div class="grid gap-2">
        <Label for="date">Date</Label>
        <Input 
          type="date" 
          id="date"
          bind:value={dateString}
          class="w-full"
        />
      </div>

      <div class="grid gap-2">
        <Label for="duration">Duration (minutes)</Label>
        <Input 
          type="number" 
          id="duration"
          bind:value={duration}
          min="1"
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

    <div class="flex justify-end">
      <Button type="submit">
        {editMode ? 'Update' : 'Add'} Workout
      </Button>
    </div>
  </form>

  {#if recentWorkouts.length > 0}
    <div class="space-y-4">
      <h3 class="font-medium text-sm text-foreground">Recent Workouts</h3>
      <div class="border rounded-lg divide-y">
        {#each recentWorkouts as workout}
          <div class="p-4 flex items-center justify-between bg-card text-card-foreground">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                {#if workout.workout_type_id}
                  {#if workoutTypeOptions.find(t => t.id === workout.workout_type_id)}
                    <div 
                      class="w-3 h-3 rounded-full" 
                      style="background-color: {workoutTypeOptions.find(t => t.id === workout.workout_type_id)?.color};"
                    />
                    <p class="text-sm font-medium">{workoutTypeOptions.find(t => t.id === workout.workout_type_id)?.name}</p>
                  {/if}
                {/if}
              </div>
              <p class="text-sm font-medium">{format(new Date(workout.date), "MMM d, yyyy")}</p>
              <p class="text-sm text-muted-foreground">{workout.duration} minutes</p>
            </div>
            <div class="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                on:click={() => handleEdit(workout)}
              >
                Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                class="text-destructive hover:text-destructive"
                on:click={() => handleDelete(workout.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<Dialog.Root bind:open={showWorkoutTypeManager}>
  <Dialog.Content class="max-w-lg">
    <WorkoutTypeManager />
  </Dialog.Content>
</Dialog.Root>
