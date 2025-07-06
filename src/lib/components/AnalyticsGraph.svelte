<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import ChartJS from 'chart.js/auto';
  import annotationPlugin from 'chartjs-plugin-annotation';
  import type { Scale, CoreScaleOptions, Chart as ChartType, TooltipModel } from 'chart.js';
  import { parseISO, format, differenceInDays } from 'date-fns';
  import { schedule } from '$lib/stores/scheduleStore';
  import { userPreferences } from '$lib/stores/userPreferencesStore';
  import { theme } from '$lib/stores/themeStore';
  import { workoutTypes } from '$lib/stores/workoutTypeStore';
  import { calculateSigmoidal } from '$lib/utils/sigmoidal';
  import type { Workout, WorkoutType } from '$lib/types';

  ChartJS.register(annotationPlugin);

  export let startDate: string;

  let canvas: HTMLCanvasElement;
  let chart: ChartType;
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
  $: colors = getThemeColors();
  $: {
    if (startDate && canvas) {
      createChart(parseISO(startDate));
    }
  }

  function getThemeColors() {
    return {
      primary: 'hsl(var(--primary))',
      foreground: $theme === 'dark' ? '#ffffff' : '#000000',
      card: $theme === 'dark' ? '#1c1c1c' : '#ffffff',
      border: $theme === 'dark' ? '#333333' : '#e5e5e5',
      moderate: $theme === 'dark' ? 'rgba(144, 238, 144, 0.7)' : 'rgba(46, 139, 87, 0.7)',
      vigorous: $theme === 'dark' ? 'rgba(135, 206, 235, 0.7)' : 'rgba(65, 105, 225, 0.7)',
      axis: $theme === 'dark' ? '#ffffff' : '#000000',
      target: $theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'
    };
  }

  function generateData(start: Date) {
    // Process workouts
    const workoutsByDate = new Map<string, DayData>();
    ($schedule as Workout[]).forEach(workout => {
      // Parse the workout date and format as local date to match chart dates
      const workoutDate = parseISO(workout.date);
      const date = format(workoutDate, 'yyyy-MM-dd');
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
            borderColor: colors.target,
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
            backgroundColor: colors.foreground,
            pointStyle: 'circle' as const,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBorderWidth: 1,
            pointBorderColor: colors.card,
            showLine: false,
            spanGaps: true
          },
          {
            label: 'Moderate (150min/week)',
            data: Array(90).fill(150/7),
            borderColor: colors.moderate,
            borderDash: [5, 5],
            borderWidth: 2,
            pointStyle: 'line' as const,
            fill: false
          },
          {
            label: 'Vigorous (300min/week)',
            data: Array(90).fill(300/7),
            borderColor: colors.vigorous,
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
              color: colors.axis,
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
              color: colors.axis,
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
                borderColor: colors.target,
                borderWidth: 2,
                borderDash: [6, 6],
                drawTime: 'beforeDatasetsDraw' as const,
                label: {
                  display: true,
                  content: 'Today',
                  position: 'center' as const,
                  backgroundColor: 'transparent',
                  color: colors.target,
                  font: {
                    size: 11
                  },
                  padding: 4
                }
              }
            }
          },
          tooltip: {
            enabled: false,
            external: externalTooltipHandler,
            position: 'nearest' as const,
          },
          legend: {
            position: 'top' as const,
            labels: {
              color: colors.axis,
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

    chart = new ChartJS(ctx, config);
  }

  function getOrCreateTooltip(chart: ChartType) {
    const parent = chart.canvas.parentNode;
    if (!parent) return null;

    let tooltipEl = parent.querySelector('div');
    
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.style.background = $theme === 'dark' ? '#1c1c1c' : '#ffffff';
      tooltipEl.style.borderRadius = '6px';
      tooltipEl.style.color = $theme === 'dark' ? '#ffffff' : '#000000';
      tooltipEl.style.border = `1px solid ${$theme === 'dark' ? '#333333' : '#e5e5e5'}`;
      tooltipEl.style.opacity = '0';
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.transform = 'translate(-50%, 0)';
      tooltipEl.style.transition = 'all .1s ease';
      tooltipEl.style.zIndex = '100';
      parent.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function externalTooltipHandler(context: { chart: ChartType; tooltip: TooltipModel<'line'> }) {
    const { chart, tooltip } = context;
    const tooltipEl = getOrCreateTooltip(chart);
    if (!tooltipEl) return;

    // Hide if no tooltip
    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = '0';
      return;
    }

    // Set Text
    if (tooltip.body) {
      const titleLines = tooltip.title || [];
      const workoutItem = tooltip.dataPoints.find(item => item.datasetIndex === 1);
      
      let innerHTML = `<div style="padding: 8px;">`;
      
      if (workoutItem) {
        const { actualMinutes, targetMinutes } = generateData(parseISO(startDate));
        const dayData = actualMinutes[workoutItem.dataIndex];
        const targetForDay = targetMinutes[workoutItem.dataIndex];
        // Parse startDate properly and calculate current date
        const startDateObj = parseISO(startDate);
        const currentDate = new Date(startDateObj);
        currentDate.setDate(startDateObj.getDate() + workoutItem.dataIndex);

        // Format date as "Thu, 12/26"
        const formattedDate = format(currentDate, 'EEE, MM/dd');

        // Calculate challenge progress
        const dayOfChallenge = differenceInDays(currentDate, startDateObj) + 1;
        const weekOfChallenge = Math.ceil(dayOfChallenge / 7);
        const monthOfChallenge = Math.ceil(dayOfChallenge / 30);

        // Add header with formatted date
        innerHTML += `
          <div style="font-weight: 600; font-size: 1.1em; margin-bottom: 4px;">
            ${formattedDate}
          </div>
          <div style="color: var(--muted-foreground); font-size: 0.9em; margin-bottom: 8px;">
            Day ${dayOfChallenge} • Week ${weekOfChallenge} • Month ${monthOfChallenge}
          </div>
        `;

        if (dayData && dayData.workouts.length > 0) {
          const isTargetMet = dayData.total >= targetForDay;
          const maxMinutes = Math.max(dayData.total, targetForDay);
          
          // Add target and total with divider
          innerHTML += `
            <div style="border-top: 1px solid var(--border); padding-top: 8px; margin-bottom: 8px;">
              <div style="margin-bottom: 8px;">
                <div style="margin-bottom: 4px;">Target: ${Math.round(targetForDay)}m</div>
                <div style="width: 100%; height: 2px; background: ${$theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};">
                  <div style="width: ${targetForDay === maxMinutes ? 100 : (targetForDay / maxMinutes) * 100}%; height: 100%; background: ${$theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};"></div>
                </div>
              </div>
              <div style="margin-bottom: 8px;">
                <div style="margin-bottom: 4px;">Total: ${Math.round(dayData.total)}m${isTargetMet ? ' ✓' : ''}</div>
                <div style="width: 100%; height: 2px; background: ${$theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};">
                  <div style="width: ${dayData.total === maxMinutes ? 100 : (dayData.total / maxMinutes) * 100}%; height: 100%; background: ${isTargetMet ? ($theme === 'dark' ? '#4ade80' : '#22c55e') : ($theme === 'dark' ? '#f87171' : '#ef4444')};"></div>
                </div>
              </div>
            </div>
          `;

          // Add workouts section with divider
          if (dayData.workouts.length > 0) {
            innerHTML += `<div style="border-top: 1px solid var(--border); padding-top: 8px;">`;
            dayData.workouts.forEach(workout => {
              const type = $workoutTypes.find(t => t.id === workout.type);
              if (type) {
                const workoutPercentage = (workout.duration / maxMinutes) * 100;
                innerHTML += `
                  <div style="margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${type.color};"></div>
                      <span>${type.name}: ${Math.round(workout.duration)}m</span>
                    </div>
                    <div style="width: 100%; height: 2px; background: ${$theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};">
                      <div style="width: ${workout.duration === maxMinutes ? 100 : workoutPercentage}%; height: 100%; background-color: ${type.color};"></div>
                    </div>
                  </div>
                `;
              }
            });
            innerHTML += `</div>`;
          }
        }
      }

      innerHTML += '</div>';
      tooltipEl.innerHTML = innerHTML;
    }

    const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
    const tooltipWidth = tooltipEl.offsetWidth;

    // Display, position, and set styles for font
    tooltipEl.style.opacity = '1';
    tooltipEl.style.left = positionX + tooltip.caretX + 'px';
    tooltipEl.style.top = positionY + tooltip.caretY + 'px';
    tooltipEl.style.padding = '0';
    tooltipEl.style.transform = `translate(${-tooltipWidth / 2}px, 10px)`;
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