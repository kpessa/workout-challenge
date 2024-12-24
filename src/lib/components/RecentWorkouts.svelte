<script lang="ts">
  import { Button } from "$lib/components/UI/button";
  import * as Collapsible from "$lib/components/UI/collapsible";
  import { ChevronsUpDown } from 'lucide-svelte';
  import { format } from 'date-fns';
  import type { Workout, WorkoutType } from '$lib/types';

  export let recentWorkouts: Workout[] = [];
  export let workoutTypeOptions: WorkoutType[] = [];

  function handleEdit(workout: Workout) {
    dispatch('editWorkout', {
      id: workout.id,
      date: workout.date,
      duration: workout.duration
    });
  }

  function handleDelete(id: string) {
    dispatch('deleteWorkout', { id });
  }

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

{#if recentWorkouts.length > 0}
  <div class="space-y-4">
    <Collapsible.Root class="w-full">
      <div class="flex items-center justify-between">
        <h3 class="font-medium text-sm text-foreground">Recent Workouts</h3>
        <Collapsible.Trigger asChild let:builder>
          <Button builders={[builder]} variant="ghost" size="sm" class="w-9 p-0">
            <ChevronsUpDown class="h-4 w-4" />
            <span class="sr-only">Toggle recent workouts</span>
          </Button>
        </Collapsible.Trigger>
      </div>

      <Collapsible.Content class="mt-4">
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
      </Collapsible.Content>
    </Collapsible.Root>
  </div>
{/if} 