# 🎮 MANUAL BACKUP SYSTEM v2.0

## 🚀 CÁCH SỬ DỤNG NHANH

### **Chạy backup:**
```bash
npm run backup
```

### **Khôi phục backup:**
```bash
npm run backup:restore <đường-dẫn-backup>
```

---

## 📋 MENU CHÍNH

```
🎮 MANUAL BACKUP SYSTEM v2.0
==================================================
1. 📋 Xem danh sách backup
2. ⚡ Tạo backup nhanh (1-2 phút)
3. 🏢 Tạo backup đầy đủ (5-10 phút)
4. 🗑️  Dọn dẹp backup
5. 📊 Thông tin hệ thống
6. 🚪 Thoát
==================================================
```

---

## ⚡ **BACKUP NHANH** (Option 2)

**Thời gian:** 1-2 phút  
**Nội dung:**
- 🗄️ Database dump (SQL + gzip)
- 📁 Files quan trọng (.env, package.json, schema.prisma)
- 📂 Uploads folder (nếu có)

**Khi nào dùng:**
- ✅ Trước deploy
- ✅ Trước update database
- ✅ Backup khẩn cấp

---

## 🏢 **BACKUP ĐẦY ĐỦ** (Option 3)

**Thời gian:** 5-10 phút  
**Nội dung:**
- 🗄️ Full database dump + Schema dump + Data dump
- 📁 Tất cả files và thư mục quan trọng
- 📋 Manifest với metadata chi tiết

**Khi nào dùng:**
- ✅ Backup định kỳ
- ✅ Trước maintenance lớn
- ✅ Lưu trữ dài hạn

---

## 🗑️ **DỌN DẸP BACKUP** (Option 4)

**Tùy chọn:**
- `1,3,5` - Xóa backup số 1, 3, 5
- `all` - Xóa tất cả backup
- `old` - Xóa backup cũ hơn 30 ngày
- `cancel` - Hủy bỏ

---

## 🔄 **KHÔI PHỤC BACKUP**

### **Cách 1: CLI trực tiếp**
```bash
# Khôi phục đầy đủ
npm run backup:restore ./backups/backup-2024-01-15.tar.gz

# Chỉ restore database
npm run backup:restore ./backups/backup-2024-01-15.tar.gz --no-files

# Không hỏi xác nhận
npm run backup:restore ./backups/backup-2024-01-15.tar.gz --no-confirm
```

### **Cách 2: Xem danh sách trước**
```bash
# 1. Chạy backup để xem danh sách
npm run backup
# Chọn option 1 để xem danh sách backup

# 2. Copy đường dẫn backup cần restore
npm run backup:restore <đường-dẫn-đã-copy>
```

---

## 🔧 **YÊU CẦU HỆ THỐNG**

### **Phần mềm:**
- ✅ Node.js 18+
- ✅ PostgreSQL client tools (`pg_dump`, `psql`)
- ✅ tar, gzip (có sẵn Linux/macOS)

### **Cấu hình:**
```bash
# File .env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### **Kiểm tra:**
```bash
# Test PostgreSQL tools
pg_dump --version
psql --version

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

---

## 🚨 **XỬ LÝ LỖI**

### **"pg_dump: command not found"**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# CentOS/RHEL
sudo yum install postgresql

# macOS
brew install postgresql
```

### **"Database connection failed"**
- ✅ Kiểm tra `DATABASE_URL` trong .env
- ✅ Kiểm tra database server đang chạy
- ✅ Kiểm tra network connection

### **"Permission denied"**
```bash
# Cấp quyền execute
chmod +x scripts/manual-backup.js scripts/backup-restore.js

# Kiểm tra quyền thư mục
ls -la backups/
```

---

## 💡 **BEST PRACTICES**

### **🎯 Backup Strategy:**
- ⚡ **Backup nhanh** trước mỗi deploy
- 🏢 **Backup đầy đủ** hàng tuần
- 🗑️ **Dọn dẹp** backup cũ định kỳ

### **🛡️ Bảo mật:**
- 🔒 Backup chứa thông tin nhạy cảm
- 📁 Không commit backup vào git
- 🌐 Lưu backup quan trọng ở nơi khác

### **📊 Monitoring:**
- 📋 Kiểm tra danh sách backup thường xuyên
- 💾 Monitor disk space
- ✅ Test restore định kỳ

---

## 📞 **EMERGENCY BACKUP**

Nếu script không hoạt động:

```bash
# Database backup thủ công
pg_dump $DATABASE_URL > emergency-backup.sql
gzip emergency-backup.sql

# Files backup thủ công
tar -czf emergency-files.tar.gz .env package.json prisma/ public/uploads/

# Restore thủ công
psql $DATABASE_URL < emergency-backup.sql
```

---

## ✅ **TÍNH NĂNG CHÍNH**

- 🎮 **Menu tương tác** dễ sử dụng
- ⚡ **Backup nhanh** cho daily use
- 🏢 **Backup đầy đủ** cho archival
- 🗑️ **Smart cleanup** với nhiều tùy chọn
- 📊 **System info** và monitoring
- 🔄 **Reliable restore** với verification
- 🛡️ **Error handling** và recovery
- 📋 **Detailed logging** và manifest

**Sẵn sàng sử dụng!** 🚀