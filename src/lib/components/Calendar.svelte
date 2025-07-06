<script lang="ts">
  import { schedule } from '../stores/scheduleStore';
  import { userPreferences } from '../stores/userPreferencesStore';
  import { calculateSigmoidal } from '$lib/utils/sigmoidal';
  import type { CalendarWorkout, Workout } from '$lib/types';
  import { getStartOfDay } from '$lib/utils/dateHelpers';
  
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let showWorkoutForm = false;
  let selectedDay: CalendarWorkout | null = null;
  let workoutDuration = 30;

  // Filter workouts for current month
  $: monthlyWorkouts = $schedule.filter(day => {
    const date = new Date(day.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // Calculate target duration for each day
  $: workoutDays = monthlyWorkouts.map(workout => {
    const workoutDate = new Date(workout.date);
    const startDate = new Date($userPreferences.startDate);
    const dayNum = Math.floor((workoutDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      ...workout,
      day: dayNum,
      targetDuration: calculateSigmoidal(dayNum, $userPreferences.sigmoidParams),
      completed: true,
      workouts: [workout],
      proposed: 0,
      total: workout.duration
    } as CalendarWorkout;
  });

  function previousMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
  }

  function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  function handleCheckboxClick(day: CalendarWorkout) {
    if (!day.completed) {
      selectedDay = day;
      showWorkoutForm = true;
    }
  }

  function submitWorkout() {
    if (selectedDay && workoutDuration > 0) {
      schedule.addWorkout(selectedDay.date, workoutDuration);
      showWorkoutForm = false;
      selectedDay = null;
      workoutDuration = 30;
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  export let onWorkoutClick = (date: string) => {};
</script>

<div class="calendar">
  <div class="calendar-header">
    <button class="nav-button" on:click={previousMonth}>&lt;</button>
    <h2>{monthNames[currentMonth]} {currentYear}</h2>
    <button class="nav-button" on:click={nextMonth}>&gt;</button>
  </div>

  <div class="workout-grid">
    {#each workoutDays as day}
      <div 
        class="workout-day" 
        on:click={() => onWorkoutClick(day.date)}
        on:keydown={(e) => e.key === 'Enter' && onWorkoutClick(day.date)}
        role="button"
        tabindex="0"
        class:completed={day.completed}
        aria-label={`Workout for ${formatDate(day.date)}`}
      >
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={day.completed}
            on:click|preventDefault={() => handleCheckboxClick(day)}
          />
          <span class="checkmark" aria-hidden="true"></span>
          <div class="day-info">
            <span class="date">{formatDate(day.date)}</span>
            <span class="target">Target: {Math.round(day.targetDuration)}min</span>
            {#if day.completed}
              <span class="completed-duration">
                Completed: {day.workouts.reduce((total, w) => total + w.duration, 0)}min
              </span>
            {/if}
          </div>
        </label>
      </div>
    {/each}
  </div>

  {#if showWorkoutForm}
    <div class="workout-form-overlay">
      <div class="workout-form">
        <h3>Log Workout for {selectedDay ? formatDate(selectedDay.date) : ''}</h3>
        <div class="form-group">
          <label for="duration">Duration (minutes):</label>
          <input
            id="duration"
            type="number"
            min="1"
            max="240"
            inputmode="numeric"
            pattern="[0-9]*"
            bind:value={workoutDuration}
          />
        </div>
        <div class="form-actions">
          <button class="cancel-button" on:click={() => showWorkoutForm = false}>
            Cancel
          </button>
          <button class="submit-button" on:click={submitWorkout}>
            Save Workout
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .calendar {
    @apply bg-card;
    border-radius: 8px;
    padding: 1.5rem;
    position: relative;
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .nav-button {
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
  }

  .workout-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }

  .workout-day {
    border: 1px solid hsl(var(--border));
    border-radius: 4px;
    padding: 0.5rem;
    @apply bg-card;
  }

  .workout-day.completed {
    border-color: hsl(var(--success));
    background: hsl(var(--success) / 0.1);
  }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    cursor: pointer;
  }

  input[type="checkbox"] {
    display: none;
  }

  .checkmark {
    width: 24px;
    height: 24px;
    border: 2px solid hsl(var(--border));
    border-radius: 4px;
    position: relative;
    flex-shrink: 0;
  }

  .workout-day.completed .checkmark {
    background: hsl(var(--success));
    border-color: hsl(var(--success));
  }

  .workout-day.completed .checkmark::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: hsl(var(--success-foreground));
  }

  .day-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex-grow: 1;
  }

  .date {
    font-weight: bold;
  }

  .target {
    font-size: 0.9em;
    @apply text-muted-foreground;
  }

  .completed-duration {
    color: hsl(var(--success));
    font-size: 0.9em;
  }

  .workout-form-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .workout-form {
    @apply bg-background;
    padding: 2rem;
    border-radius: 8px;
    min-width: 300px;
  }

  .form-group {
    margin: 1.5rem 0;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .submit-button {
    background: hsl(var(--success));
    color: hsl(var(--success-foreground));
  }

  .cancel-button {
    background: hsl(var(--muted));
    color: hsl(var(--muted-foreground));
  }

  @media (max-width: 768px) {
    .calendar {
      padding: 1rem;
    }

    .workout-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
