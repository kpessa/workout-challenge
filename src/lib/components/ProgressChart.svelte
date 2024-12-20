<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { schedule } from '../stores/scheduleStore';
  import { userPreferences } from '../stores/userPreferencesStore';
  import { calculateSigmoidal } from '../utils/sigmoidal';
  import { Button } from "$lib/components/UI/button";
  import { timeFormat } from 'd3-time-format';

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

  // Move the workout calculation logic to a function
  function calculateWorkoutDays() {
    if (!$userPreferences || !$schedule) return;
    
    console.log('Calculating workouts for page:', currentPage);
    console.log('Current schedule:', $schedule);
    console.log('User preferences:', $userPreferences);
    
    const startDate = new Date($userPreferences.startDate);
    const daysPerWeek = $userPreferences.daysPerWeek;
    
    // Calculate start and end dates for current page
    const pageStartDate = new Date(startDate);
    pageStartDate.setDate(pageStartDate.getDate() + (currentPage * 30));
    
    const pageEndDate = new Date(pageStartDate);
    pageEndDate.setDate(pageEndDate.getDate() + 29);

    console.log('Page date range:', {
      start: pageStartDate.toDateString(),
      end: pageEndDate.toDateString()
    });

    // Generate workout days for this month
    const workoutDays = [];
    let currentDate = new Date(pageStartDate);
    let workoutsThisWeek = 0;
    let weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    while (currentDate <= pageEndDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Reset counter at start of week (Monday)
      if (dayOfWeek === 1) {
        workoutsThisWeek = 0;
      }

      // If we haven't hit our weekly limit and it's not Sunday
      if (workoutsThisWeek < daysPerWeek && dayOfWeek !== 0) {
        const dayNum = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Find any completed workouts for this day
        const dayEntries = $schedule.filter(s => {
          if (!s.date) return false;
          const sDate = new Date(s.date);
          return sDate.toDateString() === currentDate.toDateString();
        });

        // Sum up completed workout minutes
        const completedTime = dayEntries.reduce((sum, entry) => {
          if (!entry.workouts) return sum;
          const dailySum = entry.workouts.reduce((acc, w) => 
            acc + (w.completed ? w.duration : 0), 0);
          return sum + dailySum;
        }, 0);

        // Calculate target duration using sigmoid
        const targetTime = Math.round(calculateSigmoidal(dayNum, $userPreferences.sigmoidParams));

        workoutDays.push({
          date: new Date(currentDate),
          day: dayNum,
          completed: completedTime,
          proposed: Math.max(0, targetTime - completedTime),
          total: targetTime
        });

        workoutsThisWeek++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Generated workout days:', {
      count: workoutDays.length,
      first: workoutDays[0],
      last: workoutDays[workoutDays.length - 1]
    });
    
    dailyWorkouts = workoutDays;
    requestAnimationFrame(updateChart); // Ensure DOM is ready before updating
  }

  // Watch for changes that should trigger recalculation
  $: {
    if ($schedule && $userPreferences) {
      calculateWorkoutDays();
    }
  }

  // Also watch currentPage explicitly
  $: {
    currentPage;
    if ($schedule && $userPreferences) {
      calculateWorkoutDays();
    }
  }

  // Use time scale for x-axis with proper padding
  $: xScale = d3.scaleTime()
    .domain([
      d3.min(dailyWorkouts, d => d.date) || new Date(),
      d3.max(dailyWorkouts, d => d.date) || new Date()
    ])
    .range([20, width - 20]); // Add padding to prevent bars from going off-screen

  $: yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

  function updateChart() {
    if (!svg || !dailyWorkouts.length) return;

    console.log('Updating chart with workouts:', dailyWorkouts);

    // Remove old elements
    svg.selectAll('.day-group').remove();

    // Join workout data
    const dayGroups = svg.selectAll('.day-group')
      .data(dailyWorkouts);

    dayGroups.exit().remove();
    
    const dayEnter = dayGroups.enter()
      .append('g')
      .attr('class', 'day-group');

    const barWidth = Math.min(
      20,  // Maximum width
      (width / dailyWorkouts.length) * 0.8  // 80% of available space per bar
    );

    // Merge and position groups
    const dayMerge = dayEnter.merge(dayGroups)
      .attr('transform', d => {
        const x = xScale(d.date);
        return `translate(${x},0)`;
      });

    // Completed portion
    dayMerge.selectAll('.completed-rect')
      .data(d => [d])
      .join('rect')
      .attr('class', 'completed-rect')
      .attr('y', d => yScale(d.completed))
      .attr('height', d => height - yScale(d.completed))
      .attr('width', barWidth)
      .attr('x', -barWidth / 2)  // Center the bar on the date
      .attr('fill', 'var(--success-color)');

    // Proposed portion
    dayMerge.selectAll('.proposed-rect')
      .data(d => [d])
      .join('rect')
      .attr('class', 'proposed-rect')
      .attr('y', d => yScale(d.total))
      .attr('height', d => height - yScale(d.proposed))
      .attr('width', barWidth)
      .attr('x', -barWidth / 2);  // Center the bar on the date

    // X-axis with dates - adjust tick count based on available space
    const formatDate = timeFormat('%a, %m/%d');
    svg.select('.x-axis')
      .call(d3.axisBottom(xScale)
        .ticks(Math.min(dailyWorkouts.length, 10)) // Limit number of ticks
        .tickFormat(formatDate))
      .selectAll('text')
      .attr('dy', '0.5em')
      .attr('dx', '-0.5em');

    // Y-axis
    svg.select('.y-axis')
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => `${d}min`));

    // Update grid lines
    svg.selectAll('.grid-lines line')
      .data(d3.range(0, 110, 10))
      .join('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d));
  }

  onMount(() => {
    // Create the SVG
    svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add grid lines for every 10 minutes
    svg.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(d3.range(0, 110, 10))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d));

    // Add axes with more visible styling
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`);

    svg.append('g')
      .attr('class', 'y-axis');

    // Add axis labels
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .text('Workouts');

    svg.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .text('Duration (minutes)');

    // Initial update
    updateChart();

    return () => {
      if (svg) {
        svg.remove();
        svg = null;
      }
    };
  });

  export let onWorkoutClick = (date) => {};
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
    --card-bg: #ffffff;        /* A lighter card background */
    --border-color: #333333;   /* Darker border color for outlines and axes */
    --muted-foreground: #555;  /* Text color for axis ticks/labels */
    --success-color: #28a745;  /* Green color for completed workouts */
  }

  .chart-container {
    background: var(--card-bg);
    border-radius: 8px;
    padding: 1.5rem;
    height: 100%;
  }

  .chart {
    width: 100%;
    height: calc(100% - 4rem);
  }

  :global(.completed-rect) {
    stroke: var(--border-color);
    stroke-width: 1;
  }

  :global(.proposed-rect) {
    fill: transparent;
    stroke: var(--border-color);
    stroke-width: 1;
    stroke-dasharray: 4,4;
  }

  :global(.x-axis), :global(.y-axis) {
    color: var(--muted-foreground);
  }

  :global(.x-axis path), :global(.y-axis path),
  :global(.x-axis line), :global(.y-axis line) {
    stroke: var(--border-color);
    stroke-width: 1.5;
    stroke-opacity: 1;
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

  /* Adjust bar widths */
  :global(.completed-rect),
  :global(.proposed-rect) {
    rx: 2;  /* Rounded corners */
  }

  /* Make x-axis dates more readable */
  :global(.x-axis text) {
    transform: rotate(-45deg);
    text-anchor: end;
  }
</style>
