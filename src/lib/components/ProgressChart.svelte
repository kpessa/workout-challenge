<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import * as d3 from 'd3';
  import { timeFormat } from 'd3-time-format';
  import { axisTop } from 'd3-axis';
  import { schedule } from '../stores/scheduleStore';
  import { userPreferences } from '../stores/userPreferencesStore';
  import { workoutTypes } from '../stores/workoutTypeStore';
  import { calculateSigmoidal } from '$lib/utils/sigmoidal';
  import { Button } from "$lib/components/UI/button";
  import * as Tabs from "$lib/components/UI/tabs";
  import { getStartOfDay } from '$lib/utils/dateHelpers';

  type ViewMode = 'week' | 'month';

  const dispatch = createEventDispatcher();

  let chartContainer: HTMLElement;
  let currentPage = 0;
  let svg: any;  // D3 selection type
  let dailyWorkouts: any[] = [];
  let containerWidth: number;
  let containerHeight: number;
  
  // Create a container query observer
  let containerObserver: ResizeObserver;
  let isMonthView: boolean;  // Remove default value
  let viewMode: ViewMode;    // Remove default value
  let isInitialized = false; // Track if initial mode has been set

  export let isFullScreen = false;  // New prop to control full-screen button visibility

  // Format date based on view mode and screen size
  $: formatDate = (date: Date | string) => {
    const d = new Date(date);
    if (viewMode === 'week') {
      // Week view: show day name
      return timeFormat('%a')(d);
    } else {
      // Month view: show MM/DD
      return timeFormat('%-m/%-d')(d);  // %-m and %-d remove leading zeros
    }
  };

  // Chart dimensions
  $: margin = {
    top: 5,
    right: containerWidth < 800 ? 10 : 20,
    bottom: containerWidth < 800 ? 25 : 40,
    left: containerWidth < 800 ? 25 : 35
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

  // Initialize with today in view
  $: {
    if (userPreferencesData && scheduleData) {
      // Set initial page to show today
      currentPage = calculateCurrentPage();
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

  function updateDimensions() {
    if (chartContainer) {
      const rect = chartContainer.getBoundingClientRect();
      containerWidth = rect.width;
      containerHeight = rect.height;
      
      console.log('Container dimensions:', {
        width: containerWidth,
        height: containerHeight
      });
      
      // Only set the initial view mode once
      if (!isInitialized && containerWidth) {
        isMonthView = containerWidth >= 800;
        viewMode = isMonthView ? 'month' : 'week';
        isInitialized = true;
        if (isDataReady) {
          currentPage = calculateCurrentPage();
          calculateWorkoutDays();
        }
      }
    }
  }

  let resizeTimeout: ReturnType<typeof setTimeout>;

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

  function handleViewModeChange(value: ViewMode) {
    isMonthView = value === 'month';
    viewMode = value;
    // Calculate the page that contains today
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
      // Ensure we start with today in view
      currentPage = calculateCurrentPage();
      calculateWorkoutDays();
      requestAnimationFrame(updateChart);
    }
  }

  onMount(() => {
    // Initialize stores first
    initializeStores();
    
    // Create the SVG
    updateDimensions();
    
    // Set up container query observer
    containerObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === chartContainer) {
          updateDimensions();
          if (svg) {
            requestAnimationFrame(updateChart);
          }
        }
      }
    });

    if (chartContainer) {
      containerObserver.observe(chartContainer);
    }

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
      .attr('class', 'x-axis-top');  // Add top x-axis

    svg.append('g')
      .attr('class', 'y-axis');
    
    return () => {
      if (containerObserver) {
        containerObserver.disconnect();
      }
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

    // Calculate the difference from today to start date
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let page;
    if (viewMode === 'month') {
      // For month view, calculate which 30-day period contains today
      const monthPage = Math.floor(diffDays / 30);
      page = Math.min(2, Math.max(0, monthPage)); // Clamp between 0 and 2
    } else {
      // For week view, we need to find which week contains today
      const startDay = startDate.getDay(); // 0-6, where 0 is Sunday
      const adjustedDiffDays = diffDays + startDay;
      const weekPage = Math.floor(adjustedDiffDays / 7);
      page = Math.min(11, Math.max(0, weekPage)); // Clamp between 0 and 11
    }
    
    return page;
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toDateString();

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
      const shouldPropose = !recordedDates.has(day.date.toDateString()) && 
                          dayOfWeek !== 0 && 
                          currentWeekWorkouts < daysPerWeek;
      
      if (shouldPropose) {
        const targetTime = Math.round(calculateSigmoidal(
          day.date,
          new Date(userPreferencesData.startDate),
          userPreferencesData.sigmoid
        ));
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
        .tickFormat(d => {
          const date = new Date(d);
          // Show full day name (Mon, Tue, etc.) in week view, single letter (M, T, etc.) in month view
          return viewMode === 'week' ? timeFormat('%a')(date) : timeFormat('%a')(date).charAt(0);
        })
        .tickValues(dailyWorkouts.map(d => new Date(d.date).toDateString())
          .filter((_, i) => {
            if (viewMode === 'week') {
              // Show all days in week view
              return true;
            } else if (containerWidth < 800) {
              // Show more ticks in month view on mobile since we're using single letters
              return i % 2 === 0;
            } else {
              // Month view on larger screens
              return true;  // Show all days since we're using single letters
            }
          })))
      .selectAll('text')
      .style('text-anchor', 'middle')
      .attr('dx', '0')
      .attr('dy', '1em')  // Move labels down a bit
      .attr('transform', 'translate(0, 0)');  // Keep labels horizontal

    // Add top X-axis with MM/DD format
    svg.select('.x-axis-top')
      .attr('transform', `translate(0,0)`)
      .call(d3.axisTop(x)
        .tickFormat(d => timeFormat('%-m/%-d')(new Date(d)))  // Always show MM/DD format
        .tickValues(dailyWorkouts.map(d => new Date(d.date).toDateString())
          .filter((_, i) => {
            if (viewMode === 'week') {
              // Show all days in week view
              return true;
            } else if (containerWidth < 800) {
              // Show fewer ticks in month view on mobile
              return i % 3 === 0;
            } else {
              // Month view on larger screens
              return i % 2 === 0;
            }
          })))
      .selectAll('text')
      .style('text-anchor', 'middle')
      .attr('dx', '0')
      .attr('dy', '-0.5em')  // Move labels up a bit
      .attr('transform', 'translate(0, 0)');  // Keep labels horizontal

    // Update Y-axis with explicit styling
    svg.select('.y-axis')
      .call(d3.axisLeft(y)
        .ticks(containerWidth < 800 ? 4 : 5)  // Updated breakpoint
        .tickFormat(d => d))
      .selectAll('text')
      .attr('dx', containerWidth < 800 ? '0' : '0.25em')  // Updated breakpoint
      .style('font-size', containerWidth < 800 ? '0.65rem' : '0.75rem'); // Adjust tick text size

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
  }
