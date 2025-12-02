#!/usr/bin/env node

/**
 * 🛡️ SECURE MANUAL BACKUP SYSTEM (REFACTORED)
 * Fixed Command Injection vulnerabilities
 * Version: 3.0 - Security Hardened
 * 
 * SECURITY IMPROVEMENTS:
 * - ✅ Uses execFile instead of exec (no shell interpolation)
 * - ✅ Uses fs-extra for file operations (no shell commands)
 * - ✅ Input validation and sanitization
 * - ✅ Path traversal prevention
 * - ✅ Whitelisted commands only
 */

const fs = require('fs-extra');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');

const execFileAsync = promisify(execFile);

// ===================================
// SECURITY: Input Validation
// ===================================

class SecurityValidator {
  /**
   * Validate and sanitize file path to prevent path traversal
   */
  static validatePath(inputPath, allowedBaseDir) {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('Invalid path: must be a non-empty string');
    }

    // Resolve to absolute path
    const absolutePath = path.resolve(inputPath);
    const baseDir = path.resolve(allowedBaseDir || process.cwd());

    // Ensure path is within allowed directory
    if (!absolutePath.startsWith(baseDir)) {
      throw new Error(`Path traversal detected: ${inputPath} is outside ${baseDir}`);
    }

    // Check for dangerous characters
    if (/[;&|`$()\\]/.test(inputPath)) {
      throw new Error(`Dangerous characters detected in path: ${inputPath}`);
    }

    return absolutePath;
  }

  /**
   * Validate database connection string
   */
  static validateDatabaseUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid DATABASE_URL');
    }

    // Must start with postgresql:// or postgres://
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      throw new Error('Invalid DATABASE_URL format');
    }

    return url;
  }

  /**
   * Sanitize filename for safe usage
   */
  static sanitizeFilename(filename) {
    // Remove any path separators and dangerous characters
    return filename
      .replace(/[\/\\]/g, '')
      .replace(/[;&|`$()]/g, '')
      .replace(/\s+/g, '_');
  }
}

// ===================================
// SECURE BACKUP MANAGER
// ===================================

class SecureBackupManager {
  constructor() {
    this.backupBaseDir = path.join(process.cwd(), 'backups');
    this.config = {
      compressionLevel: 6,
      maxBackups: 10,
      dbUrl: process.env.DATABASE_URL
    };

    // Validate environment
    if (!this.config.dbUrl) {
      throw new Error('DATABASE_URL not set in environment');
    }
    
    SecurityValidator.validateDatabaseUrl(this.config.dbUrl);
  }

  /**
   * ✅ SECURE: Get directory size using fs instead of shell
   */
  async getDirectorySize(dirPath) {
    const safePath = SecurityValidator.validatePath(dirPath, process.cwd());
    
    let totalSize = 0;
    
    async function calculateSize(dir) {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          await calculateSize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    }
    
    await calculateSize(safePath);
    return totalSize;
  }

  /**
   * ✅ SECURE: Check PostgreSQL availability using execFile (no shell)
   */
  async checkPostgresAvailability() {
    const requirements = [
      { cmd: 'pg_dump', name: 'PostgreSQL pg_dump' },
      { cmd: 'gzip', name: 'gzip compression' }
    ];

    for (const req of requirements) {
      try {
        // ✅ SECURE: execFile with array args, no shell interpolation
        await execFileAsync('which', [req.cmd]);
        console.log(`✅ ${req.name} available`);
      } catch (error) {
        throw new Error(`❌ ${req.name} not found. Please install PostgreSQL client tools.`);
      }
    }
  }

  /**
   * ✅ SECURE: Create backup directory using fs-extra
   */
  async createBackupDirectory(backupName) {
    const sanitizedName = SecurityValidator.sanitizeFilename(backupName);
    const backupDir = path.join(this.backupBaseDir, sanitizedName);
    
    // Validate path
    SecurityValidator.validatePath(backupDir, this.backupBaseDir);
    
    // ✅ SECURE: Use fs-extra instead of shell commands
    await fs.ensureDir(backupDir);
    return backupDir;
  }

  /**
   * ✅ SECURE: Database dump using execFile with array arguments
   */
  async performDatabaseDump(backupDir, dumpType = 'full') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpFile = path.join(backupDir, `database_${dumpType}_${timestamp}.sql`);
    
    // Validate paths
    SecurityValidator.validatePath(dumpFile, this.backupBaseDir);
    
    // Parse DATABASE_URL safely
    const dbUrl = new URL(this.config.dbUrl);
    
    // ✅ SECURE: Build command arguments as array (no shell interpolation)
    const pgDumpArgs = [
      '-h', dbUrl.hostname,
      '-p', dbUrl.port || '5432',
      '-U', dbUrl.username,
      '-d', dbUrl.pathname.slice(1), // Remove leading /
      '-F', 'p', // Plain format
      '--no-password'
    ];

    if (dumpType === 'schema') {
      pgDumpArgs.push('--schema-only');
    } else if (dumpType === 'data') {
      pgDumpArgs.push('--data-only');
    }

    pgDumpArgs.push('-f', dumpFile);

