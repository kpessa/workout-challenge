import { writable } from 'svelte/store';

type Theme = 'light' | 'dark';

function createThemeStore() {
  // Get initial theme from localStorage or default to 'dark'
  const initialTheme = (typeof window !== 'undefined' && localStorage.getItem('theme') as Theme) || 'dark';
  
  const { subscribe, set, update } = writable<Theme>(initialTheme);

  // Initialize the DOM with the initial theme
  if (typeof window !== 'undefined') {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);
  }

  return {
    subscribe,
    set: (value: Theme) => {
      localStorage.setItem('theme', value);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(value);
      set(value);
    },
    toggle: () => {
      update(currentTheme => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
        return newTheme;
      });
    }
  };
}

export const theme = createThemeStore(); 