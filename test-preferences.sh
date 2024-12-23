#!/bin/bash

# Ensure Supabase is running
echo "Checking Supabase status..."
supabase status || { echo "Starting Supabase..."; supabase start; }

# Run the test
echo "Running user preferences test..."
npx tsx src/lib/tests/userPreferences.test.ts 