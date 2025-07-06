# Supabase to Firebase Migration Guide

This guide will help you migrate your Supabase data to Firebase using the provided migration scripts.

## Prerequisites

- Your Supabase backup file: `db_cluster-22-02-2025@12-22-20.backup`
- Docker installed (recommended) OR PostgreSQL installed locally
- Firebase project with Firestore enabled
- Node.js and pnpm

## Quick Start

### 1. Prepare Your Backup File

Copy your Supabase backup file to the project root and rename it:

```bash
cp /path/to/your/db_cluster-22-02-2025@12-22-20.backup ./supabase-backup.backup
```

### 2. Run Complete Migration

```bash
pnpm run migrate
```

This will:
- Set up PostgreSQL in Docker
- Restore your Supabase backup
- Extract data to JSON files
- Migrate data to Firebase
- Clean up resources

## Manual Migration Steps

If you prefer to run each step manually:

### Step 1: Set up PostgreSQL

**Option A: Docker (Recommended)**
```bash
# Start PostgreSQL container
docker run --name postgres-migration \
  -e POSTGRES_PASSWORD=migration \
  -p 5432:5432 \
  -d postgres:15

# Copy backup file
docker cp supabase-backup.backup postgres-migration:/tmp/

# Restore backup
docker exec postgres-migration pg_restore \
  -U postgres -d postgres -v \
  /tmp/supabase-backup.backup
```

**Option B: Local PostgreSQL**
See `migration-scripts/setup-postgresql.md` for detailed instructions.

### Step 2: Extract Data
```bash
pnpm run migrate:extract
```

This creates JSON files in `migration-data/` directory with your Supabase data.

### Step 3: Set up Firebase Credentials (Optional)

For better performance and authentication, set up Firebase Admin SDK:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Save as `firebase-service-account.json` in project root

### Step 4: Migrate to Firebase
```bash
pnpm run migrate:firebase
```

## Data Mapping

The migration transforms your Supabase data as follows:

### Users
- Supabase user records → Firebase Auth users
- User data stored in Firestore under `users/{uid}/`

### Workouts
- `workouts` table → `users/{uid}/workouts` collection
- `workout_type_id` field → `type` field
- Maintains original IDs and timestamps

### Workout Types
- `workout_types` table → `users/{uid}/workout_types` collection
- Includes name, color, and metadata

### User Preferences
- `user_preferences` table → `users/{uid}/user_preferences/preferences` document
- Transforms field names to match Firebase schema

## File Structure

```
workout-challenge/
├── migration-scripts/
│   ├── migrate.js                 # Main migration orchestrator
│   ├── extract-supabase-data.js   # PostgreSQL data extraction
│   ├── migrate-to-firebase.js     # Firebase data migration
│   └── setup-postgresql.md       # PostgreSQL setup guide
├── migration-data/               # Extracted JSON data (created during migration)
├── supabase-backup.backup       # Your Supabase backup file (place here)
└── firebase-service-account.json # Firebase credentials (optional)
```

## Environment Variables

You can customize the migration with these environment variables:

```bash
# PostgreSQL connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=migration

# Firebase project
VITE_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY='{...json...}'  # Alternative to service account file
```

## Verification

After migration, verify your data:

1. **Start your app**: `pnpm run dev`
2. **Log in** with an existing account
3. **Check data**: Verify workouts, preferences, and workout types are present
4. **Test functionality**: Create new workouts, update preferences

## Troubleshooting

### PostgreSQL Issues
- **Container already exists**: `docker rm postgres-migration` then retry
- **Port in use**: Change port mapping `-p 5433:5432`
- **Permission denied**: Use `sudo` with Docker commands

### Firebase Issues
- **Authentication errors**: Ensure Firebase credentials are set up correctly
- **Permission denied**: Check Firestore security rules
- **Quota exceeded**: Firebase has usage limits for batch operations

### Data Issues
- **Missing tables**: Check if backup was restored correctly with `docker exec -it postgres-migration psql -U postgres -c "\dt"`
- **Empty migration**: Verify data exists in extracted JSON files
- **Schema mismatch**: Check `migration-data/extraction-summary.json` for table structure

## Cleanup

After successful migration:

```bash
# Stop and remove PostgreSQL container
docker stop postgres-migration
docker rm postgres-migration

# Remove migration files (optional)
rm -rf migration-data/
rm supabase-backup.backup
```

## Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your backup file is a valid PostgreSQL dump
3. Ensure Firebase project is properly configured
4. Check that all dependencies are installed: `pnpm install`

## Security Notes

- Never commit `firebase-service-account.json` to version control
- Remove backup files after successful migration
- Review Firebase security rules after migration
- Consider rotating Firebase credentials after migration