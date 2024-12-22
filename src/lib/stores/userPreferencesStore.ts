import { writable, type Writable } from 'svelte/store';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorageHelpers';
import { ValidationError, logError } from '../utils/errorHandling';
import type { SigmoidParams, UserPreferences } from '$lib/types';

interface UserPreferencesStore {
  subscribe: Writable<UserPreferences>['subscribe'];
  setDaysPerWeek: (days: number) => void;
  setStartDate: (date: string) => void;
  updateSigmoidParams: (params: Partial<SigmoidParams>) => void;
  reset: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  daysPerWeek: 3,
  startDate: new Date().toISOString(),
  sigmoidParams: {
    startMinutes: 15,
    endMinutes: 90,
    steepness: 0.1,
    midpoint: 45
  }
};

function validatePreferences(prefs: UserPreferences): void {
  if (prefs.daysPerWeek < 1 || prefs.daysPerWeek > 7) {
    throw new ValidationError('Days per week must be between 1 and 7');
  }

  const { startMinutes, endMinutes, steepness, midpoint } = prefs.sigmoidParams;
  
  if (startMinutes < 1 || startMinutes > endMinutes) {
    throw new ValidationError('Invalid start minutes');
  }
  
  if (endMinutes > 240) {
    throw new ValidationError('End minutes cannot exceed 240');
  }
  
  if (steepness <= 0 || steepness > 1) {
    throw new ValidationError('Steepness must be between 0 and 1');
  }
  
  if (midpoint < 1 || midpoint > 90) {
    throw new ValidationError('Midpoint must be between 1 and 90');
  }
}

function createUserPreferencesStore(): UserPreferencesStore {
  let stored: UserPreferences | null = null;
  try {
    stored = loadFromLocalStorage('userPreferences');
    if (stored) {
      validatePreferences(stored);
    }
  } catch (error) {
    logError(error, 'Loading user preferences');
    stored = DEFAULT_PREFERENCES;
  }

  const store = writable<UserPreferences>(stored || DEFAULT_PREFERENCES);

  return {
    subscribe: store.subscribe,
    
    setDaysPerWeek: (days: number) => {
      try {
        store.update(prefs => {
          const newPrefs = { ...prefs, daysPerWeek: days };
          validatePreferences(newPrefs);
          saveToLocalStorage('userPreferences', newPrefs);
          return newPrefs;
        });
      } catch (error) {
        logError(error, 'Setting days per week');
        throw error;
      }
    },

    setStartDate: (date: string) => {
      try {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          throw new ValidationError('Invalid date format');
        }
        
        store.update(prefs => {
          const newPrefs = { ...prefs, startDate: date };
          saveToLocalStorage('userPreferences', newPrefs);
          return newPrefs;
        });
      } catch (error) {
        logError(error, 'Setting start date');
        throw error;
      }
    },

    updateSigmoidParams: (params: Partial<SigmoidParams>) => {
      try {
        store.update(prefs => {
          const newPrefs = {
            ...prefs,
            sigmoidParams: { ...prefs.sigmoidParams, ...params }
          };
          validatePreferences(newPrefs);
          saveToLocalStorage('userPreferences', newPrefs);
          return newPrefs;
        });
      } catch (error) {
        logError(error, 'Updating sigmoid parameters');
        throw error;
      }
    },

    reset: () => {
      try {
        store.set(DEFAULT_PREFERENCES);
        saveToLocalStorage('userPreferences', DEFAULT_PREFERENCES);
      } catch (error) {
        logError(error, 'Resetting preferences');
        throw error;
      }
    }
  };
}

export const userPreferences = createUserPreferencesStore(); 