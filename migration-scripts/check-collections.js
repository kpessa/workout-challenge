#!/usr/bin/env node

/**
 * Check all collections in Firebase
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

async function checkAllCollections() {
  console.log('🔍 Checking All Firebase Collections');
  console.log('====================================');
  
  try {
    // List all collections at root level
    const collections = await db.listCollections();
    console.log(`\n📊 Root collections found: ${collections.length}`);
    
    for (const collection of collections) {
      console.log(`\n📁 Collection: ${collection.id}`);
      
      try {
        const snapshot = await collection.limit(5).get();
        console.log(`   Documents: ${snapshot.size} (showing first 5)`);
        
        snapshot.docs.forEach((doc, index) => {
          console.log(`   ${index + 1}. Document ID: ${doc.id}`);
          const data = doc.data();
          const keys = Object.keys(data).slice(0, 3);
          console.log(`      Sample fields: ${keys.join(', ')}`);
        });
        
        // Check for subcollections if this is users collection
        if (collection.id === 'users' && snapshot.size > 0) {
          const firstUser = snapshot.docs[0];
          const subcollections = await firstUser.ref.listCollections();
          console.log(`      Subcollections: ${subcollections.map(sc => sc.id).join(', ')}`);
        }
        
      } catch (error) {
        console.log(`   Error reading collection: ${error.message}`);
      }
    }
    
    // Also try some common collection names
    const commonCollections = ['workouts', 'workout_types', 'user_preferences'];
    console.log(`\n🔍 Checking common collection names...`);
    
    for (const collectionName of commonCollections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        if (snapshot.size > 0) {
          console.log(`   ✅ Found: ${collectionName} (${snapshot.size}+ documents)`);
        }
      } catch (error) {
        // Collection doesn't exist or no access
      }
    }
    
  } catch (error) {
    console.error('Error checking collections:', error);
  }
}

async function main() {
  try {
    await initFirebase();
    await checkAllCollections();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();