import { writable } from 'svelte/store';
import { userPreferences } from './userPreferencesStore';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorageHelpers';
import { generateWorkoutSchedule } from '../utils/sigmoidal';
import { ValidationError, logError } from '../utils/errorHandling';
import { saveWorkout, getWorkouts, supabase } from '../services/supabase';
import { authStore } from './authStore';

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

  // Subscribe to real-time changes
  let subscription;
  
  authStore.subscribe(({ user }) => {
    if (user) {
      subscription = supabase
        .channel('workouts')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'workouts' },
          async (payload) => {
            if (payload.new.user_id === user.id) {
              store.update(schedule => {
                const updatedSchedule = schedule.map(day => {
                  if (day.date.toDateString() === new Date(payload.new.date).toDateString()) {
                    return {
                      ...day,
                      completed: true,
                      workouts: [...day.workouts, {
                        duration: payload.new.duration,
                        timestamp: payload.new.created_at
                      }]
                    };
                  }
                  return day;
                });
                saveToLocalStorage('workoutSchedule', updatedSchedule);
                return updatedSchedule;
              });
            }
          }
        )
        .subscribe();
    } else if (subscription) {
      subscription.unsubscribe();
    }
  });

  return {
    subscribe: store.subscribe,
    
    initialize: async () => {
      try {
        // First, generate the schedule based on preferences
        const unsubscribe = userPreferences.subscribe(prefs => {
          console.log('Generating schedule with preferences:', prefs);
          const schedule = generateWorkoutSchedule(
            prefs.startDate,
            prefs.daysPerWeek
          );
          store.set(schedule);
          saveToLocalStorage('workoutSchedule', schedule);
        });

        // Then, fetch completed workouts from Supabase and merge them
        const user = await supabase.auth.getUser();
        console.log('Current user:', user.data.user);
        
        if (user.data.user) {
          const workouts = await getWorkouts();
          console.log('Fetched workouts:', workouts);
          
          store.update(schedule => {
            const updatedSchedule = schedule.map(day => {
              const dayWorkouts = workouts.filter(w => 
                new Date(w.date).toDateString() === new Date(day.date).toDateString()
              );
              
              if (dayWorkouts.length > 0) {
                return {
                  ...day,
                  completed: true,
                  workouts: dayWorkouts.map(w => ({
                    duration: w.duration,
                    timestamp: w.created_at
                  }))
                };
              }
              return day;
            });
            saveToLocalStorage('workoutSchedule', updatedSchedule);
            return updatedSchedule;
          });
        }

        return unsubscribe;
      } catch (error) {
        logError(error, 'Initializing schedule');
        throw error;
      }
    },

    logWorkout: async (date, duration) => {
      try {
        validateWorkout(date, duration);
        
        // Save to Supabase first
        await saveWorkout({
          date: date.toISOString(),
          duration
        });
        
        // Local state will be updated via the real-time subscription
      } catch (error) {
        logError(error, 'Logging workout');
        throw error;
      }
    }
  };
}

export const schedule = createScheduleStore();
