import * as d3 from 'd3';
import { timeFormat } from 'd3-time-format';
import { axisTop } from 'd3-axis';
import type { WorkoutDay, ChartDimensions, ChartScales, ViewMode, ChartEvents, ProcessedWorkout } from '$lib/types/chart';
import type { WorkoutType } from '$lib/types';
import { getTickValues, getGridTicks, getChartFontSizes } from './chartUtils';

/**
 * D3.js chart rendering utilities
 * Extracted from ProgressChart.svelte to improve maintainability and testability
 */

/**
 * Sets up the base SVG structure for the chart
 */
export function setupChartSVG(
  container: HTMLElement,
  dimensions: ChartDimensions
): { svgElement: d3.Selection<SVGSVGElement, unknown, null, undefined>; chartGroup: d3.Selection<SVGGElement, unknown, null, undefined> } {
  const svgElement = d3.select(container)
    .append('svg')
    .attr('width', dimensions.width + dimensions.margin.left + dimensions.margin.right)
    .attr('height', dimensions.height + dimensions.margin.top + dimensions.margin.bottom)
    .attr('class', 'chart-svg');
  
  const chartGroup = svgElement
    .append('g')
    .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

  // Add containers for different chart elements
  chartGroup.append('g').attr('class', 'grid-lines');
  chartGroup.append('g').attr('class', 'x-axis');
  chartGroup.append('g').attr('class', 'x-axis-top');
  chartGroup.append('g').attr('class', 'y-axis');

  return { svgElement, chartGroup };
}

/**
 * Renders the chart background elements (today indicator, week boundaries)
 */
export function renderChartBackground(
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  dailyWorkouts: WorkoutDay[],
  scales: ChartScales,
  dimensions: ChartDimensions,
  viewMode: ViewMode
) {
  const { x, y } = scales;
  const { width, height } = dimensions;

  // Remove old background elements
  chartGroup.selectAll('.current-day-line').remove();
  chartGroup.selectAll('.week-boundary-line').remove();
  chartGroup.selectAll('.current-day-background').remove();
  chartGroup.selectAll('.chart-border').remove();
  chartGroup.selectAll('.click-overlay').remove();

  // Add current day background and line
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toDateString();
  
  // Add current day indicator if today is in view
  const todayInView = dailyWorkouts.some(d => d.date.toDateString() === todayStr);

  if (todayInView) {
    chartGroup.append('rect')
      .attr('class', 'current-day-background')
      .attr('x', x(todayStr))
      .attr('y', 0)
      .attr('width', x.bandwidth())
      .attr('height', height)
      .attr('fill', 'rgb(59, 130, 246)')  // Using tailwind blue-500
      .attr('opacity', 0.15);
  }

  // Add week boundaries in month view
  if (viewMode === 'month') {
    dailyWorkouts.forEach((d, i) => {
      const date = new Date(d.date);
      // If it's Sunday (start of week)
      if (date.getDay() === 0) {
        const xPos = x(date.toDateString());
        chartGroup.append('rect')
          .attr('class', 'week-boundary-line')
          .attr('x', xPos - 1)  // Center the line
          .attr('y', 0)
          .attr('width', 2)
          .attr('height', height)
          .attr('fill', 'currentColor')
          .attr('opacity', 0.2);
      }
    });
  }

  // Add top and right borders
  const border = chartGroup.append('g')
    .attr('class', 'chart-border');

  // Top border
  border.append('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', 'var(--border-color)')
    .attr('stroke-width', 1.5);

  // Right border
  border.append('line')
    .attr('x1', width)
    .attr('x2', width)
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', 'var(--border-color)')
    .attr('stroke-width', 1.5);
}

/**
 * Renders the grid lines for the chart
 */
export function renderGridLines(
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  scales: ChartScales,
  dimensions: ChartDimensions,
  containerWidth: number
) {
  const { y } = scales;
  const { width } = dimensions;
  const ticks = getGridTicks(containerWidth);

  chartGroup.select('.grid-lines')
    .selectAll('line')
    .data(y.ticks(ticks))
    .join('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .attr('stroke', 'var(--border-color)')
    .attr('stroke-opacity', 0.15)
    .attr('stroke-dasharray', '2,2');
}

/**
 * Renders the chart axes
 */
export function renderAxes(
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  scales: ChartScales,
  dimensions: ChartDimensions,
  dailyWorkouts: WorkoutDay[],
  viewMode: ViewMode,
  containerWidth: number
) {
  const { x, y } = scales;
  const { height } = dimensions;
  const fontSizes = getChartFontSizes(containerWidth);
  const ticks = getGridTicks(containerWidth);
  const tickValues = getTickValues(dailyWorkouts, viewMode, containerWidth);

  // Update X-axis (bottom)
  chartGroup.select('.x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickFormat(d => {
        const date = new Date(d);
        return viewMode === 'week' ? timeFormat('%a')(date) : timeFormat('%a')(date).charAt(0);
      })
      .tickValues(tickValues))
    .selectAll('text')
    .style('text-anchor', 'middle')
    .style('font-size', fontSizes.axis)
    .attr('dx', '0')
    .attr('dy', '1em')
    .attr('transform', 'translate(0, 0)');

  // Update X-axis (top) with MM/DD format
  chartGroup.select('.x-axis-top')
    .attr('transform', `translate(0,0)`)
    .call(d3.axisTop(x)
      .tickFormat(d => timeFormat('%-m/%-d')(new Date(d)))
      .tickValues(tickValues.filter((_, i) => {
        if (viewMode === 'week') {
          return true;
        } else if (containerWidth < 800) {
          return i % 3 === 0;
        } else {
          return i % 2 === 0;
        }
      })))
    .selectAll('text')
    .style('text-anchor', 'middle')
    .style('font-size', fontSizes.axis)
    .attr('dx', '0')
    .attr('dy', '-0.5em')
    .attr('transform', 'translate(0, 0)');

  // Update Y-axis
  chartGroup.select('.y-axis')
    .call(d3.axisLeft(y)
      .ticks(ticks)
      .tickFormat(d => d))
    .selectAll('text')
    .style('font-size', fontSizes.axis)
    .attr('dx', containerWidth < 800 ? '0' : '0.25em');
}

