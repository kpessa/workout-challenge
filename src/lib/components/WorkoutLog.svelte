<script>
  import { schedule } from '../stores/scheduleStore';
  import { Button } from "$lib/components/UI/button";
  import { Input } from "$lib/components/UI/input";
  import { Pencil, Trash2 } from 'lucide-svelte';
  
  // Default to today's date if no date is selected
  export let selectedDate = new Date().toISOString();
  export let proposedDuration = 30;
  export let onComplete = () => {};
  export let editMode = false;
  export let workoutId = null;
  
  let duration = editMode ? proposedDuration : 30;
  
  // Update duration when proposedDuration changes and not in edit mode
  $: if (proposedDuration && !editMode) {
    duration = proposedDuration;
  }

  // Get recent workouts (last 7 days)
  $: recentWorkouts = $schedule
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7)
    .map(workout => ({
      date: workout.date,
      workouts: [{
        id: workout.id,
        duration: workout.duration,
        timestamp: workout.created_at
      }]
    }));

  async function handleSubmit() {
    try {
      if (duration > 0) {
        // Parse the date from the input value (YYYY-MM-DD format)
        const [year, month, day] = formattedDate.split('-').map(Number);
        const workoutDate = new Date(year, month - 1, day, 12, 0, 0, 0);
        
        if (isNaN(workoutDate.getTime())) {
          throw new Error('Invalid date');
        }

        if (editMode && workoutId) {
          console.log('Updating workout:', { id: workoutId, duration, date: workoutDate.toISOString() });
          await schedule.updateWorkout(workoutDate, duration, workoutId);
        } else {
          console.log('Logging new workout:', { date: workoutDate.toISOString(), duration });
          await schedule.logWorkout(workoutDate, duration);
        }
        onComplete(); // Close modal
      }
    } catch (error) {
      console.error('Error submitting workout:', error);
      alert('Failed to save workout. Please try again.');
    }
  }

  async function handleDelete() {
    try {
      if (!workoutId) {
        console.error('No workout ID provided for deletion');
        throw new Error('No workout ID provided for deletion');
      }

      if (confirm('Are you sure you want to delete this workout?')) {
        console.log('Deleting workout with ID:', workoutId);
        await schedule.deleteWorkout(null, workoutId);
        console.log('Workout deleted successfully');
        onComplete(); // Close modal
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Failed to delete workout. Please try again.');
    }
  }

  function formatDate(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  }

  // Format date for input value, ensuring it's in YYYY-MM-DD format
  $: formattedDate = selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : '';

  // Validate date whenever it changes
  $: {
    if (selectedDate) {
      const date = new Date(selectedDate);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', selectedDate);
        selectedDate = new Date().toISOString(); // Reset to today if invalid
      }
    }
  }

  // When editing a workout, convert the date to YYYY-MM-DD format
  function setEditWorkout(workout, date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
    }
    workoutId = workout.id;
    duration = workout.duration;
    editMode = true;
  }
</script>

<div class="workout-log">
  <div class="log-section">
    <h2>{editMode ? 'Edit Workout' : 'Log Workout'}</h2>
    
    <form on:submit|preventDefault={handleSubmit} class="log-form">
      <div class="form-group">
        <label for="workout-date">Date:</label>
        <Input
          id="workout-date"
          type="date"
          bind:value={formattedDate}
          max={new Date().toISOString().split('T')[0]}
          class="date-input"
        />
      </div>

      <div class="form-group">
        <label for="workout-duration">Duration (minutes):</label>
        <Input
          id="workout-duration"
          type="number"
          min="1"
          max="240"
          bind:value={duration}
        />
      </div>

      <div class="button-group">
        <button type="submit" class="submit-button" disabled={!formattedDate}>
          {editMode ? 'Update Workout' : 'Log Workout'}
        </button>

        {#if editMode}
          <button 
            type="button" 
            class="delete-button" 
            on:click={handleDelete}
          >
            Delete Workout
          </button>
        {/if}
      </div>
    </form>
  </div>

  <div class="recent-section">
    <h3>Recent Workouts</h3>
    
    {#if recentWorkouts.length > 0}
      <div class="recent-workouts">
        {#each recentWorkouts as day}
          <div class="workout-day">
            <div class="day-header">
              {formatDate(day.date)}
            </div>
            <div class="workout-entries">
              {#each day.workouts as workout}
                <div class="workout-entry">
                  <div class="flex items-center gap-2">
                    <span class="duration">{workout.duration} minutes</span>
                    <span class="time">{formatTime(workout.timestamp)}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button 
                      class="icon-button"
                      on:click={() => setEditWorkout(workout, day.date)}
                      title="Edit workout"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      class="icon-button delete"
                      on:click={async () => {
                        if (confirm('Are you sure you want to delete this workout?')) {
                          await schedule.deleteWorkout(null, workout.id);
                        }
                      }}
                      title="Delete workout"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <p class="no-workouts">No recent workouts logged</p>
    {/if}
  </div>
</div>

<style>
  .workout-log {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1.5rem;
    max-width: 600px;
    margin: 1rem auto;
  }

  .log-section, .recent-section {
    margin-bottom: 2rem;
  }

  h2, h3 {
    margin: 0 0 1rem 0;
    color: #ccc;
  }

  .log-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    color: #888;
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: inherit;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .submit-button, .delete-button {
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    flex: 1;
  }

  .submit-button {
    background: #4CAF50;
    color: white;
  }

  .submit-button:hover {
    background: #45a049;
  }

  .delete-button {
    background: #dc3545;
    color: white;
  }

  .delete-button:hover {
    background: #c82333;
  }

  .submit-button:disabled, .delete-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .recent-workouts {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .workout-day {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .day-header {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.5rem;
    font-weight: bold;
  }

  .workout-entries {
    padding: 0.5rem;
  }

  .workout-entry {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: background-color 0.2s;
  }

  .workout-entry:last-child {
    border-bottom: none;
  }

  .workout-entry:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .duration {
    font-weight: bold;
    color: #4CAF50;
  }

  .time {
    color: #888;
    font-size: 0.9em;
  }

  .no-workouts {
    color: #888;
    text-align: center;
    padding: 1rem;
    font-style: italic;
  }

  @media (max-width: 480px) {
    .workout-log {
      padding: 1rem;
    }
  }

  .date-input-wrapper,
  .date-input-wrapper input[type="date"],
  .date-display {
    display: none;
  }

  :global(.date-input) {
    appearance: none;
    -webkit-appearance: none;
    position: relative;
    display: block;
  }

  :global(.date-input::-webkit-calendar-picker-indicator) {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
    cursor: pointer;
  }

  :global(.date-input::-webkit-datetime-edit) {
    padding: 0;
  }

  .icon-button {
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: var(--muted-foreground);
    opacity: 0.7;
    transition: all 0.2s;
    border-radius: 4px;
  }

  .icon-button:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  .icon-button.delete:hover {
    color: #dc3545;
  }
</style>
