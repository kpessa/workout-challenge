<script lang="ts">
  import { onMount } from 'svelte';
  import { schedule } from '$lib/stores/scheduleStore';
  import { userPreferences } from '$lib/stores/userPreferencesStore';
  import { format, isToday, isYesterday, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, differenceInDays, addDays } from 'date-fns';
  import { calculateSigmoidal } from '$lib/utils/sigmoidal';
  import * as Table from '$lib/components/ui/table';

  interface Workout {
    id: string;
    date: string;
    duration: number;
    type?: string;
  }

  interface DailyAverage {
    date: string;
    average: number;
    projectedWeekly: number;
    targetMinutes: number;
  }

  const HEALTH_BENEFITS_THRESHOLD = 150;
  const ENHANCED_BENEFITS_THRESHOLD = 300;

  interface WeeklyProgress {
    date: string;
    actualMinutes: number;
    targetMinutes: number;
    averageMinutes: number;
  }

  interface DailyProgress {
    date: string;
    actualMinutes: number;
    proposedMinutes: number;
    rollingAverage: number;
  }

  interface SigmoidPoint {
    date: string;
    weeklyTarget: number;
  }

  let workouts: Workout[] = [];
  let streak = 0;
  let weeklyStats: { date: string; minutes: number }[] = [];
  let weeklyAverage = 0;
  let currentWeekMinutes = 0;
  let weeklyTarget = 0;
  let dailyAverages: DailyAverage[] = [];
  let weeklyProgress: WeeklyProgress[] = [];
  let dailyProgress: DailyProgress[] = [];
  let sigmoidPoints: SigmoidPoint[] = [];

  $: if ($userPreferences) {
    weeklyTarget = $userPreferences.daysPerWeek * $userPreferences.sigmoid.maxDuration;
    calculateSigmoidPoints();
  }

  function calculateSigmoidPoints() {
    if (!$userPreferences) return;

    const startDate = parseISO($userPreferences.startDate);
    const today = new Date();
    const daysSinceStart = Math.max(differenceInDays(today, startDate), 0);
    
    // Calculate points for sigmoid curve - show 90 days total
    sigmoidPoints = Array.from({ length: 90 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const weeklyTarget = calculateSigmoidal(date, startDate, $userPreferences.sigmoid);
      
      return {
        date: dateStr,
        weeklyTarget
      };
    });
  }

  schedule.subscribe(value => {
    workouts = value;
    calculateStreak();
    calculateWeeklyStats();
    calculateDailyAverages();
  });

  function calculateDailyAverages() {
    if (!workouts || workouts.length === 0) return;

    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstDate = new Date(sortedWorkouts[0].date);
    const lastDate = new Date();  // Use today as the end date
    
    dailyAverages = [];
    let currentDate = firstDate;

    while (currentDate <= lastDate) {
      // Calculate 7-day rolling average
      const weekEnd = currentDate;
      const weekStart = addDays(weekEnd, -6);
      const weekWorkouts = workouts.filter(w => {
        const date = new Date(w.date);
        return date >= weekStart && date <= weekEnd;
      });

      const totalMinutes = weekWorkouts.reduce((sum, w) => sum + (w.duration ?? 0), 0);
      const average = totalMinutes / 7; // Daily average over the week
      const projectedWeekly = average * 7; // Project to full week

      // Get target for this day
      const daysSinceStart = differenceInDays(currentDate, parseISO($userPreferences.startDate));
      const targetForDay = sigmoidPoints[Math.max(0, Math.min(daysSinceStart, sigmoidPoints.length - 1))]?.weeklyTarget ?? 0;

      dailyAverages.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        average,
        projectedWeekly,
        targetMinutes: targetForDay
      });

      currentDate = addDays(currentDate, 1);
    }
  }

  function calculateWeeklyStats() {
    if (!workouts || workouts.length === 0) return;

    // Find the earliest and latest workout dates
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstWorkoutDate = startOfWeek(new Date(sortedWorkouts[0].date));
    const lastWorkoutDate = endOfWeek(new Date(sortedWorkouts[sortedWorkouts.length - 1].date));
    
    // Create array of week intervals from first workout to now
    const weeks = eachDayOfInterval({ start: firstWorkoutDate, end: lastWorkoutDate })
      .filter(date => isSameDay(date, startOfWeek(date)))
      .map(weekStart => {
        const weekEnd = endOfWeek(weekStart);
        const weekWorkouts = workouts.filter(w => {
          const workoutDate = new Date(w.date);
          return workoutDate >= weekStart && workoutDate <= weekEnd;
        });
        
        return {
          date: format(weekStart, 'MMM d'),
          minutes: weekWorkouts.reduce((sum, w) => sum + (w.duration ?? 0), 0)
        };
      });

    weeklyStats = weeks;
    
    // Calculate weekly average (excluding current week if it's not complete)
    const today = new Date();
    const isCurrentWeekComplete = endOfWeek(today) <= lastWorkoutDate;
    const completedWeeks = isCurrentWeekComplete ? weeks : weeks.slice(0, -1);
    
    weeklyAverage = completedWeeks.length > 0 
      ? Math.round(completedWeeks.reduce((sum, week) => sum + week.minutes, 0) / completedWeeks.length)
      : 0;

    // Calculate current week's minutes
    currentWeekMinutes = weeks[weeks.length - 1]?.minutes ?? 0;
  }

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

  function calculateWeeklyProgress() {
    if (!workouts || workouts.length === 0) return;

    // Find the earliest and latest dates
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstDate = startOfWeek(new Date(sortedWorkouts[0].date));
    const lastDate = endOfWeek(new Date());

    // Create array of weeks
    weeklyProgress = eachDayOfInterval({ start: firstDate, end: lastDate })
      .filter(date => isSameDay(date, startOfWeek(date)))
      .map(weekStart => {
        const weekEnd = endOfWeek(weekStart);
        
        // Actual minutes this week
        const weekWorkouts = workouts.filter(w => {
          const workoutDate = new Date(w.date);
          return workoutDate >= weekStart && workoutDate <= weekEnd;
        });
        const actualMinutes = weekWorkouts.reduce((sum, w) => sum + (w.duration ?? 0), 0);

        // Target minutes for this week
        const daysSinceStart = differenceInDays(weekStart, parseISO($userPreferences.startDate));
        const targetMinutes = sigmoidPoints[Math.max(0, Math.min(daysSinceStart, sigmoidPoints.length - 1))]?.weeklyTarget ?? 0;

        // Calculate running average
        const previousWeeks = weeklyProgress.slice(-3); // Last 3 weeks
        const averageMinutes = previousWeeks.length > 0
          ? Math.round((previousWeeks.reduce((sum, w) => sum + w.actualMinutes, 0) + actualMinutes) / (previousWeeks.length + 1))
          : actualMinutes;

        return {
          date: format(weekStart, 'MMM d'),
          actualMinutes,
          targetMinutes,
          averageMinutes
        };
      });
  }

  function calculateDailyProgress() {
    if (!workouts || workouts.length === 0) return;

    // Find the earliest and latest dates
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstDate = new Date(sortedWorkouts[0].date);
    const lastDate = new Date();

    // Create array of days
    dailyProgress = eachDayOfInterval({ start: firstDate, end: lastDate })
      .map(date => {
        // Get workouts for this day
        const dayWorkouts = workouts.filter(w => 
          isSameDay(new Date(w.date), date)
        );
        const actualMinutes = dayWorkouts.reduce((sum, w) => sum + (w.duration ?? 0), 0);

        // Group workouts by type
        const workoutsByType = dayWorkouts.reduce((acc, w) => {
          if (!w.type) return acc;
          acc.push({
            type: w.type,
            minutes: w.duration ?? 0
          });
          return acc;
        }, [] as { type: string; minutes: number }[]);

        // Get proposed minutes for this day
        const daysSinceStart = differenceInDays(date, parseISO($userPreferences.startDate));
        const proposedMinutes = sigmoidPoints[Math.max(0, Math.min(daysSinceStart, sigmoidPoints.length - 1))]?.weeklyTarget ?? 0;

        // Calculate 7-day rolling average
        const weekStart = addDays(date, -6);
        const weekWorkouts = workouts.filter(w => {
          const workoutDate = new Date(w.date);
          return workoutDate >= weekStart && workoutDate <= date;
        });
        const weeklyTotal = weekWorkouts.reduce((sum, w) => sum + (w.duration ?? 0), 0);
        const rollingAverage = weeklyTotal / 7;

        return {
          date: format(date, 'MMM d'),
          actualMinutes,
          proposedMinutes,
          rollingAverage,
          workouts: workoutsByType
        };
      });
  }

  $: if (workouts && sigmoidPoints) {
    calculateWeeklyProgress();
    calculateDailyProgress();
  }

  onMount(async () => {
    await schedule.initialize();
  });
