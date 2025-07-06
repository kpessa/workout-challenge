#!/usr/bin/env node

/**
 * Migrate extracted Supabase data to Firebase Firestore
 * This script reads JSON files from migration-data and uploads to Firebase
 */

import admin from 'firebase-admin';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase project configuration
const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'workout-challenge-132f7',
  // Service account key will be loaded from environment or file
};

// Input directory for extracted data
const inputDir = path.join(__dirname, '../migration-data');

// Initialize Firebase Admin SDK
let db;

async function initFirebase() {
  try {
    // Try to load service account key from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
    } else {
      // Fallback to default credentials or local service account file
      const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
      try {
        const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: firebaseConfig.projectId,
        });
      } catch (error) {
        console.error('Service account file not found. Using default credentials...');
        admin.initializeApp({
          projectId: firebaseConfig.projectId,
        });
      }
    }
    
    db = admin.firestore();
    console.log('Firebase Admin SDK initialized');
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
    id: workout.id,
    date: workout.date,
    duration: workout.duration,
    type: workout.workout_type_id || workout.type || 'default',
    created_at: workout.created_at,
    user_id: workout.user_id,
  };
}

function transformWorkoutType(workoutType) {
  return {
    id: workoutType.id,
    name: workoutType.name,
    color: workoutType.color || '#3B82F6',
    created_at: workoutType.created_at,
    user_id: workoutType.user_id,
  };
}

function transformUserPreferences(preferences) {
  return {
    daysPerWeek: preferences.days_per_week || preferences.daysPerWeek || 3,
    startDate: preferences.start_date || preferences.startDate || new Date().toISOString(),
    sigmoid: preferences.sigmoid_params || preferences.sigmoid || {
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
  const batch = db.batch();
  let operationCount = 0;
  
  const userDocRef = db.collection('users').doc(userId);
  
  // Migrate workouts
  if (userData.workouts && userData.workouts.length > 0) {
    console.log(`  Migrating ${userData.workouts.length} workouts...`);
    
    for (const workout of userData.workouts) {
      const transformedWorkout = transformWorkout(workout);
      const workoutRef = userDocRef.collection('workouts').doc();
      batch.set(workoutRef, transformedWorkout);
      operationCount++;
      
      // Commit batch if approaching limit
      if (operationCount >= 450) {
        await batch.commit();
        console.log(`    Committed batch of ${operationCount} operations`);
        operationCount = 0;
      }
    }
  }
  
  // Migrate workout types
  if (userData.workout_types && userData.workout_types.length > 0) {
    console.log(`  Migrating ${userData.workout_types.length} workout types...`);
    
    for (const workoutType of userData.workout_types) {
      const transformedType = transformWorkoutType(workoutType);
      const typeRef = userDocRef.collection('workout_types').doc();
      batch.set(typeRef, transformedType);
      operationCount++;
      
      if (operationCount >= 450) {
        await batch.commit();
        console.log(`    Committed batch of ${operationCount} operations`);
        operationCount = 0;
      }
    }
  }
  
  // Migrate user preferences
  if (userData.user_preferences && userData.user_preferences.length > 0) {
    console.log(`  Migrating user preferences...`);
    
    const preferences = userData.user_preferences[0]; // Assuming one preferences record per user
    const transformedPreferences = transformUserPreferences(preferences);
    const preferencesRef = userDocRef.collection('user_preferences').doc('preferences');
    batch.set(preferencesRef, transformedPreferences);
    operationCount++;
  }
  
  // Commit final batch
  if (operationCount > 0) {
    await batch.commit();
    console.log(`    Committed final batch of ${operationCount} operations`);
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
  console.log('Loading extracted data...');
  const data = await loadExtractedData();
  
  console.log('Grouping data by user...');
  const userGroups = await groupDataByUser(data);
  
  const userIds = Object.keys(userGroups);
  console.log(`Found ${userIds.length} users to migrate`);
  
  let totalOperations = 0;
  
  for (const userId of userIds) {
    console.log(`\nMigrating data for user: ${userId}`);
    const operations = await migrateUserData(userId, userGroups[userId]);
    totalOperations += operations;
    
    // Add a small delay to avoid overwhelming Firestore
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n=== Migration Complete ===`);
  console.log(`Total users: ${userIds.length}`);
  console.log(`Total operations: ${totalOperations}`);
  
  return { userCount: userIds.length, operationCount: totalOperations };
}

async function main() {
  console.log('=== Firebase Migration ===');
  
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
    
    console.log('\nMigration completed successfully!');
    console.log('You can now test your application with the migrated data.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { migrateAllData, migrateUserData };