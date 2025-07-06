import { writable } from 'svelte/store';
import { getWorkouts, saveWorkout, updateWorkout as updateWorkoutInDB, deleteWorkout as deleteWorkoutFromDB } from '$lib/services/firebase';
import type { Workout } from '$lib/types';

const workouts = writable<Workout[]>([]);

async function initialize() {
  try {
    const data = await getWorkouts();
    workouts.set(data || []);
  } catch (error) {
    console.error('Error initializing workouts:', error);
    workouts.set([]);
  }
}

async function addWorkout(date: string, duration: number, workout_type_id?: string) {
  try {
    console.log('➕ Adding workout:', { date, duration, workout_type_id });
    const data = await saveWorkout({ 
      date, 
      duration, 
      type: workout_type_id || 'default'
    });

    workouts.update(w => [data, ...w]);
    console.log('✅ Workout added successfully:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error adding workout:', error);
    throw error;
  }
}

async function updateWorkout(id: string, date: string, duration: number, workout_type_id?: string) {
  try {
    console.log('🔄 Updating workout:', { id, date, duration, workout_type_id });
    await updateWorkoutInDB(id, { 
      date, 
      duration, 
      type: workout_type_id 
    });

    workouts.update(w => w.map(workout => 
      workout.id === id ? { ...workout, date, duration, type: workout_type_id } : workout
    ));
    console.log('✅ Workout updated successfully');
  } catch (error) {
    console.error('❌ Error updating workout:', error);
    throw error;
  }
}

async function deleteWorkout(id: string) {
  try {
    console.log('🗑️ Deleting workout:', id);
    await deleteWorkoutFromDB(id);
    workouts.update(w => w.filter(workout => workout.id !== id));
    console.log('✅ Workout deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting workout:', error);
    throw error;
  }
}

export const schedule = {
  subscribe: workouts.subscribe,
  initialize,
  addWorkout,
  updateWorkout,
  deleteWorkout
}; 