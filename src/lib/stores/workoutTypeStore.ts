import { writable, get, type Writable } from 'svelte/store';
import { supabase } from '$lib/services/supabase';
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

      // If no workout types exist, create a default one
      if (!data || data.length === 0) {
        const defaultType = {
          name: 'Exercise',
          color: '#4CAF50',
          user_id: user.id
        };

        const { data: newType, error: insertError } = await supabase
          .from('workout_types')
          .insert([defaultType])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default workout type:', insertError);
          return;
        }

        set([newType]);
      } else {
        set(data);
      }
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
      // Don't allow deleting if it's the last workout type
      const currentTypes = get(workoutTypes);
      if (currentTypes.length <= 1) {
        console.warn('Cannot delete the last workout type');
        return;
      }

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