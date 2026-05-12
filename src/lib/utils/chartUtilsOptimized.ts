import { loadD3 } from './chartLibraryLoader';
import type { WorkoutDay, ChartDimensions, ChartScales } from '$lib/types/chart';

/**
 * Optimized Chart utility functions with lazy-loaded D3.js
 * Only loads D3 when these functions are actually called
 */

let d3: any = null;
let d3LoadPromise: Promise<any> | null = null;

/**
 * Ensures D3 is loaded before using it
 */
async function ensureD3Loaded() {
  if (d3) return d3;
  
  if (!d3LoadPromise) {
    d3LoadPromise = loadD3();
  }
  
  d3 = await d3LoadPromise;
  return d3;
}

/**
 * Creates D3 scales for the chart with lazy loading
 */
export async function createChartScalesOptimized(
  dailyWorkouts: WorkoutDay[],
  dimensions: ChartDimensions
): Promise<ChartScales | null> {
  const { width, height } = dimensions;
  
  if (!width || !height || !dailyWorkouts.length) {
    return null;
  }

  const d3 = await ensureD3Loaded();

  const x = d3.scaleBand()
    .domain(dailyWorkouts.map(d => new Date(d.date).toDateString()))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(dailyWorkouts, d => Math.max(d.total, 100)) || 100])
    .range([height, 0]);

  return { x, y };
}

/**
 * Formats date based on view mode and screen size with lazy loading
 */
export async function formatDateForChartOptimized(
  date: Date | string,
  viewMode: 'week' | 'month'
): Promise<string> {
  const d3 = await ensureD3Loaded();
  const dateObj = new Date(date);
  
  if (viewMode === 'week') {
    return d3.timeFormat('%a')(dateObj);
  } else {
    return d3.timeFormat('%-m/%-d')(dateObj);
  }
}

/**
 * Gets tick values for x-axis based on view mode and container width
 */
export function getTickValues(
  dailyWorkouts: WorkoutDay[],
  viewMode: 'week' | 'month',
  containerWidth: number
): string[] {
  const allDates = dailyWorkouts.map(d => new Date(d.date).toDateString());
  
  return allDates.filter((_, i) => {
    if (viewMode === 'week') {
      return true; // Show all days in week view
    } else if (containerWidth < 800) {
      return i % 2 === 0; // Show every other day on mobile
    } else {
      return true; // Show all days on larger screens
    }
  });
}

/**
 * Gets responsive chart margins based on container width
 */
export function getChartMargins(containerWidth: number): ChartDimensions['margin'] {
  return {
    top: 5,
    right: containerWidth < 800 ? 10 : 20,
    bottom: containerWidth < 800 ? 25 : 40,
    left: containerWidth < 800 ? 25 : 35
  };
}

/**
 * Calculates chart dimensions from container size
 */
export function calculateChartDimensions(
  containerWidth: number,
  containerHeight: number
): ChartDimensions {
  const margin = getChartMargins(containerWidth);
  
  return {
    width: containerWidth - margin.left - margin.right,
    height: containerHeight - margin.top - margin.bottom,
    margin
  };
}

/**
 * Gets the number of grid line ticks based on container width
 */
export function getGridTicks(containerWidth: number): number {
  return containerWidth < 800 ? 4 : 5;
}

/**
 * Gets responsive font sizes for chart elements
 */
export function getChartFontSizes(containerWidth: number) {
  return {
    axis: containerWidth < 640 ? '0.65rem' : '0.75rem',
    label: containerWidth < 640 ? '0.65rem' : '0.75rem',
    duration: containerWidth < 640 ? '0.65rem' : '0.75rem'
  };
}

/**
 * Preload D3 for faster subsequent loads
 */
export function preloadD3() {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      ensureD3Loaded().catch(() => {});
    });
  }
}

/**
 * Check if D3 is already loaded
 */
export function isD3Loaded(): boolean {
  return d3 !== null;
}