</script>

<div class="analytics-panel">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>Current Streak</Table.Head>
        <Table.Head>Weekly Average</Table.Head>
        <Table.Head>This Week</Table.Head>
        <Table.Head>Weekly Target</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell>{streak} days</Table.Cell>
        <Table.Cell>{Math.round(weeklyAverage)} min</Table.Cell>
        <Table.Cell>{currentWeekMinutes} min</Table.Cell>
        <Table.Cell>{weeklyTarget} min</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
</div>

<style>
  .analytics-panel {
    width: 100%;
  }

  /* Mobile font size and padding adjustments */
  @media (max-width: 640px) {
    :global(.analytics-panel th) {
      font-size: 0.6875rem; /* 11px */
      padding: 0.5rem 1rem; /* Reduced vertical padding */
    }
    
    :global(.analytics-panel td) {
      font-size: 0.625rem; /* 10px - slightly smaller for data */
      padding: 0.5rem 1rem; /* Reduced vertical padding */
    }
  }

  /* Very small mobile screens */
  @media (max-width: 380px) {
    :global(.analytics-panel th) {
      font-size: 0.5625rem; /* 9px */
      padding: 0.375rem 0.75rem; /* Even more reduced padding */
    }
    
    :global(.analytics-panel td) {
      font-size: 0.5rem; /* 8px - slightly smaller for data */
      padding: 0.375rem 0.75rem; /* Even more reduced padding */
    }
  }
</style>
