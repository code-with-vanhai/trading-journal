#!/usr/bin/env node

/**
 * 🔒 SAFETY BACKUP SCRIPT
 * Script để backup code và kiểm tra database safety trước khi optimization
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class SafetyBackup {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backup-' + new Date().toISOString().split('T')[0]);
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
      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf-8');
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
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      // Backup critical files
      for (const file of this.criticalFiles) {
        const sourcePath = path.join(process.cwd(), file);
        if (fs.existsSync(sourcePath)) {
          const backupPath = path.join(this.backupDir, file);
          const backupFileDir = path.dirname(backupPath);
          
          if (!fs.existsSync(backupFileDir)) {
            fs.mkdirSync(backupFileDir, { recursive: true });
          }
          
          fs.copyFileSync(sourcePath, backupPath);
          console.log(`✅ Backed up: ${file}`);
        } else {
          console.log(`⚠️  File not found: ${file}`);
        }
      }

      // Create Git backup
      console.log('📚 Creating Git backup commit...');
      await execAsync('git add -A');
      await execAsync('git commit -m "BACKUP: Before optimization - ' + new Date().toISOString() + '"');
      console.log('✅ Git backup created');

      console.log(`💾 Backup completed in: ${this.backupDir}`);
      return true;
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
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
        check: () => fs.existsSync('package.json'),
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
      }
    ];

    for (const check of checks) {
      try {
        const result = check.check();
        const status = result ? '✅' : '❌';
        console.log(`${status} ${check.name}: ${result}`);
      } catch (error) {
        console.log(`❌ ${check.name}: Error - ${error.message}`);
      }
    }
  }

  async run() {
    console.log('🚀 Starting Safety Backup Process...');
    console.log('=' .repeat(50));

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
  const backup = new SafetyBackup();
  backup.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = SafetyBackup;

