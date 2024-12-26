import { writable } from 'svelte/store';
import { supabase } from '$lib/services/supabase';

export interface SigmoidParams {
  steepness: number;
  midpoint: number;
  minDuration: number;
  maxDuration: number;
}

export interface UserPreferences {
  daysPerWeek: number;
  startDate: string;
  sigmoid: SigmoidParams;
}

// Database format
interface DatabasePreferences {
  startDate: string;
  daysPerWeek: string | number;
  sigmoidParams: {
    steepness: number;
    midpoint: number;
    minDuration: string | number;
    maxDuration: string | number;
  };
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  daysPerWeek: 3,
  startDate: new Date().toISOString().split('T')[0],
  sigmoid: {
    steepness: 0.1,
    midpoint: 30,
    minDuration: 30,
    maxDuration: 60
  }
};

function transformFromDatabase(dbPrefs: DatabasePreferences): UserPreferences {
  return {
    daysPerWeek: Number(dbPrefs.daysPerWeek),
    startDate: dbPrefs.startDate || DEFAULT_PREFERENCES.startDate,
    sigmoid: {
      steepness: dbPrefs.sigmoidParams.steepness,
      midpoint: dbPrefs.sigmoidParams.midpoint,
      minDuration: Number(dbPrefs.sigmoidParams.minDuration),
      maxDuration: Number(dbPrefs.sigmoidParams.maxDuration)
    }
  };
}

function transformToDatabase(prefs: UserPreferences): DatabasePreferences {
  return {
    startDate: prefs.startDate,
    daysPerWeek: prefs.daysPerWeek,
    sigmoidParams: {
      steepness: prefs.sigmoid.steepness,
      midpoint: prefs.sigmoid.midpoint,
      minDuration: prefs.sigmoid.minDuration,
      maxDuration: prefs.sigmoid.maxDuration
    }
  };
}

function createUserPreferencesStore() {
  const { subscribe, set, update } = writable<UserPreferences>(DEFAULT_PREFERENCES);

  return {
    subscribe,
    initialize: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching preferences:', error);
          return;
        }

        if (data) {
          const preferences = transformFromDatabase(data.data as DatabasePreferences);
          set(preferences);
        } else {
          const dbPrefs = transformToDatabase(DEFAULT_PREFERENCES);
          const { error: upsertError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              data: dbPrefs
            })
            .select();

          if (upsertError) {
            console.error('Error inserting default preferences:', upsertError);
          } else {
            set(DEFAULT_PREFERENCES);
          }
        }
      } catch (err) {
        console.error('Error in initialize:', err);
      }
    },
    update: async (updater: (preferences: UserPreferences) => UserPreferences) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { data: currentData, error: fetchError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching current preferences:', fetchError);
          throw fetchError;
        }

        const currentPreferences = currentData?.data ? 
          transformFromDatabase(currentData.data as DatabasePreferences) : 
          DEFAULT_PREFERENCES;
        
        const newPreferences = updater(currentPreferences);
        const dbPrefs = transformToDatabase(newPreferences);

        let result;
        if (currentData) {
          // Update existing record
          result = await supabase
            .from('user_preferences')
            .update({ data: dbPrefs })
            .eq('user_id', user.id)
            .select();
        } else {
          // Insert new record
          result = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              data: dbPrefs
            })
            .select();
        }

        if (result.error) {
          console.error('Error updating preferences:', result.error);
          throw result.error;
        }

        set(newPreferences);
      } catch (err) {
        console.error('Error in update:', err);
        throw err;
      }
    },
    reset: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const dbPrefs = transformToDatabase(DEFAULT_PREFERENCES);
        const { error } = await supabase
          .from('user_preferences')
          .update({ data: dbPrefs })
          .eq('user_id', user.id)
          .select();

        if (error) {
          console.error('Error resetting preferences:', error);
          throw error;
        }

        set(DEFAULT_PREFERENCES);
      } catch (err) {
        console.error('Error in reset:', err);
        throw err;
      }
    }
  };
}

export const userPreferences = createUserPreferencesStore(); 