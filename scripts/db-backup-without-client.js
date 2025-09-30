#!/usr/bin/env node

/**
 * DB Backup (No external Postgres client required)
 * - Uses Prisma Client to export all tables to JSON files
 * - Streams data in chunks to avoid high memory usage
 * - Creates a timestamped backup folder under ./backups/
 * - Safety guard for production URLs (require --allow-prod or BACKUP_ALLOW_PROD=true)
 *
 * Usage:
 *   node scripts/db-backup-without-client.js [--out=<dir>] [--tables=User,Transaction] [--chunk=1000] [--allow-prod]
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const argv = process.argv.slice(2);
const arg = (name, def = undefined) => {
  const p = argv.find(a => a.startsWith(`--${name}=`));
  return p ? p.split('=')[1] : def;
};
const hasFlag = (name) => argv.includes(`--${name}`);

(async () => {
  // Safety checks
  const dbUrl = process.env.DATABASE_URL || '';
  const isProdLike = /supabase\.(co|com)|amazonaws|render\.com|neon\.tech|railway|cloud/.test(dbUrl);
  const allowProd = hasFlag('allow-prod') || process.env.BACKUP_ALLOW_PROD === 'true';
  if (isProdLike && !allowProd) {
    console.error('\n❌ Safety guard: Detected production-like DATABASE_URL.');
    console.error('   To proceed, pass --allow-prod or set BACKUP_ALLOW_PROD=true');
    process.exit(1);
  }
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
  }

  // Initialize Prisma
  const prisma = new PrismaClient();

  // Resolve output folder
  const outArg = arg('out');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = outArg || path.join(process.cwd(), 'backups', `db-backup-${timestamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  // Determine delegates (tables) dynamically
  // Pick keys on prisma that expose findMany (model delegates)
  const delegateKeys = Object.keys(prisma).filter(k => {
    try { return typeof prisma[k]?.findMany === 'function'; } catch { return false; }
  });

  // If user specified --tables, filter the list
  const tablesArg = arg('tables');
  let targets = delegateKeys;
  if (tablesArg) {
    const requested = tablesArg.split(',').map(s => s.trim()).filter(Boolean);
    targets = delegateKeys.filter(k => requested.includes(k) || requested.map(x => x.toLowerCase()).includes(k.toLowerCase()));
    const missing = requested.filter(r => !targets.find(t => t.toLowerCase() === r.toLowerCase()));
    if (missing.length) {
      console.warn(`⚠️  Some requested tables not found in Prisma delegates: ${missing.join(', ')}`);
    }
  }

  const chunkSize = parseInt(arg('chunk', '1000'), 10);
  const meta = {
    createdAt: new Date().toISOString(),
    databaseUrlMasked: dbUrl.replace(/:\\w+@/, ':***@'),
    chunkSize,
    tables: [],
    notes: 'Backup created via Prisma without external DB client',
  };

  console.log(`📦 Starting DB backup to ${outDir}`);
  console.log(`🗃️  Tables to export: ${targets.join(', ')}`);

  // Helper to stream a table as JSON array without loading full data into memory
  async function exportTable(delegateKey) {
    const filePath = path.join(outDir, `${delegateKey}.json`);
    const ws = fs.createWriteStream(filePath, { encoding: 'utf-8' });

    let total = 0;
    let cursor = undefined;
    let firstChunk = true;

    ws.write('[');

    while (true) {
      const where = {};
      const orderBy = { id: 'asc' };
      const query = cursor
        ? prisma[delegateKey].findMany({ take: chunkSize, skip: 1, cursor, orderBy })
        : prisma[delegateKey].findMany({ take: chunkSize, orderBy });

      const rows = await query;
      if (!rows.length) break;

      rows.forEach((row, idx) => {
        const json = JSON.stringify(row);
        if (!firstChunk || idx > 0) ws.write(',');
        ws.write(json);
      });

      total += rows.length;
      const last = rows[rows.length - 1];
      if (!last || !last.id) {
        // Fallback to offset pagination if model doesn't have id
        // Note: Fewer models in this schema lack id, so we continue simple export
        // For safety, break to avoid infinite loop
        break;
      }
      cursor = { id: last.id };
      firstChunk = false;
      if (rows.length < chunkSize) break; // done
    }

    ws.write(']');
    ws.end();
    await new Promise(res => ws.on('close', res));

    return { filePath, count: total };
  }

  try {
    const results = {};
    for (const key of targets) {
      console.log(`→ Exporting ${key} ...`);
      try {
        const r = await exportTable(key);
        results[key] = r.count;
        meta.tables.push({ name: key, count: r.count, file: path.basename(r.filePath) });
        console.log(`   ✓ ${key}: ${r.count} rows`);
      } catch (e) {
        console.warn(`   ✗ Skipped ${key}: ${e.message}`);
      }
    }

    // Write metadata
    fs.writeFileSync(path.join(outDir, 'backup-metadata.json'), JSON.stringify(meta, null, 2));
    console.log('\n✅ Backup completed. Summary:');
    for (const [k, v] of Object.entries(results)) console.log(`   - ${k}: ${v} rows`);
    console.log(`\n📁 Location: ${outDir}`);
    console.log('\nRestore guidance: import each JSON file per table via your admin tool or custom restore script.');
  } catch (err) {
    console.error('💥 Backup failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
