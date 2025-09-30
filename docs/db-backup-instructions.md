# DB Backup (No External Client)

This guide explains how to export your PostgreSQL database to JSON files using a Node.js script with Prisma. No `psql`/`pg_dump` is required.

The backup script: `scripts/db-backup-without-client.js`
The npm command: `npm run backup`

---

## 1) Prerequisites
- Node.js 18+ installed
- Project dependencies installed: `npm ci` or `npm install`
- `.env` configured with a valid `DATABASE_URL`

Example `.env` (redacted):
```
DATABASE_URL="postgresql://user:***@host:5432/dbname"
```

---

## 2) Safety Guard (IMPORTANT)
To prevent accidental production deletion or unsafe actions, the backup script has a safety check:
- If `DATABASE_URL` looks like production (e.g. `supabase.co`, `supabase.com`, major cloud DB hosts), the script will refuse to run unless you explicitly allow it.
- To allow backup on production, pass `--allow-prod` or set `BACKUP_ALLOW_PROD=true`.

Examples:
```
# Permit backup on production URL via flag
node scripts/db-backup-without-client.js --allow-prod

# Or via environment variable
BACKUP_ALLOW_PROD=true node scripts/db-backup-without-client.js
```

---

## 3) Quick Start (Default Backup)
This runs a full backup of all tables into a timestamped folder under `./backups/`.

Option A (npm script):
```
npm run backup
```

Option B (call script directly):
```
node scripts/db-backup-without-client.js
```

Output structure (example):
```
backups/
  db-backup-2025-09-30T13-59-12-345Z/
    User.json
    Transaction.json
    StockAccount.json
    ...
    backup-metadata.json
```

---

## 4) Custom Options
You can customize output directory, table selection, and chunk size.

- Output directory
```
node scripts/db-backup-without-client.js --out=./backups/prod-2025-09-30
```

- Select specific tables only (comma-separated). Names are Prisma model delegates (e.g. `User,Transaction,PurchaseLot`):
```
node scripts/db-backup-without-client.js --tables=User,Transaction,PurchaseLot
```

- Change chunk size (default 1000 rows per batch):
```
node scripts/db-backup-without-client.js --chunk=2000
```

- Allow production backup (required when `DATABASE_URL` is production-like):
```
node scripts/db-backup-without-client.js --allow-prod
# or
BACKUP_ALLOW_PROD=true node scripts/db-backup-without-client.js
```

---

## 5) Verify Backup
- Ensure a new folder is created in `./backups/`
- Check each JSON file is non-empty for tables that contain data
- Inspect `backup-metadata.json` for:
  - `createdAt`
  - masked `databaseUrl`
  - exported `tables` with row counts
  - `chunkSize`

Example:
```
{
  "createdAt": "2025-09-30T14:00:12.000Z",
  "databaseUrlMasked": "postgresql://user:***@host:5432/dbname",
  "chunkSize": 1000,
  "tables": [
    { "name": "User", "count": 10, "file": "User.json" },
    { "name": "Transaction", "count": 1234, "file": "Transaction.json" }
  ]
}
```

---

## 6) Recommended Workflows
- Development/Test backup:
```
# Use a local/test DB URL
npm run backup
```

- Production backup (manual):
```
# Make sure you understand the safety guard and implications
BACKUP_ALLOW_PROD=true npm run backup
# Or
node scripts/db-backup-without-client.js --allow-prod --out=./backups/prod-$(date +%F)
```

- Backup selected critical tables only (faster, smaller):
```
node scripts/db-backup-without-client.js --tables=User,Transaction,PurchaseLot --allow-prod
```

---

## 7) Troubleshooting
- "DATABASE_URL is not set":
  - Ensure `.env` is present and contains `DATABASE_URL`
- "Refused to run on production":
  - Add `--allow-prod` or `BACKUP_ALLOW_PROD=true` if you intend to back up production
- "Out of memory" on very large datasets:
  - Increase `--chunk` size moderately or ensure sufficient disk space
- Permission errors writing to `./backups/`:
  - Run from project root and ensure write permissions

---

## 8) Notes on Restore
This script produces JSON files. You can restore data by writing an import script using Prisma to read each JSON file and reinsert records, or use a database admin tool that supports JSON import. For point-in-time restore or full engine backups, consider managed DB provider backups.

---

## 9) Reference
- Script: `scripts/db-backup-without-client.js`
- NPM: `npm run backup`
- Env flags: `BACKUP_ALLOW_PROD=true`
- CLI flags: `--allow-prod`, `--out`, `--tables`, `--chunk`
