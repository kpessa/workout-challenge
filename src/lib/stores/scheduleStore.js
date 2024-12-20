import { writable } from 'svelte/store';
import { userPreferences } from './userPreferencesStore';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorageHelpers';
import { generateWorkoutSchedule } from '../utils/sigmoidal';
import { ValidationError, logError } from '../utils/errorHandling';

function validateWorkout(date, duration) {
  if (isNaN(new Date(date).getTime())) {
    throw new ValidationError('Invalid workout date');
  }
  
  if (duration <= 0 || duration > 240) {
    throw new ValidationError('Workout duration must be between 1 and 240 minutes');
  }
}

function createScheduleStore() {
  let stored;
  try {
    stored = loadFromLocalStorage('workoutSchedule');
  } catch (error) {
    logError(error, 'Loading workout schedule');
    stored = [];
  }

  const store = writable(stored || []);

  return {
    subscribe: store.subscribe,
    
    initialize: () => {
      try {
        return userPreferences.subscribe(prefs => {
          const schedule = generateWorkoutSchedule(
            prefs.startDate,
            prefs.daysPerWeek
          );
          store.set(schedule);
          saveToLocalStorage('workoutSchedule', schedule);
        });
      } catch (error) {
        logError(error, 'Initializing schedule');
        throw error;
      }
    },

    logWorkout: (date, duration) => {
      try {
        validateWorkout(date, duration);
        
        store.update(schedule => {
          const updatedSchedule = schedule.map(day => {
            if (day.date.toDateString() === date.toDateString()) {
              return {
                ...day,
                completed: true,
                workouts: [...day.workouts, { duration, timestamp: new Date() }]
              };
            }
            return day;
          });
          saveToLocalStorage('workoutSchedule', updatedSchedule);
          return updatedSchedule;
        });
      } catch (error) {
        logError(error, 'Logging workout');
        throw error;
      }
    }
  };
}

export const schedule = createScheduleStore();
