# 📈 Trading Journal - Nền Tảng Quản Lý Đầu Tư Chứng Khoán Việt Nam

<div align="center">

![Trading Journal Hero](public/images/trading-dashboard-hero.jpg)

**🚀 Giải pháp quản lý danh mục đầu tư chuyên sâu, tối ưu hóa cho thị trường chứng khoán Việt Nam (TCBS, SSI, VPS...)**

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)](https://github.com/yourusername/trading-journal)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/stack-Next.js%2015%20|%20Prisma%20|%20PostgreSQL-blueviolet.svg)](https://nextjs.org)
[![Status](https://img.shields.io/badge/status-Production%20Ready-success.svg)](https://tradingjournal.vn)

[🌐 Website](https://tradingjournal.vn) • [📖 Tài Liệu](https://docs.tradingjournal.vn) • [💬 Cộng Đồng](https://discord.gg/tradingjournal)

</div>

---

## 🎯 Tại Sao Chọn Trading Journal?

Khác với các file Excel thủ công hay các app ghi chép đơn giản, **Trading Journal** tập trung vào **tính chính xác của dữ liệu tài chính** và **phân tích hiệu suất chuyên sâu**.

### ✨ Tính Năng Cốt Lõi

#### 1. 💰 Smart Cost Basis Engine (Độc Quyền)
Hệ thống tính toán giá vốn (Cost Basis) phức tạp nhất hiện nay, giải quyết triệt để các bài toán khó của thị trường Việt Nam:
-   ✅ **FIFO Chính Xác**: Tự động khớp lệnh bán với các lô mua cũ nhất theo đúng chuẩn kế toán.
-   ✅ **Xử Lý Cổ Tức (Dividends)**: Tự động điều chỉnh giá vốn khi nhận cổ tức tiền mặt hoặc cổ phiếu thưởng.
-   ✅ **Corporate Actions**: Hỗ trợ chia tách cổ phiếu (Stock Splits), phát hành thêm.
-   ✅ **Thuế & Phí**: Tính toán chính xác thuế bán (0.1%) và phí giao dịch từng công ty chứng khoán.

#### 2. 📊 Advanced Analytics (Thay vì "Cảm tính")
Không chỉ là biểu đồ giá, chúng tôi cung cấp các chỉ số rủi ro chuẩn quỹ đầu tư:
-   📈 **Risk Metrics**: Sharpe Ratio, Alpha, Beta, Volatility, Max Drawdown.
-   📉 **Benchmark Comparison**: So sánh hiệu suất thực tế với VN-Index/HNX-Index.
-   🍰 **Sector Analysis**: Phân tích phân bổ danh mục theo nhóm ngành (Ngân hàng, Bất động sản, Thép...).
-   📅 **Performance Attribution**: Phân tích hiệu quả theo từng khung thời gian (Tuần, Tháng, Năm).

#### 3. 🇻🇳 Tối Ưu Cho Chứng Khoán Việt Nam
-   ✅ **Bước Giá Động (Dynamic Price Steps)**: Validation giá đặt lệnh theo đúng quy định HSX/HNX (10, 50, 100 đồng).
-   ✅ **Dữ Liệu Thị Trường**: Tích hợp giá tham chiếu real-time (nguồn TCBS).
-   ✅ **T+2.5**: Hỗ trợ theo dõi chu kỳ thanh toán.

---

## 🆕 Tính Năng Mới (v4.0.0)

### 🎨 UI/UX Improvements

| Tính năng | Mô tả |
|-----------|-------|
| **🌙 Dark Mode** | Hỗ trợ chế độ tối với localStorage persistence, toggle mượt mà |
| **✍️ Typography** | Be Vietnam Pro (hỗ trợ tiếng Việt), Space Grotesk cho headings |
| **⏳ Loading States** | Skeleton components (Table, Card, Chart, List, Form) với accessibility |
| **✨ Animations** | Micro-interactions: fade-in-up, slide-in-right, scale-in, pulse effects |
| **📋 Enhanced Table** | Sticky header, sorting, search, selection, empty/loading states |
| **🎯 Icon System** | Lucide React icons - nhẹ hơn và đẹp hơn |

### ⚡ Performance Optimization

| Tối ưu | Cải thiện |
|--------|-----------|
| **API Consolidation** | Dashboard API giảm từ 5 requests → 1 request (**80% reduction**) |
| **Server Components** | PortfolioStats, TransactionStats - Better SEO & TTFB |
| **Database Indexes** | 8 indexes mới cho Transaction và CostBasisAdjustment (**30-50% faster queries**) |
| **Bundle Optimization** | Chunk splitting thông minh cho vendors, common, recharts, date-fns (**20-30% smaller bundles**) |
| **Response Caching** | Cache-Control headers với stale-while-revalidate |

---

## 🛠️ Tech Stack & Architecture

Dự án được xây dựng với công nghệ hiện đại nhất, đảm bảo hiệu năng và khả năng mở rộng:

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | **Next.js 15.3** (App Router) | Server Components, Streaming, Suspense |
| **Styling** | **Tailwind CSS** | Responsive design, Dark mode support |
| **Icons** | **Lucide React** | Lightweight, customizable icons |
| **Database** | **PostgreSQL** | Quan hệ dữ liệu chặt chẽ, ACID compliance |
| **ORM** | **Prisma** | Type-safe database access, Migrations |
| **Auth** | **NextAuth.js** | Secure authentication (Google, Credentials) |
| **Charts** | **Chart.js / Recharts** | Interactive visualizations |
| **State** | **SWR** | Data fetching with caching |
| **Infra** | **Vercel / Supabase** | Serverless deployment, Connection pooling |

---

## 📁 Project Structure

```
trading-journal/
├── app/
│   ├── api/                    # API routes
│   │   ├── dashboard/          # Consolidated dashboard API
│   │   ├── portfolio/          # Portfolio endpoints
│   │   ├── transactions/       # Transaction endpoints
│   │   └── ...
│   ├── components/
│   │   ├── landing/            # Landing page components
│   │   ├── portfolio/          # Portfolio components (inc. Server Components)
│   │   ├── transactions/       # Transaction components
│   │   └── ui/                 # Reusable UI components (Modal, Skeleton, etc.)
│   ├── context/                # React contexts (Theme, Auth)
│   ├── lib/                    # Utilities and helpers
│   ├── services/               # Business logic services
│   └── [pages]/                # App router pages
├── prisma/                     # Database schema and migrations
├── scripts/                    # Utility scripts (backup, cleanup)
├── tests/                      # Test suites
└── docs/                       # Documentation
```

---

## 🚀 Bắt Đầu Nhanh

### Yêu Cầu
-   Node.js 18+
-   PostgreSQL (Local hoặc Cloud)

### Cài Đặt
```bash
# 1. Clone repository
git clone https://github.com/yourusername/trading-journal.git
cd trading-journal

# 2. Cài đặt dependencies
npm install

# 3. Cấu hình môi trường
cp .env.example .env
# Cập nhật DATABASE_URL trong file .env

# 4. Khởi tạo Database
npx prisma migrate dev
npx prisma db seed # (Tùy chọn) Tạo dữ liệu mẫu

# 5. Chạy ứng dụng
npm run dev
```

Truy cập `http://localhost:3000` để bắt đầu.

---

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run prisma:generate  # Generate Prisma client

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:api         # Run API tests
npm run test:components  # Run component tests
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:performance # Run performance tests

# Utilities
npm run backup           # Create database backup
npm run backup:restore   # Restore database from backup
npm run cleanup:cache    # Clean up cache
```

---

## 🧪 Testing & Quality

Chúng tôi cam kết chất lượng code cao nhất với bộ test suite toàn diện:

-   **Unit Tests**: `npm test` (Test logic tính toán giá vốn, xử lý cổ tức)
-   **E2E Tests**: `npm run test:e2e` (Test luồng người dùng với Playwright)
-   **Performance**: `npm run test:performance` (Load testing)

---

## 🔐 Safety & Backup

Để tránh mất dữ liệu, hãy tuân thủ các quy tắc sau:
- **Luôn backup** trước khi chạy migrations hoặc scripts
- **Sử dụng `.env.test`** riêng biệt cho môi trường test
- **Không bao giờ** chạy test scripts với production DATABASE_URL

Xem thêm: `docs/db-backup-instructions.md`

---

## 🤝 Đóng Góp

Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng!
1.  Fork dự án
2.  Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4.  Push lên branch (`git push origin feature/AmazingFeature`)
5.  Tạo Pull Request

---

## 📄 License

Dự án được phát hành dưới giấy phép [MIT](LICENSE).

---

## 📝 Changelog

### v4.0.0 (November 2025)
- 🎨 **Dark Mode**: Full dark mode support across all components
- ✍️ **Typography**: Be Vietnam Pro + Space Grotesk fonts
- ⏳ **Skeleton Loading**: Enhanced loading states with accessibility
- ✨ **Animations**: Smooth micro-interactions and transitions
- ⚡ **Performance**: 80% reduction in API calls, 30-50% faster queries
- 📦 **Bundle Optimization**: Intelligent chunk splitting
- 🖼️ **Icons**: Migrated to Lucide React

### v3.1.1 (Previous)
- Smart Cost Basis Engine
- Advanced Analytics
- Vietnam market optimization

---

<div align="center">
<i>Made with ❤️ by Vietnamese traders, for Vietnamese traders</i>
</div>
