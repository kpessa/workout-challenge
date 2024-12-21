<script>
  import { schedule } from '../stores/scheduleStore';
  import { userPreferences } from '../stores/userPreferencesStore';

  // Derived calculations
  $: completedWorkouts = $schedule.filter(day => day.completed);
  
  $: totalWorkoutMinutes = completedWorkouts.reduce((total, day) => {
    return total + day.workouts.reduce((dayTotal, workout) => dayTotal + workout.duration, 0);
  }, 0);

  $: averageMinutesPerWorkout = completedWorkouts.length > 0
    ? Math.round(totalWorkoutMinutes / completedWorkouts.length)
    : 0;

  $: weeksPassed = Math.ceil(
    (new Date() - new Date($userPreferences.startDate)) / (7 * 24 * 60 * 60 * 1000)
  );

  $: averageWorkoutsPerWeek = weeksPassed > 0
    ? Math.round((completedWorkouts.length / weeksPassed) * 10) / 10
    : completedWorkouts.length;

  $: progressPercentage = Math.round((completedWorkouts.length / 90) * 100);
</script>

<div class="analytics-panel">
  <h2>Progress Analytics</h2>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">{completedWorkouts.length}</div>
      <div class="stat-label">Workouts Completed</div>
      <div class="stat-subtext">{progressPercentage}% of 90-day goal</div>
    </div>

    <div class="stat-card">
      <div class="stat-value">{averageWorkoutsPerWeek}</div>
      <div class="stat-label">Avg Workouts/Week</div>
      <div class="stat-subtext">Target: {$userPreferences.daysPerWeek}</div>
    </div>

    <div class="stat-card">
      <div class="stat-value">{averageMinutesPerWorkout}</div>
      <div class="stat-label">Avg Minutes/Workout</div>
      <div class="stat-subtext">Total: {totalWorkoutMinutes} minutes</div>
    </div>

    <div class="stat-card">
      <div class="stat-value">{weeksPassed}</div>
      <div class="stat-label">Weeks Completed</div>
      <div class="stat-subtext">{Math.round(weeksPassed / 13 * 100)}% of timeline</div>
    </div>
  </div>

  <div class="progress-bar">
    <div 
      class="progress-fill" 
      style="width: {progressPercentage}%"
    ></div>
  </div>
</div>

<style>
  .analytics-panel {
    width: 100%;
    margin: 0 auto;
  }

  h2 {
    margin: 0 0 1rem 0;
    text-align: center;
    font-size: 1.25rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.03);
    padding: 0.75rem;
    border-radius: 6px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: bold;
    color: #ff3e00;
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #ccc;
    margin-bottom: 0.25rem;
  }

  .stat-subtext {
    font-size: 0.75rem;
    color: #888;
  }

  .progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    margin-top: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: #ff3e00;
    transition: width 0.3s ease;
  }

  @media (min-width: 640px) {
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      padding: 1rem;
    }

    .stat-value {
      font-size: 2rem;
    }

    .stat-label {
      font-size: 1rem;
    }

    .stat-subtext {
      font-size: 0.875rem;
    }

    .progress-bar {
      height: 8px;
      border-radius: 4px;
      margin-top: 1rem;
    }

    h2 {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
    }
  }
</style>
