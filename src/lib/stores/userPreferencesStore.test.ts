import { writable } from 'svelte/store';
import type { UserPreferences } from '$lib/types';
import { supabase } from '../services/supabase.test';

const DEFAULT_PREFERENCES: UserPreferences = {
  startDate: new Date().toISOString(),
  daysPerWeek: 3,
  sigmoidParams: {
    steepness: 0.1,
    midpoint: 45,
    minDuration: 15,
    maxDuration: 60
  }
};

function createUserPreferencesStore() {
  const { subscribe, set, update } = writable<UserPreferences>(DEFAULT_PREFERENCES);

  return {
    subscribe,
    initialize: async () => {
      try {
        // First try to get from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: preferences } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (preferences) {
            set({
              ...DEFAULT_PREFERENCES,
              ...preferences.preferences
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    },
    set: async (value: UserPreferences) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              preferences: value
            })
            .select()
            .single();
        }
        set(value);
      } catch (error) {
        console.error('Error saving preferences:', error);
        throw error;
      }
    },
    update: async (updater: (preferences: UserPreferences) => UserPreferences) => {
      update(preferences => {
        const newPreferences = updater(preferences);
        return newPreferences;
      });

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const currentPrefs = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          const newPrefs = updater(currentPrefs?.data?.preferences || DEFAULT_PREFERENCES);
          
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              preferences: newPrefs
            })
            .select()
            .single();
        }
      } catch (error) {
        console.error('Error updating preferences:', error);
        throw error;
      }
    },
    reset: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_preferences')
            .delete()
            .eq('user_id', user.id);
        }
        set(DEFAULT_PREFERENCES);
      } catch (error) {
        console.error('Error resetting preferences:', error);
        throw error;
      }
    }
  };
}

export const userPreferences = createUserPreferencesStore(); 