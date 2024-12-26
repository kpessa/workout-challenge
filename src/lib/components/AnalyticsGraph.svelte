<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import annotationPlugin from 'chartjs-plugin-annotation';
  import type { Scale, CoreScaleOptions } from 'chart.js';
  import { parseISO, format, differenceInDays } from 'date-fns';
  import { schedule } from '$lib/stores/scheduleStore';
  import { userPreferences } from '$lib/stores/userPreferencesStore';
  import { theme } from '$lib/stores/themeStore';
  import { workoutTypes } from '$lib/stores/workoutTypeStore';
  import { calculateSigmoidal } from '$lib/utils/sigmoidal';
  import type { Workout, WorkoutType } from '$lib/types';

  Chart.register(annotationPlugin);

  export let startDate: string;

  let canvas: HTMLCanvasElement;
  let chart: Chart;
  let windowWidth = window.innerWidth;

  interface DayData {
    total: number;
    workouts: Workout[];
  }

  function handleResize() {
    windowWidth = window.innerWidth;
    if (startDate && canvas) {
      createChart(parseISO(startDate));
    }
  }

  // Subscribe to theme changes
  $: {
    if (startDate && canvas) {
      createChart(parseISO(startDate));
    }
  }

  function getThemeColors() {
    const colors = {
      primary: 'hsl(var(--primary))',
      foreground: $theme === 'dark' ? '#ffffff' : '#000000',
      card: $theme === 'dark' ? '#1c1c1c' : '#ffffff',
      border: $theme === 'dark' ? '#333333' : '#e5e5e5',
      moderate: $theme === 'dark' ? '#90EE90' : '#2E8B57',
      vigorous: $theme === 'dark' ? '#87CEEB' : '#4169E1',
      axis: $theme === 'dark' ? '#ffffff' : '#000000',
      target: $theme === 'dark' ? '#ffffff' : '#000000'
    };
    
    return colors;
  }

  function generateData(start: Date) {
    // Process workouts
    const workoutsByDate = new Map<string, DayData>();
    ($schedule as Workout[]).forEach(workout => {
      const date = workout.date.split('T')[0];
      const current = workoutsByDate.get(date) || { total: 0, workouts: [] };
      current.total += workout.duration;
      current.workouts.push(workout);
      workoutsByDate.set(date, current);
    });

    // Generate data points for 90 days
    const dates = Array.from({ length: 90 }, (_, i) => {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      return format(currentDate, 'MMM dd');
    });

    // Create sparse array for workouts (undefined for days without workouts)
    const actualMinutes: (DayData | null)[] = Array.from({ length: 90 }, (_, i) => {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayData = workoutsByDate.get(dateStr);
      return dayData || null;
    });

    const targetMinutes = Array.from({ length: 90 }, (_, i) => {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      return calculateSigmoidal(currentDate, start, $userPreferences.sigmoid);
    });

    return { dates, actualMinutes, targetMinutes };
  }

  function createChart(start: Date) {
    if (chart) {
      chart.destroy();
    }

    const { dates, actualMinutes, targetMinutes } = generateData(start);
    const ctx = canvas.getContext('2d');
    const colors = getThemeColors();

    if (!ctx) return;

    // Convert DayData to simple numbers for Chart.js
    const workoutData = actualMinutes.map(d => d?.total || null);

    const config = {
      type: 'line' as const,
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Target Minutes',
            data: targetMinutes,
            borderColor: $theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.6)',
            borderDash: [5, 5],
            borderWidth: 2,
            pointStyle: 'line' as const,
            tension: 0.4,
            fill: false
          },
          {
            label: 'Workouts',
            data: workoutData,
            borderColor: 'transparent',
            backgroundColor: $theme === 'dark' ? '#ffffff' : '#000000',
            pointStyle: 'circle' as const,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBorderWidth: 1,
            pointBorderColor: $theme === 'dark' ? '#1c1c1c' : '#ffffff',
            showLine: false,
            spanGaps: true
          },
          {
            label: 'Moderate (150min/week)',
            data: Array(90).fill(150/7),
            borderColor: $theme === 'dark' ? 'rgba(144, 238, 144, 0.7)' : 'rgba(46, 139, 87, 0.7)',
            borderDash: [5, 5],
            borderWidth: 2,
            pointStyle: 'line' as const,
            fill: false
          },
          {
            label: 'Vigorous (300min/week)',
            data: Array(90).fill(300/7),
            borderColor: $theme === 'dark' ? 'rgba(135, 206, 235, 0.7)' : 'rgba(65, 105, 225, 0.7)',
            borderDash: [5, 5],
            borderWidth: 2,
            pointStyle: 'line' as const,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: window.innerWidth < 768 ? 1.2 : 2,
        interaction: {
          mode: 'nearest' as const,
          intersect: false,
          axis: 'x' as const
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            border: {
              display: false
            },
            ticks: {
              color: $theme === 'dark' ? '#ffffff' : '#000000',
              font: {
                size: 10
              }
            }
          },
          y: {
            min: 0,
            max: Math.max(
              $userPreferences.sigmoid.maxDuration,
              Math.max(...workoutData.filter(m => m !== null) as number[]) || 0,
              43
            ) * 1.1,
            grid: {
              display: false
            },
            border: {
              display: false
            },
            ticks: {
              color: $theme === 'dark' ? '#ffffff' : '#000000',
              callback: function(this: Scale<CoreScaleOptions>, tickValue: string | number) {
                const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
                return `${Math.round(value)}m`;
              },
              font: {
                size: 10
              }
            }
          }
        },
        plugins: {
          annotation: {
            annotations: {
              currentDate: {
                type: 'line' as const,
                xMin: format(new Date(), 'MMM dd'),
                xMax: format(new Date(), 'MMM dd'),
                borderColor: $theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                borderWidth: 2,
                borderDash: [6, 6],
                drawTime: 'beforeDatasetsDraw' as const,
                label: {
                  display: true,
                  content: 'Today',
                  position: 'center' as const,
                  backgroundColor: 'transparent',
                  color: $theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  font: {
                    size: 11
                  },
                  padding: 4
                }
              }
            }
          },
          tooltip: {
            backgroundColor: colors.card,
            titleColor: $theme === 'dark' ? '#ffffff' : '#000000',
            bodyColor: $theme === 'dark' ? '#ffffff' : '#000000',
            borderColor: colors.border,
            borderWidth: 1,
            padding: 8,
            displayColors: true,
            callbacks: {
              title: (items: any[]) => {
                const date = new Date(items[0].label);
                return format(date, 'EEE, MM/dd');
              },
              label: (item: any) => {
                if (item.datasetIndex !== 1) {
                  const value = item.raw as number;
                  if (value === null) return '';
                  return `${item.dataset.label}: ${value.toFixed(1)}m`;
                }

                const dayData = actualMinutes[item.dataIndex];
                if (!dayData || !dayData.workouts.length) return '';

                // Return empty string for the total line - we'll show workouts in afterBody
                return '';
              },
              afterBody: (items: any[]) => {
                const workoutItem = items.find(item => item.datasetIndex === 1);
                if (!workoutItem) return [];

                const dayData = actualMinutes[workoutItem.dataIndex];
                if (!dayData || !dayData.workouts.length) return [];

                const lines = [`Total: ${dayData.total.toFixed(1)}m`];
                dayData.workouts.forEach(workout => {
                  const type = $workoutTypes.find(t => t.id === workout.workout_type_id);
                  if (type) {
                    lines.push(`• ${type.name}: ${workout.duration.toFixed(1)}m`);
                  } else {
                    lines.push(`• Workout: ${workout.duration.toFixed(1)}m`);
                  }
                });
                return lines;
              },
              labelTextColor: (item: any) => {
                if (item.datasetIndex !== 1) return item.dataset.borderColor;
                const dayData = actualMinutes[item.dataIndex];
                if (!dayData || !dayData.workouts.length) return colors.foreground;
                const workout = dayData.workouts[0];
                const type = $workoutTypes.find(t => t.id === workout.workout_type_id);
                return type?.color || colors.foreground;
              }
            }
          },
          legend: {
            position: 'top' as const,
            labels: {
              color: $theme === 'dark' ? '#ffffff' : '#000000',
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 11
              },
              boxWidth: 8,
              padding: 15
            }
          }
        }
      }
    };

    chart = new Chart(ctx, config);
  }

  onMount(() => {
    if (startDate) {
      createChart(parseISO(startDate));
    }
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
    window.removeEventListener('resize', handleResize);
  });
</script>

<div class="w-full border rounded-lg bg-background p-4">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  canvas {
    width: 100% !important;
  }
</style> 