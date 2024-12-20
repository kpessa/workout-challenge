import { writable } from 'svelte/store';
import { supabase } from '../supabase';

const createAuthStore = () => {
    const { subscribe, set, update } = writable({
        user: null,
        session: null,
        loading: true
    });

    return {
        subscribe,
        setSession: (session) => {
            update(state => ({
                ...state,
                user: session?.user ?? null,
                session,
                loading: false
            }));
        },
        signIn: async (email, password) => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return data;
        },
        signUp: async (email, password) => {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });
            if (error) throw error;
            return data;
        },
        signOut: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            set({ user: null, session: null, loading: false });
        }
    };
};

export const authStore = createAuthStore();

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
    authStore.setSession(session);
});

// Listen for auth changes
supabase.auth.onAuthStateChange((_event, session) => {
    authStore.setSession(session);
}); 