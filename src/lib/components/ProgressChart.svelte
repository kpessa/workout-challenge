<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { schedule } from '../stores/scheduleStore';
  import { userPreferences } from '../stores/userPreferencesStore';
  import { calculateSigmoidal } from '../utils/sigmoidal';
  import { Button } from "$lib/components/UI/button";
  import { timeFormat } from 'd3-time-format';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let chartContainer;
  let currentPage = 0;
  let svg;
  let dailyWorkouts = [];
  
  // Chart dimensions
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Navigation functions
  function previousPeriod() {
    if (currentPage > 0) {
      currentPage--;
      // Force recalculation of dailyWorkouts
      calculateWorkoutDays();
    }
  }

  function nextPeriod() {
    if (currentPage < 2) {
      currentPage++;
      // Force recalculation of dailyWorkouts
      calculateWorkoutDays();
    }
  }

  let scheduleData;
  let userPreferencesData;

  schedule.subscribe(value => {
    scheduleData = value;
    calculateWorkoutDays();
  });

  userPreferences.subscribe(value => {
    userPreferencesData = value;
    calculateWorkoutDays();
  });

  // Move the workout calculation logic to a function
  function calculateWorkoutDays() {
    if (!userPreferencesData || !scheduleData) return;
    
    const startDate = new Date(userPreferencesData.startDate);
    const daysPerWeek = userPreferencesData.daysPerWeek;
    
    // Calculate start and end dates for current page
    const pageStartDate = new Date(startDate);
    pageStartDate.setDate(pageStartDate.getDate() + (currentPage * 30));
    
    const pageEndDate = new Date(pageStartDate);
    pageEndDate.setDate(pageEndDate.getDate() + 29);

    // First, add all recorded workouts
    const workoutDays = scheduleData
      .filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= pageStartDate && workoutDate <= pageEndDate;
      })
      .map(workout => {
        const workoutDate = new Date(workout.date);
        const dayNum = Math.floor((workoutDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return {
          date: workoutDate,
          day: dayNum,
          completed: workout.duration,
          proposed: 0,
          total: workout.duration
        };
      });

    // Track which dates already have recorded workouts
    const recordedDates = new Set(workoutDays.map(w => w.date.toDateString()));

    // Now add proposed workouts
    let currentDate = new Date(pageStartDate);
    let currentWeekWorkouts = 0;
    let weekStartDate = new Date(currentDate);

    while (currentDate <= pageEndDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Reset week counter on Sundays
      if (dayOfWeek === 0) {
        currentWeekWorkouts = 0;
        weekStartDate = new Date(currentDate);
      }

      // Count recorded workouts this week
      if (dayOfWeek === 0 || currentDate.toDateString() === pageStartDate.toDateString()) {
        const weekEnd = new Date(weekStartDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        currentWeekWorkouts = Array.from(recordedDates)
          .filter(dateStr => {
            const date = new Date(dateStr);
            return date >= weekStartDate && date <= weekEnd;
          }).length;
      }

      // Only propose a workout if:
      // 1. This day doesn't have a recorded workout
      // 2. It's not Sunday
      // 3. We haven't hit our weekly workout goal yet
      if (!recordedDates.has(currentDate.toDateString()) && 
          dayOfWeek !== 0 && 
          currentWeekWorkouts < daysPerWeek) {
        
        const dayNum = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const targetTime = Math.round(calculateSigmoidal(dayNum, userPreferencesData.sigmoidParams));

        workoutDays.push({
          date: new Date(currentDate),
          day: dayNum,
          completed: 0,
          proposed: targetTime,
          total: targetTime
        });
        currentWeekWorkouts++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort workouts by date
    workoutDays.sort((a, b) => a.date - b.date);

    console.log('Recorded workouts:', scheduleData.length);
    console.log('All workout days:', workoutDays);

    dailyWorkouts = workoutDays;
    requestAnimationFrame(updateChart);
  }

  // Use time scale for x-axis with proper padding
  $: xScale = d3.scaleTime()
    .domain([
      d3.min(dailyWorkouts, d => d.date) || new Date(),
      d3.max(dailyWorkouts, d => d.date) || new Date()
    ])
    .range([20, width - 20]); // Add padding to prevent bars from going off-screen

  $: yScale = d3.scaleLinear()
    .domain([0, d3.max(dailyWorkouts, d =>  Math.max(d.total, 100)) || 100])
    .range([height, 0]);

  function handleWorkoutClick(workout) {
    if (workout.proposed > 0) {
      dispatch('workoutClick', {
        date: workout.date.toISOString(),
        proposedDuration: workout.proposed
      });
    }
  }

  function updateChart() {
    if (!svg || !dailyWorkouts.length) return;

    console.log('Updating chart with workouts:', dailyWorkouts);

    // Remove old elements
    svg.selectAll('.day-group').remove();

    // Create new groups for each day
    const dayGroups = svg.selectAll('.day-group')
      .data(dailyWorkouts)
      .enter()
      .append('g')
      .attr('class', 'day-group')
      .attr('transform', d => `translate(${xScale(d.date)},0)`);

    const barWidth = Math.min(
      20,  // Maximum width
      (width / dailyWorkouts.length) * 0.8  // 80% of available space per bar
    );

    // Add completed workout bars
    dayGroups.filter(d => d.completed > 0)
      .append('rect')
      .attr('class', 'completed-rect')
      .attr('y', d => yScale(d.completed))
      .attr('height', d => height - yScale(d.completed))
      .attr('width', barWidth)
      .attr('x', -barWidth / 2)
      .attr('fill', 'var(--success-color)');

    // Add proposed workout bars with click interaction
    dayGroups.filter(d => d.proposed > 0)
      .append('rect')
      .attr('class', 'proposed-rect')
      .attr('y', d => yScale(d.proposed))
      .attr('height', d => height - yScale(d.proposed))
      .attr('width', barWidth)
      .attr('x', -barWidth / 2)
      .attr('fill', 'transparent')
      .attr('stroke', 'var(--border-color)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .style('cursor', 'pointer')
      .on('click', (event, d) => handleWorkoutClick(d));

    // X-axis with dates
    const formatDate = timeFormat('%a, %m/%d');
    svg.select('.x-axis')
      .call(d3.axisBottom(xScale)
        .ticks(Math.min(dailyWorkouts.length, 10))
        .tickFormat(formatDate))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    // Y-axis
    svg.select('.y-axis')
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => `${d}min`));

    // Update grid lines
    svg.select('.grid-lines')
      .selectAll('line')
      .data(yScale.ticks(5))
      .join('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', 'var(--border-color)')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-dasharray', '2,2');
  }

  onMount(() => {
    // Create the SVG
    const svgElement = d3.select(chartContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);
    
    svg = svgElement
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add grid lines container
    svg.append('g')
      .attr('class', 'grid-lines');

    // Add axes
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`);

    svg.append('g')
      .attr('class', 'y-axis');

    // Add axis labels
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Workouts');

    svg.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 20)
      .attr('text-anchor', 'middle')
      .text('Duration (minutes)');

    // Initial update
    calculateWorkoutDays();

    return () => {
      if (svgElement) {
        svgElement.remove();
      }
      svg = null;
    };
  });
</script>

<div class="chart-container">
  <div class="flex justify-between items-center mb-6">
    <Button 
      variant="outline" 
      on:click={previousPeriod} 
      disabled={currentPage === 0}
    >
      Previous Month
    </Button>
    <h2 class="text-xl font-bold">
      Month {currentPage + 1}
    </h2>
    <Button 
      variant="outline" 
      on:click={nextPeriod} 
      disabled={currentPage === 2}
    >
      Next Month
    </Button>
  </div>
  
  <div bind:this={chartContainer} class="chart"></div>
</div>

<style>
  /* Make sure these variables contrast enough to be visible */
  :root {
    --card-bg: #ffffff;
    --border-color: #333333;
    --muted-foreground: #555555;
    --success-color: #28a745;
  }

  .chart-container {
    background: var(--card-bg);
    border-radius: 8px;
    padding: 1.5rem;
    height: 100%;
    min-height: 600px;
  }

  .chart {
    width: 100%;
    height: 100%;
  }

  :global(.completed-rect) {
    fill: var(--success-color);
    stroke: var(--border-color);
    stroke-width: 1;
  }

  :global(.proposed-rect) {
    fill: transparent;
    stroke: var(--border-color);
    stroke-width: 1.5;
    stroke-dasharray: 4,4;
    transition: fill 0.2s ease-in-out;
  }

  :global(.proposed-rect:hover) {
    fill: rgba(40, 167, 69, 0.1); /* Light green background on hover */
  }

  :global(.x-axis), :global(.y-axis) {
    color: var(--muted-foreground);
  }

  :global(.x-axis path), :global(.y-axis path),
  :global(.x-axis line), :global(.y-axis line) {
    stroke: var(--border-color);
    stroke-width: 1.5;
  }

  :global(.x-axis text), :global(.y-axis text) {
    fill: var(--muted-foreground);
    font-size: 12px;
    font-weight: 500;
  }

  :global(.grid-lines line) {
    stroke: var(--border-color);
    stroke-opacity: 0.2;
    stroke-dasharray: 2,2;
  }

  :global(.axis-label) {
    fill: var(--muted-foreground);
    font-size: 14px;
    font-weight: 500;
  }
</style>
