import type { WorkoutDay, ViewMode, FocusableChartElement, ProcessedWorkout } from '$lib/types/chart';
import type { WorkoutType } from '$lib/types';

/**
 * Accessibility utilities for chart components
 * Provides keyboard navigation, screen reader support, and data table alternatives
 */

/**
 * Generates accessible chart description for screen readers
 */
export function generateChartDescription(
  dailyWorkouts: WorkoutDay[],
  viewMode: ViewMode,
  currentPage: number
): string {
  const totalDays = dailyWorkouts.length;
  const completedDays = dailyWorkouts.filter(d => d.completed).length;
  const proposedDays = dailyWorkouts.filter(d => d.proposed > 0).length;
  const totalMinutes = dailyWorkouts.reduce((sum, d) => sum + d.total, 0);
  
  const period = viewMode === 'week' ? 'week' : 'month';
  const pageDescription = viewMode === 'week' 
    ? `Week ${currentPage + 1}` 
    : `Month ${currentPage + 1}`;
  
  return `Workout progress chart for ${pageDescription}. ` +
    `Showing ${totalDays} days with ${completedDays} completed workouts ` +
    `and ${proposedDays} proposed workouts. ` +
    `Total workout time: ${totalMinutes} minutes. ` +
    `Use arrow keys to navigate between chart elements, ` +
    `Enter to select, and Escape to exit navigation mode.`;
}

/**
 * Generates accessible label for workout bars
 */
export function generateWorkoutBarLabel(
  workout: ProcessedWorkout,
  workoutTypesData: WorkoutType[],
  dayData: WorkoutDay,
  isStacked: boolean = false
): string {
  const workoutType = workoutTypesData.find(t => t.id === workout.workout_type_id);
  const typeName = workoutType?.name || 'Unknown';
  const stackInfo = isStacked ? ` (part of ${dayData.workouts.length} workouts)` : '';
  
  return `${typeName} workout on ${dayData.date.toLocaleDateString()}, ` +
    `${workout.duration} minutes${stackInfo}. ` +
    `Press Enter to edit, Delete to remove.`;
}

/**
 * Generates accessible label for proposed workout bars
 */
export function generateProposedBarLabel(dayData: WorkoutDay): string {
  return `Proposed workout on ${dayData.date.toLocaleDateString()}, ` +
    `${dayData.proposed} minutes. ` +
    `Press Enter to log this workout.`;
}

/**
 * Generates accessible label for date areas
 */
export function generateDateLabel(dayData: WorkoutDay): string {
  const hasWorkouts = dayData.workouts.length > 0;
  const hasProposed = dayData.proposed > 0;
  
  let label = `${dayData.date.toLocaleDateString()}`;
  
  if (hasWorkouts) {
    label += `, ${dayData.workouts.length} completed workout${dayData.workouts.length > 1 ? 's' : ''}, ${dayData.total} minutes total`;
  }
  
  if (hasProposed) {
    label += `, ${dayData.proposed} minutes proposed`;
  }
  
  if (!hasWorkouts && !hasProposed) {
    label += ', no workouts';
  }
  
  label += '. Press Enter to add workout.';
  
  return label;
}

/**
 * Creates keyboard navigation handler for chart elements
 */
