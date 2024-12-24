import type { SigmoidParams } from '$lib/types';

/**
 * Calculates the target duration for a given day using a sigmoid function
 * @param currentDate The current date
 * @param startDate The start date of the challenge
 * @param params The sigmoid function parameters
 * @returns The target duration in minutes
 */
export function calculateSigmoidal(
  currentDate: Date | string,
  startDate: Date,
  params: SigmoidParams
): number {
  // Ensure currentDate is a Date object
  if (!(currentDate instanceof Date)) {
    currentDate = new Date(currentDate);
  }
  const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const { minDuration, maxDuration, steepness, midpoint } = params;
  return minDuration + (maxDuration - minDuration) / 
    (1 + Math.exp(-steepness * (daysDiff - midpoint)));
}

export function generateWorkoutSchedule(startDate: Date, daysPerWeek: number, totalDays: number = 90) {
  const schedule = [];
  let currentDate = new Date(startDate);
  let workoutCount = 0;

  while (workoutCount < totalDays) {
    const dayOfWeek = currentDate.getDay();
    // Assuming we want to spread workouts evenly through the week
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
      schedule.push({
        date: new Date(currentDate),
        day: workoutCount + 1,
        completed: false,
        workouts: []
      });
      workoutCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedule;
} 