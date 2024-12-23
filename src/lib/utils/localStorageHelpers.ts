import { browser } from '$app/environment';

/**
 * Loads data from localStorage
 * @param key The key to load from localStorage
 * @returns The parsed data or null if not found
 */
export function loadFromLocalStorage<T>(key: string): T | null {
  if (!browser) return null;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return null;
  }
}

/**
 * Saves data to localStorage
 * @param key The key to save to localStorage
 * @param data The data to save
 * @returns true if successful, false otherwise
 */
export function saveToLocalStorage<T>(key: string, data: T): boolean {
  if (!browser) return false;
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Removes data from localStorage
 * @param key The key to remove from localStorage
 * @returns true if successful, false otherwise
 */
export function removeFromLocalStorage(key: string): boolean {
  if (!browser) return false;
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
} 