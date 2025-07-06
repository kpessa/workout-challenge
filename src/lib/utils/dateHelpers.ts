/**
 * Formats a date for display
 * @param date The date to format
 * @param options The Intl.DateTimeFormatOptions to use
 * @returns The formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Gets the number of days between two dates
 * @param date1 The first date
 * @param date2 The second date
 * @returns The number of days between the dates
 */
export function getDaysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gets the ISO string date without time
 * @param date The date to format
 * @returns The ISO string date without time
 */
export function getISODateString(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toISOString().split('T')[0];
}

/**
 * Checks if a date is valid
 * @param date The date to check
 * @returns true if the date is valid
 */
export function isValidDate(date: Date | string): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
}

/**
 * Gets the start of the day for a date
 * @param date The date to get the start of day for
 * @returns The start of the day
 */
export function getStartOfDay(date: Date | string): Date {
  const dateObj = date instanceof Date ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

/**
 * Gets the end of the day for a date
 * @param date The date to get the end of day for
 * @returns The end of the day
 */
export function getEndOfDay(date: Date | string): Date {
  const dateObj = date instanceof Date ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
} 