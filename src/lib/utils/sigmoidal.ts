import type { SigmoidParams } from '$lib/types';

/**
 * Calculates the target duration for a given day using a sigmoid function
 * @param day The day number in the challenge
 * @param params The sigmoid function parameters
 * @returns The target duration in minutes
 */
export function calculateSigmoidal(
  day: number,
  params: SigmoidParams
): number {
  const { startMinutes, endMinutes, steepness, midpoint } = params;
  return startMinutes + (endMinutes - startMinutes) / 
    (1 + Math.exp(-steepness * (day - midpoint)));
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