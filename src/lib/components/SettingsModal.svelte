<script lang="ts">
  import { Button } from "$lib/components/UI/button";
  import * as Dialog from "$lib/components/UI/dialog";
  import * as Collapsible from "$lib/components/UI/collapsible";
  import { Alert, AlertTitle, AlertDescription } from "$lib/components/UI/alert";
  import { Label } from "$lib/components/UI/label";
  import { Input } from "$lib/components/UI/input";
  import { createEventDispatcher } from "svelte";
  import { userPreferences } from "$lib/stores/userPreferencesStore";
  import type { UserPreferences } from "$lib/types";
  import { ChevronsUpDown } from 'lucide-svelte';

  export let open = false;

  const dispatch = createEventDispatcher();

  const defaultPreferences: UserPreferences = {
    daysPerWeek: 3,
    startDate: new Date().toISOString().split('T')[0],
    sigmoid: {
      steepness: 0.1,
      midpoint: 30,
      minDuration: 30,
      maxDuration: 60
    }
  };

  let preferences: UserPreferences = { ...defaultPreferences };
  let showAdvancedSettings = false;

  let showAlert = false;
  let alertVariant: "default" | "destructive" = "default";
  let alertTitle = "";
  let alertDescription = "";

  function showSuccessAlert() {
    showAlert = true;
    alertVariant = "default";
    alertTitle = "Settings Updated";
    alertDescription = "Your settings have been updated successfully.";
    setTimeout(() => {
      showAlert = false;
    }, 3000);
  }

  function showErrorAlert() {
    showAlert = true;
    alertVariant = "destructive";
    alertTitle = "Error";
    alertDescription = "Failed to update settings. Please try again.";
    setTimeout(() => {
      showAlert = false;
    }, 3000);
  }

  function handleClose() {
    open = false;
  }

  async function handleUpdate() {
    try {
      await userPreferences.update(() => ({
        ...preferences,
        startDate: formatDateForInput(preferences.startDate),
        daysPerWeek: Number(preferences.daysPerWeek),
        sigmoid: {
          ...preferences.sigmoid,
          steepness: Number(preferences.sigmoid.steepness),
          midpoint: Number(preferences.sigmoid.midpoint),
          minDuration: Number(preferences.sigmoid.minDuration),
          maxDuration: Number(preferences.sigmoid.maxDuration)
        }
      }));
      showSuccessAlert();
      setTimeout(() => {
        open = false;
      }, 1000);
    } catch (error) {
      showErrorAlert();
    }
  }

  function resetToDefaults() {
    preferences = { ...defaultPreferences };
  }

  $: if ($userPreferences) {
    preferences = {
      daysPerWeek: $userPreferences.daysPerWeek ?? defaultPreferences.daysPerWeek,
      startDate: formatDateForInput($userPreferences.startDate) ?? defaultPreferences.startDate,
      sigmoid: {
        steepness: $userPreferences.sigmoid?.steepness ?? defaultPreferences.sigmoid.steepness,
        midpoint: $userPreferences.sigmoid?.midpoint ?? defaultPreferences.sigmoid.midpoint,
        minDuration: $userPreferences.sigmoid?.minDuration ?? defaultPreferences.sigmoid.minDuration,
        maxDuration: $userPreferences.sigmoid?.maxDuration ?? defaultPreferences.sigmoid.maxDuration
      }
    };
  }

  function formatDateForInput(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return new Date().toISOString().split('T')[0];
    }
  }
</script>

<Dialog.Root bind:open on:openChange={(e) => !e.detail && dispatch('close')}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Challenge Settings</Dialog.Title>
    </Dialog.Header>
    <div class="max-h-[calc(80vh-12rem)] overflow-y-auto">
      {#if showAlert}
        <div class="mb-4">
          <Alert variant={alertVariant}>
            <AlertTitle>{alertTitle}</AlertTitle>
            <AlertDescription>{alertDescription}</AlertDescription>
          </Alert>
        </div>
      {/if}

      <div class="space-y-6">
        <!-- Primary Settings -->
        <div class="space-y-4">
          <div class="grid gap-4">
            <div class="grid gap-2">
              <Label for="startDate">Start Date</Label>
              <Input 
                type="date" 
                id="startDate"
                bind:value={preferences.startDate}
              />
              <p class="text-sm text-muted-foreground">
                The date you started or want to start your workout challenge
              </p>
            </div>

            <div class="grid gap-2">
              <Label for="daysPerWeek">Days Per Week</Label>
              <Input 
                type="number" 
                id="daysPerWeek"
                bind:value={preferences.daysPerWeek}
                min="1"
                max="7"
              />
              <p class="text-sm text-muted-foreground">
                Number of days per week you want to workout
              </p>
            </div>

            <div class="grid gap-2">
              <Label for="minDuration">Minimum Duration (minutes)</Label>
              <Input 
                type="number" 
                id="minDuration"
                bind:value={preferences.sigmoid.minDuration}
                min="1"
              />
              <p class="text-sm text-muted-foreground">
                Starting workout duration
              </p>
            </div>

            <div class="grid gap-2">
              <Label for="maxDuration">Maximum Duration (minutes)</Label>
              <Input 
                type="number" 
                id="maxDuration"
                bind:value={preferences.sigmoid.maxDuration}
                min="1"
              />
              <p class="text-sm text-muted-foreground">
                Maximum workout duration
              </p>
            </div>
          </div>
        </div>

        <!-- Advanced Settings -->
        <Collapsible.Root>
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-sm">Advanced Settings</h3>
            <Collapsible.Trigger asChild let:builder>
              <Button builders={[builder]} variant="ghost" size="sm" class="w-9 p-0">
                <ChevronsUpDown class="h-4 w-4" />
                <span class="sr-only">Toggle advanced settings</span>
              </Button>
            </Collapsible.Trigger>
          </div>

          <Collapsible.Content class="mt-4 space-y-4">
            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label for="steepness">Steepness</Label>
                <Input 
                  type="number" 
                  id="steepness"
                  bind:value={preferences.sigmoid.steepness}
                  step="0.01"
                  min="0.01"
                  max="1"
                />
                <p class="text-sm text-muted-foreground">
                  Controls how quickly the workout duration increases (0.01 to 1)
                </p>
              </div>

              <div class="grid gap-2">
                <Label for="midpoint">Midpoint (days)</Label>
                <Input 
                  type="number" 
                  id="midpoint"
                  bind:value={preferences.sigmoid.midpoint}
                  min="1"
                />
                <p class="text-sm text-muted-foreground">
                  Day at which the workout duration reaches the middle point between min and max
                </p>
              </div>
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="destructive" on:click={resetToDefaults}>Reset to Defaults</Button>
      <div class="flex gap-2">
        <Button variant="outline" class="flex-1 sm:flex-none" on:click={handleClose}>Cancel</Button>
        <Button variant="default" class="flex-1 sm:flex-none" on:click={handleUpdate}>Update</Button>
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>