import { writable } from 'svelte/store';

type Theme = 'light' | 'dark';

function createThemeStore() {
  const { subscribe, set, update } = writable<Theme>('dark');

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