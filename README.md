# 📈 Trading Journal - Vietnamese Stock Market Trading Platform

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748)](https://www.prisma.io/)

> **Nền tảng nhật ký giao dịch chứng khoán thông minh hàng đầu Việt Nam**  
> Theo dõi, phân tích và tối ưu hóa chiến lược đầu tư của bạn với công nghệ AI và dữ liệu thị trường thời gian thực.

![image](https://github.com/user-attachments/assets/709283c7-5ab5-45de-a959-11291952ecb2)
![image](https://github.com/user-attachments/assets/cf63349a-7218-496a-bc40-c40a220fedac)


## 🎯 Tổng quan

Trading Journal là nền tảng toàn diện giúp nhà đầu tư Việt Nam quản lý danh mục, theo dõi giao dịch và phân tích hiệu suất một cách khoa học. Với tích hợp dữ liệu thị trường từ TCBS và công nghệ AI, chúng tôi giúp bạn đưa ra quyết định đầu tư thông minh hơn.

## ✨ Tính năng chính

### 🔐 Quản lý tài khoản nâng cao
- **Xác thực bảo mật**: Đăng nhập bằng email/username với NextAuth.js
- **Mã hóa mật khẩu**: Bảo mật tối đa với bcrypt
- **Quản lý phiên**: Tự động đăng xuất sau 30 phút không hoạt động
- **Cảnh báo phiên**: Thông báo trước 2 phút khi hết hạn
- **Hồ sơ người dùng**: Tùy chỉnh thông tin cá nhân

### 💼 Quản lý đa tài khoản chứng khoán
- **Tạo nhiều tài khoản**: Quản lý các tài khoản từ nhiều công ty chứng khoán
- **Theo dõi riêng biệt**: Phân tích hiệu suất từng tài khoản độc lập
- **Chuyển cổ phiếu**: Di chuyển cổ phiếu giữa các tài khoản
- **Phân tích tổng hợp**: Xem tổng quan toàn bộ danh mục

### 📊 Ghi nhận giao dịch thông minh
- **Ghi nhận chi tiết**: Mã cổ phiếu, số lượng, giá, phí, thuế
- **Lọc và sắp xếp**: Tìm kiếm theo nhiều tiêu chí
- **Phân trang linh hoạt**: 10/25/50/100 giao dịch mỗi trang
- **Đồng bộ URL**: Chia sẻ bộ lọc qua URL
- **Tính P&L tự động**: Phương pháp FIFO (First-In-First-Out)

### 📈 Phân tích danh mục chuyên sâu
- **Vị thế thời gian thực**: Tính toán từ lịch sử giao dịch
- **Phân tích đa tài khoản**: Tổng quan toàn danh mục
- **Chỉ số hiệu suất**: ROI, tỷ lệ thắng/thua, phân tích xu hướng
- **Biểu đồ trực quan**: Charts tương tác với Chart.js và Recharts
- **So sánh thị trường**: Hiệu suất so với VN-Index

### 📝 Nhật ký giao dịch tâm lý
- **Liên kết giao dịch**: Mỗi giao dịch có một nhật ký riêng
- **Theo dõi cảm xúc**: Ghi nhận tâm lý lúc vào/ra lệnh
- **Tài liệu chiến lược**: Liên kết chiến lược với từng giao dịch
- **Đánh giá sau giao dịch**: Phản tư và học hỏi có hệ thống
- **Hệ thống tag**: Phân loại và phân tích theo tag cá nhân

### 🤝 Cộng đồng chia sẻ chiến lược
- **Thư viện chiến lược công cộng**: Khám phá chiến lược từ cộng đồng
- **Quản lý chiến lược cá nhân**: Tạo, chỉnh sửa chiến lược riêng
- **Tương tác cộng đồng**: Học hỏi từ nhà đầu tư khác
- **Phân tích chiến lược**: Theo dõi hiệu quả các chiến lược

### ⚡ Tối ưu hóa hiệu suất
- **Cache đa lớp**: Bộ nhớ + database cho tốc độ tối ưu
- **Cache giá cổ phiếu**: Lưu trữ 1 giờ với TTL thông minh
- **Tối ưu truy vấn**: Raw SQL cho các thao tác quan trọng
- **Thời gian phản hồi**: <200ms cho request có cache
- **Quản lý bộ nhớ**: Singleton Prisma và LRU cache

## 🛠️ Công nghệ sử dụng

### Frontend & UI/UX
```
Next.js 14 (App Router)    - Full-stack React framework
React 18                   - Component-based UI with Concurrent Features  
Tailwind CSS              - Utility-first CSS framework
Font Awesome              - Icon library
Chart.js + react-chartjs-2 - Interactive data visualization
Recharts                  - Responsive React charts
```

### Backend & Database
```
PostgreSQL                - Primary ACID-compliant database
Prisma ORM               - Type-safe database toolkit
NextAuth.js v4           - Complete authentication solution
Node.js                  - JavaScript runtime
bcrypt                   - Password hashing and security
```

### External APIs & Integration
```
TCBS API                 - Vietnamese stock market data
node-fetch               - HTTP client for API calls
date-fns                 - Modern date utility library
Custom Caching System    - Multi-layer performance optimization
```

### Development & Testing
```
Jest                     - Testing framework
Playwright               - End-to-end testing
ESLint                   - Code linting and quality
PostCSS + Autoprefixer   - CSS processing
dotenv                   - Environment variable management
```

## 🗄️ Cấu trúc Database

### Models chính

#### User - Quản lý người dùng
```prisma
model User {
  id             String         @id @default(cuid())
  email          String         @unique
  name           String?
  passwordHash   String?
  username       String         @unique
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  
  // Relations
  journalEntries JournalEntry[]
  StockAccount   StockAccount[]
  strategies     Strategy[]
  tags           Tag[]
  transactions   Transaction[]
  purchaseLots   PurchaseLot[]
}
```

#### Transaction - Giao dịch chứng khoán
```prisma
model Transaction {
  id              String        @id @default(cuid())
  userId          String
  ticker          String
  type            String        // 'BUY' hoặc 'SELL'
  quantity        Float
  price           Float
  transactionDate DateTime
  fee             Float         @default(0)
  taxRate         Float         @default(0)
  calculatedPl    Float?        // P&L cho lệnh SELL
  notes           String?
  stockAccountId  String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  journalEntry    JournalEntry?
  StockAccount    StockAccount  @relation(fields: [stockAccountId], references: [id])
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### StockAccount - Tài khoản chứng khoán
```prisma
model StockAccount {
  id            String        @id
  name          String
  brokerName    String?
  accountNumber String?
  description   String?
  userId        String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  // Relations
  User          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  Transaction   Transaction[]
}
```

#### JournalEntry - Nhật ký giao dịch
```prisma
model JournalEntry {
  id              String            @id @default(cuid())
  transactionId   String            @unique
  userId          String
  emotionOnEntry  String?
  emotionOnExit   String?
  strategyUsed    String?
  postTradeReview String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  // Relations
  transaction     Transaction       @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags            JournalEntryTag[]
}
```

## 🔌 API Endpoints

### Authentication & User Management
```http
GET/POST /api/auth/[...nextauth]  # NextAuth.js authentication routes
POST     /api/auth/register       # User registration endpoint
```

### Stock Account Management
```http
GET     /api/stock-accounts        # Danh sách tài khoản chứng khoán
POST    /api/stock-accounts        # Tạo tài khoản mới
PUT     /api/stock-accounts/:id    # Cập nhật tài khoản
DELETE  /api/stock-accounts/:id    # Xóa tài khoản
```

### Transaction Management
```http
GET     /api/transactions           # Danh sách với filter, phân trang, sắp xếp
POST    /api/transactions           # Tạo giao dịch mới
GET     /api/transactions/:id       # Chi tiết giao dịch
PUT     /api/transactions/:id       # Cập nhật giao dịch
DELETE  /api/transactions/:id       # Xóa giao dịch
POST    /api/transactions/transfer  # Chuyển cổ phiếu giữa các tài khoản
```

### Journal & Tags
```http
GET     /api/journal                # Danh sách nhật ký
POST    /api/journal                # Tạo nhật ký cho giao dịch
GET     /api/journal/tags           # Danh sách tag cá nhân
POST    /api/journal/tags           # Tạo tag mới
DELETE  /api/journal/tags/:id       # Xóa tag
```

### Strategy Sharing
```http
GET     /api/strategies             # Danh sách chiến lược công khai
POST    /api/strategies             # Tạo chiến lược mới
GET     /api/strategies/me          # Chiến lược của user
GET     /api/strategies/latest      # Chiến lược mới nhất
GET     /api/strategies/:id         # Chi tiết chiến lược
PUT     /api/strategies/:id         # Cập nhật chiến lược
DELETE  /api/strategies/:id         # Xóa chiến lược
```

### Analytics & Market Data
```http
GET     /api/portfolio              # Dữ liệu và phân tích danh mục
GET     /api/analysis               # Phân tích hiệu suất giao dịch
GET     /api/market-data            # Dữ liệu thị trường với TCBS
```

## 🚀 Cài đặt và triển khai

### Yêu cầu hệ thống
- **Node.js** v18+ (khuyến nghị v20+)
- **PostgreSQL** v13+ (khuyến nghị v15+)
- **Git** để quản lý mã nguồn
- **npm** hoặc **yarn** để quản lý packages

### 1. Clone Repository
```bash
git clone <repository-url>
cd trading-journal
```

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Thiết lập Database

#### Cài đặt PostgreSQL
**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Tải từ [PostgreSQL Official Website](https://www.postgresql.org/download/windows/)

#### Tạo Database và User
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE trading_journal;
CREATE USER tjuser WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE trading_journal TO tjuser;
ALTER USER tjuser CREATEDB;
\q
```

### 4. Cấu hình Environment

Tạo file `.env` trong thư mục gốc:
```env
# Database connection
DATABASE_URL="postgresql://tjuser:your_secure_password@localhost:5432/trading_journal"

# NextAuth.js configuration
NEXTAUTH_SECRET="your_generated_secret_key_32_chars_minimum"
NEXTAUTH_URL="http://localhost:3000"

# TCBS API (Vietnamese stock market data)
TCBS_API_URL="https://apipubaws.tcbs.com.vn"

# Stock price cache duration (1 hour = 3600000ms)
STOCK_PRICE_CACHE_DURATION=3600000

# Logging configuration
LOG_LEVEL="info"

# Production settings (for deployment)
NODE_ENV="development"
```

**Tạo NextAuth Secret:**
```bash
openssl rand -base64 32
```
Hoặc truy cập [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)

### 5. Thiết lập Database Schema
```bash
# Generate Prisma client
npx prisma generate

# Apply database migrations
npx prisma migrate dev --name init

# Optional: View database in Prisma Studio
npx prisma studio
```

### 6. Chạy Development Server
```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

### 7. Production Build
```bash
npm run build
npm start
```

## 📋 Scripts có sẵn

### Development & Build
```bash
npm run dev                    # Chạy development server với hot reload
npm run build                  # Tạo production build
npm start                      # Chạy production server
npm run lint                   # Chạy ESLint kiểm tra code quality
```

### Database Management
```bash
npm run prisma:generate        # Generate Prisma client
npx prisma migrate dev         # Tạo và apply migration mới
npx prisma migrate reset       # Reset database và apply tất cả migrations
npx prisma studio              # Mở Prisma Studio database GUI
```

### Testing & Quality Assurance
```bash
npm test                       # Chạy tất cả tests
npm run test:watch             # Chạy tests ở watch mode
npm run test:coverage          # Chạy tests với coverage report
npm run test:api               # Test API endpoints
npm run test:components        # Test React components
npm run test:integration       # Test integration scenarios
npm run test:e2e               # End-to-end testing với Playwright
```

### Database Testing
```bash
npm run test:db-migration      # Comprehensive database migration test
npm run test:db:setup          # Thiết lập test database
npm run test:db:seed           # Seed test data
npm run test:db:clean          # Dọn dẹp test data
```

### Debugging & Monitoring
```bash
npm run debug:tcbs             # Debug TCBS API connection
npm run debug:market-data      # Test market data functionality
npm run test:market-data       # Test market data functions
```

### Maintenance
```bash
npm run cleanup:cache          # Dọn dẹp application cache
npm run cleanup:cache:dry      # Preview cache cleanup (dry run)
npm run migrate:cost-basis     # Migrate cost basis calculations
```

## 🔧 Cấu hình nâng cao

### Stock Price Caching
Hệ thống cache thông minh cho giá cổ phiếu:
- **Thời gian mặc định**: 1 giờ (có thể cấu hình qua `STOCK_PRICE_CACHE_DURATION`)
- **Lưu trữ cache**: Database với lớp in-memory
- **Tự động làm mới**: Cache hết hạn kích hoạt API request mới
- **Fallback**: Sử dụng cache cũ nếu API thất bại
- **Hiệu suất**: Tăng tốc 10x cho dữ liệu đã cache

### Session Management
- **Timeout**: 30 phút không hoạt động
- **Cảnh báo**: 2 phút trước khi hết hạn
- **Theo dõi hoạt động**: Mouse, keyboard, scroll events gia hạn session
- **Re-authentication**: Modal login không reload trang

### API Performance
- **Thời gian phản hồi**: <200ms trung bình cho transaction lists
- **Chiến lược cache**: Multi-layer với TTL-based expiration
- **Tối ưu truy vấn**: Raw SQL cho các path quan trọng
- **Xử lý lỗi**: Logging toàn diện và error messages thân thiện

### TCBS API Integration
- **Rate limiting**: Request throttling thông minh
- **Error handling**: Fallback graceful tới cached data
- **Data validation**: Validation toàn diện API responses
- **Retry logic**: Auto retry với exponential backoff

## 🧪 Testing Strategy

### Comprehensive Test Suite
Ứng dụng bao gồm test suite toàn diện cho tất cả layers:

#### Test Categories
1. **Database Migration Tests** - Kiểm tra database connectivity và schema integrity
2. **API Tests** - Test tất cả REST endpoints và business logic
3. **Component Tests** - Test React components và UI functionality  
4. **Integration Tests** - Test end-to-end workflows
5. **Performance Tests** - Kiểm tra response times và query performance
6. **Security Tests** - Kiểm tra authentication và data isolation

#### Quick Database Environment Test
Khi thay đổi database environment (ví dụ SQLite sang PostgreSQL):
```bash
npm run test:db-migration
```

Test này sẽ kiểm tra:
- ✅ Database connectivity
- ✅ Schema integrity  
- ✅ API functionality
- ✅ Data relationships
- ✅ Performance benchmarks
- ✅ Security features

#### Coverage Requirements
```javascript
// Jest configuration trong package.json
"coverageThreshold": {
  "global": {
    "branches": 70,
    "functions": 70, 
    "lines": 70,
    "statements": 70
  }
}
```

## 🌐 Production Deployment

### Environment Variables cho Production
```env
# Production database (ví dụ: AWS RDS, Google Cloud SQL)
DATABASE_URL="postgresql://user:password@prod-db-host:5432/trading_journal"

# Production NextAuth
NEXTAUTH_SECRET="production_secret_key_64_chars_minimum"
NEXTAUTH_URL="https://yourdomain.com"

# Production settings
NODE_ENV="production"
LOG_LEVEL="warn"

# Performance settings
STOCK_PRICE_CACHE_DURATION=3600000

# Security settings
SESSION_MAX_AGE=1800  # 30 minutes
```

### Production Checklist
- [ ] **Database**: Sử dụng managed PostgreSQL service
- [ ] **SSL/TLS**: Enable HTTPS cho production
- [ ] **Secrets**: Sử dụng secure secret management
- [ ] **Monitoring**: Thiết lập APM và database monitoring
- [ ] **Backups**: Cấu hình automated backups
- [ ] **Rate Limiting**: Implement cho API endpoints
- [ ] **CORS**: Cấu hình proper CORS policies
- [ ] **Performance**: Connection pooling và query optimization
- [ ] **Security**: Regular security updates

### Performance Monitoring
- **APM Integration**: Application performance monitoring
- **Database Monitoring**: Query performance và connection pools
- **Error Tracking**: Real-time error monitoring và alerting
- **Cache Monitoring**: Cache hit rates và performance metrics
- **API Monitoring**: Response times và error rates

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Mở Pull Request

### Development Guidelines
- **Code Style**: Tuân theo ESLint configuration
- **Testing**: Viết tests cho tính năng mới
- **Documentation**: Cập nhật docs cho API changes
- **Commits**: Sử dụng conventional commit messages
- **Quality**: Đảm bảo tất cả tests pass trước khi submit PR

### Code Review Process
- **Automated Tests**: Tất cả tests phải pass
- **Code Coverage**: Maintain coverage threshold (70%+)
- **Performance**: Không làm giảm performance
- **Security**: Security review cho authentication changes
- **Documentation**: Documentation updates cho breaking changes

## 📄 License

Dự án này được cấp phép theo ISC License. Xem file [LICENSE](LICENSE) để biết chi tiết.

## 🙏 Acknowledgements

- **Vietnamese Trading Community** - Góp ý và feedback
- **TCBS (Techcom Securities)** - Cung cấp market data API
- **Open Source Community** - Các thư viện mã nguồn mở:
  - Next.js team - Amazing React framework
  - Prisma team - Excellent database toolkit
  - NextAuth.js - Complete authentication solution
  - Chart.js & Recharts - Powerful visualization tools
  - Tailwind CSS - Utility-first CSS framework

## 📞 Support & Contact

### Hỗ trợ kỹ thuật
- 📧 **Email**: support@tradingjournal.vn
- 📞 **Hotline**: 1800-123-456
- 🌐 **Website**: [tradingjournal.vn](https://tradingjournal.vn)
- 💬 **Community**: [Discord Community](https://discord.gg/tradingjournal)

### Bug Reports & Feature Requests
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-repo/trading-journal/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/your-repo/trading-journal/discussions)
- 📚 **Documentation**: [Wiki](https://github.com/your-repo/trading-journal/wiki)

### Business Inquiries
- 🏢 **Enterprise Sales**: enterprise@tradingjournal.vn
- 🤝 **Partnerships**: partnerships@tradingjournal.vn
- 📺 **Media**: media@tradingjournal.vn

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Problems
```bash
# Kiểm tra PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Test database connection
psql -U tjuser -d trading_journal -c "\dt"
```

#### Prisma Issues
```bash
# Reset Prisma client
npx prisma generate

# Reset database
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

#### TCBS API Issues
```bash
# Test API connectivity
npm run debug:tcbs

# Check API logs
tail -f logs/tcbs-api-debug.json
```

#### Performance Issues
```bash
# Check cache status
npm run debug:market-data

# Clean cache
npm run cleanup:cache

# Monitor performance
npm run test:market-data
```

### Getting Help

1. **Kiểm tra Documentation**: Đọc các file TESTING.md, POSTGRES_MIGRATION.md
2. **Search Issues**: Tìm trong existing GitHub issues
3. **Run Diagnostics**: Sử dụng debug scripts có sẵn
4. **Community Support**: Tham gia Discord community
5. **Professional Support**: Liên hệ support team

---

<div align="center">

**🚀 Built for traders, by traders 📈**

**Happy Trading! 💪**

[Website](https://tradingjournal.vn) • [Documentation](https://docs.tradingjournal.vn) • [Community](https://discord.gg/tradingjournal) • [Support](mailto:support@tradingjournal.vn)

</div>
