import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function createThemeStore() {
  // Get initial theme from localStorage or default to 'dark'
  const initialTheme = (browser && localStorage.getItem('theme') as Theme) || 'dark';
  
  const { subscribe, set, update } = writable<Theme>(initialTheme);

  // Initialize the DOM with the initial theme
  if (browser) {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);
  }

  return {
    subscribe,
    set: (value: Theme) => {
      if (browser) {
        localStorage.setItem('theme', value);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(value);
      }
      set(value);
    },
    toggle: () => {
      update(currentTheme => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        if (browser) {
          localStorage.setItem('theme', newTheme);
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(newTheme);
        }
        return newTheme;
      });
    }
  };
}

export const theme = createThemeStore(); 