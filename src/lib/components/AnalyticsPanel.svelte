<script lang="ts">
  import { schedule } from '$lib/stores/scheduleStore';
  import type { Workout } from '$lib/types';
  import { onMount } from 'svelte';

  $: workouts = Array.isArray($schedule) ? $schedule : [];
  
  $: {
    console.log('Schedule store value:', $schedule);
    console.log('Workouts array:', workouts);
  }

  $: totalWorkouts = workouts.length;
  $: totalMinutes = workouts.reduce((sum, w) => sum + (w?.duration ?? 0), 0);
  $: avgMinutes = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;
  
  // Calculate day streak
  $: dayStreak = calculateDayStreak(workouts);

  function calculateDayStreak(workouts: Workout[]): number {
    if (!workouts?.length) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get unique dates (in case of multiple workouts per day)
    const uniqueDates = [...new Set(workouts.map(w => {
      const date = new Date(w?.date ?? new Date());
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    }))].sort((a, b) => b - a); // Sort in descending order

    console.log('Unique workout dates:', uniqueDates.map(ts => new Date(ts).toISOString()));

    let streak = 0;
    let currentDate = today.getTime();

    // Check if we have a workout today
    if (uniqueDates[0] === currentDate) {
      streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const expectedDate = currentDate - (86400000 * i);
        if (uniqueDates[i] === expectedDate) {
          streak++;
        } else {
          break;
        }
      }
    } else {
      // Check if we have a streak ending yesterday
      const yesterday = today.getTime() - 86400000;
      if (uniqueDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const expectedDate = yesterday - (86400000 * (i - 1));
          if (uniqueDates[i] === expectedDate) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    console.log('Calculated streak:', streak);
    return streak;
  }

  onMount(() => {
    console.log('AnalyticsPanel mounted, initializing schedule');
    schedule.initialize();
  });
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div class="p-4 rounded-lg border bg-card text-card-foreground">
    <div class="text-2xl font-bold">{totalWorkouts}</div>
    <div class="text-sm text-muted-foreground">Total Workouts</div>
  </div>
  
  <div class="p-4 rounded-lg border bg-card text-card-foreground">
    <div class="text-2xl font-bold">{totalMinutes}</div>
    <div class="text-sm text-muted-foreground">Total Minutes</div>
  </div>
  
  <div class="p-4 rounded-lg border bg-card text-card-foreground">
    <div class="text-2xl font-bold">{avgMinutes}</div>
    <div class="text-sm text-muted-foreground">Avg Minutes</div>
  </div>
  
  <div class="p-4 rounded-lg border bg-card text-card-foreground">
    <div class="text-2xl font-bold">{dayStreak}</div>
    <div class="text-sm text-muted-foreground">Day Streak</div>
  </div>
</div>