/**
 * Renders the workout bars and labels
 */
export function renderWorkoutBars(
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  dailyWorkouts: WorkoutDay[],
  scales: ChartScales,
  dimensions: ChartDimensions,
  containerWidth: number,
  workoutTypesData: WorkoutType[],
  events: ChartEvents
) {
  const { x, y } = scales;
  const { height } = dimensions;
  const fontSizes = getChartFontSizes(containerWidth);

  // Remove old day groups
  chartGroup.selectAll('.day-group').remove();

  // Create day groups
  const dayGroups = chartGroup.selectAll('.day-group')
    .data(dailyWorkouts)
    .enter()
    .append('g')
    .attr('class', 'day-group')
    .attr('transform', d => `translate(${x(new Date(d.date).toDateString())},0)`);

  const barWidth = x.bandwidth();

  // Add completed workout bars and labels
  dayGroups.each(function(d) {
    const group = d3.select(this);
    let stackHeight = 0;

    // Add bars for each workout in the day
    if (d.workouts && d.workouts.length > 0) {
      d.workouts.forEach((workout) => {
        group.append('rect')
          .attr('class', 'completed-rect')
          .attr('y', y(stackHeight + workout.duration))
          .attr('height', height - y(workout.duration))
          .attr('width', barWidth)
          .attr('x', 0)
          .attr('data-workout-id', workout.id)
          .attr('data-date', d.date.toISOString())
          .style('cursor', 'pointer')
          .style('fill', getWorkoutColor(workout, workoutTypesData))
          .style('stroke', 'hsl(var(--border))')
          .style('stroke-width', '1px')
          .style('stroke-opacity', '0.5')
          .on('click', () => events.editWorkout({
            date: workout.date.toISOString(),
            duration: workout.duration,
            id: workout.id
          }));

        stackHeight += workout.duration;
      });

      // Add total duration label for recorded workouts
      group.append('text')
        .attr('class', 'duration-label')
        .attr('x', barWidth / 2)
        .attr('y', y(stackHeight) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', fontSizes.duration)
        .style('fill', 'currentColor')
        .text(stackHeight);
    }

    // Add proposed workout bar and label if it exists
    if (d.proposed > 0) {
      group.append('rect')
        .attr('class', 'proposed-rect')
        .attr('y', y(d.proposed))
        .attr('height', height - y(d.proposed))
        .attr('width', barWidth)
        .attr('x', 0)
        .attr('data-proposed-date', d.date.toISOString())
        .style('cursor', 'pointer')
        .style('fill', 'transparent')
        .style('stroke', 'hsl(var(--primary))')
        .style('stroke-width', '1.5px')
        .style('stroke-opacity', '0.7')
        .style('stroke-dasharray', '4,4')
        .on('click', () => events.workoutClick({
          date: d.date.toISOString(),
          proposedDuration: d.proposed
        }));

      // Add proposed duration label
      const labelY = d.workouts.length > 0 ? y(stackHeight) - 20 : y(d.proposed) - 5;
      group.append('text')
        .attr('class', 'duration-label proposed')
        .attr('x', barWidth / 2)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .style('font-size', fontSizes.duration)
        .style('fill', 'currentColor')
        .style('opacity', 0.7)
        .text(`${d.proposed}`);
    }
  });
}

/**
 * Adds click overlay for date selection
 */
export function addClickOverlay(
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  dailyWorkouts: WorkoutDay[],
  scales: ChartScales,
  dimensions: ChartDimensions,
  events: ChartEvents
) {
  const { x } = scales;
  const { height } = dimensions;

  // Add click overlay
  const overlay = chartGroup.append('g')
    .attr('class', 'click-overlay');

  // Add clickable rectangles for each day
  overlay.selectAll('rect')
    .data(dailyWorkouts)
    .join('rect')
    .attr('x', d => x(new Date(d.date).toDateString()))
    .attr('y', 0)
    .attr('width', x.bandwidth())
    .attr('height', height)
    .attr('fill', 'transparent')
    .attr('data-date', d => d.date.toISOString())
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      // Don't trigger if we clicked on a bar
      if (event.target === event.currentTarget) {
        const clickedDate = new Date(d.date);
        // Set to noon to avoid timezone issues
        clickedDate.setHours(12, 0, 0, 0);
        events.dateClick({
          date: clickedDate.toISOString()
        });
      }
    });
}

/**
 * Gets workout color from workout types data
 */
function getWorkoutColor(workout: ProcessedWorkout, workoutTypesData: WorkoutType[]): string {
  if (!workout || !workoutTypesData || workoutTypesData.length === 0) {
    return 'hsl(var(--primary))';
  }
  const workoutType = workoutTypesData.find(t => t.id === workout.workout_type_id);
  return workoutType?.color || 'hsl(var(--primary))';
}