export function createKeyboardNavigationHandler(
  chartContainer: HTMLElement,
  dailyWorkouts: WorkoutDay[],
  workoutTypesData: WorkoutType[],
  onElementSelect: (element: FocusableChartElement) => void,
  onAnnouncement: (message: string) => void
) {
  let focusedElementIndex = -1;
  let focusableElements: FocusableChartElement[] = [];
  let isNavigationActive = false;

  // Build focusable elements list
  function buildFocusableElements() {
    focusableElements = [];
    
    dailyWorkouts.forEach((dayData) => {
      // Add completed workout bars
      dayData.workouts.forEach((workout) => {
        const element = chartContainer.querySelector(
          `[data-workout-id="${workout.id}"]`
        );
        if (element) {
          focusableElements.push({
            type: 'bar',
            date: dayData.date.toISOString(),
            workoutId: workout.id,
            data: { dayData, workout },
            element
          });
        }
      });

      // Add proposed workout bars
      if (dayData.proposed > 0) {
        const element = chartContainer.querySelector(
          `[data-proposed-date="${dayData.date.toISOString()}"]`
        );
        if (element) {
          focusableElements.push({
            type: 'proposed',
            date: dayData.date.toISOString(),
            data: { dayData },
            element
          });
        }
      }

      // Add date click areas
      const dateElement = chartContainer.querySelector(
        `[data-date="${dayData.date.toISOString()}"]`
      );
      if (dateElement) {
        focusableElements.push({
          type: 'date',
          date: dayData.date.toISOString(),
          data: { dayData },
          element: dateElement
        });
      }
    });
  }

  // Focus element and update visual indicator
  function focusElement(index: number) {
    if (index < 0 || index >= focusableElements.length) return;

    // Remove previous focus
    chartContainer.querySelectorAll('.chart-element-focused').forEach(el => {
      el.classList.remove('chart-element-focused');
      el.removeAttribute('aria-selected');
    });

    // Add focus to current element
    const currentElement = focusableElements[index];
    currentElement.element.classList.add('chart-element-focused');
    currentElement.element.setAttribute('aria-selected', 'true');
    
    // Announce element
    let announcement = '';
    switch (currentElement.type) {
      case 'bar':
        announcement = generateWorkoutBarLabel(
          currentElement.data.workout,
          workoutTypesData,
          currentElement.data.dayData,
          currentElement.data.dayData.workouts.length > 1
        );
        break;
      case 'proposed':
        announcement = generateProposedBarLabel(currentElement.data.dayData);
        break;
      case 'date':
        announcement = generateDateLabel(currentElement.data.dayData);
        break;
    }
    
    onAnnouncement(announcement);
    focusedElementIndex = index;
  }

  // Keyboard event handler
  function handleKeyDown(event: KeyboardEvent) {
    if (!isNavigationActive) {
      // Enter navigation mode with Tab or arrow keys
      if (event.key === 'Tab' || event.key.startsWith('Arrow')) {
        event.preventDefault();
        isNavigationActive = true;
        buildFocusableElements();
        if (focusableElements.length > 0) {
          focusElement(0);
          onAnnouncement('Chart navigation activated. Use arrow keys to navigate, Enter to select, Escape to exit.');
        }
        return;
      }
      return;
    }

    // Handle navigation keys
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        if (focusedElementIndex < focusableElements.length - 1) {
          focusElement(focusedElementIndex + 1);
        } else {
          onAnnouncement('End of chart reached');
        }
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        if (focusedElementIndex > 0) {
          focusElement(focusedElementIndex - 1);
        } else {
          onAnnouncement('Beginning of chart reached');
        }
        break;

      case 'Home':
        event.preventDefault();
        if (focusableElements.length > 0) {
          focusElement(0);
        }
        break;

      case 'End':
        event.preventDefault();
        if (focusableElements.length > 0) {
          focusElement(focusableElements.length - 1);
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedElementIndex >= 0 && focusedElementIndex < focusableElements.length) {
          onElementSelect(focusableElements[focusedElementIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        isNavigationActive = false;
        focusedElementIndex = -1;
        chartContainer.querySelectorAll('.chart-element-focused').forEach(el => {
          el.classList.remove('chart-element-focused');
          el.removeAttribute('aria-selected');
        });
        onAnnouncement('Chart navigation deactivated');
        break;

      default:
        break;
    }
  }

  // Set up event listeners
  chartContainer.addEventListener('keydown', handleKeyDown);
  chartContainer.setAttribute('tabindex', '0');
  chartContainer.setAttribute('role', 'application');
  chartContainer.setAttribute('aria-label', 'Workout progress chart. Press Tab to begin navigation.');

  // Return cleanup function
  return () => {
    chartContainer.removeEventListener('keydown', handleKeyDown);
    chartContainer.removeAttribute('tabindex');
    chartContainer.removeAttribute('role');
    chartContainer.removeAttribute('aria-label');
  };
}

/**
 * Generates data table HTML for screen readers
 */
export function generateDataTableHTML(
  dailyWorkouts: WorkoutDay[],
  workoutTypesData: WorkoutType[],
  viewMode: ViewMode
): string {
  const headers = ['Date', 'Day', 'Workouts', 'Total Minutes', 'Proposed Minutes'];
  
  let tableHTML = '<table class="sr-only" aria-label="Workout data table">\n';
  tableHTML += '  <thead>\n    <tr>\n';
  
  headers.forEach(header => {
    tableHTML += `      <th scope="col">${header}</th>\n`;
  });
  
  tableHTML += '    </tr>\n  </thead>\n  <tbody>\n';

  dailyWorkouts.forEach((dayData, index) => {
    const dateStr = dayData.date.toLocaleDateString();
    const dayOfWeek = dayData.date.toLocaleDateString('en-US', { weekday: 'long' });
    
    let workoutsText = 'None';
    if (dayData.workouts.length > 0) {
      const workoutDetails = dayData.workouts.map(workout => {
        const type = workoutTypesData.find(t => t.id === workout.workout_type_id);
        return `${type?.name || 'Unknown'}: ${workout.duration}min`;
      }).join(', ');
      workoutsText = workoutDetails;
    }

    tableHTML += '    <tr>\n';
    tableHTML += `      <td>${dateStr} (${dayOfWeek})</td>\n`;
    tableHTML += `      <td>Day ${dayData.day}</td>\n`;
    tableHTML += `      <td>${workoutsText}</td>\n`;
    tableHTML += `      <td>${dayData.total}</td>\n`;
    tableHTML += `      <td>${dayData.proposed || 'None'}</td>\n`;
    tableHTML += '    </tr>\n';
  });

  tableHTML += '  </tbody>\n</table>';
  
  return tableHTML;
}

/**
 * Creates live region for announcements
 */
export function createLiveRegion(container: HTMLElement): {
  announce: (message: string) => void;
  cleanup: () => void;
} {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.id = 'chart-live-region';
  
  container.appendChild(liveRegion);

  let announcementTimeout: ReturnType<typeof setTimeout>;

  const announce = (message: string) => {
    // Clear previous timeout
    if (announcementTimeout) {
      clearTimeout(announcementTimeout);
    }

    // Clear and set new message
    liveRegion.textContent = '';
    
    // Use setTimeout to ensure screen readers pick up the change
    announcementTimeout = setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
  };

  const cleanup = () => {
    if (announcementTimeout) {
      clearTimeout(announcementTimeout);
    }
    if (liveRegion.parentNode) {
      liveRegion.parentNode.removeChild(liveRegion);
    }
  };

  return { announce, cleanup };
}

/**
 * Updates chart elements with accessibility attributes
 */
export function updateChartAccessibility(
  chartContainer: HTMLElement,
  dailyWorkouts: WorkoutDay[],
  workoutTypesData: WorkoutType[]
) {
  // Add data attributes and labels to workout bars
  dailyWorkouts.forEach((dayData) => {
    // Update completed workout bars
    dayData.workouts.forEach((workout, workoutIndex) => {
      const barElement = chartContainer.querySelector(
        `[data-workout-id="${workout.id}"]`
      ) as HTMLElement;
      
      if (barElement) {
        barElement.setAttribute('role', 'button');
        barElement.setAttribute('tabindex', '-1');
        barElement.setAttribute('aria-label', 
          generateWorkoutBarLabel(workout, workoutTypesData, dayData, dayData.workouts.length > 1)
        );
        barElement.setAttribute('data-date', dayData.date.toISOString());
        barElement.setAttribute('data-workout-index', workoutIndex.toString());
      }
    });

    // Update proposed workout bars
    if (dayData.proposed > 0) {
      const proposedElement = chartContainer.querySelector(
        `[data-proposed-date="${dayData.date.toISOString()}"]`
      ) as HTMLElement;
      
      if (proposedElement) {
        proposedElement.setAttribute('role', 'button');
        proposedElement.setAttribute('tabindex', '-1');
        proposedElement.setAttribute('aria-label', generateProposedBarLabel(dayData));
      }
    }

    // Update date click areas
    const dateElement = chartContainer.querySelector(
      `[data-date="${dayData.date.toISOString()}"]`
    ) as HTMLElement;
    
    if (dateElement) {
      dateElement.setAttribute('role', 'button');
      dateElement.setAttribute('tabindex', '-1');
      dateElement.setAttribute('aria-label', generateDateLabel(dayData));
    }
  });
}