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
    const data = await saveWorkout({ 
      date, 
      duration, 
      type: workout_type_id || 'default'
    });

    workouts.update(w => [data, ...w]);
    return data;
  } catch (error) {
    throw error;
  }
}

async function updateWorkout(id: string, date: string, duration: number, workout_type_id?: string) {
  try {
    await updateWorkoutInDB(id, { 
      date, 
      duration, 
      type: workout_type_id 
    });

    workouts.update(w => w.map(workout => 
      workout.id === id ? { ...workout, date, duration, type: workout_type_id } : workout
    ));
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
}

async function deleteWorkout(id: string) {
  try {
    await deleteWorkoutFromDB(id);
    workouts.update(w => w.filter(workout => workout.id !== id));
  } catch (error) {
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