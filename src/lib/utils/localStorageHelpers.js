import { StorageError } from './errorHandling';

export function saveToLocalStorage(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    throw new StorageError(
      `Failed to save data for key "${key}": ${error.message}`
    );
  }
}

export function loadFromLocalStorage(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    throw new StorageError(
      `Failed to load data for key "${key}": ${error.message}`
    );
  }
}
