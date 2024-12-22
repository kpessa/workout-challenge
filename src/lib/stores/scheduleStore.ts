import { writable, type Writable } from 'svelte/store';
import { supabase } from '$lib/services/supabase';
import type { Workout } from '$lib/types';
import { authStore } from '$lib/stores/authStore';

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateWorkout(date: string | Date, duration: number) {
  if (isNaN(new Date(date).getTime())) {
    throw new ValidationError('Invalid workout date');
  }
  
  if (duration <= 0 || duration > 240) {
    throw new ValidationError('Workout duration must be between 1 and 240 minutes');
  }
}

function logError(error: Error, context: string) {
  console.error(`Error in ${context}:`, error);
}

function createScheduleStore() {
  const { subscribe, set, update }: Writable<Workout[]> = writable([]);

  // Subscribe to real-time changes
  let subscription: ReturnType<typeof supabase.channel> | null = null;
  
  authStore.subscribe(({ user }) => {
    if (user) {
      subscription = supabase
        .channel('workouts')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'workouts' },
          async (payload) => {
            if (payload.new.user_id === user.id) {
              // Add the new workout to the store
              update(workouts => [...workouts, {
                id: payload.new.id,
                date: payload.new.date,
                duration: payload.new.duration,
                created_at: payload.new.created_at,
                user_id: payload.new.user_id
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
    subscribe,
    initialize: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user:', user);
        
        if (!user) {
          console.error('No authenticated user');
          set([]);
          return;
        }

        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (error) {
          throw error;
        }

        console.log('Fetched workouts from database:', data);
        set(data || []);
      } catch (error) {
        logError(error as Error, 'Initializing schedule');
        set([]);
      }
    },
    addWorkout: async (date: string, duration: number) => {
      try {
        validateWorkout(date, duration);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('No authenticated user');
        }

        const { data, error } = await supabase
          .from('workouts')
          .insert([{ date, duration, user_id: user.id }])
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Local state will be updated via the real-time subscription
        return data;
      } catch (error) {
        logError(error as Error, 'Adding workout');
        return null;
      }
    },
    updateWorkout: async (id: string, date: string, duration: number) => {
      try {
        validateWorkout(date, duration);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('No authenticated user');
        }

        const { data, error } = await supabase
          .from('workouts')
          .update({ date, duration })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        update(workouts => workouts.map(w => w.id === id ? data : w));
        return data;
      } catch (error) {
        logError(error as Error, 'Updating workout');
        return null;
      }
    },
    deleteWorkout: async (id: string) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('No authenticated user');
        }

        const { error } = await supabase
          .from('workouts')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        update(workouts => workouts.filter(w => w.id !== id));
        return true;
      } catch (error) {
        logError(error as Error, 'Deleting workout');
        return false;
      }
    }
  };
}

export const schedule = createScheduleStore(); 