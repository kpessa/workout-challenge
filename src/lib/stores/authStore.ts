import { writable, type Writable } from 'svelte/store';
import { supabase } from '$lib/services/supabase';
import type { AuthState, User } from '$lib/types';

function createAuthStore() {
  const { subscribe, set, update }: Writable<AuthState> = writable({
    user: null,
    loading: true
  });

  return {
    subscribe,
    initialize: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        set({ user: null, loading: false });
        return;
      }

      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email || ''
          },
          loading: false
        });
      } else {
        set({ user: null, loading: false });
      }
    },
    signIn: async (email: string, password: string) => {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Error signing in:', error);
        return error;
      }

      if (user) {
        set({
          user: {
            id: user.id,
            email: user.email || ''
          },
          loading: false
        });
      }
    },
    signUp: async (email: string, password: string) => {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        console.error('Error signing up:', error);
        return error;
      }

      if (user) {
        set({
          user: {
            id: user.id,
            email: user.email || ''
          },
          loading: false
        });
      }
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out:', error);
        return;
      }

      set({ user: null, loading: false });
    }
  };
}

export const authStore = createAuthStore(); 