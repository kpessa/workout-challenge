<!-- Modal container -->
<div 
  class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 overflow-y-auto" 
  role="dialog"
  aria-modal="true"
  aria-labelledby="settings-modal-title"
>
  <button
    class="absolute inset-0 w-full h-full cursor-default"
    on:click={() => dispatch('close')}
    on:keydown={(e) => e.key === 'Escape' && dispatch('close')}
  >
    <span class="sr-only">Close modal</span>
  </button>
  
  <div class="min-h-[calc(100vh-2rem)] flex items-center justify-center">
    <div 
      class="relative w-full max-w-lg mx-auto bg-card text-card-foreground rounded-lg shadow-lg border"
      role="document"
    >
      <!-- Header with close button -->
      <div class="flex items-center justify-between p-4 border-b">
        <h2 id="settings-modal-title" class="text-lg font-semibold">Challenge Settings</h2>
        <Button variant="ghost" size="icon" on:click={() => dispatch('close')}>
          <X class="h-4 w-4" />
          <span class="sr-only">Close</span>
        </Button>
      </div>

      <!-- Scrollable content -->
      <div class="p-4 max-h-[calc(80vh-8rem)] overflow-y-auto">
        {#if showAlert}
          <div class="mb-4">
            <Alert variant={alertVariant}>
              <AlertTitle>{alertTitle}</AlertTitle>
              <AlertDescription>{alertDescription}</AlertDescription>
            </Alert>
          </div>
        {/if}

        <form on:submit|preventDefault={handleUpdate} class="space-y-4">
          <div class="space-y-2">
            <Label for="startDate">Start Date</Label>
            <Input 
              type="date" 
              id="startDate"
              bind:value={localStartDate}
            />
          </div>

          <div class="space-y-2">
            <Label for="daysPerWeek">Days Per Week</Label>
            <Input 
              type="number" 
              id="daysPerWeek"
              min="1"
              max="7"
              bind:value={localDaysPerWeek}
            />
          </div>

          <div class="space-y-2">
            <Label for="minDuration">Minimum Duration (minutes)</Label>
            <Input 
              type="number" 
              id="minDuration"
              min="1"
              bind:value={localParams.minDuration}
            />
          </div>

          <div class="space-y-2">
            <Label for="maxDuration">Maximum Duration (minutes)</Label>
            <Input 
              type="number" 
              id="maxDuration"
              min="1"
              bind:value={localParams.maxDuration}
            />
          </div>

          <div class="space-y-2">
            <Label for="steepness">Progression Steepness</Label>
            <div class="flex gap-4 items-center">
              <Input 
                type="range" 
                id="steepness"
                min="0.01"
                max="0.2"
                step="0.01"
                bind:value={localParams.steepness}
                class="flex-1"
              />
              <span class="text-sm text-muted-foreground w-12 flex-shrink-0">{localParams.steepness.toFixed(2)}</span>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="midpoint">Midpoint (Days)</Label>
            <div class="flex gap-4 items-center">
              <Input 
                type="range" 
                id="midpoint"
                min="1"
                max="90"
                bind:value={localParams.midpoint}
                class="flex-1"
              />
              <span class="text-sm text-muted-foreground w-12 flex-shrink-0">Day {localParams.midpoint}</span>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer with buttons -->
      <div class="flex flex-col sm:flex-row justify-between gap-4 p-4 border-t">
        <Button variant="destructive" on:click={resetToDefaults}>Reset to Defaults</Button>
        <div class="flex gap-2">
          <Button variant="outline" class="flex-1 sm:flex-none" on:click={() => dispatch('close')}>Cancel</Button>
          <Button variant="default" class="flex-1 sm:flex-none" on:click={handleUpdate}>Update</Button>
        </div>
      </div>
    </div>
  </div>
</div>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from "$lib/components/UI/button";
  import { Input } from "$lib/components/UI/input";
  import { Label } from "$lib/components/UI/label";
  import { Alert, AlertTitle, AlertDescription } from "$lib/components/UI/alert";
  import { X } from 'lucide-svelte';
  import { userPreferences } from '../stores/userPreferencesStore';
  import type { SigmoidParams } from '$lib/types';

  const dispatch = createEventDispatcher();

  let localParams: SigmoidParams = $userPreferences.sigmoidParams;
  let localDaysPerWeek = $userPreferences.daysPerWeek;
  let localStartDate = new Date($userPreferences.startDate).toISOString().split('T')[0];

  let showAlert = false;
  let alertVariant: "default" | "destructive" = "default";
  let alertTitle = "";
  let alertDescription = "";

  function showFeedback(success: boolean, title: string, description: string) {
    alertVariant = success ? "default" : "destructive";
    alertTitle = title;
    alertDescription = description;
    showAlert = true;
    
    // Hide the alert after 3 seconds
    setTimeout(() => {
      showAlert = false;
    }, 3000);
  }

  async function handleUpdate() {
    try {
      await userPreferences.set({
        startDate: new Date(localStartDate).toISOString(),
        daysPerWeek: localDaysPerWeek,
        sigmoidParams: localParams
      });
      
      showFeedback(
        true,
        "Settings Updated",
        "Your challenge settings have been saved successfully."
      );
      
      setTimeout(() => {
        dispatch('close');
      }, 1000);
    } catch (error) {
      showFeedback(
        false,
        "Error",
        error instanceof Error ? error.message : "Failed to update settings. Please try again."
      );
    }
  }

  async function resetToDefaults() {
    try {
      await userPreferences.reset();
      localParams = $userPreferences.sigmoidParams;
      localDaysPerWeek = $userPreferences.daysPerWeek;
      localStartDate = new Date($userPreferences.startDate).toISOString().split('T')[0];
      
      showFeedback(
        true,
        "Settings Reset",
        "Your challenge settings have been reset to defaults."
      );
    } catch (error) {
      showFeedback(
        false,
        "Error",
        error instanceof Error ? error.message : "Failed to reset settings. Please try again."
      );
    }
  }
</script> 