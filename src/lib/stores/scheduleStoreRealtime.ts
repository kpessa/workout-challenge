import { writable, derived } from 'svelte/store';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type Unsubscribe 
} from 'firebase/firestore';
import { db, auth } from '$lib/services/firebase';
import { handleFirestoreError, logError } from '$lib/utils/errorHandler';
import type { Workout } from '$lib/types';

interface ScheduleState {
  workouts: Workout[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
}

const initialState: ScheduleState = {
  workouts: [],
  loading: true,
  error: null,
  syncing: false
};

function createScheduleStore() {
  const { subscribe, set, update } = writable<ScheduleState>(initialState);
  
  let unsubscribe: Unsubscribe | null = null;
  
  /**
   * Initialize real-time listener for workouts
   */
  function initialize() {
    // Clean up any existing listener
    if (unsubscribe) {
      unsubscribe();
    }
    
    const user = auth.currentUser;
    if (!user) {
      set({ ...initialState, loading: false, error: 'User not authenticated' });
      return;
    }
    
    update(state => ({ ...state, loading: true, error: null }));
    
    // Create real-time query
    const workoutsRef = collection(db, 'users', user.uid, 'workouts');
    const q = query(workoutsRef, orderBy('date', 'desc'));
    
    // Set up real-time listener
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const workouts: Workout[] = [];
        
        snapshot.forEach((doc) => {
          workouts.push({
            id: doc.id,
            ...doc.data(),
            // Ensure date is a string
            date: doc.data().date
          } as Workout);
        });
        
        update(state => ({
          ...state,
          workouts,
          loading: false,
          error: null,
          syncing: false
        }));
      },
      (error) => {
        const errorInfo = handleFirestoreError(error);
        logError({
          context: 'scheduleStore.initialize',
          error,
          userId: user.uid
        });
        
        update(state => ({
          ...state,
          loading: false,
          error: errorInfo.message,
          syncing: false
        }));
      }
    );
  }
  
  /**
   * Add a new workout with optimistic update
   */
  async function addWorkout(date: string, duration: number, workout_type_id?: string): Promise<Workout> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const newWorkout: Workout = {
      id: tempId,
      date,
      duration,
      type: workout_type_id || 'default',
      user_id: user.uid
    };
    
    update(state => ({
      ...state,
      workouts: [newWorkout, ...state.workouts],
      syncing: true
    }));
    
    try {
      const workoutsRef = collection(db, 'users', user.uid, 'workouts');
      const docRef = await addDoc(workoutsRef, {
        date,
        duration,
        type: workout_type_id || 'default',
        user_id: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      
      // Update with real ID (real-time listener will handle the full update)
      const savedWorkout = { ...newWorkout, id: docRef.id };
      
      update(state => ({
        ...state,
        workouts: state.workouts.map(w => 
          w.id === tempId ? savedWorkout : w
        ),
        syncing: false
      }));
      
      return savedWorkout;
    } catch (error) {
      // Rollback optimistic update on error
      update(state => ({
        ...state,
        workouts: state.workouts.filter(w => w.id !== tempId),
        syncing: false,
        error: handleFirestoreError(error).message
      }));
      throw error;
    }
  }
  
  /**
   * Update an existing workout with optimistic update
   */
  async function updateWorkout(id: string, date: string, duration: number, workout_type_id?: string) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Store original for rollback
    let originalWorkout: Workout | undefined;
    
    // Optimistic update
    update(state => {
      originalWorkout = state.workouts.find(w => w.id === id);
      return {
        ...state,
        workouts: state.workouts.map(w =>
          w.id === id 
            ? { ...w, date, duration, type: workout_type_id || w.type }
            : w
        ),
        syncing: true
      };
    });
    
    try {
      const workoutRef = doc(db, 'users', user.uid, 'workouts', id);
      await updateDoc(workoutRef, {
        date,
        duration,
        type: workout_type_id,
        updated_at: serverTimestamp()
      });
      
      update(state => ({ ...state, syncing: false }));
    } catch (error) {
      // Rollback on error
      if (originalWorkout) {
        update(state => ({
          ...state,
          workouts: state.workouts.map(w =>
            w.id === id ? originalWorkout : w
          ),
          syncing: false,
          error: handleFirestoreError(error).message
        }));
      }
      throw error;
    }
  }
  
  /**
   * Delete a workout with optimistic update
   */
  async function deleteWorkout(id: string) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Store for rollback
    let deletedWorkout: Workout | undefined;
    
    // Optimistic update
    update(state => {
      deletedWorkout = state.workouts.find(w => w.id === id);
      return {
        ...state,
        workouts: state.workouts.filter(w => w.id !== id),
        syncing: true
      };
    });
    
    try {
      const workoutRef = doc(db, 'users', user.uid, 'workouts', id);
      await deleteDoc(workoutRef);
      
      update(state => ({ ...state, syncing: false }));
    } catch (error) {
      // Rollback on error
      if (deletedWorkout) {
        update(state => ({
          ...state,
          workouts: [...state.workouts, deletedWorkout].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
          syncing: false,
          error: handleFirestoreError(error).message
        }));
      }
      throw error;
    }
  }
  
  /**
   * Clean up listener when store is destroyed
   */
  function destroy() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }
  
  return {
    subscribe,
    initialize,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    destroy
  };
}

// Create the store instance
export const scheduleRealtime = createScheduleStore();

// Derived store for just the workouts array (backward compatibility)
export const schedule = derived(
  scheduleRealtime,
  $scheduleRealtime => $scheduleRealtime.workouts
);

// Derived store for loading state
export const scheduleLoading = derived(
  scheduleRealtime,
  $scheduleRealtime => $scheduleRealtime.loading
);

// Derived store for error state
export const scheduleError = derived(
  scheduleRealtime,
  $scheduleRealtime => $scheduleRealtime.error
);

// Derived store for syncing state
export const scheduleSyncing = derived(
  scheduleRealtime,
  $scheduleRealtime => $scheduleRealtime.syncing
);