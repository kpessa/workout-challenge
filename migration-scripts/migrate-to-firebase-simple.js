#!/usr/bin/env node

/**
 * Simple Firebase migration using regular Firebase SDK (not Admin SDK)
 * This approach uses your existing Firebase project configuration
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the same Firebase config as your app
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDikWc-duFRrMQkETpnk2KmECAYExXfWXQ",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "workout-challenge-132f7.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "workout-challenge-132f7",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "workout-challenge-132f7.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1171118170",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:1171118170:web:a35d9d7c83532dd753e063",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LQDXYB31VC"
};

const inputDir = path.join(__dirname, '../migration-data');
let db, auth;

async function initFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    console.log('Firebase initialized successfully');
    console.log('Project ID:', firebaseConfig.projectId);
    
    // Sign in anonymously to get write permissions
    await signInAnonymously(auth);
    console.log('Signed in anonymously');
    
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

async function loadExtractedData() {
  try {
    const files = await fs.readdir(inputDir);
    const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'extraction-summary.json');
    
    const data = {};
    for (const file of jsonFiles) {
      const tableName = path.basename(file, '.json');
      const filePath = path.join(inputDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      data[tableName] = JSON.parse(content);
      console.log(`Loaded ${data[tableName].length} records from ${tableName}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error loading extracted data:', error);
    throw error;
  }
}

function transformWorkout(workout) {
  return {
    date: workout.date,
    duration: workout.duration,
    type: workout.workout_type_id || workout.type || 'default',
    created_at: workout.created_at,
    user_id: workout.user_id,
  };
}

function transformWorkoutType(workoutType) {
  return {
    name: workoutType.name,
    color: workoutType.color || '#3B82F6',
    created_at: workoutType.created_at,
    user_id: workoutType.user_id,
  };
}

function transformUserPreferences(preferences) {
  // Handle nested data structure
  const data = preferences.data || preferences;
  return {
    daysPerWeek: data.daysPerWeek || data.days_per_week || 3,
    startDate: data.startDate || data.start_date || new Date().toISOString(),
    sigmoid: data.sigmoidParams || data.sigmoid_params || data.sigmoid || {
      steepness: 0.1,
      midpoint: 45,
      minDuration: 15,
      maxDuration: 90
    },
    user_id: preferences.user_id,
    updated_at: preferences.updated_at || new Date().toISOString(),
  };
}

async function migrateUserData(userId, userData) {
  console.log(`\n  Migrating data for user: ${userId}`);
  
  const batch = writeBatch(db);
  let operationCount = 0;
  
  // Migrate workouts
  if (userData.workouts && userData.workouts.length > 0) {
    console.log(`    Migrating ${userData.workouts.length} workouts...`);
    
    for (const workout of userData.workouts) {
      const transformedWorkout = transformWorkout(workout);
      const workoutRef = doc(collection(db, 'users', userId, 'workouts'));
      batch.set(workoutRef, transformedWorkout);
      operationCount++;
      
      // Commit in smaller batches to avoid limits
      if (operationCount >= 400) {
        await batch.commit();
        console.log(`      Committed batch of ${operationCount} operations`);
        operationCount = 0;
      }
    }
  }
  
  // Migrate workout types
  if (userData.workout_types && userData.workout_types.length > 0) {
    console.log(`    Migrating ${userData.workout_types.length} workout types...`);
    
    for (const workoutType of userData.workout_types) {
      const transformedType = transformWorkoutType(workoutType);
      const typeRef = doc(collection(db, 'users', userId, 'workout_types'));
      batch.set(typeRef, transformedType);
      operationCount++;
      
      if (operationCount >= 400) {
        await batch.commit();
        console.log(`      Committed batch of ${operationCount} operations`);
        operationCount = 0;
      }
    }
  }
  
  // Migrate user preferences
  if (userData.user_preferences && userData.user_preferences.length > 0) {
    console.log(`    Migrating user preferences...`);
    
    const preferences = userData.user_preferences[0]; // Assuming one preferences record per user
    const transformedPreferences = transformUserPreferences(preferences);
    const preferencesRef = doc(db, 'users', userId, 'user_preferences', 'preferences');
    batch.set(preferencesRef, transformedPreferences);
    operationCount++;
  }
  
  // Commit final batch
  if (operationCount > 0) {
    await batch.commit();
    console.log(`      Committed final batch of ${operationCount} operations`);
  }
  
  return operationCount;
}

async function groupDataByUser(data) {
  const userGroups = {};
  
  // Group workouts by user
  if (data.workouts) {
    for (const workout of data.workouts) {
      const userId = workout.user_id;
      if (!userGroups[userId]) userGroups[userId] = {};
      if (!userGroups[userId].workouts) userGroups[userId].workouts = [];
      userGroups[userId].workouts.push(workout);
    }
  }
  
  // Group workout types by user
  if (data.workout_types) {
    for (const workoutType of data.workout_types) {
      const userId = workoutType.user_id;
      if (!userGroups[userId]) userGroups[userId] = {};
      if (!userGroups[userId].workout_types) userGroups[userId].workout_types = [];
      userGroups[userId].workout_types.push(workoutType);
    }
  }
  
  // Group user preferences by user
  if (data.user_preferences) {
    for (const preferences of data.user_preferences) {
      const userId = preferences.user_id;
      if (!userGroups[userId]) userGroups[userId] = {};
      if (!userGroups[userId].user_preferences) userGroups[userId].user_preferences = [];
      userGroups[userId].user_preferences.push(preferences);
    }
  }
  
  return userGroups;
}

async function migrateAllData() {
  console.log('\nLoading extracted data...');
  const data = await loadExtractedData();
  
  console.log('\nGrouping data by user...');
  const userGroups = await groupDataByUser(data);
  
  const userIds = Object.keys(userGroups);
  console.log(`\nFound ${userIds.length} users to migrate`);
  
  let totalOperations = 0;
  
  for (const userId of userIds) {
    const operations = await migrateUserData(userId, userGroups[userId]);
    totalOperations += operations;
    
    // Small delay between users
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n=== Migration Complete ===`);
  console.log(`Total users: ${userIds.length}`);
  console.log(`Total operations: ${totalOperations}`);
  
  return { userCount: userIds.length, operationCount: totalOperations };
}

async function main() {
  console.log('=== Simple Firebase Migration ===');
  console.log('Using Firebase Web SDK instead of Admin SDK');
  
  try {
    await initFirebase();
    
    // Check if extracted data exists
    try {
      await fs.access(inputDir);
    } catch (error) {
      console.error(`Migration data directory not found: ${inputDir}`);
      console.error('Please run the extraction script first.');
      process.exit(1);
    }
    
    const result = await migrateAllData();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('Your Supabase data has been migrated to Firebase.');
    console.log('You can now test your application with the migrated data.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. Firebase project configuration is correct');
    console.error('2. Firestore database is created and accessible');
    console.error('3. Firestore security rules allow writes');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { migrateAllData, migrateUserData };