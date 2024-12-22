import { writable, type Writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { WorkoutType } from '$lib/types';

function createWorkoutTypeStore() {
  const { subscribe, set, update }: Writable<WorkoutType[]> = writable([]);

  return {
    subscribe,
    initialize: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      const { data, error } = await supabase
        .from('workout_types')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching workout types:', error);
        return;
      }

      set(data || []);
    },
    addWorkoutType: async (name: string, color: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('workout_types')
        .insert([{ name, color, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error adding workout type:', error);
        return;
      }

      update(types => [...types, data]);
    },
    updateWorkoutType: async (id: string, name: string, color: string) => {
      const { data, error } = await supabase
        .from('workout_types')
        .update({ name, color })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating workout type:', error);
        return;
      }

      update(types => types.map(t => t.id === id ? data : t));
    },
    deleteWorkoutType: async (id: string) => {
      const { error } = await supabase
        .from('workout_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting workout type:', error);
        return;
      }

      update(types => types.filter(t => t.id !== id));
    }
  };
}

export const workoutTypes = createWorkoutTypeStore(); 