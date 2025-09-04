#!/usr/bin/env node

/**
 * 🎮 MANUAL BACKUP SYSTEM
 * Script backup thủ công với menu tương tác cho Trading Journal
 * Version: 2.0 - Chuẩn hóa và tối ưu
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');

const execAsync = promisify(exec);

class ManualBackupSystem {
  constructor() {
    this.backupBaseDir = path.join(process.cwd(), 'backups');
    this.loadEnvironment();
    this.dbConfig = this.parseDbUrl(process.env.DATABASE_URL);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Cấu hình backup
    this.config = {
      compressionLevel: 9,
      maxBackupAge: 30, // ngày
      criticalFiles: [
        '.env',
        'package.json',
        'package-lock.json',
        'prisma/schema.prisma',
        'next.config.js'
      ],
      backupDirs: [
        { src: 'public/uploads', dest: 'uploads', required: false },
        { src: 'public/images', dest: 'images', required: false },
        { src: 'prisma', dest: 'prisma', required: true }
      ]
    };
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
   * Utility functions
   */
  async question(prompt) {
    return new Promise(resolve => {
      this.rl.question(prompt, resolve);
    });
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getAge(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} ngày`;
    } else if (diffHours > 0) {
      return `${diffHours} giờ`;
    } else {
      return 'Vừa tạo';
    }
  }

  async getDirSize(dirPath) {
    try {
      const { stdout } = await execAsync(`du -sb "${dirPath}"`);
      return parseInt(stdout.split('\t')[0]);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Tạo timestamp cho backup
   */
  createTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  /**
   * Kiểm tra yêu cầu hệ thống
   */
  async checkSystemRequirements() {
    const requirements = [
      { cmd: 'pg_dump --version', name: 'PostgreSQL Client' },
      { cmd: 'tar --version', name: 'tar command' },
      { cmd: 'gzip --version', name: 'gzip command' }
    ];

    for (const req of requirements) {
      try {
        await execAsync(req.cmd + ' > /dev/null 2>&1');
      } catch (error) {
        throw new Error(`${req.name} không được cài đặt. Vui lòng cài đặt trước khi sử dụng.`);
      }
    }
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection() {
    const testCmd = `PGPASSWORD="${this.dbConfig.password}" psql ` +
      `-h ${this.dbConfig.host} ` +
      `-p ${this.dbConfig.port} ` +
      `-U ${this.dbConfig.user} ` +
      `-d ${this.dbConfig.database} ` +
      `-c "SELECT 1;" > /dev/null 2>&1`;
    
    await execAsync(testCmd);
  }

  /**
   * Tạo thư mục backup
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupBaseDir)) {
      fs.mkdirSync(this.backupBaseDir, { recursive: true });
    }
  }

  /**
   * Liệt kê tất cả backup hiện có
   */
  async listBackups() {
    console.log('\n📋 DANH SÁCH BACKUP HIỆN CÓ');
    console.log('=' .repeat(80));
    
    if (!fs.existsSync(this.backupBaseDir)) {
      console.log('📁 Chưa có backup nào được tạo');
      return [];
    }
    
    const backups = [];
    const items = fs.readdirSync(this.backupBaseDir);
    
    for (const item of items) {
      const itemPath = path.join(this.backupBaseDir, item);
      const stats = fs.statSync(itemPath);
      
      if (item.endsWith('.tar.gz') || item.startsWith('backup-') || item.startsWith('quick-backup-')) {
        let size = stats.size;
        
        if (stats.isDirectory()) {
          size = await this.getDirSize(itemPath);
        }
        
        backups.push({
          name: item,
          path: itemPath,
          size: size,
          sizeHuman: this.formatBytes(size),
          created: stats.mtime,
          age: this.getAge(stats.mtime),
          type: stats.isDirectory() ? 'folder' : 'archive'
        });
      }
    }
    
    // Sắp xếp theo thời gian tạo (mới nhất trước)
    backups.sort((a, b) => b.created - a.created);
    
    if (backups.length === 0) {
      console.log('📁 Chưa có backup nào được tạo');
      return [];
    }
    
    console.log(`\n📊 Tổng cộng: ${backups.length} backup\n`);
    
    backups.forEach((backup, index) => {
      const typeIcon = backup.type === 'archive' ? '📦' : '📁';
      console.log(`${index + 1}. ${typeIcon} ${backup.name}`);
      console.log(`   💾 Dung lượng: ${backup.sizeHuman}`);
      console.log(`   📅 Tạo lúc: ${backup.created.toLocaleString('vi-VN')}`);
      console.log(`   ⏰ Tuổi: ${backup.age}`);
      console.log('');
    });
    
    // Tính tổng dung lượng
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    console.log(`💾 Tổng dung lượng: ${this.formatBytes(totalSize)}`);
    
    return backups;
  }

  /**
   * Tạo database backup
   */
  async createDatabaseBackup(backupDir, type = 'full') {
    console.log('🗄️  Đang backup database...');
    
    const dbBackupDir = path.join(backupDir, 'database');
    fs.mkdirSync(dbBackupDir, { recursive: true });
    
    const timestamp = this.createTimestamp();
    
    if (type === 'full' || type === 'quick') {
      // Full database dump
      const fullDumpFile = path.join(dbBackupDir, `full-dump-${timestamp}.sql`);
      const fullDumpCmd = `PGPASSWORD="${this.dbConfig.password}" pg_dump ` +
        `-h ${this.dbConfig.host} ` +
        `-p ${this.dbConfig.port} ` +
        `-U ${this.dbConfig.user} ` +
        `-d ${this.dbConfig.database} ` +
        `--verbose --clean --if-exists --create ` +
        `--file="${fullDumpFile}"`;
      
      await execAsync(fullDumpCmd);
      await execAsync(`gzip -${this.config.compressionLevel} "${fullDumpFile}"`);
      console.log(`   ✅ Full dump: ${path.basename(fullDumpFile)}.gz`);
    }
    
    if (type === 'full') {
      // Schema-only dump
      const schemaFile = path.join(dbBackupDir, `schema-${timestamp}.sql`);
      const schemaDumpCmd = `PGPASSWORD="${this.dbConfig.password}" pg_dump ` +
        `-h ${this.dbConfig.host} ` +
        `-p ${this.dbConfig.port} ` +
        `-U ${this.dbConfig.user} ` +
        `-d ${this.dbConfig.database} ` +
        `--schema-only --verbose ` +
        `--file="${schemaFile}"`;
      
      await execAsync(schemaDumpCmd);
      await execAsync(`gzip -${this.config.compressionLevel} "${schemaFile}"`);
      console.log(`   ✅ Schema dump: ${path.basename(schemaFile)}.gz`);
      
      // Data-only dump
      const dataFile = path.join(dbBackupDir, `data-${timestamp}.sql`);
      const dataDumpCmd = `PGPASSWORD="${this.dbConfig.password}" pg_dump ` +
        `-h ${this.dbConfig.host} ` +
        `-p ${this.dbConfig.port} ` +
        `-U ${this.dbConfig.user} ` +
        `-d ${this.dbConfig.database} ` +
        `--data-only --verbose ` +
        `--file="${dataFile}"`;
      
      await execAsync(dataDumpCmd);
      await execAsync(`gzip -${this.config.compressionLevel} "${dataFile}"`);
      console.log(`   ✅ Data dump: ${path.basename(dataFile)}.gz`);
    }
    
    return dbBackupDir;
  }

  /**
   * Tạo files backup
   */
  async createFilesBackup(backupDir, type = 'full') {
    console.log('📁 Đang backup files...');
    
    const fileBackupDir = path.join(backupDir, 'files');
    fs.mkdirSync(fileBackupDir, { recursive: true });
    
    // Backup critical files
    const configDir = path.join(fileBackupDir, 'config');
    fs.mkdirSync(configDir, { recursive: true });
    
    for (const file of this.config.criticalFiles) {
      const srcPath = path.join(process.cwd(), file);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(configDir, path.basename(file));
        fs.copyFileSync(srcPath, destPath);
        console.log(`   ✅ ${file}`);
      }
    }
    
    // Backup directories (chỉ cho full backup)
    if (type === 'full') {
      for (const dir of this.config.backupDirs) {
        try {
          const srcPath = path.join(process.cwd(), dir.src);
          const destPath = path.join(fileBackupDir, dir.dest);
          
          if (fs.existsSync(srcPath)) {
            if (fs.statSync(srcPath).isDirectory()) {
              await execAsync(`cp -r "${srcPath}" "${destPath}"`);
            } else {
              const destDir = path.dirname(destPath);
              if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
              }
              fs.copyFileSync(srcPath, destPath);
            }
            console.log(`   ✅ ${dir.src}`);
          } else if (dir.required) {
            console.warn(`   ⚠️  Required file missing: ${dir.src}`);
          }
        } catch (error) {
          if (dir.required) {
            throw error;
          }
          console.warn(`   ⚠️  Could not backup ${dir.src}: ${error.message}`);
        }
      }
    } else {
      // Quick backup - chỉ uploads nếu có
      const uploadsDir = path.join(process.cwd(), 'public/uploads');
      if (fs.existsSync(uploadsDir)) {
        await execAsync(`cp -r "${uploadsDir}" "${fileBackupDir}/"`);
        console.log(`   ✅ public/uploads`);
      }
    }
    
    return fileBackupDir;
  }

  /**
   * Tạo manifest file
   */
  createManifest(backupDir, type, dbBackupDir, fileBackupDir) {
    const manifest = {
      timestamp: this.createTimestamp(),
      date: new Date().toISOString(),
      type: type,
      version: '2.0',
      database: {
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        database: this.dbConfig.database,
        user: this.dbConfig.user
      },
      files: {
        database: fs.existsSync(dbBackupDir) ? fs.readdirSync(dbBackupDir) : [],
        files: fs.existsSync(fileBackupDir) ? this.getFileList(fileBackupDir) : []
      },
      config: this.config
    };
    
    const manifestFile = path.join(backupDir, 'manifest.json');
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    
    console.log(`   ✅ Manifest: manifest.json`);
    return manifest;
  }

  /**
   * Lấy danh sách files trong thư mục
   */
  getFileList(dir, basePath = '') {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        files.push(...this.getFileList(fullPath, relativePath));
      } else {
        const stats = fs.statSync(fullPath);
        files.push({
          path: relativePath,
          size: stats.size,
          modified: stats.mtime.toISOString()
        });
      }
    }
    
    return files;
  }

  /**
   * Nén backup thành archive
   */
  async compressBackup(backupDir, archiveName) {
    console.log('📦 Đang nén backup...');
    
    const archivePath = path.join(this.backupBaseDir, archiveName);
    const tarCmd = `tar -czf "${archivePath}" -C "${this.backupBaseDir}" "${path.basename(backupDir)}"`;
    
    await execAsync(tarCmd);
    
    // Xóa thư mục tạm
    await execAsync(`rm -rf "${backupDir}"`);
    
    const stats = fs.statSync(archivePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`   ✅ Archive: ${archiveName} (${sizeMB} MB)`);
    return archivePath;
  }

  /**
   * Tạo backup nhanh
   */
  async createQuickBackup() {
    console.log('\n⚡ TẠO BACKUP NHANH');
    console.log('=' .repeat(50));
    
    const timestamp = this.createTimestamp();
    const backupDir = path.join(this.backupBaseDir, `quick-backup-${timestamp}`);
    
    try {
      this.ensureBackupDirectory();
      fs.mkdirSync(backupDir, { recursive: true });
      
      // Database backup
      const dbBackupDir = await this.createDatabaseBackup(backupDir, 'quick');
      
      // Files backup
      const fileBackupDir = await this.createFilesBackup(backupDir, 'quick');
      
      // Manifest
      console.log('📋 Tạo manifest...');
      this.createManifest(backupDir, 'quick-backup', dbBackupDir, fileBackupDir);
      
      // Compress
      const archiveName = `quick-backup-${timestamp}.tar.gz`;
      const archivePath = await this.compressBackup(backupDir, archiveName);
      
      console.log('\n✅ BACKUP NHANH HOÀN THÀNH!');
      console.log(`📦 File: ${archiveName}`);
      console.log(`📁 Đường dẫn: ${archivePath}`);
      
      return archivePath;
      
    } catch (error) {
      console.error('❌ Backup thất bại:', error.message);
      
      // Cleanup on error
      if (fs.existsSync(backupDir)) {
        await execAsync(`rm -rf "${backupDir}"`);
      }
      
      throw error;
    }
  }

  /**
   * Tạo backup đầy đủ
   */
  async createFullBackup() {
    console.log('\n🏢 TẠO BACKUP ĐẦY ĐỦ');
    console.log('=' .repeat(50));
    
    const timestamp = this.createTimestamp();
    const backupDir = path.join(this.backupBaseDir, `backup-${timestamp}`);
    
    try {
      this.ensureBackupDirectory();
      fs.mkdirSync(backupDir, { recursive: true });
      
      // Database backup
      const dbBackupDir = await this.createDatabaseBackup(backupDir, 'full');
      
      // Files backup
      const fileBackupDir = await this.createFilesBackup(backupDir, 'full');
      
      // Manifest
      console.log('📋 Tạo manifest...');
      this.createManifest(backupDir, 'full-backup', dbBackupDir, fileBackupDir);
      
      // Compress
      const archiveName = `backup-${timestamp}.tar.gz`;
      const archivePath = await this.compressBackup(backupDir, archiveName);
      
      console.log('\n✅ BACKUP ĐẦY ĐỦ HOÀN THÀNH!');
      console.log(`📦 File: ${archiveName}`);
      console.log(`📁 Đường dẫn: ${archivePath}`);
      
      return archivePath;
      
    } catch (error) {
      console.error('❌ Backup thất bại:', error.message);
      
      // Cleanup on error
      if (fs.existsSync(backupDir)) {
        await execAsync(`rm -rf "${backupDir}"`);
      }
      
      throw error;
    }
  }

  /**
   * Chọn backup để xóa
   */
  async selectBackupsToDelete(backups) {
    console.log('\n🗑️  CHỌN BACKUP ĐỂ XÓA');
    console.log('=' .repeat(50));
    console.log('Nhập số thứ tự của backup muốn xóa (cách nhau bằng dấu phẩy)');
    console.log('Ví dụ: 1,3,5 hoặc nhập "all" để xóa tất cả');
    console.log('Nhập "old" để xóa backup cũ hơn 30 ngày');
    console.log('Nhập "cancel" để hủy\n');
    
    const input = await this.question('Lựa chọn của bạn: ');
    
    if (input.toLowerCase() === 'cancel') {
      return [];
    }
    
    if (input.toLowerCase() === 'all') {
      const confirm = await this.question('⚠️  Bạn có chắc muốn xóa TẤT CẢ backup? (yes/no): ');
      if (confirm.toLowerCase() === 'yes') {
        return backups;
      } else {
        return [];
      }
    }
    
    if (input.toLowerCase() === 'old') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.maxBackupAge);
      
      const oldBackups = backups.filter(backup => backup.created < cutoffDate);
      
      if (oldBackups.length === 0) {
        console.log('📋 Không có backup cũ nào để xóa');
        return [];
      }
      
      console.log(`\n📋 Tìm thấy ${oldBackups.length} backup cũ hơn ${this.config.maxBackupAge} ngày:`);
      oldBackups.forEach(backup => {
        console.log(`- ${backup.name} (${backup.sizeHuman}) - ${backup.age}`);
      });
      
      const confirm = await this.question('\n⚠️  Xác nhận xóa các backup cũ? (yes/no): ');
      if (confirm.toLowerCase() === 'yes') {
        return oldBackups;
      } else {
        return [];
      }
    }
    
    const indices = input.split(',').map(s => parseInt(s.trim()) - 1);
    const selectedBackups = [];
    
    for (const index of indices) {
      if (index >= 0 && index < backups.length) {
        selectedBackups.push(backups[index]);
      }
    }
    
    if (selectedBackups.length === 0) {
      console.log('❌ Không có backup nào được chọn');
      return [];
    }
    
    console.log('\n📋 Backup sẽ bị xóa:');
    selectedBackups.forEach(backup => {
      console.log(`- ${backup.name} (${backup.sizeHuman})`);
    });
    
    const confirm = await this.question('\n⚠️  Xác nhận xóa? (yes/no): ');
    if (confirm.toLowerCase() === 'yes') {
      return selectedBackups;
    } else {
      return [];
    }
  }

  /**
   * Xóa backup
   */
  async deleteBackups(backupsToDelete) {
    console.log('\n🗑️  ĐANG XÓA BACKUP...');
    
    let deletedCount = 0;
    let freedSpace = 0;
    
    for (const backup of backupsToDelete) {
      try {
        if (backup.type === 'archive') {
          fs.unlinkSync(backup.path);
        } else {
          await execAsync(`rm -rf "${backup.path}"`);
        }
        
        deletedCount++;
        freedSpace += backup.size;
        console.log(`✅ Đã xóa: ${backup.name}`);
      } catch (error) {
        console.error(`❌ Không thể xóa ${backup.name}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Hoàn thành! Đã xóa ${deletedCount} backup`);
    console.log(`💾 Giải phóng: ${this.formatBytes(freedSpace)}`);
    
    return { deletedCount, freedSpace };
  }

  /**
   * Hiển thị thông tin hệ thống
   */
  async showSystemInfo() {
    console.log('\n📊 THÔNG TIN HỆ THỐNG');
    console.log('=' .repeat(50));
    
    try {
      // Database info
      console.log('🗄️  Database:');
      console.log(`   Host: ${this.dbConfig.host}:${this.dbConfig.port}`);
      console.log(`   Database: ${this.dbConfig.database}`);
      console.log(`   User: ${this.dbConfig.user}`);
      
      // Disk space
      const { stdout } = await execAsync('df -h .');
      const lines = stdout.trim().split('\n');
      const data = lines[1].split(/\s+/);
      
      console.log('\n💾 Disk Space:');
      console.log(`   Total: ${data[1]}`);
      console.log(`   Used: ${data[2]} (${data[4]})`);
      console.log(`   Available: ${data[3]}`);
      
      // Backup directory
      console.log('\n📁 Backup Directory:');
      console.log(`   Path: ${this.backupBaseDir}`);
      console.log(`   Exists: ${fs.existsSync(this.backupBaseDir) ? 'Yes' : 'No'}`);
      
      if (fs.existsSync(this.backupBaseDir)) {
        const backups = await this.listBackups();
        const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
        console.log(`   Backups: ${backups.length}`);
        console.log(`   Total Size: ${this.formatBytes(totalSize)}`);
      }
      
    } catch (error) {
      console.error('❌ Không thể lấy thông tin hệ thống:', error.message);
    }
  }

  /**
   * Hiển thị menu chính
   */
  async showMainMenu() {
    console.clear();
    console.log('🎮 MANUAL BACKUP SYSTEM v2.0');
    console.log('=' .repeat(50));
    console.log('1. 📋 Xem danh sách backup');
    console.log('2. ⚡ Tạo backup nhanh (1-2 phút)');
    console.log('3. 🏢 Tạo backup đầy đủ (5-10 phút)');
    console.log('4. 🗑️  Dọn dẹp backup');
    console.log('5. 📊 Thông tin hệ thống');
    console.log('6. 🚪 Thoát');
    console.log('=' .repeat(50));
    
    const choice = await this.question('Chọn tùy chọn (1-6): ');
    return choice;
  }

  /**
   * Khởi tạo và kiểm tra hệ thống
   */
  async initialize() {
    console.log('🚀 KHỞI TẠO MANUAL BACKUP SYSTEM...\n');
    
    try {
      console.log('🔧 Kiểm tra yêu cầu hệ thống...');
      await this.checkSystemRequirements();
      console.log('✅ System requirements OK');
      
      console.log('🔍 Kiểm tra kết nối database...');
      await this.testDatabaseConnection();
      console.log('✅ Database connection OK');
      
      console.log('📁 Kiểm tra thư mục backup...');
      this.ensureBackupDirectory();
      console.log('✅ Backup directory OK');
      
      console.log('\n🎉 Hệ thống sẵn sàng!\n');
      return true;
      
    } catch (error) {
      console.error('❌ Lỗi khởi tạo:', error.message);
      console.log('\n🔧 Vui lòng kiểm tra:');
      console.log('1. PostgreSQL client tools đã được cài đặt');
      console.log('2. DATABASE_URL trong .env đã đúng');
      console.log('3. Database server đang chạy');
      console.log('4. Quyền ghi vào thư mục project');
      return false;
    }
  }

  /**
   * Main loop
   */
  async run() {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        this.rl.close();
        process.exit(1);
      }
      
      while (true) {
        const choice = await this.showMainMenu();
        
        switch (choice) {
          case '1':
            await this.listBackups();
            await this.question('\nNhấn Enter để tiếp tục...');
            break;
            
          case '2':
            try {
              await this.createQuickBackup();
            } catch (error) {
              console.error('❌ Lỗi:', error.message);
            }
            await this.question('\nNhấn Enter để tiếp tục...');
            break;
            
          case '3':
            try {
              await this.createFullBackup();
            } catch (error) {
              console.error('❌ Lỗi:', error.message);
            }
            await this.question('\nNhấn Enter để tiếp tục...');
            break;
            
          case '4':
            const backups = await this.listBackups();
            if (backups.length > 0) {
              const backupsToDelete = await this.selectBackupsToDelete(backups);
              if (backupsToDelete.length > 0) {
                await this.deleteBackups(backupsToDelete);
              }
            }
            await this.question('\nNhấn Enter để tiếp tục...');
            break;
            
          case '5':
            await this.showSystemInfo();
            await this.question('\nNhấn Enter để tiếp tục...');
            break;
            
          case '6':
            console.log('\n👋 Tạm biệt!');
            this.rl.close();
            return;
            
          default:
            console.log('\n❌ Lựa chọn không hợp lệ!');
            await this.question('Nhấn Enter để tiếp tục...');
        }
      }
      
    } catch (error) {
      console.error('❌ Lỗi hệ thống:', error.message);
      this.rl.close();
      process.exit(1);
    }
  }
}

// Export class
module.exports = ManualBackupSystem;

// Chạy nếu được gọi trực tiếp
if (require.main === module) {
  const backupSystem = new ManualBackupSystem();
  backupSystem.run().catch(error => {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  });
}