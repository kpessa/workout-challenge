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
  let viewMode = 'month'; // 'week' or 'month'
  
  // Chart dimensions
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Navigation functions
  function previousPeriod() {
    if (currentPage > 0) {
      currentPage--;
      calculateWorkoutDays();
    }
  }

  function nextPeriod() {
    const maxPages = viewMode === 'week' ? 12 : 3; // 12 weeks or 3 months
    if (currentPage < maxPages - 1) {
      currentPage++;
      calculateWorkoutDays();
    }
  }

  function toggleView() {
    viewMode = viewMode === 'month' ? 'week' : 'month';
    currentPage = 0; // Reset to first page when switching views
    calculateWorkoutDays();
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

  function calculateWorkoutDays() {
    if (!userPreferencesData || !scheduleData) return;
    
    const startDate = new Date(userPreferencesData.startDate);
    const daysPerWeek = userPreferencesData.daysPerWeek;
    
    // Calculate start and end dates based on view mode
    const pageStartDate = new Date(startDate);
    const daysToAdd = viewMode === 'month' ? currentPage * 30 : currentPage * 7;
    pageStartDate.setDate(pageStartDate.getDate() + daysToAdd);
    
    if (viewMode === 'week') {
      // Adjust to the nearest Sunday
      const dayOfWeek = pageStartDate.getDay();
      pageStartDate.setDate(pageStartDate.getDate() - dayOfWeek);
    }
    
    const pageEndDate = new Date(pageStartDate);
    const periodLength = viewMode === 'month' ? 29 : 6;
    pageEndDate.setDate(pageEndDate.getDate() + periodLength);

    // Group recorded workouts by date
    const workoutsByDate = scheduleData
      .filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= pageStartDate && workoutDate <= pageEndDate;
      })
      .reduce((acc, workout) => {
        const dateStr = new Date(workout.date).toDateString();
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push({
          id: workout.id,
          date: new Date(workout.date),
          duration: workout.duration,
          created_at: workout.created_at
        });
        return acc;
      }, {});

    // Convert grouped workouts into daily records
    const workoutDays = Object.entries(workoutsByDate).map(([dateStr, workouts]) => {
      const date = new Date(dateStr);
      const dayNum = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return {
        date,
        day: dayNum,
        completed: true,
        workouts: workouts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        proposed: 0,
        total: workouts.reduce((sum, w) => sum + w.duration, 0)
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
          workouts: [],
          completed: false,
          proposed: targetTime,
          total: targetTime
        });
        currentWeekWorkouts++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort workouts by date
    workoutDays.sort((a, b) => a.date.getTime() - b.date.getTime());

    console.log('All workout days:', workoutDays);

    dailyWorkouts = workoutDays;
    requestAnimationFrame(updateChart);
  }

  // Use time scale for x-axis with proper padding
  $: xScale = d3.scaleBand()
    .domain(dailyWorkouts.map(d => new Date(d.date).toDateString()))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  $: yScale = d3.scaleLinear()
    .domain([0, d3.max(dailyWorkouts, d =>  Math.max(d.total, 100)) || 100])
    .range([height, 0]);

  function handleWorkoutClick(workout) {
    if (workout && workout.proposed > 0) {
      dispatch('workoutClick', {
        date: workout.date.toISOString(),
        proposedDuration: workout.proposed
      });
    }
  }

  function handleEditWorkout(workout) {
    if (workout && workout.date) {
      const workoutData = {
        date: workout.date.toISOString(),
        duration: workout.duration,
        id: workout.id
      };
      console.log('Dispatching editWorkout with data:', workoutData);
      dispatch('editWorkout', workoutData);
    }
  }

  function handleDeleteWorkout(workout) {
    if (workout && workout.date && workout.id) {
      console.log('Deleting workout:', workout);
      dispatch('deleteWorkout', {
        date: workout.date.toISOString(),
        id: workout.id
      });
    }
  }

  function updateChart() {
    if (!svg || !dailyWorkouts.length) return;

    // Remove old elements
    svg.selectAll('.day-group').remove();

    // Create new groups for each day
    const dayGroups = svg.selectAll('.day-group')
      .data(dailyWorkouts)
      .enter()
      .append('g')
      .attr('class', 'day-group')
      .attr('transform', d => `translate(${xScale(new Date(d.date).toDateString())},0)`);

    const barWidth = xScale.bandwidth();

    // Add completed workout bars (stacked)
    dayGroups.each(function(d) {
      const group = d3.select(this);
      let stackHeight = 0;

      // Add bars for each workout in the day
      if (d.workouts && d.workouts.length > 0) {
        d.workouts.forEach((workout, i) => {
          console.log('Creating bar for workout:', workout); // Debug log
          group.append('rect')
            .attr('class', 'completed-rect')
            .attr('y', () => yScale(stackHeight + workout.duration))
            .attr('height', () => height - yScale(workout.duration))
            .attr('width', barWidth)
            .attr('x', 0)
            .attr('fill', 'var(--success-color)')
            .style('cursor', 'pointer')
            .on('click', () => handleEditWorkout(workout));

          stackHeight += workout.duration;
        });
      }

      // Add proposed workout bar if it exists
      if (d.proposed > 0) {
        group.append('rect')
          .attr('class', 'proposed-rect')
          .attr('y', yScale(d.proposed))
          .attr('height', height - yScale(d.proposed))
          .attr('width', barWidth)
          .attr('x', 0)
          .attr('fill', 'transparent')
          .attr('stroke', 'var(--border-color)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4,4')
          .style('cursor', 'pointer')
          .on('click', () => handleWorkoutClick(d));
      }
    });

    // X-axis with dates
    const formatDate = timeFormat('%a, %m/%d');
    svg.select('.x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat((d, i) => formatDate(new Date(d))))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    // Y-axis
    svg.select('.y-axis')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => `${d}min`));

    // Update grid lines
    svg.select('.grid-lines')
      .selectAll('line')
      .data(yScale.ticks(5))
      .join('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
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
      .attr('class', 'x-axis');

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
    <div class="flex items-center gap-2">
      <Button 
        variant="outline" 
        on:click={previousPeriod} 
        disabled={currentPage === 0}
      >
        Previous {viewMode === 'month' ? 'Month' : 'Week'}
      </Button>
      <Button 
        variant="outline"
        on:click={toggleView}
      >
        {viewMode === 'month' ? 'Switch to Week View' : 'Switch to Month View'}
      </Button>
      <Button 
        variant="outline" 
        on:click={nextPeriod} 
        disabled={currentPage === (viewMode === 'month' ? 2 : 11)}
      >
        Next {viewMode === 'month' ? 'Month' : 'Week'}
      </Button>
    </div>
    <h2 class="text-xl font-bold">
      {viewMode === 'month' ? `Month ${currentPage + 1}` : `Week ${currentPage + 1}`}
    </h2>
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
    transition: filter 0.2s ease-in-out;
  }

  :global(.completed-rect:hover) {
    filter: brightness(1.1);
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
