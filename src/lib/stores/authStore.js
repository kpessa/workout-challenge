import { writable } from 'svelte/store';
import { supabase } from '../services/supabase';

function createAuthStore() {
  const { subscribe, set, update } = writable({
    user: null,
    loading: true,
  });

  // Initialize the store with the current session
  supabase.auth.getSession().then(({ data: { session } }) => {
    set({
      user: session?.user ?? null,
      loading: false,
    });
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    set({
      user: session?.user ?? null,
      loading: false,
    });
  });

  return {
    subscribe,
    getUser: () => {
      const unsubscribe = subscribe(state => {
        if (!state.loading) {
          return state.user;
        }
      });
      unsubscribe();
      return null;
    },
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    signUp: async (email, password) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  };
}

export const authStore = createAuthStore(); 