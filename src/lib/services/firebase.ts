import { auth, db } from '$lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp
} from 'firebase/firestore';
import type { Workout, WorkoutType } from '../types';

// Helper function to get current user
function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return user;
}

// Workout operations
export async function saveWorkout(workout: Pick<Workout, 'date' | 'duration' | 'type'>): Promise<Workout> {
  const user = getCurrentUser();
  
  const workoutData = {
    user_id: user.uid,
    date: workout.date,
    duration: workout.duration,
    type: workout.type || 'default',
    created_at: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, 'users', user.uid, 'workouts'), workoutData);
  return { id: docRef.id, ...workoutData } as Workout;
}

export async function getWorkouts(): Promise<Workout[]> {
  const user = getCurrentUser();
  
  const q = query(
    collection(db, 'users', user.uid, 'workouts'),
    orderBy('date', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Workout));
}

export async function updateWorkout(id: string, updates: Partial<Workout>) {
  const user = getCurrentUser();
  
  const docRef = doc(db, 'users', user.uid, 'workouts', id);
  await updateDoc(docRef, {
    ...updates,
    updated_at: new Date().toISOString()
  });
}

export async function deleteWorkout(id: string) {
  const user = getCurrentUser();
  
  const docRef = doc(db, 'users', user.uid, 'workouts', id);
  await deleteDoc(docRef);
}

// Workout type operations
export async function getWorkoutTypes(): Promise<WorkoutType[]> {
  const user = getCurrentUser();
  
  const q = query(collection(db, 'users', user.uid, 'workout_types'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as WorkoutType));
}

export async function saveWorkoutType(workoutType: Omit<WorkoutType, 'id'>): Promise<WorkoutType> {
  const user = getCurrentUser();
  
  const typeData = {
    ...workoutType,
    user_id: user.uid,
    created_at: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, 'users', user.uid, 'workout_types'), typeData);
  return { id: docRef.id, ...typeData } as WorkoutType;
}

export async function updateWorkoutType(id: string, updates: Partial<WorkoutType>) {
  const user = getCurrentUser();
  
  const docRef = doc(db, 'users', user.uid, 'workout_types', id);
  await updateDoc(docRef, {
    ...updates,
    updated_at: new Date().toISOString()
  });
}

export async function deleteWorkoutType(id: string) {
  const user = getCurrentUser();
  
  const docRef = doc(db, 'users', user.uid, 'workout_types', id);
  await deleteDoc(docRef);
}

// User preferences operations
export async function getUserPreferences() {
  const user = getCurrentUser();
  
  const docRef = doc(db, 'users', user.uid, 'user_preferences', 'preferences');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserPreferences;
  }
  
  return null;
}

export async function saveUserPreferences(preferences: any) {
  const user = getCurrentUser();
  
  const preferencesData = {
    ...preferences,
    user_id: user.uid,
    updated_at: new Date().toISOString()
  };

  const docRef = doc(db, 'users', user.uid, 'user_preferences', 'preferences');
  await setDoc(docRef, preferencesData, { merge: true });
  
  return preferencesData;
}