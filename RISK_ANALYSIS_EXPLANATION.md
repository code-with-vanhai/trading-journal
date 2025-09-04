# 📊 GIẢI THÍCH CHI TIẾT: ĐÁNH GIÁ RỦI RO & VOLATILITY

## 🎯 TỔNG QUAN

Tôi đã cải thiện phần **Đánh Giá Rủi Ro** với các hints chi tiết và giải thích cách tính toán bằng tiếng Việt. Tất cả các chỉ số được tính từ dữ liệu có sẵn trong bảng `Transaction` mà **KHÔNG CẦN THAY ĐỔI DATABASE**.

---

## 📈 1. VOLATILITY (ĐỘ BIẾN ĐỘNG)

### 💡 **Ý nghĩa:**
Volatility cho biết danh mục của bạn biến động bao nhiều so với giá trị trung bình. 
- **Volatility cao** = Rủi ro cao nhưng cũng có thể có lợi nhuận cao
- **Volatility thấp** = Ổn định hơn nhưng lợi nhuận có thể hạn chế

### 🧮 **Cách tính toán:**

```javascript
// Bước 1: Lấy dữ liệu từ bảng Transaction
const trades = await prisma.transaction.findMany({
  where: { userId, calculatedPl: { not: null } },
  select: { transactionDate: true, calculatedPl: true }
});

// Bước 2: Nhóm P&L theo ngày
const dailyPnL = {};
trades.forEach(trade => {
  const date = trade.transactionDate.toISOString().split('T')[0];
  if (!dailyPnL[date]) dailyPnL[date] = 0;
  dailyPnL[date] += trade.calculatedPl;
});

// Bước 3: Tính daily returns
const returns = [];
let cumulativePnL = 0;
for (let i = 0; i < sortedDates.length; i++) {
  const prevCumulative = cumulativePnL;
  cumulativePnL += dailyPnL[sortedDates[i]];
  
  if (i > 0 && prevCumulative !== 0) {
    returns.push(dailyPnL[sortedDates[i]] / Math.abs(prevCumulative));
  }
}

// Bước 4: Tính volatility
const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
const variance = returns.reduce((sum, ret) => 
  sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
const volatility = Math.sqrt(variance * 252); // Annualized
```

### 📊 **Nguồn dữ liệu:**
- **Bảng:** `Transaction`
- **Trường chính:** `calculatedPl` (lãi/lỗ đã tính sẵn của giao dịch SELL)
- **Trường phụ:** `transactionDate` (để nhóm theo ngày)
- **Lưu ý:** Chỉ tính từ giao dịch SELL có `calculatedPl` khác null

### 📈 **Cách đọc kết quả:**
- **< 15%:** 🟢 Rủi ro thấp - Phù hợp nhà đầu tư thận trọng
- **15-30%:** 🟡 Rủi ro trung bình - Cân bằng an toàn/lợi nhuận  
- **> 30%:** 🔴 Rủi ro cao - Chỉ dành cho nhà đầu tư mạo hiểm

---

## ⚖️ 2. SHARPE RATIO

### 💡 **Ý nghĩa:**
Sharpe Ratio đo lường hiệu quả đầu tư - bạn nhận được bao nhiều lợi nhuận cho mỗi đơn vị rủi ro chấp nhận.

### 🧮 **Cách tính toán:**

```javascript
function calculateSharpeRatio(returns, riskFreeRate = 0.02) {
  // Bước 1: Tính lợi nhuận trung bình hàng năm
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const annualizedReturn = avgReturn * 252; // 252 ngày giao dịch/năm
  
  // Bước 2: Tính volatility (như trên)
  const volatility = calculateVolatility(returns);
  
  // Bước 3: Áp dụng công thức Sharpe
  const sharpeRatio = volatility !== 0 ? 
    (annualizedReturn - riskFreeRate) / volatility : 0;
    
  return sharpeRatio;
}
```

### 📊 **Nguồn dữ liệu:**
- **Dữ liệu:** Cùng với Volatility từ bảng `Transaction`
- **Lãi suất phi rủi ro:** 2%/năm (trái phiếu chính phủ Việt Nam)
- **Công thức:** `(Lợi nhuận hàng năm - 2%) / Volatility`

### 📈 **Cách đọc kết quả:**
- **> 1.0:** 🟢 Xuất sắc - Lợi nhuận cao với rủi ro hợp lý
- **0.5-1.0:** 🟡 Tốt - Hiệu quả đầu tư ổn định
- **< 0.5:** 🔴 Kém - Rủi ro cao so với lợi nhuận

---

## 📉 3. MAX DRAWDOWN

### 💡 **Ý nghĩa:**
Max Drawdown là tổn thất lớn nhất mà danh mục từng trải qua, tính từ đỉnh cao nhất đến điểm thấp nhất.

