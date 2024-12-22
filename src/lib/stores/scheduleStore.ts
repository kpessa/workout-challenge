import { writable } from 'svelte/store';
import { supabase } from '$lib/services/supabase';
import type { Workout } from '$lib/types';

const workouts = writable<Workout[]>([]);

async function initialize() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) throw error;
    workouts.set(data || []);
  } catch (error) {
    workouts.set([]);
  }
}

async function addWorkout(date: string, duration: number, workout_type_id: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('workouts')
      .insert([
        { 
          date, 
          duration, 
          user_id: user.id,
          workout_type_id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    workouts.update(w => [data, ...w]);
    return data;
  } catch (error) {
    throw error;
  }
}

async function updateWorkout(id: string, date: string, duration: number, workout_type_id: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('workouts')
      .update({ date, duration, workout_type_id })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    workouts.update(w => w.map(workout => 
      workout.id === id ? data : workout
    ));
    return data;
  } catch (error) {
    throw error;
  }
}

async function deleteWorkout(id: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

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