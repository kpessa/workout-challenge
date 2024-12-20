<script>
  import { schedule } from '../stores/scheduleStore';
  import { userPreferences } from '../stores/userPreferencesStore';
  import { calculateSigmoidal } from '../utils/sigmoidal';
  
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let showWorkoutForm = false;
  let selectedDay = null;
  let workoutDuration = 30;

  // Filter workouts for current month
  $: monthlyWorkouts = $schedule.filter(day => {
    const date = new Date(day.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // Calculate target duration for each day
  $: workoutDays = monthlyWorkouts.map(day => ({
    ...day,
    targetDuration: calculateSigmoidal(day.day, $userPreferences.sigmoidParams)
  }));

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

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  function handleCheckboxClick(day) {
    if (!day.completed) {
      selectedDay = day;
      showWorkoutForm = true;
    }
  }

  function submitWorkout() {
    if (selectedDay && workoutDuration > 0) {
      schedule.logWorkout(new Date(selectedDay.date), workoutDuration);
      showWorkoutForm = false;
      selectedDay = null;
      workoutDuration = 30;
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
</script>

<div class="calendar">
  <div class="calendar-header">
    <button class="nav-button" on:click={previousMonth}>&lt;</button>
    <h2>{monthNames[currentMonth]} {currentYear}</h2>
    <button class="nav-button" on:click={nextMonth}>&gt;</button>
  </div>

  <div class="workout-grid">
    {#each workoutDays as day}
      <div class="workout-day" class:completed={day.completed}>
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={day.completed}
            on:click|preventDefault={() => handleCheckboxClick(day)}
          />
          <span class="checkmark"></span>
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
    background: var(--card-bg);
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
    background: var(--primary-color);
    color: white;
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
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.03);
  }

  .workout-day.completed {
    border-color: var(--success-color);
    background: rgba(76, 175, 80, 0.1);
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
    border: 2px solid var(--border-color);
    border-radius: 4px;
    position: relative;
    flex-shrink: 0;
  }

  .workout-day.completed .checkmark {
    background: var(--success-color);
    border-color: var(--success-color);
  }

  .workout-day.completed .checkmark::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
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
    color: var(--text-muted);
  }

  .completed-duration {
    color: var(--success-color);
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
    background: var(--bg-color);
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
    background: var(--success-color);
    color: white;
  }

  .cancel-button {
    background: var(--text-muted);
    color: white;
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
