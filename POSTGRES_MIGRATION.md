# Migrating from SQLite to PostgreSQL

This guide explains how to migrate your Trading Journal application from SQLite to PostgreSQL.

## Prerequisites

1. Install PostgreSQL on your system or use a cloud service
2. Basic knowledge of PostgreSQL setup and management

## Step 1: Install PostgreSQL Database

### On Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### On macOS (using Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

### On Windows
Download and install PostgreSQL from the [official website](https://www.postgresql.org/download/windows/).

## Step 2: Create Database and User

Connect to PostgreSQL:
```bash
sudo -u postgres psql
```

Create the database and user:
```sql
CREATE DATABASE trading_journal;
CREATE USER tjuser WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE trading_journal TO tjuser;
```

## Step 3: Configure Connection String

Update your `.env` file with the PostgreSQL connection string:
```
DATABASE_URL="postgresql://tjuser:your_secure_password@localhost:5432/trading_journal"
```

Make sure to adjust the username, password, host, and database name according to your setup.

## Step 4: Reset and Generate New Migrations

Since you're changing database providers, it's best to reset migrations and create new ones for PostgreSQL.

1. Delete the old migration folder:
```bash
rm -rf prisma/migrations
```

2. Generate a new migration:
```bash
npx prisma migrate dev --name init
```

## Step 5: Verify the Migration

1. Generate the Prisma client:
```bash
npx prisma generate
```

2. Start your application:
```bash
npm run dev
```

3. Test database operations in your application.

## Step 6: Data Migration (Optional)

If you need to migrate data from your SQLite database to PostgreSQL:

1. Create a backup of your SQLite data:
```bash
npx ts-node scripts/export-data.js
```

2. Import data into PostgreSQL:
```bash
npx ts-node scripts/import-data.js
```

You may need to create these scripts to handle the data migration process.

## Troubleshooting

- **Connection Issues**: Ensure PostgreSQL is running and accepting connections.
- **Permission Denied**: Check that your database user has proper permissions.
- **Prisma Client Errors**: Re-generate the Prisma client if encountering type errors.

## Note on Production Deployments

For production environments, ensure your PostgreSQL instance has:
- Regular backups
- Proper security configuration
- Sufficient resources for your application's needs 