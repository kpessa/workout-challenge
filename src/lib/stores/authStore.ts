import { writable, type Writable } from 'svelte/store';
import { auth } from '$lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  type User as FirebaseUser
} from 'firebase/auth';
import type { AuthState, User } from '$lib/types';

function createAuthStore() {
  const { subscribe, set, update }: Writable<AuthState> = writable({
    user: null,
    loading: true
  });

  return {
    subscribe,
    initialize: async () => {
      onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          set({
            user: {
              id: firebaseUser.uid,
              email: firebaseUser.email || ''
            },
            loading: false
          });
        } else {
          set({ user: null, loading: false });
        }
      });
    },
    signIn: async (email: string, password: string) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        set({
          user: {
            id: user.uid,
            email: user.email || ''
          },
          loading: false
        });
      } catch (error) {
        console.error('Error signing in:', error);
        return error;
      }
    },
    signInWithGoogle: async () => {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        
        set({
          user: {
            id: user.uid,
            email: user.email || ''
          },
          loading: false
        });
      } catch (error) {
        console.error('Error signing in with Google:', error);
        return error;
      }
    },
    signUp: async (email: string, password: string) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        set({
          user: {
            id: user.uid,
            email: user.email || ''
          },
          loading: false
        });
      } catch (error) {
        console.error('Error signing up:', error);
        return error;
      }
    },
    signOut: async () => {
      try {
        await signOut(auth);
        set({ user: null, loading: false });
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
  };
}

export const authStore = createAuthStore(); 