import type { SigmoidParams } from '$lib/types';

/**
 * Calculates the target duration for a given day using a sigmoid function
 * @param currentDate The date to calculate the duration for
 * @param startDate The start date of the challenge
 * @param params The sigmoid function parameters
 * @returns The target duration in minutes
 */
export function calculateSigmoidal(
  currentDate: Date,
  startDate: Date,
  params: SigmoidParams
): number {
  const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const { startMinutes, endMinutes, steepness, midpoint } = params;

  // If before start date, return start minutes
  if (daysDiff < 0) return startMinutes;

  // If after 90 days, return end minutes
  if (daysDiff > 90) return endMinutes;

  // Calculate sigmoid value
  const x = daysDiff - midpoint;
  const sigmoid = 1 / (1 + Math.exp(-steepness * x));

  // Scale sigmoid to our range
  const range = endMinutes - startMinutes;
  const scaledValue = startMinutes + (range * sigmoid);

  return Math.round(scaledValue);
} 