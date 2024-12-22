<script lang="ts">
  import { Button } from "$lib/components/UI/button";
  import { Input } from "$lib/components/UI/input";
  import { Label } from "$lib/components/UI/label";
  import { schedule } from "$lib/stores/scheduleStore";
  import { format } from "date-fns";
  import { createEventDispatcher } from "svelte";

  export let selectedDate: string | null = null;
  export let proposedDuration = 30;
  export let editMode = false;
  export let workoutId: string | null = null;
  export let onComplete: () => void;

  let duration = proposedDuration;
  let date = selectedDate ? new Date(selectedDate) : new Date();
  $: workouts = $schedule?.workouts || [];
  $: recentWorkouts = workouts.slice(0, 5);

  $: formattedDate = format(date, "MM/dd/yy");

  async function handleSubmit() {
    if (editMode && workoutId) {
      await schedule.updateWorkout(workoutId, date.toISOString(), duration);
    } else {
      await schedule.addWorkout(date.toISOString(), duration);
    }
    onComplete();
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this workout?")) {
      await schedule.deleteWorkout(id);
    }
  }

  function handleEdit(workout: any) {
    date = new Date(workout.date);
    duration = workout.duration;
    workoutId = workout.id;
    editMode = true;
  }
</script>

<form class="space-y-6" on:submit|preventDefault={handleSubmit}>
  <div class="space-y-4">
    <div class="grid gap-2">
      <Label for="date">Date</Label>
      <Input 
        type="date" 
        id="date"
        bind:value={date}
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
  </div>

  <div class="flex justify-end">
    <Button type="submit">
      {editMode ? 'Update' : 'Add'} Workout
    </Button>
  </div>

  {#if recentWorkouts.length > 0}
    <div class="space-y-4">
      <h3 class="font-medium text-sm text-foreground">Recent Workouts</h3>
      <div class="border rounded-lg divide-y">
        {#each recentWorkouts as workout}
          <div class="p-4 flex items-center justify-between bg-card text-card-foreground">
            <div class="space-y-1">
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
</form>
