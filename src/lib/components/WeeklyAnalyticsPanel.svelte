<script lang="ts">
  import { onMount } from 'svelte';
  import { schedule } from '$lib/stores/scheduleStore';
  import { userPreferences } from '$lib/stores/userPreferencesStore';
  import { format, parseISO, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
  import type { Workout } from '$lib/types';

  const HEALTH_BENEFITS_THRESHOLD = 150;
  const ENHANCED_BENEFITS_THRESHOLD = 300;

  interface WeekStats {
    weekStart: Date;
    totalMinutes: number;
    hasHealthBenefits: boolean;
    hasEnhancedBenefits: boolean;
  }

  let weeklyStats: WeekStats[] = [];
  let healthBenefitsStreak = 0;
  let enhancedBenefitsStreak = 0;
  let totalHealthBenefitsWeeks = 0;
  let totalEnhancedBenefitsWeeks = 0;

  function calculateWeeklyStats() {
    if (!$userPreferences || !$schedule) return;

    const startDate = parseISO($userPreferences.startDate);
    const today = new Date();
    
    // Get all weeks from start date to now
    const weeks = eachWeekOfInterval({ start: startDate, end: today });
    
    weeklyStats = weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      
      // Get workouts for this week
      const weekWorkouts = ($schedule as Workout[]).filter(w => {
        const workoutDate = parseISO(w.date);
        return workoutDate >= weekStart && workoutDate <= weekEnd;
      });
      
      // Calculate total minutes
      const totalMinutes = weekWorkouts.reduce((sum, w) => sum + w.duration, 0);
      
      return {
        weekStart,
        totalMinutes,
        hasHealthBenefits: totalMinutes >= HEALTH_BENEFITS_THRESHOLD,
        hasEnhancedBenefits: totalMinutes >= ENHANCED_BENEFITS_THRESHOLD
      };
    });

    // Calculate streaks and totals
    let currentHealthStreak = 0;
    let currentEnhancedStreak = 0;
    let healthWeeks = 0;
    let enhancedWeeks = 0;

    // Go through weeks in reverse to calculate current streaks
    for (let i = weeklyStats.length - 1; i >= 0; i--) {
      const week = weeklyStats[i];
      
      if (week.hasHealthBenefits) {
        healthWeeks++;
        if (i === weeklyStats.length - 1 || weeklyStats[i + 1].hasHealthBenefits) {
          currentHealthStreak++;
        }
      }
      
      if (week.hasEnhancedBenefits) {
        enhancedWeeks++;
        if (i === weeklyStats.length - 1 || weeklyStats[i + 1].hasEnhancedBenefits) {
          currentEnhancedStreak++;
        }
      }
    }

    healthBenefitsStreak = currentHealthStreak;
    enhancedBenefitsStreak = currentEnhancedStreak;
    totalHealthBenefitsWeeks = healthWeeks;
    totalEnhancedBenefitsWeeks = enhancedWeeks;
  }

  $: if ($schedule && $userPreferences) {
    calculateWeeklyStats();
  }

  onMount(async () => {
    await schedule.initialize();
  });
</script>

<div class="analytics-panel">
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="stat">
      <div class="stat-title">Health Benefits Streak</div>
      <div class="stat-value">{healthBenefitsStreak} weeks</div>
      <div class="stat-desc">150+ min/week</div>
    </div>
    <div class="stat">
      <div class="stat-title">Enhanced Benefits Streak</div>
      <div class="stat-value">{enhancedBenefitsStreak} weeks</div>
      <div class="stat-desc">300+ min/week</div>
    </div>
    <div class="stat">
      <div class="stat-title">Total Health Benefit Weeks</div>
      <div class="stat-value">{totalHealthBenefitsWeeks}</div>
      <div class="stat-desc">Since start</div>
    </div>
    <div class="stat">
      <div class="stat-title">Total Enhanced Weeks</div>
      <div class="stat-value">{totalEnhancedBenefitsWeeks}</div>
      <div class="stat-desc">Since start</div>
    </div>
  </div>
</div>

<style>
  .analytics-panel {
    width: 100%;
  }

  .stat {
    padding: 1rem;
    border-radius: 0.5rem;
    background: var(--background);
    border: 1px solid var(--border);
  }

  .stat-title {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--foreground);
  }

  .stat-desc {
    font-size: 0.75rem;
    color: var(--muted-foreground);
    margin-top: 0.25rem;
  }
</style> 