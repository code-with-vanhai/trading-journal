#!/usr/bin/env node

/**
 * 🛡️ SECURE BACKUP RESTORE SYSTEM (REFACTORED)
 * Fixed Command Injection vulnerabilities
 * Version: 3.0 - Security Hardened
 * 
 * SECURITY IMPROVEMENTS:
 * - ✅ Uses execFile instead of exec (no shell interpolation)
 * - ✅ Uses fs-extra for file operations (no shell commands)
 * - ✅ Input validation and sanitization
 * - ✅ Path traversal prevention
 * - ✅ Archive integrity checks
 */

const fs = require('fs-extra');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');

const execFileAsync = promisify(execFile);

// ===================================
// SECURITY: Input Validation
// ===================================

class SecurityValidator {
  static validatePath(inputPath, allowedBaseDir) {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('Invalid path: must be a non-empty string');
    }

    const absolutePath = path.resolve(inputPath);
    const baseDir = path.resolve(allowedBaseDir || process.cwd());

    if (!absolutePath.startsWith(baseDir)) {
      throw new Error(`Path traversal detected: ${inputPath} is outside ${baseDir}`);
    }

    if (/[;&|`$()\\]/.test(inputPath)) {
      throw new Error(`Dangerous characters detected in path: ${inputPath}`);
    }

    return absolutePath;
  }

  static validateArchiveName(filename) {
    // Must be .tar.gz and contain only safe characters
    if (!filename.endsWith('.tar.gz')) {
      throw new Error('Archive must be .tar.gz format');
    }

    if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
      throw new Error('Archive name contains invalid characters');
    }

    return filename;
  }

  static async validateArchiveIntegrity(archivePath) {
    try {
      // Check if file exists and is readable
      const stats = await fs.stat(archivePath);
      
      if (!stats.isFile()) {
        throw new Error('Archive is not a file');
      }

      if (stats.size === 0) {
        throw new Error('Archive is empty');
      }

      // Test tar archive integrity without extracting
      await execFileAsync('tar', ['-tzf', archivePath, '--exclude', '*'], {
        timeout: 30000
      });

      return true;
    } catch (error) {
      throw new Error(`Archive integrity check failed: ${error.message}`);
    }
  }
}

// ===================================
// SECURE RESTORE MANAGER
// ===================================

class SecureRestoreManager {
  constructor(backupPath) {
    this.backupPath = backupPath;
    this.backupBaseDir = path.join(process.cwd(), 'backups');
    this.extractDir = null;
    
    // Validate environment
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set in environment');
    }

    // Validate backup path
    try {
      this.backupPath = SecurityValidator.validatePath(backupPath, this.backupBaseDir);
      SecurityValidator.validateArchiveName(path.basename(backupPath));
    } catch (error) {
      throw new Error(`Invalid backup path: ${error.message}`);
    }
  }

  /**
   * ✅ SECURE: Extract archive using execFile with validation
   */
  async extractBackup() {
    console.log('📦 Extracting backup archive...');
    
    // Validate archive integrity first
    await SecurityValidator.validateArchiveIntegrity(this.backupPath);
    
    // Create temporary extraction directory
    const timestamp = Date.now();
    this.extractDir = path.join(this.backupBaseDir, `restore_temp_${timestamp}`);
    await fs.ensureDir(this.extractDir);
    
    try {
      // ✅ SECURE: execFile with array args
      await execFileAsync('tar', [
        '-xzf',
        this.backupPath,
        '-C',
        this.extractDir
      ], {
        timeout: 300000 // 5 minutes
      });
      
      console.log('✅ Archive extracted successfully');
      
      // List extracted contents
      const contents = await fs.readdir(this.extractDir);
      console.log('📋 Extracted contents:', contents.join(', '));
      
      return this.extractDir;
    } catch (error) {
      // Cleanup on failure
      await fs.remove(this.extractDir);
      throw new Error(`Archive extraction failed: ${error.message}`);
    }
  }

  /**
   * ✅ SECURE: Find database dump file with validation
   */
  async findDatabaseDump() {
    console.log('\n🔍 Locating database dump...');
    
    const searchDirs = [this.extractDir];
    const subdirs = await fs.readdir(this.extractDir);
    
    for (const subdir of subdirs) {
      const subdirPath = path.join(this.extractDir, subdir);
      const stats = await fs.stat(subdirPath);
      
      if (stats.isDirectory()) {
        searchDirs.push(subdirPath);
      }
    }

    for (const dir of searchDirs) {
      const files = await fs.readdir(dir);
      const dumpFiles = files.filter(f => 
        f.startsWith('database_') && f.endsWith('.sql.gz')
      );
      
      if (dumpFiles.length > 0) {
        const dumpPath = path.join(dir, dumpFiles[0]);
        console.log(`✅ Found database dump: ${dumpFiles[0]}`);
        return dumpPath;
      }
    }

    throw new Error('Database dump file not found in archive');
  }

  /**
   * ✅ SECURE: Decompress SQL dump using execFile
   */
  async decompressDump(dumpPath) {
    SecurityValidator.validatePath(dumpPath, this.extractDir);
    
    console.log('\n🗜️ Decompressing database dump...');
    
    const sqlFile = dumpPath.replace('.gz', '');
    
    try {
      // ✅ SECURE: execFile with array args (gunzip to stdout, then write)
      const { stdout } = await execFileAsync('gunzip', [
        '-c',
        dumpPath
      ], {
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer
        timeout: 300000
      });
      
      // Write decompressed content to file
      await fs.writeFile(sqlFile, stdout);
      
      console.log('✅ Decompression completed');
      return sqlFile;
    } catch (error) {
      throw new Error(`Decompression failed: ${error.message}`);
    }
  }

  /**
   * ✅ SECURE: Restore database using execFile with array args
   */
  async restoreDatabase(sqlFile) {
    SecurityValidator.validatePath(sqlFile, this.extractDir);
    
    console.log('\n🗄️ Restoring database...');
    console.log('⚠️  This will OVERWRITE existing data!');
    
    // Parse DATABASE_URL safely
    const dbUrl = new URL(process.env.DATABASE_URL);
    
    // ✅ SECURE: Build psql arguments as array
    const psqlArgs = [
      '-h', dbUrl.hostname,
      '-p', dbUrl.port || '5432',
      '-U', dbUrl.username,
      '-d', dbUrl.pathname.slice(1),
      '-f', sqlFile,
      '--set', 'ON_ERROR_STOP=on',
      '--no-password'
    ];

    try {
      // ✅ SECURE: execFile with array args, password via env
      await execFileAsync('psql', psqlArgs, {
        env: {
          ...process.env,
          PGPASSWORD: dbUrl.password
        },
        timeout: 600000 // 10 minutes
      });
      
      console.log('✅ Database restored successfully');
      return true;
    } catch (error) {
      throw new Error(`Database restore failed: ${error.message}`);
    }
  }

  /**
   * ✅ SECURE: Restore application files using fs-extra
   */
  async restoreApplicationFiles() {
    console.log('\n📁 Restoring application files...');
    
    const fileBackupDir = path.join(this.extractDir, 'app_files');
    
    if (!(await fs.pathExists(fileBackupDir))) {
      // Try to find it in subdirectories
      const subdirs = await fs.readdir(this.extractDir);
      
      for (const subdir of subdirs) {
        const testPath = path.join(this.extractDir, subdir, 'app_files');
        if (await fs.pathExists(testPath)) {
          console.log(`✅ Found app_files in ${subdir}`);
          return await this.restoreFilesFromDirectory(testPath);
        }
      }
      
      console.log('⚠️  No application files found in backup');
      return false;
    }

    return await this.restoreFilesFromDirectory(fileBackupDir);
  }

  /**
   * Helper to restore files from a directory
   */
  async restoreFilesFromDirectory(sourceDir) {
    const files = await fs.readdir(sourceDir);
    let restoredCount = 0;

    for (const file of files) {
      const srcPath = path.join(sourceDir, file);
      const stats = await fs.stat(srcPath);

      if (stats.isFile()) {
        // Create backup of existing file before overwrite
        const destPath = path.join(process.cwd(), file);
        
        if (await fs.pathExists(destPath)) {
          const backupPath = `${destPath}.backup.${Date.now()}`;
          await fs.copy(destPath, backupPath);
          console.log(`📋 Backed up existing: ${file}`);
        }
        
        // ✅ SECURE: Use fs-extra copy
        await fs.copy(srcPath, destPath);
        console.log(`✅ Restored: ${file}`);
        restoredCount++;
      } else if (stats.isDirectory() && file === 'uploads') {
        // Restore uploads directory
        const destPath = path.join(process.cwd(), 'public/uploads');
        
        if (await fs.pathExists(destPath)) {
          const backupPath = `${destPath}.backup.${Date.now()}`;
          await fs.copy(destPath, backupPath);
        }
        
        await fs.copy(srcPath, destPath);
        console.log('✅ Restored: public/uploads');
        restoredCount++;
      }
    }

    console.log(`✅ Restored ${restoredCount} items`);
    return true;
  }

  /**
   * ✅ SECURE: Test database connection
   */
  async testDatabaseConnection() {
    console.log('\n🔌 Testing database connection...');
    
    const dbUrl = new URL(process.env.DATABASE_URL);
    
    try {
      // ✅ SECURE: execFile with array args
      const { stdout } = await execFileAsync('psql', [
        '-h', dbUrl.hostname,
        '-p', dbUrl.port || '5432',
        '-U', dbUrl.username,
        '-d', dbUrl.pathname.slice(1),
        '-c', 'SELECT COUNT(*) FROM "User";',
        '--no-password',
        '-t'
      ], {
        env: {
          ...process.env,
          PGPASSWORD: dbUrl.password
        },
        timeout: 10000
      });
      
      const userCount = parseInt(stdout.trim());
      console.log(`✅ Connection successful. Found ${userCount} users in database.`);
      return true;
    } catch (error) {
      throw new Error(`Database connection test failed: ${error.message}`);
    }
  }

  /**
   * ✅ SECURE: Cleanup temporary files using fs-extra
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up temporary files...');
    
    if (this.extractDir && await fs.pathExists(this.extractDir)) {
      // ✅ SECURE: Use fs-extra remove
      await fs.remove(this.extractDir);
      console.log('✅ Temporary files removed');
    }
  }

  /**
   * Main restore execution
   */
  async performRestore(options = {}) {
    console.log('🔄 Starting secure restore process...');
    console.log('═'.repeat(60));
    console.log(`📦 Backup file: ${path.basename(this.backupPath)}`);
    console.log('═'.repeat(60));
    
    try {
      // Extract backup
      await this.extractBackup();
      
      // Find and decompress database dump
      const dumpPath = await this.findDatabaseDump();
      const sqlFile = await this.decompressDump(dumpPath);
      
      // Restore database
      if (options.databaseOnly !== false) {
        await this.restoreDatabase(sqlFile);
      }
      
      // Restore application files
      if (options.filesOnly !== false) {
        await this.restoreApplicationFiles();
      }
      
      // Test connection
      await this.testDatabaseConnection();
      
      console.log('\n🎉 RESTORE COMPLETED SUCCESSFULLY!');
      console.log('═'.repeat(60));
      
      return true;
    } catch (error) {
      console.error('\n❌ RESTORE FAILED:', error.message);
      throw error;
    } finally {
      // Always cleanup
      await this.cleanup();
    }
  }
}

// ===================================
// CLI INTERFACE
// ===================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node backup-restore.SECURE.js <backup-file.tar.gz>');
    console.log('\nExample:');
    console.log('  node backup-restore.SECURE.js backups/backup_2025-01-15.tar.gz');
    process.exit(1);
  }

  const backupFile = args[0];
  
  try {
    const manager = new SecureRestoreManager(backupFile);
    await manager.performRestore();
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

module.exports = SecureRestoreManager;