### 🧮 **Cách tính toán:**

```javascript
function calculateMaxDrawdown(trades) {
  let peak = 0;           // Đỉnh cao nhất
  let maxDrawdown = 0;    // Drawdown lớn nhất
  let cumulativePnL = 0;  // P&L tích lũy
  
  trades.forEach(trade => {
    // Cộng dồn P&L
    cumulativePnL += trade.calculatedPl || 0;
    
    // Cập nhật đỉnh mới nếu cao hơn
    if (cumulativePnL > peak) {
      peak = cumulativePnL;
    }
    
    // Tính drawdown hiện tại
    if (peak > 0) {
      const currentDrawdown = (peak - cumulativePnL) / peak;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }
    }
  });
  
  return maxDrawdown; // Trả về dạng thập phân (0.15 = 15%)
}
```

### 📊 **Nguồn dữ liệu:**
- **Bảng:** `Transaction` 
- **Logic:** Tích lũy `calculatedPl` theo thời gian để tìm đỉnh và đáy
- **Sắp xếp:** Theo `transactionDate` tăng dần

### 📈 **Cách đọc kết quả:**
- **< 10%:** 🟢 Rủi ro thấp - Danh mục ổn định
- **10-20%:** 🟡 Rủi ro trung bình - Có thể chấp nhận
- **> 20%:** 🔴 Rủi ro cao - Cần xem xét lại chiến lược

---

## 🎯 4. ĐIỂM RỦI RO TỔNG HỢP (0-100)

### 💡 **Ý nghĩa:**
Điểm rủi ro tổng hợp kết hợp 3 chỉ số trên thành 1 điểm duy nhất dễ hiểu.

### 🧮 **Cách tính toán:**

```javascript
function calculateRiskScore(volatility, sharpeRatio, maxDrawdown) {
  let score = 0;
  
  // Component 1: Volatility (0-40 điểm)
  // Volatility cao = nhiều điểm rủi ro
  score += Math.min(volatility * 100, 40);
  
  // Component 2: Sharpe Ratio (0-30 điểm, đảo ngược)
  // Sharpe thấp = nhiều điểm rủi ro
  score += Math.max(0, 30 - (sharpeRatio * 10));
  
  // Component 3: Max Drawdown (0-30 điểm)
  // Drawdown cao = nhiều điểm rủi ro
  score += Math.min(maxDrawdown * 100, 30);
  
  return Math.min(Math.round(score), 100);
}
```

### 📊 **Phân loại rủi ro:**
- **0-30:** 🟢 Rủi ro thấp - Phù hợp nhà đầu tư thận trọng
- **31-60:** 🟡 Rủi ro trung bình - Cân bằng lợi nhuận/rủi ro
- **61-100:** 🔴 Rủi ro cao - Chỉ dành cho nhà đầu tư mạo hiểm

---

## 🔧 CÁCH SỬ DỤNG TRONG GIAO DIỆN

### 1. **Enhanced Risk Metric Cards:**
- Click vào icon ℹ️ để xem chi tiết
- Màu sắc tự động thay đổi theo mức độ rủi ro
- Hiển thị đầy đủ: ý nghĩa, cách tính, nguồn dữ liệu

### 2. **Risk Breakdown Chart:**
- Biểu đồ thanh hiển thị 3 thành phần của điểm rủi ro
- Màu sắc khác nhau cho từng thành phần
- Tooltip hiển thị giá trị chi tiết

### 3. **Data Source Information:**
- Panel màu xanh giải thích nguồn dữ liệu
- Nhấn mạnh không cần thay đổi database
- Liệt kê các trường dữ liệu được sử dụng

---

## ✅ LỢI ÍCH CỦA CÁCH TIẾP CẬN NÀY

### 🎯 **Cho Người Dùng:**
- **Hiểu rõ hơn:** Giải thích chi tiết bằng tiếng Việt
- **Tương tác tốt:** Click để xem thêm thông tin
- **Trực quan:** Màu sắc và biểu đồ dễ hiểu
- **Thực tế:** Áp dụng cho thị trường Việt Nam

### 🔧 **Cho Hệ Thống:**
- **Zero Database Impact:** Không cần thay đổi gì
- **Performance tốt:** Tính toán từ dữ liệu có sẵn
- **Maintainable:** Code rõ ràng, dễ bảo trì
- **Scalable:** Dễ thêm chỉ số mới

---

## 🚀 NEXT STEPS

1. **Test với dữ liệu thực:** `npm run dev` và vào `/analysis`
2. **Kiểm tra tính toán:** So sánh với công cụ tài chính khác
3. **Thu thập feedback:** Từ người dùng về độ hữu ích
4. **Mở rộng:** Thêm các chỉ số rủi ro khác nếu cần

**Tất cả đã sẵn sàng để sử dụng ngay!** 🎉