import { writable } from 'svelte/store';
import { supabase as productionSupabase } from '$lib/services/supabase';
import { browser } from '$app/environment';

let supabase = productionSupabase;

// In test environment, use the test-specific Supabase client
if (process.env.NODE_ENV === 'test') {
  const { supabase: testSupabase } = require('../tests/supabase.test');
  supabase = testSupabase;
}

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

  const getStoredPreferences = () => {
    if (browser) {
      const storedPrefs = localStorage.getItem('userPreferences');
      if (storedPrefs) {
        return JSON.parse(storedPrefs);
      }
    }
    return null;
  };

  return {
    subscribe,
    initialize: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('data')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching preferences:', error);
          const storedPrefs = getStoredPreferences();
          if (storedPrefs) {
            set(storedPrefs);
          }
          return;
        }

        if (data) {
          const preferences = transformFromDatabase(data.data as DatabasePreferences);
          set(preferences);
          if (browser) {
            localStorage.setItem('userPreferences', JSON.stringify(preferences));
          }
        } else {
          const dbPrefs = transformToDatabase(DEFAULT_PREFERENCES);
          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert([
              {
                user_id: user.id,
                data: dbPrefs
              }
            ]);

          if (insertError) {
            console.error('Error inserting default preferences:', insertError);
          } else {
            set(DEFAULT_PREFERENCES);
            if (browser) {
              localStorage.setItem('userPreferences', JSON.stringify(DEFAULT_PREFERENCES));
            }
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
          .select('data')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching current preferences:', fetchError);
          return;
        }

        const currentPreferences = currentData?.data ? 
          transformFromDatabase(currentData.data as DatabasePreferences) : 
          DEFAULT_PREFERENCES;
        
        const newPreferences = updater(currentPreferences);
        const dbPrefs = transformToDatabase(newPreferences);
        const { error: updateError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            data: dbPrefs
          });

        if (updateError) {
          console.error('Error updating preferences:', updateError);
          return;
        }

        set(newPreferences);
        if (browser) {
          localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
        }
      } catch (err) {
        console.error('Error in update:', err);
      }
    },
    reset: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const dbPrefs = transformToDatabase(DEFAULT_PREFERENCES);
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            data: dbPrefs
          });

        if (error) {
          console.error('Error resetting preferences:', error);
          return;
        }

        set(DEFAULT_PREFERENCES);
        if (browser) {
          localStorage.setItem('userPreferences', JSON.stringify(DEFAULT_PREFERENCES));
        }
      } catch (err) {
        console.error('Error in reset:', err);
      }
    }
  };
}

export const userPreferences = createUserPreferencesStore(); 