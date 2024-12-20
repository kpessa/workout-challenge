import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveWorkout(workout) {
  const { data, error } = await supabase
    .from('workouts')
    .insert([{
      user_id: (await supabase.auth.getUser()).data.user?.id,
      date: workout.date,
      duration: workout.duration,
      created_at: new Date().toISOString()
    }]);

  if (error) throw error;
  return data;
}

export async function getWorkouts() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
} 