</script>

<!-- Chart container -->
<div class="chart-container" style="container-type: inline-size;">
  <!-- Full screen button - only show if not in full screen -->
  {#if !isFullScreen}
    <Button 
      variant="ghost" 
      size="sm"
      class="absolute top-2 right-2 z-10 h-7 w-7 p-0"
      on:click={() => window.location.href = '/graph'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
      </svg>
    </Button>
  {/if}

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

  /* Navigation controls */
  .flex.justify-center.items-center {
    flex: 0 0 auto;  /* Don't grow or shrink */
  }

  /* Chart area */
  .chart {
    flex: 1 1 0;     /* Can grow and shrink, but start at 0 */
    min-height: 0;   /* Allow shrinking below content size */
    position: relative;
    width: 100%;
  }

  /* Legend and tabs area */
  .flex.flex-wrap,
  .flex.justify-center.mt-2 {
    flex: 0 0 auto;  /* Don't grow or shrink */
  }

  /* Landscape mode optimizations */
  @media (max-height: 500px) {
    .flex.flex-wrap {
      margin-top: 0.25rem !important;
      gap-x: 1.5rem !important;
      gap-y: 0.25rem !important;
    }

    .flex.justify-center.mt-2 {
      margin-top: 0.25rem !important;
    }

    /* Make the legend text even smaller in landscape */
    .flex.flex-wrap span {
      font-size: 0.65rem !important;
    }

    /* Make dots smaller in landscape */
    .flex.flex-wrap .w-3 {
      width: 0.5rem !important;
      height: 0.5rem !important;
    }

    /* Make tabs more compact in landscape */
    :global([role="tab"]) {
      height: 1.5rem !important;
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
      font-size: 0.7rem !important;
    }
  }

  @container (width < 800px) {
    /* Make legend and tabs more compact on mobile */
    .flex.flex-wrap {
      gap-x: 2 !important;
      gap-y: 1 !important;
      margin-top: 0.25rem !important;
      padding: 0 0.5rem !important;
    }

    .flex.justify-center.mt-2 {
      margin-top: 0.25rem !important;
    }

    /* Make the legend text smaller */
    .flex.flex-wrap span {
      font-size: 0.7rem;
    }

    /* Adjust the dots size */
    .flex.flex-wrap .w-3 {
      width: 0.625rem !important;
      height: 0.625rem !important;
    }

    /* Make tabs more compact */
    :global([role="tab"]) {
      height: 1.75rem !important;
      padding-left: 0.75rem !important;
      padding-right: 0.75rem !important;
      font-size: 0.75rem !important;
    }
  }

  /* Additional full-screen mobile optimizations */
  :global(.fixed) .chart-container {
    padding-bottom: max(env(safe-area-inset-bottom, 0.5rem), 0.5rem);
    max-height: 100%;  /* Ensure container doesn't overflow */
  }

  :global(.chart-svg) {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  :global(.x-axis), :global(.y-axis), :global(.x-axis-top) {
    @apply text-muted-foreground;
  }

  :global(.x-axis path), :global(.y-axis path), :global(.x-axis-top path),
  :global(.x-axis line), :global(.y-axis line), :global(.x-axis-top line) {
    stroke: hsl(var(--border));
    stroke-width: 1px;
    stroke-opacity: 0.5;
  }

  :global(.x-axis text), :global(.y-axis text), :global(.x-axis-top text) {
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

  @container (width < 800px) {
    :global(.x-axis text) {
      font-size: 0.65rem;
    }

    :global(.y-axis text) {
      font-size: 0.65rem;
    }

    :global(.duration-label) {
      font-size: 0.6rem;
    }

    .chart {
      height: 100%;
      margin-right: 0;
    }

    /* Reduce spacing for legend and tabs */
    .flex.flex-wrap {
      gap-x: 2 !important;
      gap-y: 1 !important;
      margin-top: 0.5rem !important;
    }

    /* Make the legend text smaller */
    .flex.flex-wrap span {
      font-size: 0.7rem;
    }

    /* Adjust the dots size */
    .flex.flex-wrap .w-3 {
      width: 0.625rem !important;
      height: 0.625rem !important;
    }

    /* Reduce bottom spacing */
    .flex.justify-center.mt-2 {
      margin-top: 0.5rem !important;
    }

    /* Make tabs more compact */
    :global([role="tab"]) {
      height: 1.75rem !important;
      padding-left: 0.75rem !important;
      padding-right: 0.75rem !important;
      font-size: 0.75rem !important;
    }
  }

  @container (width >= 800px) {
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
      height: 100%;
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

  /* Adjust top margin to accommodate top x-axis */
  .chart {
    margin-top: 1.5rem;
  }
</style>