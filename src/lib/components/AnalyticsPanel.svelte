<script lang="ts">
  import { schedule } from '$lib/stores/scheduleStore';
  import type { Workout } from '$lib/types';

  // Calculate total workout minutes
  $: totalMinutes = $schedule.reduce((acc, workout) => acc + workout.duration, 0);

  // Calculate average workout duration
  $: averageMinutes = $schedule.length > 0 
    ? Math.round(totalMinutes / $schedule.length) 
    : 0;

  // Calculate total workouts
  $: totalWorkouts = $schedule.length;

  // Calculate streak
  $: currentStreak = calculateStreak($schedule);

  function calculateStreak(workouts: Workout[]): number {
    if (workouts.length === 0) return 0;

    const sortedWorkouts = [...workouts].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Check if there's a workout today
    const hasWorkoutToday = sortedWorkouts.some(workout => {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);
      return workoutDate.getTime() === currentDate.getTime();
    });

    if (!hasWorkoutToday) {
      // If no workout today, check if there was one yesterday
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const hasWorkoutYesterday = sortedWorkouts.some(workout => {
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === yesterday.getTime();
      });

      if (!hasWorkoutYesterday) {
        return 0;
      }
      currentDate = yesterday;
    }

    // Calculate streak
    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].date);
      workoutDate.setHours(0, 0, 0, 0);

      if (workoutDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (workoutDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  }
</script>

<div class="analytics-panel">
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div class="stat-card">
      <div class="stat-value">{totalWorkouts}</div>
      <div class="stat-label">Total Workouts</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-value">{totalMinutes}</div>
      <div class="stat-label">Total Minutes</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-value">{averageMinutes}</div>
      <div class="stat-label">Avg Minutes</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-value">{currentStreak}</div>
      <div class="stat-label">Day Streak</div>
    </div>
  </div>
</div>

<style>
  .analytics-panel {
    width: 100%;
  }

  .stat-card {
    padding: 1rem;
    border-radius: 0.5rem;
    background: var(--background);
    border: 1px solid var(--border);
    text-align: center;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--primary);
    line-height: 1.2;
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    margin-top: 0.25rem;
  }

  @media (max-width: 640px) {
    .stat-value {
      font-size: 1.25rem;
    }
    
    .stat-label {
      font-size: 0.75rem;
    }
  }
</style>
