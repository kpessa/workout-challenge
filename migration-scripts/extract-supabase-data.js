#!/usr/bin/env node

/**
 * Extract data from restored Supabase PostgreSQL database
 * This script connects to a PostgreSQL database and exports data to JSON files
 */

import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'migration',
};

// Output directory for extracted data
const outputDir = path.join(__dirname, '../migration-data');

async function ensureOutputDir() {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`Output directory created: ${outputDir}`);
  } catch (error) {
    console.error('Error creating output directory:', error);
  }
}

async function extractTable(client, tableName, query = null) {
  try {
    const sql = query || `SELECT * FROM ${tableName} ORDER BY created_at DESC`;
    console.log(`Extracting data from table: ${tableName}`);
    
    const result = await client.query(sql);
    const data = result.rows;
    
    const outputFile = path.join(outputDir, `${tableName}.json`);
    await fs.writeFile(outputFile, JSON.stringify(data, null, 2));
    
    console.log(`✓ Extracted ${data.length} records from ${tableName} to ${outputFile}`);
    return data;
  } catch (error) {
    console.error(`Error extracting ${tableName}:`, error);
    throw error;
  }
}

async function extractAllData() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
    
    // Check available tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('Available tables:', tables);
    
    // Extract data from common Supabase tables
    const extractionResults = {};
    
    // Extract users (if exists)
    if (tables.includes('users')) {
      extractionResults.users = await extractTable(client, 'users');
    }
    
    // Extract workouts
    if (tables.includes('workouts')) {
      extractionResults.workouts = await extractTable(client, 'workouts');
    }
    
    // Extract workout types
    if (tables.includes('workout_types')) {
      extractionResults.workout_types = await extractTable(client, 'workout_types');
    }
    
    // Extract user preferences
    if (tables.includes('user_preferences')) {
      extractionResults.user_preferences = await extractTable(client, 'user_preferences');
    }
    
    // Extract any other relevant tables
    const otherTables = tables.filter(t => 
      !['users', 'workouts', 'workout_types', 'user_preferences'].includes(t) &&
      !t.startsWith('_') && // Skip system tables
      !t.includes('schema') // Skip schema tables
    );
    
    for (const table of otherTables) {
      console.log(`Found additional table: ${table}`);
      extractionResults[table] = await extractTable(client, table);
    }
    
    // Save extraction summary
    const summary = {
      extractedAt: new Date().toISOString(),
      tables: Object.keys(extractionResults).map(table => ({
        name: table,
        recordCount: extractionResults[table].length
      })),
      totalRecords: Object.values(extractionResults).reduce((sum, data) => sum + data.length, 0)
    };
    
    await fs.writeFile(
      path.join(outputDir, 'extraction-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\n=== Extraction Complete ===');
    console.log(`Total tables: ${summary.tables.length}`);
    console.log(`Total records: ${summary.totalRecords}`);
    summary.tables.forEach(table => {
      console.log(`  ${table.name}: ${table.recordCount} records`);
    });
    
  } catch (error) {
    console.error('Error during extraction:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

async function main() {
  console.log('=== Supabase Data Extraction ===');
  console.log('Database config:', { ...dbConfig, password: '***' });
  
  await ensureOutputDir();
  await extractAllData();
  
  console.log('\nExtraction completed! Check the migration-data directory for JSON files.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { extractAllData, extractTable };