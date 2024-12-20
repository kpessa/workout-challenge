<script>
  import { schedule } from '../stores/scheduleStore';
  
  export let selectedDate = null;
  export let proposedDuration = 30;
  export let onComplete = () => {};
  
  let duration = proposedDuration;
  
  // Update duration when proposedDuration changes
  $: if (proposedDuration) {
    duration = proposedDuration;
  }

  // Get recent workouts (last 7 days)
  $: recentWorkouts = $schedule
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7)
    .map(workout => ({
      date: workout.date,
      workouts: [{
        duration: workout.duration,
        timestamp: workout.created_at
      }]
    }));

  async function handleSubmit() {
    if (duration > 0) {
      await schedule.logWorkout(new Date(selectedDate), duration);
      duration = 30; // Reset to default
      onComplete(); // Call this after successful submission
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString();
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Format date for input value
  $: formattedDate = selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : '';
</script>

<div class="workout-log">
  <div class="log-section">
    <h2>Log Workout</h2>
    
    <form on:submit|preventDefault={handleSubmit} class="log-form">
      <div class="form-group">
        <label for="workout-date">Date:</label>
        <input
          id="workout-date"
          type="date"
          bind:value={formattedDate}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div class="form-group">
        <label for="workout-duration">Duration (minutes):</label>
        <input
          id="workout-duration"
          type="number"
          min="1"
          max="240"
          bind:value={duration}
        />
      </div>

      <button type="submit" class="submit-button" disabled={!formattedDate}>
        Log Workout
      </button>
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
                  <span class="duration">{workout.duration} minutes</span>
                  <span class="time">{formatTime(workout.timestamp)}</span>
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

  .submit-button {
    padding: 0.75rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .submit-button:hover {
    background: #45a049;
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
    padding: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .workout-entry:last-child {
    border-bottom: none;
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
</style>
