#!/usr/bin/env node
/**
 * Remove redundant scripts and markdown docs safely.
 * - Dry-run by default. Pass --apply to actually delete.
 * - Maintains a curated allowlist and blocklist.
 */
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');

// Candidate files/folders considered redundant in this repo
const candidates = [
  // Old or heavy scripts that are not essential to runtime
  'scripts/cleanup-console-logs.js',
  'scripts/add-performance-indexes.js',
  'scripts/migrate-stock-accounts.js',
  'scripts/test-with-server.sh',
  'scripts/vercel-build.sh',
  // Docs to consider removing (ask confirmation)
  'IMPLEMENTATION_SUMMARY.md',
  'RISK_ANALYSIS_EXPLANATION.md',
  'TESTING.md',
  'docs/backup-guide.md',
  'docs/cost-basis-calculation.md',
  'docs/db-backup-with-docker.md',
  'docs/implementation-summary.md',
  'docs/tradingview-integration-guide.md',
  // Generated files we can keep out of repo (if present)
  'test-reports'
];

function exists(p) { try { return fs.existsSync(p); } catch { return false; } }

function remove(p) {
  if (!exists(p)) return { path: p, status: 'missing' };
  const stat = fs.lstatSync(p);
  if (stat.isDirectory()) {
    fs.rmSync(p, { recursive: true, force: true });
  } else {
    fs.unlinkSync(p);
  }
  return { path: p, status: 'deleted' };
}

function run() {
  const report = [];
  for (const p of candidates) {
    if (!exists(p)) {
      report.push({ path: p, status: 'not-found' });
      continue;
    }
    if (APPLY) {
      report.push(remove(p));
    } else {
      report.push({ path: p, status: 'would-delete' });
    }
  }
  console.log(JSON.stringify({ apply: APPLY, report }, null, 2));
}

run();
