<script lang="ts">
  import { onMount } from 'svelte';
  import { schedule } from '$lib/stores/scheduleStore';
  import { format, isToday, isYesterday, parseISO } from 'date-fns';

  let workouts = [];
  let streak = 0;

  schedule.subscribe(value => {
    workouts = value;
    calculateStreak();
  });

  function calculateStreak() {
    if (!workouts || workouts.length === 0) {
      streak = 0;
      return;
    }

    // Get unique dates and sort them in descending order
    const uniqueDates = [...new Set(workouts.map(w => w.date))]
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Start counting streak from most recent workout
    let currentStreak = 1;
    let lastDate = new Date(uniqueDates[0]);

    // Check if the most recent workout is from today or yesterday
    if (!isToday(lastDate) && !isYesterday(lastDate)) {
      streak = 0;
      return;
    }

    // Count consecutive days
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const dayDiff = Math.floor(
        (lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        currentStreak++;
        lastDate = currentDate;
      } else {
        break;
      }
    }

    streak = currentStreak;
  }

  onMount(async () => {
    await schedule.initialize();
  });
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div class="p-4 rounded-lg border bg-card text-card-foreground">
    <div class="text-2xl font-bold">{workouts.length}</div>
    <div class="text-sm text-muted-foreground">Total Workouts</div>
  </div>
  
  <div class="p-4 rounded-lg border bg-card text-card-foreground">
    <div class="text-2xl font-bold">{workouts.reduce((sum, w) => sum + (w?.duration ?? 0), 0)}</div>
    <div class="text-sm text-muted-foreground">Total Minutes</div>
  </div>
  
  <div class="p-4 rounded-lg border bg-card text-card-foreground">
    <div class="text-2xl font-bold">{Math.round(workouts.reduce((sum, w) => sum + (w?.duration ?? 0), 0) / workouts.length)}</div>
    <div class="text-sm text-muted-foreground">Avg Minutes</div>
  </div>
  
  <div class="p-4 rounded-lg border bg-card text-card-foreground">
    <div class="text-2xl font-bold">{streak}</div>
    <div class="text-sm text-muted-foreground">Day Streak</div>
  </div>
</div>
