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
  let containerWidth;
  let containerHeight;
  
  // Chart dimensions
  $: margin = {
    top: 20,
    right: containerWidth < 640 ? 20 : 40,
    bottom: containerWidth < 640 ? 50 : 60,
    left: containerWidth < 640 ? 35 : 50
  };
  
  $: width = containerWidth ? containerWidth - margin.left - margin.right : 0;
  $: height = containerHeight ? containerHeight - margin.top - margin.bottom : 0;

  // Use time scale for x-axis with proper padding
  function createScales() {
    if (!width || !height || !dailyWorkouts.length) return null;

    const x = d3.scaleBand()
      .domain(dailyWorkouts.map(d => new Date(d.date).toDateString()))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(dailyWorkouts, d => Math.max(d.total, 100)) || 100])
      .range([height, 0]);

    return { x, y };
  }

  // Format date based on view mode and screen size
  $: formatDate = (date) => {
    const d = new Date(date);
    if (containerWidth < 640) {
      return d3.timeFormat(viewMode === 'week' ? '%a' : '%d')(d);
    }
    return d3.timeFormat(viewMode === 'week' ? '%a, %d' : '%b %d')(d);
  };

  function updateDimensions() {
    if (chartContainer) {
      const rect = chartContainer.getBoundingClientRect();
      containerWidth = rect.width;
      containerHeight = rect.height;
    }
  }

  // Update chart dimensions on resize
  function handleResize() {
    updateDimensions();
    if (svg) {
      svg.attr('width', containerWidth)
         .attr('height', containerHeight);
      updateChart();
    }
  }

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

  onMount(() => {
    // Create the SVG
    updateDimensions();
    
    const svgElement = d3.select(chartContainer)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('class', 'chart-svg');
    
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
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle');

    // Initial update
    calculateWorkoutDays();

    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (svgElement) {
        svgElement.remove();
      }
      svg = null;
    };
  });

  function updateChart() {
    if (!svg || !dailyWorkouts.length || !width || !height) return;

    const scales = createScales();
    if (!scales) return;
    const { x, y } = scales;

    // Remove old elements
    svg.selectAll('.day-group').remove();

    // Create new groups for each day
    const dayGroups = svg.selectAll('.day-group')
      .data(dailyWorkouts)
      .enter()
      .append('g')
      .attr('class', 'day-group')
      .attr('transform', d => `translate(${x(new Date(d.date).toDateString())},0)`);

    const barWidth = x.bandwidth();

    // Add completed workout bars (stacked)
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
            .style('cursor', 'pointer')
            .on('click', () => handleEditWorkout(workout));

          stackHeight += workout.duration;
        });
      }

      // Add proposed workout bar if it exists
      if (d.proposed > 0) {
        group.append('rect')
          .attr('class', 'proposed-rect')
          .attr('y', y(d.proposed))
          .attr('height', height - y(d.proposed))
          .attr('width', barWidth)
          .attr('x', 0)
          .style('cursor', 'pointer')
          .on('click', () => handleWorkoutClick(d));
      }
    });

    // Update X-axis with explicit styling
    svg.select('.x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickFormat(formatDate))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', containerWidth < 640 ? 'rotate(-45)' : 'rotate(-65)');

    // Update Y-axis with explicit styling
    svg.select('.y-axis')
      .call(d3.axisLeft(y)
        .ticks(containerWidth < 640 ? 5 : 8)
        .tickFormat(d => `${d}${containerWidth < 640 ? '' : 'min'}`));

    // Update grid lines with explicit styling
    svg.select('.grid-lines')
      .selectAll('line')
      .data(y.ticks(containerWidth < 640 ? 5 : 8))
      .join('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', 'var(--border-color)')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-dasharray', '2,2');

    // Update Y-axis label with explicit styling
    svg.select('.y-axis-label')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 12)
      .attr('fill', 'var(--muted-foreground)')
      .text(containerWidth < 640 ? 'Min' : 'Duration (minutes)');
  }
</script>

<div class="chart-container">
  <div class="flex justify-between items-center mb-4 sm:mb-6">
    <div class="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm"
        on:click={previousPeriod} 
        disabled={currentPage === 0}
      >
        ←
      </Button>
      <Button 
        variant="outline"
        size="sm"
        on:click={toggleView}
      >
        {viewMode === 'month' ? 'Week' : 'Month'}
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        on:click={nextPeriod} 
        disabled={currentPage === (viewMode === 'month' ? 2 : 11)}
      >
        →
      </Button>
    </div>
    <h2 class="text-sm sm:text-base font-semibold">
      {viewMode === 'month' ? `Month ${currentPage + 1}` : `Week ${currentPage + 1}`}
    </h2>
  </div>
  
  <div bind:this={chartContainer} class="chart h-full"></div>
</div>

<style>
  :root {
    --success-color: #28a745;
    --border-color: #333333;
    --muted-foreground: #666666;
    --background: #ffffff;
  }

  .chart-container {
    height: 100%;
    width: 100%;
    background: var(--background);
  }

  .chart {
    width: 100%;
    height: calc(100% - 3rem);
  }

  :global(.x-axis), :global(.y-axis) {
    color: var(--muted-foreground);
  }

  :global(.x-axis path), :global(.y-axis path),
  :global(.x-axis line), :global(.y-axis line) {
    stroke: var(--border-color);
    stroke-width: 1px;
  }

  :global(.x-axis text), :global(.y-axis text) {
    fill: var(--muted-foreground);
    font-size: 0.7rem;
  }

  :global(.completed-rect) {
    fill: var(--success-color);
    stroke: var(--border-color);
    stroke-width: 1px;
    transition: filter 0.2s ease-in-out;
  }

  :global(.completed-rect:hover) {
    filter: brightness(1.1);
  }

  :global(.proposed-rect) {
    fill: transparent;
    stroke: var(--border-color);
    stroke-width: 1.5px;
    stroke-dasharray: 4,4;
    transition: fill 0.2s ease-in-out;
  }

  :global(.proposed-rect:hover) {
    fill: rgba(40, 167, 69, 0.1);
  }

  :global(.grid-lines line) {
    stroke: var(--border-color);
    stroke-opacity: 0.2;
    stroke-dasharray: 2,2;
  }

  :global(.y-axis-label) {
    fill: var(--muted-foreground);
    font-size: 0.8rem;
  }

  @media (min-width: 640px) {
    :global(.x-axis text), :global(.y-axis text) {
      font-size: 0.8rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    :root {
      --success-color: #28a745;
      --border-color: #666666;
      --muted-foreground: #999999;
      --background: transparent;
    }
  }
</style>
