# 📈 Trading Journal - Nền Tảng Quản Lý Đầu Tư Chứng Khoán Thông Minh

<div align="center">

![Trading Journal Banner](public/images/trading-dashboard-hero.jpg)

**🚀 Giải pháp quản lý danh mục đầu tư chuyên sâu, giao diện Glassmorphism hiện đại, tối ưu hóa cho thị trường chứng khoán Việt Nam.**

[![Version](https://img.shields.io/badge/version-4.3.0-blue.svg)](https://github.com/yourusername/trading-journal)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/stack-Next.js%2015%20|%20Prisma%20|%20PostgreSQL-blueviolet.svg)](https://nextjs.org)
[![Style](https://img.shields.io/badge/style-Glassmorphism-teal.svg)](https://tailwindcss.com)

[🌐 Website](https://tradingjournal.vn) • [📖 Tài Liệu](https://docs.tradingjournal.vn) • [💬 Cộng Đồng](https://discord.gg/tradingjournal)

</div>

---

## 🎨 Giao Diện Glassmorphism Mới (v4.3.0)

Phiên bản mới nhất mang đến trải nghiệm người dùng hoàn toàn mới với phong cách thiết kế **Glassmorphism** (Kính mờ) sang trọng và hiện đại, cùng với các cập nhật bảo mật quan trọng.

| Đặc điểm | Chi tiết |
|----------|----------|
| **🌫️ Hiệu ứng Kính mờ** | Sử dụng `backdrop-blur` và độ trong suốt tinh tế giúp giao diện có chiều sâu và nổi bật nội dung quan trọng. |
| **🌓 Chế độ Sáng/Tối** | Tự động thích ứng với hệ thống, tối ưu hóa độ tương phản cho cả ngày và đêm. |
| **✨ Vi mô tương tác** | Hiệu ứng hover, transition mượt mà, bóng đổ (shadow) mềm mại tạo cảm giác cao cấp. |
| **📱 Responsive** | Hiển thị hoàn hảo trên mọi thiết bị từ Mobile, Tablet đến Desktop. |

---

## 🎯 Tại Sao Chọn Trading Journal?

Khác với Excel hay các ứng dụng ghi chép đơn giản, **Trading Journal** tập trung vào **tính chính xác tuyệt đối** của dữ liệu tài chính và **trải nghiệm người dùng đẳng cấp**.

### ✨ Tính Năng Cốt Lõi

#### 1. 💰 Smart Cost Basis Engine (Độc Quyền)
Hệ thống tính toán giá vốn phức tạp nhất hiện nay, giải quyết triệt để các bài toán khó của thị trường Việt Nam:
-   ✅ **FIFO Chính Xác**: Tự động khớp lệnh bán với các lô mua cũ nhất theo chuẩn kế toán.
-   ✅ **Xử Lý Cổ Tức**: Tự động điều chỉnh giá vốn khi nhận cổ tức tiền mặt/cổ phiếu.
-   ✅ **Corporate Actions**: Hỗ trợ chia tách cổ phiếu, quyền mua.
-   ✅ **Thuế & Phí**: Tính toán chính xác thuế bán (0.1%) và phí giao dịch từng công ty chứng khoán.

#### 2. 📊 Phân Tích Chuyên Sâu
Không chỉ là con số, chúng tôi cung cấp cái nhìn toàn cảnh về hiệu suất đầu tư:
-   📈 **Risk Metrics**: Sharpe Ratio, Alpha, Beta, Max Drawdown.
-   📉 **Benchmark Comparison**: So sánh hiệu suất với VN-Index/HNX-Index.
-   🍰 **Phân Bổ Danh Mục**: Theo dõi tỷ trọng cổ phiếu, tiền mặt và nhóm ngành.
-   📅 **Lịch Sử Hiệu Quả**: Phân tích lãi/lỗ theo tuần, tháng, năm.

#### 3. 🇻🇳 Tối Ưu Cho Chứng Khoán Việt Nam
-   ✅ **Bước Giá Động**: Validation giá đặt lệnh chuẩn HSX/HNX/UPCOM.
-   ✅ **Dữ Liệu Thị Trường**: Tích hợp giá tham chiếu và cập nhật giá trị thị trường.
-   ✅ **Chu Kỳ T+2.5**: Hỗ trợ theo dõi ngày thanh toán.

---

## 🛠️ Tech Stack & Kiến Trúc

Dự án được xây dựng trên nền tảng công nghệ vững chắc, đảm bảo hiệu năng và khả năng mở rộng:

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | **Next.js 16.0.6** (App Router) | Server Components, Turbopack, Streaming |
| **Styling** | **Tailwind CSS** | Glassmorphism Design System, Dark mode |
| **Icons** | **Lucide React** | Lightweight, modern icons |
| **Database** | **PostgreSQL** | Quan hệ dữ liệu chặt chẽ, ACID compliance |
| **ORM** | **Prisma** | Type-safe database access |
| **Auth** | **NextAuth.js** | Secure authentication |
| **Charts** | **Recharts** | Interactive data visualization |

---

## 📁 Cấu Trúc Dự Án

```
trading-journal/
├── app/
│   ├── api/                    # API routes (Next.js App Router)
│   ├── components/
│   │   ├── ui/                 # Reusable Glassmorphism components (Modal, Card, Button...)
│   │   ├── portfolio/          # Portfolio feature components
│   │   ├── transactions/       # Transaction feature components
│   │   └── ...
│   ├── context/                # React Contexts (Theme, Auth)
│   ├── lib/                    # Utilities, formatters, hooks
│   └── [pages]/                # Application pages
├── prisma/                     # Database schema & migrations
├── public/                     # Static assets
├── scripts/                    # Maintenance scripts
└── tests/                      # Unit & E2E tests
```

---

## 🚀 Bắt Đầu Nhanh

### Yêu Cầu
-   **Node.js** 18+ (Tested on v22.21.0)
-   **PostgreSQL** (Supabase, Local, hoặc Docker)
-   **npm** hoặc **yarn**

### Cài Đặt

1.  **Clone repository**
    ```bash
    git clone https://github.com/yourusername/trading-journal.git
    cd trading-journal
    ```

2.  **Cài đặt dependencies**
    ```bash
    npm install
    ```

3.  **Cấu hình môi trường**
    ```bash
    cp .env.example .env
    # Cập nhật DATABASE_URL trong file .env
    ```

4.  **Khởi tạo Database**
    ```bash
    npx prisma migrate dev
    npx prisma db seed # (Tùy chọn: Tạo dữ liệu mẫu)
    ```

5.  **Chạy ứng dụng**
    ```bash
    npm run dev
    ```
    Truy cập `http://localhost:3000` để trải nghiệm giao diện mới.

### Scripts Quan Trọng

```bash
# Development
npm run dev              # Chạy dev server với Turbopack
npm run build            # Build production
npm start                # Chạy production server

# Database
npx prisma migrate dev   # Chạy migrations
npx prisma studio        # Mở Prisma Studio GUI
npm run backup           # Backup database

# Testing
npm test                 # Unit tests
npm run test:e2e         # E2E tests với Playwright
npm run test:coverage    # Test coverage report

# Maintenance
npm audit                # Kiểm tra vulnerabilities
npm run cleanup:cache    # Dọn dẹp cache
```

---

## 🧪 Testing & Quality

Chúng tôi cam kết chất lượng code cao nhất với bộ test suite toàn diện:

-   **Unit Tests**: `npm test` (Logic nghiệp vụ, tính toán giá vốn)
-   **E2E Tests**: `npm run test:e2e` (Luồng người dùng với Playwright)
-   **Performance**: `npm run test:performance` (Load testing)

---

## 🔒 Security & Data Safety

### Security Best Practices
- ✅ **0 vulnerabilities** - All dependencies regularly updated
- ✅ **Command injection prevention** - Secure backup scripts using `execFile`
- ✅ **SQL injection protection** - Prisma ORM with parameterized queries
- ✅ **Secret management** - Environment variables, never committed to Git
- ✅ **Pre-commit hooks (Husky)** - Automatic checks to prevent secret leaks
- ✅ **Git history** - Clean, no exposed credentials

#### 🐶 Git Hooks (Husky)

Pre-commit hooks automatically run security checks before each commit:

1. **Detect .env files** - Prevents committing sensitive files
2. **Scan for secrets** - Detects passwords, API keys, tokens in code
3. **Verify .gitignore** - Ensures sensitive files are protected
4. **Pattern matching** - Catches common security mistakes

To bypass (not recommended): `git commit --no-verify`

### Database Safety Guards
**Important:** Test scripts have safety checks to prevent production data loss:

```javascript
// Test scripts ONLY run on TEST_DATABASE_URL
if (!process.env.TEST_DATABASE_URL) {
  console.error('❌ DANGER: TEST_DATABASE_URL not set!');
  process.exit(1);
}
```

### Backup & Recovery

**Quick Backup (No PostgreSQL client required):**
```bash
npm run backup
```

**Production Backup:**
```bash
# Explicit confirmation required for production
BACKUP_ALLOW_PROD=true npm run backup
```

**Features:**
- JSON-based exports via Prisma
- Timestamped backup folders
- Production safety guards
- Selective table backup
- Metadata tracking

**Output:** `backups/db-backup-YYYY-MM-DDTHH-mm-ss/`

For detailed backup instructions, run `npm run backup -- --help`

### Security Rules

**NEVER:**
- Run test scripts on production DATABASE_URL
- Commit `.env` files (except `.env.example`)
- Use `exec()` with user input (use `execFile()` instead)
- Hardcode credentials in code

**ALWAYS:**
- Check environment before running destructive scripts
- Create backups before major changes
- Use separate TEST_DATABASE_URL for testing
- Review `git status` before committing

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your application URL
- `NEXTAUTH_SECRET` - Generated secret for NextAuth
- `TCBS_API_URL` - TCBS market data API endpoint

### Other Platforms

The app is compatible with any platform supporting Next.js 16:
- **Netlify**: Deploy with Next.js plugin
- **AWS**: EC2, ECS, or Amplify
- **Docker**: Dockerfile included in project
- **Self-hosted**: Node.js server

### Production Checklist

Before deploying to production:
- [ ] Set all environment variables
- [ ] Run database migrations
- [ ] Test build locally (`npm run build`)
- [ ] Enable production backups
- [ ] Configure monitoring/logging
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Review security settings
- [ ] Test all critical user flows

---

## 🤝 Đóng Góp

Chúng tôi hoan nghênh mọi đóng góp để làm cho Trading Journal tốt hơn!

1.  Fork dự án
2.  Tạo feature branch (`git checkout -b feature/NewFeature`)
3.  Commit thay đổi (`git commit -m 'Add NewFeature'`)
4.  Push lên branch (`git push origin feature/NewFeature`)
5.  Tạo Pull Request

### Development Guidelines

- Follow existing code style (ESLint + Prettier)
- Write tests for new features
- Update documentation as needed
- Keep commits atomic and descriptive
- Ensure all tests pass before submitting PR

---

## 📝 Changelog

### v4.3.0 (Current) - Security & Performance Update
- 🔒 **Security Hardening**: Sửa tất cả lỗ hổng bảo mật dependencies (0 vulnerabilities)
- 🛡️ **Secure Scripts**: Triển khai backup scripts an toàn, ngăn chặn command injection
- ⚡ **Next.js 16**: Cập nhật lên Next.js 16.0.6 với Turbopack support
- 🔐 **Git Security**: Xác minh git history sạch, không có secrets bị lộ
- 📦 **Dependencies**: Cập nhật tất cả packages (next-auth, form-data, glob, js-yaml, playwright)
- 🚀 **Build Optimization**: Cải thiện webpack configuration cho production builds
- 📝 **Documentation**: Thêm SECURITY.md với best practices và guidelines

### v4.2.0 - Glassmorphism Update
- 🎨 **New UI**: Chuyển đổi toàn bộ giao diện sang phong cách Glassmorphism.
- 🧩 **Components**: Cập nhật Modal, Cards, Tables với hiệu ứng kính mờ.
- 🌓 **Theming**: Tinh chỉnh Dark Mode để phù hợp với thiết kế mới.
- ⚡ **Optimization**: Cải thiện hiệu năng render các thành phần UI phức tạp.

### v4.1.0
- 👤 **User Attribution Fix**: Sửa lỗi hiển thị tên người tạo chiến lược.
- 🔗 **Database Relations**: Cải thiện quan hệ User-Strategy trong Prisma.
- 🔒 **Security**: Tăng cường bảo mật API.

### v4.0.0
- 🌑 **Dark Mode**: Hỗ trợ chế độ tối toàn diện.
- ⚡ **Performance**: Giảm 80% API calls, query nhanh hơn 30-50%.

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| **Lines of Code** | ~15,000+ |
| **Components** | 40+ React components |
| **API Endpoints** | 30+ routes |
| **Database Tables** | 12 core tables |
| **Test Coverage** | 70%+ |
| **Bundle Size** | Optimized with code splitting |
| **Performance** | Lighthouse 90+ |

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/trading-journal/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/trading-journal/discussions)
- **Email**: support@tradingjournal.vn
- **Community**: [Discord Server](https://discord.gg/tradingjournal)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### ⭐ If you find this project helpful, please consider giving it a star!

**Made with ❤️ by Vietnamese traders, for Vietnamese traders**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/trading-journal?style=social)](https://github.com/yourusername/trading-journal)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/trading-journal?style=social)](https://github.com/yourusername/trading-journal/fork)

</div>
