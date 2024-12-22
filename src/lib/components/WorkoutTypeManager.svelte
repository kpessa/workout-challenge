<script lang="ts">
  import { Button } from "$lib/components/UI/button";
  import { Input } from "$lib/components/UI/input";
  import { Label } from "$lib/components/UI/label";
  import { workoutTypes } from "$lib/stores/workoutTypeStore";
  import type { WorkoutType } from "$lib/types";
  import { onMount } from "svelte";

  let name = "";
  let color = "#000000";
  let editMode = false;
  let editingId: string | null = null;

  $: types = $workoutTypes || [];

  onMount(() => {
    workoutTypes.initialize();
  });

  async function handleSubmit() {
    if (editMode && editingId) {
      await workoutTypes.updateWorkoutType(editingId, name, color);
      editMode = false;
      editingId = null;
    } else {
      await workoutTypes.addWorkoutType(name, color);
    }
    name = "";
    color = "#000000";
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this workout type?")) {
      await workoutTypes.deleteWorkoutType(id);
    }
  }

  function handleEdit(type: WorkoutType) {
    name = type.name;
    color = type.color;
    editingId = type.id;
    editMode = true;
  }
</script>

<div class="space-y-6">
  <form class="space-y-4" on:submit|preventDefault={handleSubmit}>
    <div class="grid gap-2">
      <Label for="name">Name</Label>
      <Input 
        type="text" 
        id="name"
        bind:value={name}
        placeholder="e.g., Running, Cycling, etc."
        required
        class="w-full"
      />
    </div>

    <div class="grid gap-2">
      <Label for="color">Color</Label>
      <Input 
        type="color" 
        id="color"
        bind:value={color}
        class="h-10 w-full"
      />
    </div>

    <div class="flex justify-end">
      <Button type="submit">
        {editMode ? 'Update' : 'Add'} Workout Type
      </Button>
    </div>
  </form>

  {#if types.length > 0}
    <div class="space-y-4">
      <h3 class="font-medium text-sm text-foreground">Workout Types</h3>
      <div class="border rounded-lg divide-y">
        {#each types as type}
          <div class="p-4 flex items-center justify-between bg-card text-card-foreground">
            <div class="flex items-center space-x-3">
              <div 
                class="w-4 h-4 rounded-full" 
                style="background-color: {type.color};"
              />
              <p class="text-sm font-medium">{type.name}</p>
            </div>
            <div class="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                on:click={() => handleEdit(type)}
              >
                Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                class="text-destructive hover:text-destructive"
                on:click={() => handleDelete(type.id)}
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