<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { workoutTypes } from "$lib/stores/workoutTypeStore";
  import type { WorkoutType } from "$lib/types";
  import { onMount } from "svelte";
  import { X } from 'lucide-svelte';
  import * as Dialog from "$lib/components/ui/dialog";

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

<Dialog.Header>
  <Dialog.Title>Manage Workout Types</Dialog.Title>
  <Dialog.Description>
    Create and manage your workout types.
  </Dialog.Description>
</Dialog.Header>

<form class="space-y-4 py-4" on:submit|preventDefault={handleSubmit}>
  <div class="grid gap-4">
    <div class="grid gap-2">
      <Label for="name">Name</Label>
      <Input 
        type="text" 
        id="name"
        bind:value={name}
        placeholder="e.g., Running, Cycling, etc."
        required
      />
    </div>

    <div class="grid gap-2">
      <Label for="color">Color</Label>
      <div class="flex gap-2">
        <Input 
          type="color" 
          id="color"
          bind:value={color}
          class="h-10 w-20 p-1"
        />
        <Input 
          type="text" 
          bind:value={color}
          placeholder="#000000"
          class="flex-1"
        />
      </div>
    </div>
  </div>

  <Dialog.Footer>
    <Button type="submit" class="w-full">
      {editMode ? 'Update' : 'Add'} Workout Type
    </Button>
  </Dialog.Footer>
</form>

{#if types.length > 0}
  <div class="space-y-4">
    <h3 class="text-sm font-medium">Workout Types</h3>
    <div class="rounded-md border">
      {#each types as type}
        <div class="flex items-center justify-between p-4 border-b last:border-0">
          <div class="flex items-center gap-3">
            <div 
              class="w-4 h-4 rounded-full" 
              style="background-color: {type.color};"
            />
            <span class="text-sm font-medium">{type.name}</span>
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