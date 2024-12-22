/**
 * Clamps a number between a minimum and maximum value
 * @param value The value to clamp
 * @param min The minimum value
 * @param max The maximum value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Formats a number with a specific number of decimal places
 * @param value The value to format
 * @param decimals The number of decimal places
 * @returns The formatted number
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toFixed(decimals);
}

/**
 * Formats a duration in minutes to a human-readable string
 * @param minutes The duration in minutes
 * @returns The formatted duration string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Calculates the percentage of a value between a min and max
 * @param value The current value
 * @param min The minimum value
 * @param max The maximum value
 * @returns The percentage (0-100)
 */
export function calculatePercentage(value: number, min: number, max: number): number {
  if (min === max) return 0;
  const percentage = ((value - min) / (max - min)) * 100;
  return clamp(percentage, 0, 100);
}

/**
 * Rounds a number to the nearest step
 * @param value The value to round
 * @param step The step size
 * @returns The rounded value
 */
export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Formats a number as a percentage string
 * @param value The value to format
 * @param decimals The number of decimal places
 * @returns The formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${formatNumber(value, decimals)}%`;
} 