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
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface UserPreferences {
  startDate: string;
  daysPerWeek: number;
  sigmoidParams: SigmoidParams;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  startDate: new Date().toISOString(),
  daysPerWeek: 3,
  sigmoidParams: {
    a: 1,
    b: 0.5,
    c: 5,
    d: 1
  }
};

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
        // First try to get preferences from Supabase
        const { data, error } = await supabase
          .from('user_preferences')
          .select('data')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching preferences:', error);
          // If there's an error and we're in the browser, try localStorage
          const storedPrefs = getStoredPreferences();
          if (storedPrefs) {
            set(storedPrefs);
          }
          return;
        }

        if (data) {
          const preferences = data.data as UserPreferences;
          set(preferences);
          if (browser) {
            localStorage.setItem('userPreferences', JSON.stringify(preferences));
          }
        } else {
          // If no preferences found, set defaults
          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert([
              {
                user_id: user.id,
                data: DEFAULT_PREFERENCES
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
    set: async (preferences: UserPreferences) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            data: preferences
          });

        if (error) {
          console.error('Error saving preferences:', error);
          return;
        }

        set(preferences);
        if (browser) {
          localStorage.setItem('userPreferences', JSON.stringify(preferences));
        }
      } catch (err) {
        console.error('Error in set:', err);
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

        const currentPreferences = currentData?.data as UserPreferences || DEFAULT_PREFERENCES;
        const newPreferences = updater(currentPreferences);

        const { error: updateError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            data: newPreferences
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
        const { error } = await supabase
          .from('user_preferences')
          .delete()
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting preferences:', error);
          return;
        }

        set(DEFAULT_PREFERENCES);
        if (browser) {
          localStorage.removeItem('userPreferences');
        }
      } catch (err) {
        console.error('Error in reset:', err);
      }
    }
  };
}

export const userPreferences = createUserPreferencesStore(); 