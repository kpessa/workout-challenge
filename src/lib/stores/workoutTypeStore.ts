import { writable, get, type Writable } from 'svelte/store';
import { getWorkoutTypes, saveWorkoutType, updateWorkoutType as updateWorkoutTypeInDB, deleteWorkoutType as deleteWorkoutTypeFromDB } from '$lib/services/firebase';
import type { WorkoutType } from '$lib/types';

function createWorkoutTypeStore() {
  const { subscribe, set, update }: Writable<WorkoutType[]> = writable([]);

  return {
    subscribe,
    initialize: async () => {
      try {
        const data = await getWorkoutTypes();

        // If no workout types exist, create a default one
        if (!data || data.length === 0) {
          const defaultType = {
            name: 'Exercise',
            color: '#4CAF50'
          };

          const newType = await saveWorkoutType(defaultType);
          set([newType]);
        } else {
          set(data);
        }
      } catch (error) {
        console.error('Error initializing workout types:', error);
      }
    },
    addWorkoutType: async (name: string, color: string) => {
      try {
        const data = await saveWorkoutType({ name, color });
        update(types => [...types, data]);
      } catch (error) {
        console.error('Error adding workout type:', error);
      }
    },
    updateWorkoutType: async (id: string, name: string, color: string) => {
      try {
        await updateWorkoutTypeInDB(id, { name, color });
        update(types => types.map(t => t.id === id ? { ...t, name, color } : t));
      } catch (error) {
        console.error('Error updating workout type:', error);
        throw error;
      }
    },
    deleteWorkoutType: async (id: string) => {
      // Don't allow deleting if it's the last workout type
      const currentTypes = get(workoutTypes);
      if (currentTypes.length <= 1) {
        console.warn('Cannot delete the last workout type');
        return;
      }

      try {
        await deleteWorkoutTypeFromDB(id);
        update(types => types.filter(t => t.id !== id));
      } catch (error) {
        console.error('Error deleting workout type:', error);
      }
    }
  };
}

export const workoutTypes = createWorkoutTypeStore(); 