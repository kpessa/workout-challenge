<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { schedule } from '../stores/scheduleStore';
  import { userPreferences } from '../stores/userPreferencesStore';
  import { workoutTypes } from '../stores/workoutTypeStore';
  import { calculateSigmoidal } from '$lib/utils/sigmoidal';
  import { Button } from "$lib/components/UI/button";
  import * as Tabs from "$lib/components/UI/tabs";
  import { timeFormat } from 'd3-time-format';
  import { createEventDispatcher } from 'svelte';
  import { getStartOfDay } from '$lib/utils/dateHelpers';

  const dispatch = createEventDispatcher();

  let chartContainer;
  let currentPage = 0;
  let svg;
  let dailyWorkouts = [];
  let containerWidth;
  let containerHeight;
  
  // Default to week view on mobile
  let isMonthView = typeof window !== 'undefined' ? window.innerWidth >= 800 : true;
  let viewMode = isMonthView ? 'month' : 'week';

  // Chart dimensions
  $: margin = {
    top: 20,
    right: containerWidth < 800 ? 40 : 40,
    bottom: containerWidth < 800 ? 100 : 70,  // Increased bottom margin on mobile for legend
    left: containerWidth < 800 ? 45 : 75
  };
  
  $: width = containerWidth ? containerWidth - margin.left - margin.right : 0;
  $: height = containerHeight ? containerHeight - margin.top - margin.bottom : 0;

  $: {
    // Update viewMode whenever isMonthView changes
    viewMode = isMonthView ? 'month' : 'week';
    // Recalculate workout days when viewMode changes
    if (userPreferencesData && scheduleData) {
      calculateWorkoutDays();
    }
  }

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
    if (containerWidth < 800) {  // Updated breakpoint
      // Shorter format below 800px
      return d3.timeFormat('%a')(d);
    }
    return d3.timeFormat('%a, %m/%d')(d);
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
      const svgElement = d3.select(chartContainer).select('svg');
      svgElement
        .attr('width', containerWidth)
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
    const maxPages = viewMode === 'month' ? 3 : 12; // 3 months or 12 weeks
    if (currentPage < maxPages - 1) {
      currentPage++;
      calculateWorkoutDays();
    }
  }

  function handleViewModeChange(value: string) {
    isMonthView = value === 'month';
    currentPage = calculateCurrentPage();
    calculateWorkoutDays();
  }

  let scheduleData;
  let userPreferencesData;
  let workoutTypesData;
  let isDataReady = false;

  // Initialize stores
  async function initializeStores() {
    // Initialize workout types first
    await workoutTypes.initialize();
    
    // Subscribe to all stores at once
    schedule.subscribe(value => {
      scheduleData = value;
      checkDataReady('schedule');
    });

    userPreferences.subscribe(value => {
      userPreferencesData = value;
      checkDataReady('preferences');
    });

    workoutTypes.subscribe(value => {
      workoutTypesData = value;
      checkDataReady('workoutTypes');
    });
  }

  function checkDataReady(source) {
    const hasWorkoutTypes = !!(workoutTypesData && workoutTypesData.length > 0);
    isDataReady = !!(scheduleData && userPreferencesData && hasWorkoutTypes);
    
    if (isDataReady && svg) {
      calculateWorkoutDays();
      requestAnimationFrame(updateChart);
    }
  }

  onMount(() => {
    // Initialize stores first
    initializeStores();
    
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

  // View mode changes should also wait for data readiness
  $: {
    viewMode = isMonthView ? 'month' : 'week';
    if (isDataReady && svg && workoutTypesData && workoutTypesData.length > 0) {
      calculateWorkoutDays();
    }
  }

  function calculateCurrentPage() {
    if (!userPreferencesData) return 0;
    
    const today = new Date();
    const startDate = new Date(userPreferencesData.startDate);
    
    // Set both dates to midnight for accurate day calculation
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    // Adjust startDate to the beginning of its week (Sunday)
    const startDay = startDate.getDay();
    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setDate(adjustedStartDate.getDate() - startDay);
    
    // Calculate the difference from the adjusted start date
    const diffTime = today.getTime() - adjustedStartDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (viewMode === 'month') {
      // For month view, calculate which 30-day period contains today
      return Math.floor(diffDays / 30);
    } else {
      // For week view, calculate which 7-day period contains today
      return Math.floor(diffDays / 7);
    }
  }

  function calculateWorkoutDays() {
    if (!userPreferencesData || !scheduleData || !workoutTypesData || workoutTypesData.length === 0) {
      return;
    }
    
    const startDate = getStartOfDay(userPreferencesData.startDate);
    const daysPerWeek = userPreferencesData.daysPerWeek;
    
    // Calculate start and end dates based on view mode
    const pageStartDate = new Date(startDate);
    
    // Adjust initial startDate to the beginning of its week (Sunday)
    const startDay = pageStartDate.getDay();
    pageStartDate.setDate(pageStartDate.getDate() - startDay);
    
    // Now add the page offset
    const daysToAdd = viewMode === 'month' ? currentPage * 30 : currentPage * 7;
    pageStartDate.setDate(pageStartDate.getDate() + daysToAdd);
    
    const pageEndDate = new Date(pageStartDate);
    // Set period length based on view mode
    const periodLength = viewMode === 'month' ? 29 : 6; // 30 days for month, 7 days for week
    pageEndDate.setDate(pageEndDate.getDate() + periodLength);

    // Group recorded workouts by date
    const workoutsByDate = scheduleData
      .filter(workout => {
        const workoutDate = getStartOfDay(workout.date);
        return workoutDate >= pageStartDate && workoutDate <= pageEndDate;
      })
      .reduce((acc, workout) => {
        const dateStr = getStartOfDay(workout.date).toDateString();
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push({
          id: workout.id,
          date: getStartOfDay(workout.date),
          duration: workout.duration,
          created_at: workout.created_at,
          workout_type_id: workout.workout_type_id
        });
        return acc;
      }, {});

    // Create base workout days for all dates in range
    const allDates = [];
    const currentDate = new Date(pageStartDate);
    
    while (currentDate <= pageEndDate) {
      allDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create base workout days for all dates in range
    const workoutDays = allDates.map(date => {
      const dateStr = date.toDateString();
      const workouts = workoutsByDate[dateStr] || [];
      const dayNum = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      return {
        date,
        day: dayNum,
        completed: workouts.length > 0,
        workouts: workouts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        proposed: 0,
        total: workouts.reduce((sum, w) => sum + w.duration, 0)
      };
    });

    // Track which dates already have recorded workouts
    const recordedDates = new Set(Object.keys(workoutsByDate));

    // Now add proposed workouts
    let currentWeekWorkouts = 0;
    let weekStartDate = new Date(pageStartDate);

    workoutDays.forEach(day => {
      const dayOfWeek = day.date.getDay();
      
      // Reset week counter on Sundays
      if (dayOfWeek === 0) {
        currentWeekWorkouts = 0;
        weekStartDate = new Date(day.date);
      }

      // Count recorded workouts this week
      if (dayOfWeek === 0 || day.date.toDateString() === pageStartDate.toDateString()) {
        const weekEnd = new Date(weekStartDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        currentWeekWorkouts = Array.from(recordedDates)
          .filter(dateStr => {
            const date = new Date(dateStr);
            return date >= weekStartDate && date <= weekEnd;
          }).length;
      }

      // Only propose a workout if conditions are met
      if (!recordedDates.has(day.date.toDateString()) && 
          dayOfWeek !== 0 && 
          currentWeekWorkouts < daysPerWeek) {
        
        const targetTime = Math.round(calculateSigmoidal(day.day, userPreferencesData.sigmoidParams));
        day.proposed = targetTime;
        day.total = targetTime;
        currentWeekWorkouts++;
      }
    });

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
      dispatch('editWorkout', workoutData);
    }
  }

  function handleDeleteWorkout(workout) {
    if (workout && workout.date && workout.id) {
      dispatch('deleteWorkout', {
        date: workout.date.toISOString(),
        id: workout.id
      });
    }
  }

  function goToToday() {
    const newPage = calculateCurrentPage();
    if (currentPage !== newPage) {
      currentPage = newPage;
      calculateWorkoutDays();
    }
  }

  function getWorkoutColor(workout) {
    if (!workout || !workoutTypesData || workoutTypesData.length === 0) {
      return 'hsl(var(--primary))';
    }
    const workoutType = workoutTypesData.find(t => t.id === workout.workout_type_id);
    return workoutType?.color || 'hsl(var(--primary))';
  }

  function updateChart() {
    if (!svg || !dailyWorkouts.length || !width || !height || !workoutTypesData || workoutTypesData.length === 0) {
      return;
    }

    const scales = createScales();
    if (!scales) return;
    const { x, y } = scales;

    // Remove old elements
    svg.selectAll('.day-group').remove();
    svg.selectAll('.current-day-line').remove();
    svg.selectAll('.week-boundary-line').remove();
    svg.selectAll('.current-day-background').remove();
    svg.selectAll('.chart-border').remove();
    svg.selectAll('.click-overlay').remove();

    // Add click overlay first (behind everything else)
    const overlay = svg.append('g')
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
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        // Don't trigger if we clicked on a bar
        if (event.target === event.currentTarget) {
          const clickedDate = new Date(d.date);
          // Set to noon to avoid timezone issues
          clickedDate.setHours(12, 0, 0, 0);
          dispatch('dateClick', {
            date: clickedDate.toISOString()
          });
        }
      });

    // Add top and right borders
    const border = svg.append('g')
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

    // Add current day background and line
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toDateString();
    
    // Add current day indicator if today is in view
    const todayInView = dailyWorkouts.some(d => d.date.toDateString() === todayStr);

    if (todayInView) {
      svg.append('rect')
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
          svg.append('rect')
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

    // Create day groups after boundaries so bars are on top
    const dayGroups = svg.selectAll('.day-group')
      .data(dailyWorkouts)
      .enter()
      .append('g')
      .attr('class', 'day-group')
      .attr('transform', d => `translate(${x(new Date(d.date).toDateString())},0)`);

    const barWidth = x.bandwidth();

    // Add completed workout bars (stacked) and labels
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
            .style('fill', getWorkoutColor(workout))
            .style('stroke', 'hsl(var(--border))')
            .style('stroke-width', '1px')
            .style('stroke-opacity', '0.5')
            .on('click', () => handleEditWorkout(workout));

          stackHeight += workout.duration;
        });

        // Add total duration label for recorded workouts
        group.append('text')
          .attr('class', 'duration-label')
          .attr('x', barWidth / 2)
          .attr('y', y(stackHeight) - 5)
          .attr('text-anchor', 'middle')
          .style('font-size', containerWidth < 640 ? '0.65rem' : '0.75rem')
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
          .style('cursor', 'pointer')
          .style('fill', 'transparent')
          .style('stroke', 'hsl(var(--primary))')
          .style('stroke-width', '1.5px')
          .style('stroke-opacity', '0.7')
          .style('stroke-dasharray', '4,4')
          .on('click', () => handleWorkoutClick(d));

        // Add proposed duration label
        const labelY = d.workouts.length > 0 ? y(stackHeight) - 20 : y(d.proposed) - 5;
        group.append('text')
          .attr('class', 'duration-label proposed')
          .attr('x', barWidth / 2)
          .attr('y', labelY)
          .attr('text-anchor', 'middle')
          .style('font-size', containerWidth < 640 ? '0.65rem' : '0.75rem')
          .style('fill', 'currentColor')
          .style('opacity', 0.7)
          .text(`${d.proposed}`);
      }
    });

    // Update X-axis with explicit styling
    svg.select('.x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickFormat(formatDate)
        .tickValues(dailyWorkouts.map(d => new Date(d.date).toDateString())
          .filter((_, i) => {
            if (containerWidth < 800) {  // Updated breakpoint
              // Show fewer ticks below 800px
              return i % 2 === 0;
            } else if (viewMode === 'month') {
              return i % 3 === 0;
            } else {
              return i % 2 === 0;
            }
          })))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', containerWidth < 800 ? '-.5em' : '-.8em')  // Updated breakpoint
      .attr('dy', containerWidth < 800 ? '.1em' : '.15em')   // Updated breakpoint
      .attr('transform', containerWidth < 800 ? 'rotate(-45)' : 'rotate(-35)');  // Updated breakpoint

    // Update Y-axis with explicit styling
    svg.select('.y-axis')
      .call(d3.axisLeft(y)
        .ticks(containerWidth < 800 ? 4 : 5)  // Updated breakpoint
        .tickFormat(d => d))
      .selectAll('text')
      .attr('dx', containerWidth < 800 ? '0' : '0.25em');  // Updated breakpoint

    // Update grid lines with explicit styling
    svg.select('.grid-lines')
      .selectAll('line')
      .data(y.ticks(containerWidth < 800 ? 4 : 5))  // Updated breakpoint
      .join('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', 'var(--border-color)')
      .attr('stroke-opacity', 0.15)
      .attr('stroke-dasharray', '2,2');

    // Update Y-axis label with explicit styling
    svg.select('.y-axis-label')
      .attr('x', -height / 2)
      .attr('y', -margin.left + (containerWidth < 800 ? 8 : 35))  // Updated breakpoint
      .attr('fill', 'currentColor')
      .style('font-size', containerWidth < 800 ? '0.7rem' : '1rem')  // Updated breakpoint
      .text('Min');
  }
