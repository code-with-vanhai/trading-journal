# 📈 Trading Journal - Nền Tảng Quản Lý Đầu Tư Chứng Khoán Việt Nam

<div align="center">

![Trading Journal Hero](public/images/trading-dashboard-hero.jpg)

**🚀 Giải pháp quản lý danh mục đầu tư chuyên sâu, tối ưu hóa cho thị trường chứng khoán Việt Nam (TCBS, SSI, VPS...)**

[![Version](https://img.shields.io/badge/version-3.1.1-blue.svg)](https://github.com/yourusername/trading-journal)
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

## 🛠️ Tech Stack & Architecture

Dự án được xây dựng với công nghệ hiện đại nhất, đảm bảo hiệu năng và khả năng mở rộng:

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | **Next.js 15.3** (App Router) | Server Components, Streaming, Suspense |
| **Styling** | **Tailwind CSS** | Responsive design, Dark mode support |
| **Database** | **PostgreSQL** | Quan hệ dữ liệu chặt chẽ, ACID compliance |
| **ORM** | **Prisma** | Type-safe database access, Migrations |
| **Auth** | **NextAuth.js** | Secure authentication (Google, Credentials) |
| **Charts** | **Chart.js / Recharts** | Interactive visualizations |
| **Infra** | **Vercel / Supabase** | Serverless deployment, Connection pooling |

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

## 🧪 Testing & Quality

Chúng tôi cam kết chất lượng code cao nhất với bộ test suite toàn diện:

-   **Unit Tests**: `npm test` (Test logic tính toán giá vốn, xử lý cổ tức)
-   **E2E Tests**: `npm run test:e2e` (Test luồng người dùng với Playwright)
-   **Performance**: `npm run test:performance` (Load testing)

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

<div align="center">
<i>Made with ❤️ by Vietnamese traders, for Vietnamese traders</i>
</div>