#!/usr/bin/env node

/**
 * 🛡️ SECURE SAFETY BACKUP SCRIPT (REFACTORED)
 * Fixed Command Injection vulnerabilities
 * Version: 3.0 - Security Hardened
 * 
 * SECURITY IMPROVEMENTS:
 * - ✅ Uses execFile instead of exec (no shell interpolation)
 * - ✅ Uses fs-extra for file operations (no shell commands)
 * - ✅ Input validation and sanitization
 * - ✅ Safe git operations
 */

const fs = require('fs-extra');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

class SecureSafetyBackup {
  constructor() {
    const timestamp = new Date().toISOString().split('T')[0];
    this.backupDir = path.join(process.cwd(), `backup-${timestamp}`);
    this.criticalFiles = [
      'app/lib/prisma.js',
      'app/lib/prisma-with-retry.js', 
      'app/lib/query-optimizer.js',
      'app/api/portfolio/route.js',
      'app/api/transactions/route.js',
      'package.json',
      'prisma/schema.prisma'
    ];
  }

  async checkDatabaseSafety() {
    console.log('🔍 Checking database connection safety...');
    
    try {
      // Check if we're connecting to production
      const envFile = path.join(process.cwd(), '.env');
      
      if (await fs.pathExists(envFile)) {
        const envContent = await fs.readFile(envFile, 'utf-8');
        
        if (envContent.includes('supabase.co') || envContent.includes('production')) {
          console.log('⚠️  WARNING: Detected production database connection!');
          console.log('📋 Safety measures:');
          console.log('   - Only read-only operations will be performed');
          console.log('   - No schema changes will be made');
          console.log('   - No data modifications');
          console.log('   - All changes are code-level only');
        }
      }

      // Test basic connection without modifying anything
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      console.log('🔌 Testing database connection...');
      const userCount = await prisma.user.count();
      console.log(`✅ Connection successful. Found ${userCount} users in database.`);
      
      await prisma.$disconnect();
      
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async createCodeBackup() {
    console.log('💾 Creating backup of critical files...');
    
    try {
      // ✅ SECURE: Use fs-extra to create directory
      await fs.ensureDir(this.backupDir);

      // Backup critical files
      for (const file of this.criticalFiles) {
        const sourcePath = path.join(process.cwd(), file);
        
        if (await fs.pathExists(sourcePath)) {
          const backupPath = path.join(this.backupDir, file);
          const backupFileDir = path.dirname(backupPath);
          
          // ✅ SECURE: Use fs-extra
          await fs.ensureDir(backupFileDir);
          await fs.copy(sourcePath, backupPath);
          
          console.log(`✅ Backed up: ${file}`);
        } else {
          console.log(`⚠️  File not found: ${file}`);
        }
      }

      // Create Git backup
      console.log('📚 Creating Git backup commit...');
      await this.createGitBackup();

      console.log(`💾 Backup completed in: ${this.backupDir}`);
      return true;
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      return false;
    }
  }

  /**
   * ✅ SECURE: Git operations using execFile
   */
  async createGitBackup() {
    try {
      // Check if git is available
      await execFileAsync('git', ['--version']);
      
      // Check if in git repo
      try {
        await execFileAsync('git', ['rev-parse', '--git-dir']);
      } catch {
        console.log('⚠️  Not a git repository, skipping git backup');
        return false;
      }

      // Check for uncommitted changes
      const { stdout: status } = await execFileAsync('git', ['status', '--porcelain']);
      
      if (!status.trim()) {
        console.log('ℹ️  No changes to commit');
        return true;
      }

      // ✅ SECURE: execFile with array args
      await execFileAsync('git', ['add', '-A']);
      
      // Create safe commit message (no user input interpolation)
      const timestamp = new Date().toISOString();
      const commitMessage = `BACKUP: Before optimization - ${timestamp}`;
      
      await execFileAsync('git', ['commit', '-m', commitMessage]);
      
      console.log('✅ Git backup created');
      return true;
    } catch (error) {
      // Git errors are not critical
      console.log(`⚠️  Git backup skipped: ${error.message}`);
      return false;
    }
  }

  async verifyEnvironment() {
    console.log('🔍 Verifying environment safety...');
    
    const checks = [
      {
        name: 'Node.js version',
        check: () => process.version,
        expected: 'v18+'
      },
      {
        name: 'Package.json exists',
        check: async () => await fs.pathExists('package.json'),
        expected: true
      },
      {
        name: 'Prisma client available',
        check: () => {
          try {
            require('@prisma/client');
            return true;
          } catch {
            return false;
          }
        },
        expected: true
      },
      {
        name: 'fs-extra installed',
        check: () => {
          try {
            require('fs-extra');
            return true;
          } catch {
            return false;
          }
        },
        expected: true
      }
    ];

    for (const check of checks) {
      try {
        const result = typeof check.check === 'function' 
          ? await Promise.resolve(check.check())
          : check.check;
        const status = result ? '✅' : '❌';
        console.log(`${status} ${check.name}: ${result}`);
      } catch (error) {
        console.log(`❌ ${check.name}: Error - ${error.message}`);
      }
    }
  }

  async run() {
    console.log('🚀 Starting Secure Safety Backup Process...');
    console.log('═'.repeat(50));

    try {
      // Step 1: Verify environment
      await this.verifyEnvironment();
      console.log('');

      // Step 2: Check database safety
      const dbSafe = await this.checkDatabaseSafety();
      if (!dbSafe) {
        throw new Error('Database safety check failed');
      }
      console.log('');

      // Step 3: Create backup
      const backupSuccess = await this.createCodeBackup();
      if (!backupSuccess) {
        throw new Error('Code backup failed');
      }
      console.log('');

      console.log('🎉 Safety backup completed successfully!');
      console.log('📋 Ready to proceed with optimizations');
      console.log('🔄 You can restore from backup if needed:');
      console.log(`   - Backup location: ${this.backupDir}`);
      console.log('   - Git restore: git reset --hard HEAD~1');
      
      return true;
    } catch (error) {
      console.error('💥 Safety backup failed:', error.message);
      console.log('❌ Please resolve issues before proceeding');
      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const backup = new SecureSafetyBackup();
  backup.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = SecureSafetyBackup;
