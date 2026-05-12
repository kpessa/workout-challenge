import { getStartOfDay } from '$lib/utils/dateHelpers';
import { calculateSigmoidal } from '$lib/utils/sigmoidal';
import type { WorkoutDay, ProcessedWorkout, ViewMode } from '$lib/types/chart';
import type { UserPreferences } from '$lib/types';

/**
 * Data processing utilities for workout charts
 * Extracted from ProgressChart.svelte to improve maintainability and testability
 */

/**
 * Calculates the current page based on today's date and user preferences
 */
export function calculateCurrentPage(
  userPreferences: UserPreferences,
  viewMode: ViewMode
): number {
  if (!userPreferences) return 0;
  
  const today = new Date();
  const startDate = new Date(userPreferences.startDate);
  
  // Set both dates to midnight for accurate day calculation
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  // Calculate the difference from today to start date
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let page;
  if (viewMode === 'month') {
    // For month view, calculate which 30-day period contains today
    const monthPage = Math.floor(diffDays / 30);
    page = Math.min(2, Math.max(0, monthPage)); // Clamp between 0 and 2
  } else {
    // For week view, we need to find which week contains today
    const startDay = startDate.getDay(); // 0-6, where 0 is Sunday
    const adjustedDiffDays = diffDays + startDay;
    const weekPage = Math.floor(adjustedDiffDays / 7);
    page = Math.min(11, Math.max(0, weekPage)); // Clamp between 0 and 11
  }
  
  return page;
}

/**
 * Calculates the date range for a specific page in the given view mode
 */
export function calculatePageDateRange(
  startDate: Date,
  currentPage: number,
  viewMode: ViewMode
): { pageStartDate: Date; pageEndDate: Date } {
  const pageStartDate = new Date(startDate);
  
  // Adjust initial startDate to the beginning of its week (Sunday)
  const startDay = pageStartDate.getDay();
  pageStartDate.setDate(pageStartDate.getDate() - startDay);
  
  // Now add the page offset
  const daysToAdd = viewMode === 'month' ? currentPage * 30 : currentPage * 7;
  pageStartDate.setDate(pageStartDate.getDate() + daysToAdd);
  
  const pageEndDate = new Date(pageStartDate);
  // Set period length based on view mode
  const periodLength = viewMode === 'month' ? 29 : 6; // 30 days for month, 7 days for week
  pageEndDate.setDate(pageEndDate.getDate() + periodLength);

  return { pageStartDate, pageEndDate };
}

/**
 * Groups workouts by date within the specified date range
 */
export function groupWorkoutsByDate(
  scheduleData: Workout[],
  pageStartDate: Date,
  pageEndDate: Date
): Record<string, ProcessedWorkout[]> {
  return scheduleData
    .filter(workout => {
      const workoutDate = getStartOfDay(workout.date);
      return workoutDate >= pageStartDate && workoutDate <= pageEndDate;
    })
    .reduce((acc, workout) => {
      const dateStr = getStartOfDay(workout.date).toDateString();
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push({
        id: workout.id,
        date: getStartOfDay(workout.date),
        duration: workout.duration,
        created_at: workout.created_at,
        workout_type_id: workout.type
      });
      return acc;
    }, {} as Record<string, ProcessedWorkout[]>);
}

/**
 * Creates base workout days for all dates in the specified range
 */
export function createBaseWorkoutDays(
  pageStartDate: Date,
  pageEndDate: Date,
  startDate: Date,
  workoutsByDate: Record<string, ProcessedWorkout[]>
): WorkoutDay[] {
  const allDates = [];
  const currentDate = new Date(pageStartDate);
  
  while (currentDate <= pageEndDate) {
    allDates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return allDates.map(date => {
    const dateStr = date.toDateString();
    const workouts = workoutsByDate[dateStr] || [];
    const dayNum = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      date,
      day: dayNum,
      completed: workouts.length > 0,
      workouts: workouts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      proposed: 0,
      total: workouts.reduce((sum, w) => sum + w.duration, 0)
    };
  });
}

/**
 * Adds proposed workouts to workout days based on user preferences
 */
export function addProposedWorkouts(
  workoutDays: WorkoutDay[],
  userPreferences: UserPreferences,
  pageStartDate: Date,
  recordedDates: Set<string>
): WorkoutDay[] {
  const daysPerWeek = userPreferences.daysPerWeek;
  const startDate = new Date(userPreferences.startDate);
  
  let currentWeekWorkouts = 0;
  let weekStartDate = new Date(pageStartDate);

  return workoutDays.map(day => {
    const dayOfWeek = day.date.getDay();
    
    // Reset week counter on Sundays
    if (dayOfWeek === 0) {
      currentWeekWorkouts = 0;
      weekStartDate = new Date(day.date);
    }

    // Count recorded workouts this week
    if (dayOfWeek === 0 || day.date.toDateString() === pageStartDate.toDateString()) {
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      currentWeekWorkouts = Array.from(recordedDates)
        .filter(dateStr => {
          const date = new Date(dateStr);
          return date >= weekStartDate && date <= weekEnd;
        }).length;
    }

    // Only propose a workout if conditions are met
    const shouldPropose = !recordedDates.has(day.date.toDateString()) && 
                        dayOfWeek !== 0 && 
                        currentWeekWorkouts < daysPerWeek;
    
    if (shouldPropose) {
      const targetTime = Math.round(calculateSigmoidal(
        day.date,
        startDate,
        userPreferences.sigmoid
      ));
      day.proposed = targetTime;
      day.total = targetTime;
      currentWeekWorkouts++;
    }

    return day;
  });
}

/**
 * Main function to calculate workout days for display
 */
export function calculateWorkoutDays(
  userPreferences: UserPreferences,
  scheduleData: Workout[],
  currentPage: number,
  viewMode: ViewMode
): WorkoutDay[] {
  if (!userPreferences || !scheduleData) {
    return [];
  }
  
  const startDate = getStartOfDay(userPreferences.startDate);
  const { pageStartDate, pageEndDate } = calculatePageDateRange(startDate, currentPage, viewMode);
  
  // Group recorded workouts by date
  const workoutsByDate = groupWorkoutsByDate(scheduleData, pageStartDate, pageEndDate);
  
  // Create base workout days for all dates in range
  const workoutDays = createBaseWorkoutDays(pageStartDate, pageEndDate, startDate, workoutsByDate);
  
  // Track which dates already have recorded workouts
  const recordedDates = new Set(Object.keys(workoutsByDate));
  
  // Add proposed workouts
  return addProposedWorkouts(workoutDays, userPreferences, pageStartDate, recordedDates);
}