    console.log(`📦 Creating ${dumpType} database dump...`);
    
    try {
      // ✅ SECURE: execFile with array args, set password via env
      await execFileAsync('pg_dump', pgDumpArgs, {
        env: {
          ...process.env,
          PGPASSWORD: dbUrl.password
        },
        timeout: 300000 // 5 minutes timeout
      });
      
      console.log(`✅ Database dump created: ${path.basename(dumpFile)}`);
      
      // ✅ SECURE: Compress using execFile
      await this.compressFile(dumpFile);
      
      return `${dumpFile}.gz`;
    } catch (error) {
      console.error(`❌ Database dump failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✅ SECURE: Compress file using execFile
   */
  async compressFile(filePath) {
    SecurityValidator.validatePath(filePath, this.backupBaseDir);
    
    console.log(`🗜️ Compressing ${path.basename(filePath)}...`);
    
    try {
      // ✅ SECURE: execFile with array args
      await execFileAsync('gzip', [
        `-${this.config.compressionLevel}`,
        filePath
      ]);
      
      console.log(`✅ Compressed successfully`);
    } catch (error) {
      console.error(`❌ Compression failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✅ SECURE: Copy application files using fs-extra
   */
  async backupApplicationFiles(backupDir) {
    console.log('\n📁 Backing up application files...');
    
    const filesToBackup = [
      'package.json',
      'package-lock.json',
      'prisma/schema.prisma',
      '.env.example'
    ];

    const fileBackupDir = path.join(backupDir, 'app_files');
    await fs.ensureDir(fileBackupDir);

    for (const file of filesToBackup) {
      const srcPath = path.join(process.cwd(), file);
      
      if (await fs.pathExists(srcPath)) {
        const destPath = path.join(fileBackupDir, path.basename(file));
        
        // ✅ SECURE: Use fs-extra copy (no shell commands)
        await fs.copy(srcPath, destPath);
        console.log(`✅ Backed up: ${file}`);
      }
    }

    // Backup uploads directory if exists
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    if (await fs.pathExists(uploadsDir)) {
      const uploadsBackup = path.join(fileBackupDir, 'uploads');
      await fs.copy(uploadsDir, uploadsBackup);
      console.log('✅ Backed up: public/uploads');
    }
  }

  /**
   * ✅ SECURE: Create archive using tar with execFile
   */
  async createArchive(backupDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveName = `backup_${timestamp}.tar.gz`;
    const archivePath = path.join(this.backupBaseDir, archiveName);
    
    console.log('\n📦 Creating compressed archive...');
    
    try {
      // ✅ SECURE: execFile with array args
      await execFileAsync('tar', [
        '-czf',
        archivePath,
        '-C',
        this.backupBaseDir,
        path.basename(backupDir)
      ]);
      
      console.log(`✅ Archive created: ${archiveName}`);
      
      // ✅ SECURE: Remove temp directory using fs-extra
      await fs.remove(backupDir);
      console.log('✅ Cleaned up temporary files');
      
      return archivePath;
    } catch (error) {
      console.error(`❌ Archive creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✅ SECURE: Cleanup old backups using fs-extra
   */
  async cleanupOldBackups() {
    console.log('\n🧹 Cleaning up old backups...');
    
    try {
      const files = await fs.readdir(this.backupBaseDir);
      const backups = files
        .filter(f => f.startsWith('backup_') && f.endsWith('.tar.gz'))
        .map(f => ({
          name: f,
          path: path.join(this.backupBaseDir, f),
          time: fs.statSync(path.join(this.backupBaseDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      if (backups.length > this.config.maxBackups) {
        const toDelete = backups.slice(this.config.maxBackups);
        
        for (const backup of toDelete) {
          // ✅ SECURE: Use fs-extra remove (no shell commands)
          await fs.remove(backup.path);
          console.log(`🗑️ Deleted old backup: ${backup.name}`);
        }
      }
      
      console.log(`✅ Kept ${Math.min(backups.length, this.config.maxBackups)} most recent backups`);
    } catch (error) {
      console.error(`❌ Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Main backup execution
   */
  async performFullBackup() {
    console.log('🚀 Starting secure backup process...');
    console.log('═'.repeat(60));
    
    try {
      // Check requirements
      await this.checkPostgresAvailability();
      
      // Create backup directory
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = await this.createBackupDirectory(`temp_${timestamp}`);
      
      // Perform database dumps
      await this.performDatabaseDump(backupDir, 'full');
      
      // Backup application files
      await this.backupApplicationFiles(backupDir);
      
      // Create archive
      const archivePath = await this.createArchive(backupDir);
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      console.log('\n🎉 BACKUP COMPLETED SUCCESSFULLY!');
      console.log(`📦 Archive: ${archivePath}`);
      console.log('═'.repeat(60));
      
      return archivePath;
    } catch (error) {
      console.error('\n❌ BACKUP FAILED:', error.message);
      throw error;
    }
  }
}

// ===================================
// MAIN EXECUTION
// ===================================

async function main() {
  try {
    const manager = new SecureBackupManager();
    await manager.performFullBackup();
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = SecureBackupManager;
