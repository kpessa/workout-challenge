<script lang="ts">
  import { onMount } from 'svelte';
  import { schedule } from '$lib/stores/scheduleStore';
  import { userPreferences } from '$lib/stores/userPreferencesStore';
  import { format, parseISO, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
  import type { Workout } from '$lib/types';
  import * as Table from '$lib/components/ui/table';

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
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>Health Benefits Streak</Table.Head>
        <Table.Head>Enhanced Benefits Streak</Table.Head>
        <Table.Head>Total Health Benefit Weeks</Table.Head>
        <Table.Head>Total Enhanced Weeks</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell>{healthBenefitsStreak} weeks</Table.Cell>
        <Table.Cell>{enhancedBenefitsStreak} weeks</Table.Cell>
        <Table.Cell>{totalHealthBenefitsWeeks}</Table.Cell>
        <Table.Cell>{totalEnhancedBenefitsWeeks}</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>150+ min/week</Table.Cell>
        <Table.Cell>300+ min/week</Table.Cell>
        <Table.Cell>Since start</Table.Cell>
        <Table.Cell>Since start</Table.Cell>
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