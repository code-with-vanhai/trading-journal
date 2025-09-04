#!/usr/bin/env node

/**
 * 🔄 BACKUP RESTORE SYSTEM
 * Script khôi phục dữ liệu từ backup cho Trading Journal
 * Version: 2.0 - Chuẩn hóa và tối ưu
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BackupRestoreSystem {
  constructor(backupPath, options = {}) {
    this.backupPath = backupPath;
    this.options = {
      restoreDatabase: options.restoreDatabase !== false,
      restoreFiles: options.restoreFiles !== false,
      confirmBeforeRestore: options.confirmBeforeRestore !== false,
      createBackupBeforeRestore: options.createBackupBeforeRestore !== false,
      ...options
    };
    
    this.loadEnvironment();
    this.dbConfig = this.parseDbUrl(process.env.DATABASE_URL);
  }

  /**
   * Load environment variables từ .env file
   */
  loadEnvironment() {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    }
  }

  /**
   * Parse DATABASE_URL thành các component
   */
  parseDbUrl(url) {
    if (!url) {
      throw new Error('DATABASE_URL không được cấu hình trong .env');
    }
    
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
      throw new Error('DATABASE_URL không đúng định dạng PostgreSQL');
    }
    
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5]
    };
  }

  /**
   * Validate backup file/directory
   */
  async validateBackup() {
    console.log('🔍 Kiểm tra backup...');
    
    if (!fs.existsSync(this.backupPath)) {
      throw new Error(`Backup không tồn tại: ${this.backupPath}`);
    }
    
    let backupDir = this.backupPath;
    let isArchive = false;
    
    // Nếu là file .tar.gz, giải nén trước
    if (this.backupPath.endsWith('.tar.gz')) {
      console.log('📦 Giải nén backup archive...');
      const extractDir = path.join(path.dirname(this.backupPath), 'temp-restore-' + Date.now());
      
      fs.mkdirSync(extractDir, { recursive: true });
      
      await execAsync(`tar -xzf "${this.backupPath}" -C "${extractDir}"`);
      
      // Tìm thư mục backup trong extract
      const items = fs.readdirSync(extractDir);
      const backupFolder = items.find(item => 
        item.startsWith('backup-') || item.startsWith('quick-backup-')
      );
      
      if (!backupFolder) {
        throw new Error('Không tìm thấy thư mục backup trong archive');
      }
      
      backupDir = path.join(extractDir, backupFolder);
      isArchive = true;
    }
    
    // Kiểm tra manifest
    const manifestPath = path.join(backupDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Manifest file không tồn tại trong backup');
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    // Kiểm tra database backup
    const dbBackupDir = path.join(backupDir, 'database');
    if (!fs.existsSync(dbBackupDir)) {
      throw new Error('Database backup không tồn tại');
    }
    
    console.log(`✅ Backup hợp lệ`);
    console.log(`   📅 Ngày tạo: ${new Date(manifest.date).toLocaleString('vi-VN')}`);
    console.log(`   📋 Loại: ${manifest.type}`);
    console.log(`   📊 Version: ${manifest.version || '1.0'}`);
    
    return { backupDir, manifest, isArchive };
  }

  /**
   * Tạo backup hiện tại trước khi restore
   */
  async createPreRestoreBackup() {
    if (!this.options.createBackupBeforeRestore) {
      return null;
    }
    
    console.log('💾 Tạo backup hiện tại trước khi restore...');
    
    try {
      const ManualBackupSystem = require('./manual-backup');
      const backupSystem = new ManualBackupSystem();
      
      // Override backup directory để tránh conflict
      backupSystem.backupBaseDir = path.join(process.cwd(), 'backups', 'pre-restore');
      backupSystem.ensureBackupDirectory();
      
      const result = await backupSystem.createQuickBackup();
      console.log(`✅ Pre-restore backup: ${result}`);
      return result;
      
    } catch (error) {
      console.warn(`⚠️  Không thể tạo pre-restore backup: ${error.message}`);
      return null;
    }
  }

  /**
   * Restore database
   */
  async restoreDatabase(backupDir) {
    if (!this.options.restoreDatabase) {
      console.log('⏭️  Bỏ qua restore database');
      return;
    }

    console.log('🗄️  Bắt đầu restore database...');
    
    const dbBackupDir = path.join(backupDir, 'database');
    if (!fs.existsSync(dbBackupDir)) {
      throw new Error('Thư mục database backup không tồn tại');
    }
    
    // Tìm file backup database
    const files = fs.readdirSync(dbBackupDir);
    let dumpFile = files.find(f => f.includes('full-dump') && f.endsWith('.sql.gz'));
    
    if (!dumpFile) {
      // Fallback to any .sql.gz file
      dumpFile = files.find(f => f.endsWith('.sql.gz'));
    }
    
    if (!dumpFile) {
      throw new Error('Không tìm thấy file database dump');
    }
    
    const dumpPath = path.join(dbBackupDir, dumpFile);
    
    console.log(`   📄 Sử dụng file: ${dumpFile}`);
    
    if (this.options.confirmBeforeRestore) {
      console.log('⚠️  CẢNH BÁO: Sẽ xóa toàn bộ database hiện tại!');
      console.log(`   🗄️  Database: ${this.dbConfig.database}`);
      console.log(`   🏠 Host: ${this.dbConfig.host}:${this.dbConfig.port}`);
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Bạn có chắc chắn muốn tiếp tục? (yes/no): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 'yes') {
        throw new Error('Restore bị hủy bởi người dùng');
      }
    }
    
    // Giải nén file dump nếu cần
    let sqlFile = dumpPath;
    if (dumpPath.endsWith('.gz')) {
      console.log('   📦 Giải nén database dump...');
      sqlFile = dumpPath.replace('.gz', '');
      await execAsync(`gunzip -c "${dumpPath}" > "${sqlFile}"`);
    }
    
    // Restore database
    console.log('   🔄 Đang restore database...');
    
    const restoreCmd = `PGPASSWORD="${this.dbConfig.password}" psql ` +
      `-h ${this.dbConfig.host} ` +
      `-p ${this.dbConfig.port} ` +
      `-U ${this.dbConfig.user} ` +
      `-d ${this.dbConfig.database} ` +
      `-f "${sqlFile}"`;
    
    await execAsync(restoreCmd);
    
    // Cleanup temporary unzipped file
    if (sqlFile !== dumpPath && fs.existsSync(sqlFile)) {
      fs.unlinkSync(sqlFile);
    }
    
    console.log('✅ Database restore hoàn thành');
  }

  /**
   * Restore files
   */
  async restoreFiles(backupDir) {
    if (!this.options.restoreFiles) {
      console.log('⏭️  Bỏ qua restore files');
      return;
    }

    console.log('📁 Bắt đầu restore files...');
    
    const fileBackupDir = path.join(backupDir, 'files');
    if (!fs.existsSync(fileBackupDir)) {
      console.log('⚠️  Không có file backup để restore');
      return;
    }
    
    const filesToRestore = [
      { src: 'uploads', dest: 'public/uploads' },
      { src: 'images', dest: 'public/images' },
      { src: 'config/.env', dest: '.env' },
      { src: 'config/package.json', dest: 'package.json' },
      { src: 'config/next.config.js', dest: 'next.config.js' },
      { src: 'prisma', dest: 'prisma' }
    ];
    
    for (const file of filesToRestore) {
      try {
        const srcPath = path.join(fileBackupDir, file.src);
        const destPath = path.join(process.cwd(), file.dest);
        
        if (fs.existsSync(srcPath)) {
          // Backup file hiện tại nếu tồn tại
          if (fs.existsSync(destPath)) {
            const backupPath = `${destPath}.backup.${Date.now()}`;
            if (fs.statSync(destPath).isDirectory()) {
              await execAsync(`cp -r "${destPath}" "${backupPath}"`);
            } else {
              fs.copyFileSync(destPath, backupPath);
            }
            console.log(`   💾 Backup hiện tại: ${file.dest} -> ${path.basename(backupPath)}`);
          }
          
          // Restore file
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          
          if (fs.statSync(srcPath).isDirectory()) {
            if (fs.existsSync(destPath)) {
              await execAsync(`rm -rf "${destPath}"`);
            }
            await execAsync(`cp -r "${srcPath}" "${destPath}"`);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
          
          console.log(`   ✅ Restore: ${file.src} -> ${file.dest}`);
        }
      } catch (error) {
        console.error(`   ❌ Lỗi restore ${file.src}: ${error.message}`);
      }
    }
  }

  /**
   * Verify restore
   */
  async verifyRestore() {
    console.log('✅ Kiểm tra restore...');
    
    try {
      // Kiểm tra database connection
      const testCmd = `PGPASSWORD="${this.dbConfig.password}" psql ` +
        `-h ${this.dbConfig.host} ` +
        `-p ${this.dbConfig.port} ` +
        `-U ${this.dbConfig.user} ` +
        `-d ${this.dbConfig.database} ` +
        `-c "SELECT COUNT(*) FROM \\"User\\";" -t`;
      
      const { stdout } = await execAsync(testCmd);
      const userCount = parseInt(stdout.trim());
      
      console.log(`   🗄️  Database: ${userCount} users found`);
      
      // Kiểm tra các file quan trọng
      const criticalFiles = [
        'package.json',
        'prisma/schema.prisma'
      ];
      
      for (const file of criticalFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          console.log(`   ✅ File: ${file}`);
        } else {
          console.warn(`   ⚠️  File không tồn tại: ${file}`);
        }
      }
      
      console.log('✅ Restore verification thành công');
      return true;
      
    } catch (error) {
      console.error('❌ Restore verification thất bại:', error.message);
      return false;
    }
  }

  /**
   * Cleanup temporary files
   */
  async cleanup(backupDir, isArchive) {
    if (isArchive) {
      // Xóa thư mục extract tạm thời
      const extractDir = path.dirname(backupDir);
      if (extractDir.includes('temp-restore-')) {
        await execAsync(`rm -rf "${extractDir}"`);
        console.log('🧹 Đã dọn dẹp file tạm thời');
      }
    }
  }

  /**
   * Main restore process
   */
  async run() {
    console.log('🔄 BẮT ĐẦU BACKUP RESTORE');
    console.log('=' .repeat(60));
    console.log(`📁 Backup path: ${this.backupPath}`);
    console.log(`🗄️  Database: ${this.dbConfig.database}`);
    console.log(`🏠 Host: ${this.dbConfig.host}:${this.dbConfig.port}`);
    console.log('=' .repeat(60));
    
    try {
      // 1. Validate backup
      const { backupDir, manifest, isArchive } = await this.validateBackup();
      
      // 2. Tạo backup trước restore (nếu cần)
      const preRestoreBackupPath = await this.createPreRestoreBackup();
      
      // 3. Restore database
      await this.restoreDatabase(backupDir);
      
      // 4. Restore files
      await this.restoreFiles(backupDir);
      
      // 5. Verify restore
      const verified = await this.verifyRestore();
      
      // 6. Cleanup
      await this.cleanup(backupDir, isArchive);
      
      console.log('');
      console.log('🎉 RESTORE HOÀN THÀNH!');
      console.log('=' .repeat(60));
      console.log(`📅 Backup date: ${new Date(manifest.date).toLocaleString('vi-VN')}`);
      console.log(`📋 Backup type: ${manifest.type}`);
      console.log(`✅ Verification: ${verified ? 'Thành công' : 'Thất bại'}`);
      if (preRestoreBackupPath) {
        console.log(`💾 Pre-restore backup: ${preRestoreBackupPath}`);
      }
      console.log('=' .repeat(60));
      
      return {
        success: true,
        manifest,
        verified,
        preRestoreBackupPath
      };
      
    } catch (error) {
      console.error('');
      console.error('💥 RESTORE THẤT BẠI!');
      console.error('=' .repeat(60));
      console.error('❌ Lỗi:', error.message);
      console.error('=' .repeat(60));
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = BackupRestoreSystem;

// CLI usage
if (require.main === module) {
  const backupPath = process.argv[2];
  
  if (!backupPath) {
    console.error('❌ Cách sử dụng: node backup-restore.js <backup-path>');
    console.error('📝 Ví dụ: node backup-restore.js ./backups/backup-2024-01-15.tar.gz');
    console.error('');
    console.error('🔧 Tùy chọn:');
    console.error('   --no-confirm         Không hỏi xác nhận');
    console.error('   --no-pre-backup      Không tạo backup trước restore');
    console.error('   --no-database        Không restore database');
    console.error('   --no-files           Không restore files');
    process.exit(1);
  }
  
  const options = {
    confirmBeforeRestore: !process.argv.includes('--no-confirm'),
    createBackupBeforeRestore: !process.argv.includes('--no-pre-backup'),
    restoreDatabase: !process.argv.includes('--no-database'),
    restoreFiles: !process.argv.includes('--no-files')
  };
  
  const restore = new BackupRestoreSystem(backupPath, options);
  restore.run().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}