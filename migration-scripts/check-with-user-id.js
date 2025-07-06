#!/usr/bin/env node

/**
 * Check Firebase data using the specific user IDs from migration
 */

import admin from 'firebase-admin';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

async function initFirebase() {
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
  const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'workout-challenge-132f7',
  });
  
  db = admin.firestore();
  console.log('✅ Firebase Admin SDK initialized');
}

async function checkSpecificUsers() {
  // These are the user IDs from the migration
  const userIds = [
    '3f622f64-f5eb-4947-816c-d803e7a21469',
    'e26f2faf-468e-45f8-8f8c-4b7e42c20007', 
    '19a9d47d-5bf8-4926-b131-09ce57035b07',
    'e1998b65-8454-484e-8f9a-03a93da9c6d0'
  ];
  
  console.log('\n🔍 Checking Specific User IDs from Migration');
  console.log('============================================');
  
  for (const userId of userIds) {
    console.log(`\n👤 User: ${userId.substring(0, 8)}...`);
    
    try {
      // Check if user document exists
      const userDoc = await db.collection('users').doc(userId).get();
      console.log(`   User doc exists: ${userDoc.exists}`);
      
      // Check workouts subcollection
      const workoutsRef = db.collection('users').doc(userId).collection('workouts');
      const workoutsSnapshot = await workoutsRef.get();
      console.log(`   💪 Workouts: ${workoutsSnapshot.size} documents`);
      
      // Check workout types subcollection  
      const typesRef = db.collection('users').doc(userId).collection('workout_types');
      const typesSnapshot = await typesRef.get();
      console.log(`   🏃 Workout Types: ${typesSnapshot.size} documents`);
      
      // Check preferences
      const prefsRef = db.collection('users').doc(userId).collection('user_preferences').doc('preferences');
      const prefsDoc = await prefsRef.get();
      console.log(`   ⚙️  Preferences: ${prefsDoc.exists ? 'exists' : 'not found'}`);
      
      // Show sample workout if exists
      if (workoutsSnapshot.size > 0) {
        const sampleWorkout = workoutsSnapshot.docs[0].data();
        console.log(`   📝 Sample workout: ${sampleWorkout.duration}min on ${sampleWorkout.date?.split('T')[0]}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function tryDirectWrite() {
  console.log('\n🧪 Testing Direct Write Access');
  console.log('==============================');
  
  try {
    const testRef = db.collection('test').doc('admin-test');
    await testRef.set({
      message: 'Admin SDK test',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Direct write successful - Admin SDK has write access');
    
    // Clean up test document
    await testRef.delete();
    console.log('✅ Test document cleaned up');
    
  } catch (error) {
    console.log(`❌ Write test failed: ${error.message}`);
  }
}

async function main() {
  try {
    await initFirebase();
    await tryDirectWrite();
    await checkSpecificUsers();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();