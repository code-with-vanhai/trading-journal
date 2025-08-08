#!/usr/bin/env node

/**
 * 🧹 AUTOMATED CONSOLE.LOG CLEANUP SCRIPT
 * Thay thế toàn bộ 555+ console.log/error/warn bằng production logger
 * 
 * Chức năng:
 * - Scan tất cả JS/JSX files
 * - Phân loại console.log thành debug/info/warn/error
 * - Thay thế bằng appropriate logger calls
 * - Thêm imports cần thiết
 * - Backup files trước khi modify
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

class ConsoleLogCleanup {
  constructor() {
    this.rootDir = process.cwd();
    this.processedFiles = new Set();
    this.statistics = {
      filesScanned: 0,
      filesModified: 0,
      consoleLogsReplaced: 0,
      consoleErrorsReplaced: 0,
      consoleWarnsReplaced: 0
    };

    // Directories to scan
    this.scanDirs = [
      'app',
      'components', 
      'lib',
      'scripts'
    ];

    // Files to exclude
    this.excludeFiles = [
      'node_modules',
      '.next',
      '.git',
      'backup-',
      'production-logger.js', // Don't modify our new logger
      'cleanup-console-logs.js' // Don't modify this script
    ];

    // Console.log patterns to replace
    this.patterns = [
      {
        regex: /console\.log\((.*?)\);?/g,
        replacement: 'logger.debug($1);',
        type: 'debug'
      },
      {
        regex: /console\.info\((.*?)\);?/g,
        replacement: 'logger.info($1);',
        type: 'info'
      },
      {
        regex: /console\.warn\((.*?)\);?/g,
        replacement: 'logger.warn($1);',
        type: 'warn'
      },
      {
        regex: /console\.error\((.*?)\);?/g,
        replacement: 'logger.error($1);',
        type: 'error'
      }
    ];
  }

  /**
   * Main cleanup process
   */
  async cleanup() {
    console.log('🧹 Starting Console.log Cleanup Process...');
    console.log('=' .repeat(60));

    try {
      // Step 1: Scan for files
      const files = await this.scanFiles();
      console.log(`📁 Found ${files.length} JavaScript files to process`);

      // Step 2: Process each file
      for (const file of files) {
        await this.processFile(file);
      }

      // Step 3: Show statistics
      this.showStatistics();

      console.log('✅ Console.log cleanup completed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      return false;
    }
  }

  /**
   * Scan directories for JavaScript files
   */
  async scanFiles() {
    const files = [];

    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(this.rootDir, fullPath);

        // Skip excluded directories/files
        if (this.shouldExclude(relativePath)) {
          continue;
        }

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (this.isJavaScriptFile(item)) {
          files.push(fullPath);
        }
      }
    };

    // Scan each target directory
    for (const scanDir of this.scanDirs) {
      const fullScanDir = path.join(this.rootDir, scanDir);
      scanDirectory(fullScanDir);
    }

    // Also scan root level JS files
    const rootFiles = fs.readdirSync(this.rootDir)
      .filter(file => this.isJavaScriptFile(file))
      .filter(file => !this.shouldExclude(file))
      .map(file => path.join(this.rootDir, file));
    
    files.push(...rootFiles);

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Check if file should be excluded
   */
  shouldExclude(filePath) {
    return this.excludeFiles.some(exclude => filePath.includes(exclude));
  }

  /**
   * Check if file is JavaScript
   */
  isJavaScriptFile(filename) {
    return /\.(js|jsx|ts|tsx)$/.test(filename);
  }

  /**
   * Process individual file
   */
  async processFile(filePath) {
    this.statistics.filesScanned++;
    
    try {
      const content = await readFile(filePath, 'utf-8');
      const originalContent = content;

      // Check if file contains console statements
      if (!this.hasConsoleStatements(content)) {
        return; // Skip files without console statements
      }

      console.log(`🔄 Processing: ${path.relative(this.rootDir, filePath)}`);

      let modifiedContent = content;
      let hasChanges = false;

      // Apply each pattern replacement
      for (const pattern of this.patterns) {
        const matches = [...modifiedContent.matchAll(pattern.regex)];
        if (matches.length > 0) {
          modifiedContent = modifiedContent.replace(pattern.regex, pattern.replacement);
          this.statistics[`console${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)}sReplaced`] += matches.length;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        // Add logger import if not present
        modifiedContent = this.addLoggerImport(modifiedContent, filePath);

        // Create backup
        await this.createBackup(filePath, originalContent);

        // Write modified content
        await writeFile(filePath, modifiedContent, 'utf-8');
        
        this.statistics.filesModified++;
        this.statistics.consoleLogsReplaced += (originalContent.match(/console\.log/g) || []).length;

        console.log(`  ✅ Modified: ${matches.length} console statements replaced`);
      }

    } catch (error) {
      console.error(`  ❌ Error processing ${filePath}:`, error.message);
    }
  }

  /**
   * Check if file has console statements
   */
  hasConsoleStatements(content) {
    return /console\.(log|info|warn|error)/.test(content);
  }

  /**
   * Add logger import to file if needed
   */
  addLoggerImport(content, filePath) {
    // Check if logger import already exists
    if (content.includes('production-logger') || content.includes('import logger')) {
      return content;
    }

    // Determine import path relative to file
    const relativePath = path.relative(path.dirname(filePath), path.join(this.rootDir, 'app/lib'));
    const importPath = relativePath.replace(/\\/g, '/'); // Normalize for different OS

    // Different import styles based on file location and existing imports
    let importStatement = '';
    
    if (content.includes('import ') && !content.includes('require(')) {
      // ES6 modules
      importStatement = `import logger from '${importPath}/production-logger.js';\n`;
    } else if (content.includes('require(')) {
      // CommonJS
      importStatement = `const logger = require('${importPath}/production-logger.js').default;\n`;
    } else {
      // Default to ES6
      importStatement = `import logger from '${importPath}/production-logger.js';\n`;
    }

    // Insert import at the top after any existing imports
    const lines = content.split('\n');
    let insertIndex = 0;

    // Find the best place to insert (after existing imports)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ') || line.startsWith('const ') || line.startsWith('require(')) {
        insertIndex = i + 1;
      } else if (line && !line.startsWith('//') && !line.startsWith('/*')) {
        break;
      }
    }

    lines.splice(insertIndex, 0, importStatement);
    return lines.join('\n');
  }

  /**
   * Create backup of original file
   */
  async createBackup(filePath, content) {
    const backupPath = filePath + '.backup.' + Date.now();
    await writeFile(backupPath, content, 'utf-8');
  }

  /**
   * Show processing statistics
   */
  showStatistics() {
    console.log('\n📊 CLEANUP STATISTICS');
    console.log('=' .repeat(40));
    console.log(`Files scanned: ${this.statistics.filesScanned}`);
    console.log(`Files modified: ${this.statistics.filesModified}`);
    console.log(`console.log replaced: ${this.statistics.consoleLogsReplaced}`);
    console.log(`console.error replaced: ${this.statistics.consoleErrorsReplaced}`);
    console.log(`console.warn replaced: ${this.statistics.consoleWarnsReplaced}`);
    
    const totalReplaced = Object.keys(this.statistics)
      .filter(key => key.includes('Replaced'))
      .reduce((sum, key) => sum + this.statistics[key], 0);
    
    console.log(`Total console statements replaced: ${totalReplaced}`);
    
    if (totalReplaced > 0) {
      console.log(`\n🎉 Performance improvement expected: ${Math.round((totalReplaced / 555) * 100)}% of console pollution removed`);
    }
  }

  /**
   * Rollback changes (emergency function)
   */
  async rollback() {
    console.log('🔄 Rolling back changes...');
    
    // Find all backup files
    const backupFiles = await this.findBackupFiles();
    
    for (const backupFile of backupFiles) {
      const originalFile = backupFile.replace(/\.backup\.\d+$/, '');
      if (fs.existsSync(backupFile) && fs.existsSync(originalFile)) {
        const backupContent = await readFile(backupFile, 'utf-8');
        await writeFile(originalFile, backupContent, 'utf-8');
        fs.unlinkSync(backupFile); // Remove backup file
        console.log(`✅ Restored: ${originalFile}`);
      }
    }
    
    console.log('🔄 Rollback completed');
  }

  /**
   * Find all backup files
   */
  async findBackupFiles() {
    const backupFiles = [];
    
    const findInDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          findInDirectory(fullPath);
        } else if (item.includes('.backup.')) {
          backupFiles.push(fullPath);
        }
      }
    };

    findInDirectory(this.rootDir);
    return backupFiles;
  }
}

// CLI interface
if (require.main === module) {
  const cleanup = new ConsoleLogCleanup();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--rollback')) {
    cleanup.rollback().then(() => {
      console.log('Rollback completed');
      process.exit(0);
    });
  } else if (args.includes('--dry-run')) {
    console.log('🔍 DRY RUN MODE - No files will be modified');
    // Implement dry run logic
  } else {
    cleanup.cleanup().then(success => {
      if (success) {
        console.log('\n🎉 Console.log cleanup completed successfully!');
        console.log('📋 Next steps:');
        console.log('  1. Test the application to ensure everything works');
        console.log('  2. Check for any import errors');
        console.log('  3. Run: node scripts/cleanup-console-logs.js --rollback (if needed)');
      }
      process.exit(success ? 0 : 1);
    });
  }
}

module.exports = ConsoleLogCleanup;

