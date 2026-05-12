import * as d3 from 'd3';
import { timeFormat } from 'd3-time-format';
import type { WorkoutDay, ChartDimensions, ChartScales } from '$lib/types/chart';

/**
 * Chart utility functions for D3.js operations
 * Extracted from ProgressChart.svelte to improve maintainability
 */

/**
 * Creates D3 scales for the chart
 */
export function createChartScales(
  dailyWorkouts: WorkoutDay[],
  dimensions: ChartDimensions
): ChartScales | null {
  const { width, height } = dimensions;
  
  if (!width || !height || !dailyWorkouts.length) {
    return null;
  }

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
 * Formats date based on view mode and screen size
 */
export function formatDateForChart(
  date: Date | string,
  viewMode: 'week' | 'month'
): string {
  const d = new Date(date);
  if (viewMode === 'week') {
    return timeFormat('%a')(d);
  } else {
    return timeFormat('%-m/%-d')(d);
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