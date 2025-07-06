#!/usr/bin/env node

/**
 * Check what data exists in Firebase after migration
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
}

async function checkUserData(userId) {
  console.log(`\n👤 User: ${userId}`);
  
  // Check workouts
  const workoutsSnapshot = await db.collection('users').doc(userId).collection('workouts').get();
  console.log(`  💪 Workouts: ${workoutsSnapshot.size} documents`);
  
  if (workoutsSnapshot.size > 0) {
    const dates = workoutsSnapshot.docs.map(doc => {
      const data = doc.data();
      return new Date(data.date).toISOString().split('T')[0];
    }).sort();
    console.log(`     Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
  }
  
  // Check workout types
  const typesSnapshot = await db.collection('users').doc(userId).collection('workout_types').get();
  console.log(`  🏃 Workout Types: ${typesSnapshot.size} documents`);
  
  if (typesSnapshot.size > 0) {
    const names = typesSnapshot.docs.map(doc => doc.data().name).slice(0, 5);
    console.log(`     Examples: ${names.join(', ')}${typesSnapshot.size > 5 ? '...' : ''}`);
  }
  
  // Check preferences
  const prefsDoc = await db.collection('users').doc(userId).collection('user_preferences').doc('preferences').get();
  if (prefsDoc.exists) {
    const prefs = prefsDoc.data();
    console.log(`  ⚙️  Preferences: daysPerWeek=${prefs.daysPerWeek}, startDate=${prefs.startDate}`);
  } else {
    console.log(`  ⚙️  Preferences: None found`);
  }
}

async function checkAllData() {
  console.log('🔍 Firebase Data Check');
  console.log('========================');
  
  // Get all users
  const usersSnapshot = await db.collection('users').get();
  console.log(`\n📊 Total users found: ${usersSnapshot.size}`);
  
  for (const userDoc of usersSnapshot.docs) {
    await checkUserData(userDoc.id);
  }
  
  console.log(`\n✅ Data check complete`);
}

async function main() {
  try {
    await initFirebase();
    await checkAllData();
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

main();