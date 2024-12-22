import { writable, type Writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { Workout } from '$lib/types';

function createScheduleStore() {
  const { subscribe, set, update }: Writable<Workout[]> = writable([]);

  return {
    subscribe,
    initialize: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching workouts:', error);
        return;
      }

      set(data || []);
    },
    addWorkout: async (date: string, duration: number) => {
      const { data, error } = await supabase
        .from('workouts')
        .insert([{ date, duration }])
        .select()
        .single();

      if (error) {
        console.error('Error adding workout:', error);
        return;
      }

      update(workouts => [...workouts, data]);
    },
    updateWorkout: async (date: string, duration: number, id: string) => {
      const { data, error } = await supabase
        .from('workouts')
        .update({ date, duration })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating workout:', error);
        return;
      }

      update(workouts => workouts.map(w => w.id === id ? data : w));
    },
    deleteWorkout: async (id: string) => {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting workout:', error);
        return;
      }

      update(workouts => workouts.filter(w => w.id !== id));
    },
    getStartDate: () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      return today.toISOString().split('T')[0];
    },
    getDuration: () => 90
  };
}

export const schedule = createScheduleStore(); 