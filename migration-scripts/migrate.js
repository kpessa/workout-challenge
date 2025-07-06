#!/usr/bin/env node

/**
 * Complete Supabase to Firebase migration script
 * This orchestrates the entire migration process
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_FILE = 'supabase-backup.backup';
const PROJECT_ROOT = path.join(__dirname, '..');

async function checkPrerequisites() {
  console.log('=== Checking Prerequisites ===');
  
  // Check if backup file exists
  const backupPath = path.join(PROJECT_ROOT, BACKUP_FILE);
  try {
    await fs.access(backupPath);
    console.log('✓ Backup file found:', BACKUP_FILE);
  } catch (error) {
    console.error('✗ Backup file not found:', BACKUP_FILE);
    console.error('Please copy your db_cluster-22-02-2025@12-22-20.backup file to the project root as supabase-backup.backup');
    process.exit(1);
  }
  
  // Check Docker availability
  try {
    execSync('docker --version', { stdio: 'ignore' });
    console.log('✓ Docker is available');
  } catch (error) {
    console.log('⚠ Docker not available, you\'ll need to set up PostgreSQL manually');
  }
  
  // Check if migration directories exist
  try {
    await fs.access(path.join(PROJECT_ROOT, 'migration-data'));
    await fs.access(path.join(PROJECT_ROOT, 'migration-scripts'));
    console.log('✓ Migration directories exist');
  } catch (error) {
    console.error('✗ Migration directories not found');
    process.exit(1);
  }
}

async function setupPostgreSQL() {
  console.log('\n=== Setting up PostgreSQL ===');
  
  try {
    // Check if container already exists
    try {
      execSync('docker inspect postgres-migration', { stdio: 'ignore' });
      console.log('PostgreSQL container already exists');
      
      // Check if it's running
      const status = execSync('docker inspect -f "{{.State.Running}}" postgres-migration', { encoding: 'utf8' }).trim();
      if (status === 'false') {
        console.log('Starting existing container...');
        execSync('docker start postgres-migration', { stdio: 'inherit' });
      }
    } catch (error) {
      // Container doesn't exist, create it
      console.log('Creating new PostgreSQL container...');
      execSync('docker run --name postgres-migration -e POSTGRES_PASSWORD=migration -p 5432:5432 -d postgres:15', {
        stdio: 'inherit'
      });
      
      // Wait for PostgreSQL to start
      console.log('Waiting for PostgreSQL to start...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Copy backup file to container
    console.log('Copying backup file to container...');
    execSync(`docker cp ${BACKUP_FILE} postgres-migration:/tmp/`, { stdio: 'inherit' });
    
    // Restore backup
    console.log('Restoring backup...');
    execSync('docker exec postgres-migration pg_restore -U postgres -d postgres -v /tmp/supabase-backup.backup', {
      stdio: 'inherit'
    });
    
    console.log('✓ PostgreSQL setup complete');
    
  } catch (error) {
    console.error('PostgreSQL setup failed:', error.message);
    console.log('\nPlease set up PostgreSQL manually using the instructions in setup-postgresql.md');
    throw error;
  }
}

async function extractData() {
  console.log('\n=== Extracting Data from PostgreSQL ===');
  
  try {
    // Set environment variables for the extraction script
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'postgres';
    process.env.DB_USER = 'postgres';
    process.env.DB_PASSWORD = 'migration';
    
    // Run extraction script
    const extractScript = path.join(__dirname, 'extract-supabase-data.js');
    execSync(`node ${extractScript}`, { stdio: 'inherit' });
    
    console.log('✓ Data extraction complete');
    
  } catch (error) {
    console.error('Data extraction failed:', error.message);
    throw error;
  }
}

async function migrateToFirebase() {
  console.log('\n=== Migrating to Firebase ===');
  
  try {
    // Check for Firebase service account
    const serviceAccountPath = path.join(PROJECT_ROOT, 'firebase-service-account.json');
    try {
      await fs.access(serviceAccountPath);
      console.log('✓ Firebase service account found');
    } catch (error) {
      console.log('⚠ Firebase service account not found');
      console.log('You may need to set up Firebase credentials manually');
      console.log('See: https://firebase.google.com/docs/admin/setup#initialize-sdk');
    }
    
    // Run migration script
    const migrateScript = path.join(__dirname, 'migrate-to-firebase.js');
    execSync(`node ${migrateScript}`, { stdio: 'inherit' });
    
    console.log('✓ Firebase migration complete');
    
  } catch (error) {
    console.error('Firebase migration failed:', error.message);
    throw error;
  }
}

async function cleanup() {
  console.log('\n=== Cleanup ===');
  
  const answer = await askQuestion('Do you want to stop the PostgreSQL container? (y/n): ');
  if (answer.toLowerCase() === 'y') {
    try {
      execSync('docker stop postgres-migration', { stdio: 'inherit' });
      console.log('✓ PostgreSQL container stopped');
      
      const removeAnswer = await askQuestion('Do you want to remove the container? (y/n): ');
      if (removeAnswer.toLowerCase() === 'y') {
        execSync('docker rm postgres-migration', { stdio: 'inherit' });
        console.log('✓ PostgreSQL container removed');
      }
    } catch (error) {
      console.log('Note: Could not stop/remove container:', error.message);
    }
  }
}

function askQuestion(question) {
  return new Promise(resolve => {
    import('readline').then(({ createInterface }) => {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question(question, answer => {
        rl.close();
        resolve(answer);
      });
    });
  });
}

async function main() {
  console.log('🔄 Supabase to Firebase Migration Tool');
  console.log('=====================================\n');
  
  try {
    await checkPrerequisites();
    
    const runAll = await askQuestion('Run complete migration? (y/n): ');
    if (runAll.toLowerCase() !== 'y') {
      console.log('Migration cancelled');
      process.exit(0);
    }
    
    await setupPostgreSQL();
    await extractData();
    await migrateToFirebase();
    await cleanup();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('Your Supabase data has been migrated to Firebase.');
    console.log('You can now test your application with the migrated data.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\nCheck the documentation in migration-scripts/setup-postgresql.md for manual setup.');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkPrerequisites, setupPostgreSQL, extractData, migrateToFirebase };