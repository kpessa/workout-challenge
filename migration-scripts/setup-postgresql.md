# PostgreSQL Setup for Supabase Migration

## Option 1: Docker PostgreSQL (Recommended)

### Prerequisites
- Docker installed on your system
- Your `db_cluster-22-02-2025@12-22-20.backup` file

### Steps

1. **Start PostgreSQL container:**
   ```bash
   docker run --name postgres-migration \
     -e POSTGRES_PASSWORD=migration \
     -p 5432:5432 \
     -d postgres:15
   ```

2. **Copy backup file to container:**
   ```bash
   # First, copy your backup file to the project root
   cp /path/to/your/db_cluster-22-02-2025@12-22-20.backup ./supabase-backup.backup
   
   # Copy to container
   docker cp supabase-backup.backup postgres-migration:/tmp/
   ```

3. **Restore the backup:**
   ```bash
   docker exec -it postgres-migration pg_restore \
     -U postgres -d postgres -v \
     /tmp/supabase-backup.backup
   ```

4. **Verify restoration:**
   ```bash
   docker exec -it postgres-migration psql -U postgres -c "\dt"
   ```

## Option 2: Local PostgreSQL Installation

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb migration_db
```

### macOS
```bash
brew install postgresql
brew services start postgresql
createdb migration_db
```

### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install and set up a database
3. Use pgAdmin or command line tools

### Restore backup locally
```bash
pg_restore -h localhost -U postgres -d migration_db -v supabase-backup.backup
```

## Environment Variables

Create a `.env.migration` file in the project root:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=migration
```

## Next Steps

1. Place your backup file in the project root as `supabase-backup.backup`
2. Set up PostgreSQL using one of the methods above
3. Run the extraction script: `node migration-scripts/extract-supabase-data.js`
4. Install Firebase Admin SDK dependencies
5. Run the migration script: `node migration-scripts/migrate-to-firebase.js`

## Troubleshooting

### Permission denied errors
```bash
# If you get permission errors with Docker:
sudo docker exec -it postgres-migration pg_restore -U postgres -d postgres -v /tmp/supabase-backup.backup
```

### Connection refused
- Make sure PostgreSQL is running
- Check port 5432 is not in use by another service
- Verify environment variables are correct

### Backup file format errors
- Ensure the backup file is a valid PostgreSQL dump
- Try using `pg_restore --list supabase-backup.backup` to verify format