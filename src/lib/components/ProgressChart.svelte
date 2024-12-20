<script>
  import { schedule } from '../stores/scheduleStore';
  import { userPreferences } from '../stores/userPreferencesStore';
  import { calculateSigmoidal } from '../utils/sigmoidal';

  // Chart dimensions
  const width = 800;
  const height = 400;
  const padding = 40;

  // Derived values for plotting
  $: sigmoidPoints = Array.from({ length: 90 }, (_, i) => ({
    day: i + 1,
    duration: calculateSigmoidal(i + 1, $userPreferences.sigmoidParams)
  }));

  $: completedWorkouts = $schedule
    .filter(day => day.completed)
    .map(day => ({
      day: day.day,
      duration: day.workouts.reduce((total, w) => total + w.duration, 0)
    }));

  // Scale helpers
  $: xScale = (day) => (day - 1) * ((width - 2 * padding) / 89) + padding;
  
  $: yScale = (duration) => {
    const maxDuration = Math.max(
      $userPreferences.sigmoidParams.endMinutes,
      ...completedWorkouts.map(w => w.duration)
    );
    return height - padding - (duration * (height - 2 * padding) / maxDuration);
  };

  // Generate SVG path for sigmoid curve
  $: sigmoidPath = sigmoidPoints
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${xScale(point.day)} ${yScale(point.duration)}`)
    .join(' ');
</script>

<div class="chart-container">
  <h2>Progress Chart</h2>
  
  <svg {width} {height}>
    <!-- Axes -->
    <line 
      x1={padding} 
      y1={height - padding} 
      x2={width - padding} 
      y2={height - padding} 
      class="axis"
    />
    <line 
      x1={padding} 
      y1={padding} 
      x2={padding} 
      y2={height - padding} 
      class="axis"
    />

    <!-- Sigmoid curve -->
    <path 
      d={sigmoidPath} 
      class="sigmoid-line"
      fill="none"
    />

    <!-- Actual workout points -->
    {#each completedWorkouts as workout}
      <circle 
        cx={xScale(workout.day)} 
        cy={yScale(workout.duration)} 
        r="4" 
        class="workout-point"
      >
        <title>Day {workout.day}: {workout.duration} minutes</title>
      </circle>
    {/each}

    <!-- Axis labels -->
    <text 
      x={width / 2} 
      y={height - 5} 
      text-anchor="middle"
    >
      Days
    </text>
    <text 
      x={15} 
      y={height / 2} 
      transform="rotate(-90, 15, {height/2})" 
      text-anchor="middle"
    >
      Minutes
    </text>
  </svg>
</div>

<style>
  .chart-container {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1.5rem;
    max-width: 900px;
    margin: 1rem auto;
  }

  h2 {
    margin: 0 0 1.5rem 0;
    text-align: center;
  }

  svg {
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .axis {
    stroke: #666;
    stroke-width: 1;
  }

  .sigmoid-line {
    stroke: #ff3e00;
    stroke-width: 2;
    opacity: 0.5;
  }

  .workout-point {
    fill: #4CAF50;
    stroke: white;
    stroke-width: 1;
    cursor: pointer;
  }

  .workout-point:hover {
    fill: #45a049;
    r: 6;
  }

  text {
    fill: #ccc;
    font-size: 12px;
  }

  @media (max-width: 900px) {
    .chart-container {
      padding: 1rem;
    }
  }
</style>
