import { writable } from 'svelte/store';
import { userPreferences } from './userPreferencesStore';
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
  const store = writable([]);

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
              // Add the new workout to the store
              store.update(workouts => [...workouts, {
                date: payload.new.date,
                duration: payload.new.duration,
                created_at: payload.new.created_at
              }]);
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
        const user = await supabase.auth.getUser();
        console.log('Current user:', user.data.user);
        
        if (user.data.user) {
          const workouts = await getWorkouts();
          console.log('Fetched workouts from database:', workouts);
          
          // Simply set the store to the fetched workouts
          store.set(workouts);
        }
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
