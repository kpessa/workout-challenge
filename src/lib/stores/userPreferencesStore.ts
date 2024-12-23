import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { UserPreferences } from '$lib/types';

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
    initialize: () => {
      if (browser) {
        try {
          const stored = localStorage.getItem('userPreferences');
          if (stored) {
            const parsed = JSON.parse(stored);
            set({
              ...DEFAULT_PREFERENCES,
              ...parsed
            });
          }
        } catch (error) {
          console.error('Error loading from localStorage (userPreferences):', error);
        }
      }
    },
    set: (value: UserPreferences) => {
      if (browser) {
        localStorage.setItem('userPreferences', JSON.stringify(value));
      }
      set(value);
    },
    update: (updater: (preferences: UserPreferences) => UserPreferences) => {
      update(preferences => {
        const newPreferences = updater(preferences);
        if (browser) {
          localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
        }
        return newPreferences;
      });
    },
    reset: () => {
      if (browser) {
        localStorage.removeItem('userPreferences');
      }
      set(DEFAULT_PREFERENCES);
    }
  };
}

export const userPreferences = createUserPreferencesStore(); 