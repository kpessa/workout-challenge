import { writable } from 'svelte/store';
import { supabase } from './supabase.test';

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
          return;
        }

        if (data) {
          const preferences = data.data as UserPreferences;
          set(preferences);
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
      } catch (err) {
        console.error('Error in reset:', err);
      }
    }
  };
}

export const userPreferences = createUserPreferencesStore(); 