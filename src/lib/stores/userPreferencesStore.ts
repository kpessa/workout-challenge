import { writable } from 'svelte/store';
import { getUserPreferences, saveUserPreferences } from '$lib/services/firebase';

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
      try {
        const data = await getUserPreferences();
        
        if (data) {
          const preferences = transformFromDatabase(data as DatabasePreferences);
          set(preferences);
        } else {
          const dbPrefs = transformToDatabase(DEFAULT_PREFERENCES);
          await saveUserPreferences(dbPrefs);
          set(DEFAULT_PREFERENCES);
        }
      } catch (err) {
        console.error('Error in initialize:', err);
      }
    },
    update: async (updater: (preferences: UserPreferences) => UserPreferences) => {
      try {
        const currentData = await getUserPreferences();
        const currentPreferences = currentData ? 
          transformFromDatabase(currentData as DatabasePreferences) : 
          DEFAULT_PREFERENCES;
        
        const newPreferences = updater(currentPreferences);
        const dbPrefs = transformToDatabase(newPreferences);

        await saveUserPreferences(dbPrefs);
        set(newPreferences);
      } catch (err) {
        console.error('Error in update:', err);
        throw err;
      }
    },
    reset: async () => {
      try {
        const dbPrefs = transformToDatabase(DEFAULT_PREFERENCES);
        await saveUserPreferences(dbPrefs);
        set(DEFAULT_PREFERENCES);
      } catch (err) {
        console.error('Error in reset:', err);
        throw err;
      }
    }
  };
}

export const userPreferences = createUserPreferencesStore(); 