</script>

<!-- Chart container -->
<div class="chart-container">
  <!-- Navigation controls above chart -->
  <div class="flex justify-center items-center gap-2 mb-2">
    <Button 
      variant="outline" 
      size="sm"
      class="h-7 px-2"
      on:click={previousPeriod} 
      disabled={currentPage === 0}
    >
      ←
    </Button>
    <Button 
      variant="secondary"
      size="sm"
      class="h-7 px-2"
      on:click={goToToday}
    >
      Today
    </Button>
    <Button 
      variant="outline" 
      size="sm"
      class="h-7 px-2"
      on:click={nextPeriod} 
      disabled={currentPage === (viewMode === 'month' ? 2 : 11)}
    >
      →
    </Button>
  </div>

  <!-- Chart area -->
  <div class="chart" bind:this={chartContainer}>
    <!-- SVG will be added here by D3 -->
  </div>

  <!-- Legend -->
  {#if workoutTypesData && workoutTypesData.length > 0}
    <div class="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2 text-xs sm:text-sm sm:mt-6 sm:px-4 sm:gap-4">
      {#each workoutTypesData as type}
        <div class="flex items-center gap-1.5">
          <div 
            class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-border" 
            style="background-color: {type.color};"
          />
          <span class="text-muted-foreground whitespace-nowrap">{type.name}</span>
        </div>
      {/each}
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-dashed border-primary rounded-full" />
        <span class="text-muted-foreground whitespace-nowrap">Proposed</span>
      </div>
    </div>
  {/if}

  <!-- View mode toggle below legend -->
  <div class="flex justify-center mt-2 sm:mt-4">
    <Tabs.Root value={viewMode} onValueChange={handleViewModeChange}>
      <Tabs.List>
        <Tabs.Trigger value="week" class="text-xs sm:text-sm px-3 h-7">Week</Tabs.Trigger>
        <Tabs.Trigger value="month" class="text-xs sm:text-sm px-3 h-7">Month</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  </div>
</div>

<style>
  .chart-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .chart {
    flex: 1;
    min-height: 0;
    position: relative;
    width: 100%;
    margin-bottom: 1rem; /* Add space for legend on mobile */
  }

  :global(.chart-svg) {
    width: 100%;
    height: 100%;
    overflow: visible;  /* Allow axis labels to overflow */
  }

  :global(.x-axis), :global(.y-axis) {
    @apply text-muted-foreground;
  }

  :global(.x-axis path), :global(.y-axis path),
  :global(.x-axis line), :global(.y-axis line) {
    stroke: hsl(var(--border));
    stroke-width: 1px;
    stroke-opacity: 0.5;
  }

  :global(.x-axis text), :global(.y-axis text) {
    @apply text-foreground;
    font-size: 0.7rem;
  }

  :global(.completed-rect) {
    stroke: hsl(var(--border));
    stroke-width: 1px;
    stroke-opacity: 0.5;
    transition: filter 0.2s ease-in-out;
  }

  :global(.completed-rect:hover) {
    filter: brightness(1.1);
  }

  :global(.proposed-rect) {
    fill: transparent;
    stroke: hsl(var(--primary));
    stroke-width: 1.5px;
    stroke-opacity: 0.7;
    stroke-dasharray: 4,4;
    transition: fill 0.2s ease-in-out;
  }

  :global(.proposed-rect:hover) {
    fill: hsl(var(--primary) / 0.2);
  }

  :global(.grid-lines line) {
    stroke: hsl(var(--border));
    stroke-opacity: 0.2;
    stroke-dasharray: 2,2;
  }

  :global(.current-day-background) {
    pointer-events: none;
    background-color: hsl(var(--primary) / 0.15);
  }

  :global(.week-boundary-line) {
    pointer-events: none;
    stroke: hsl(var(--border));
    stroke-opacity: 0.3;
  }

  :global(.duration-label) {
    pointer-events: none;
    font-family: system-ui, -apple-system, sans-serif;
    @apply text-foreground;
  }

  :global(.duration-label.proposed) {
    opacity: 0.9;
    @apply text-foreground;
  }

  @media (min-width: 800px) {
    :global(.chart-svg) {
      position: absolute;
      top: 0;
      left: 0;
    }

    .chart-container {
      position: relative;
      padding-right: 1rem;
    }

    .chart {
      position: relative;
    }

    :global(.x-axis text), :global(.y-axis text) {
      font-size: 0.9rem;
    }

    :global(.x-axis path), :global(.y-axis path),
    :global(.x-axis line), :global(.y-axis line) {
      stroke-width: 1.5px;
    }

    :global(.completed-rect) {
      stroke-width: 1.5px;
    }

    :global(.proposed-rect) {
      stroke-width: 2px;
      stroke-opacity: 0.8;
    }

    :global(.grid-lines line) {
      stroke-opacity: 0.15;
      stroke-width: 1.5px;
    }

    :global(.week-boundary-line) {
      stroke-width: 2px;
      stroke-opacity: 0.4;
      opacity: 0.25 !important;
    }
  }

  /* Remove any styles that might interfere with shadcn tabs */
  :global(.chart-container [data-state="active"]) {
    background-color: unset !important;
    color: unset !important;
  }

  /* Add proper tab styling */
  :global(.chart-container [role="tablist"]) {
    height: 100%;
    border: 1px solid hsl(var(--border));
    border-radius: 0.375rem;
    padding: 0;
    background: none;
  }

  :global(.chart-container [role="tab"]) {
    height: 100%;
    border-radius: 0.375rem;
    border: none;
    background: none;
    @apply text-muted-foreground;
  }

  :global(.chart-container [role="tab"][data-state="active"]) {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }

  @media (max-width: 800px) {
    .chart {
      height: calc(100% - 7rem); /* Adjust height to accommodate legend and controls */
      margin-right: 0;
    }

    :global(.x-axis text) {
      font-size: 0.65rem;
    }

    :global(.y-axis text) {
      font-size: 0.65rem;
    }

    :global(.duration-label) {
      font-size: 0.6rem;
    }
  }

  :global(.tabs-list) {
    margin-bottom: 0;
  }
</style>
