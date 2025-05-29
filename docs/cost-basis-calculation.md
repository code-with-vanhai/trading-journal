# Hướng Dẫn Tính Giá Vốn Chứng Khoán (Đầy Đủ)

## 1. Nguyên Tắc Chung: FIFO (First In, First Out)

### FIFO ("Vào trước, Ra trước")
Khi bạn bán cổ phiếu, giá vốn của những cổ phiếu bạn mua sớm nhất (bao gồm cả phí mua của lô đó) sẽ được sử dụng để tính toán lợi nhuận/thua lỗ cho giao dịch bán đó.

### Giá Vốn Trung Bình Danh Mục
Đối với việc theo dõi giá trị danh mục và giá vốn trung bình của số cổ phiếu còn lại, chúng ta sẽ tính giá vốn trung bình dựa trên tổng chi phí mua thực tế và tổng số lượng cổ phiếu đang nắm giữ.

## 2. Các Thành Phần Tính Toán

### Giao Dịch Mua (BUY)
- **Giá mua**: Giá một cổ phiếu tại thời điểm mua
- **Số lượng mua**: Số lượng cổ phiếu mua
- **Phí mua**: Số tiền phí cố định do bạn nhập cho mỗi giao dịch mua

### Giao Dịch Bán (SELL)
- **Giá bán**: Giá một cổ phiếu tại thời điểm bán
- **Số lượng bán**: Số lượng cổ phiếu bán
- **Phí bán**: Số tiền phí cố định do bạn nhập cho mỗi giao dịch bán
- **Thuế bán**: Tính theo tỷ lệ % trên tổng giá trị giao dịch bán (ví dụ: 0.1%)

## 3. Quy Trình Tính Toán và Công Thức

### A. Khi Mua Cổ Phiếu (BUY)

Mỗi khi bạn thực hiện một giao dịch MUA:

#### 1. Tính Chi Phí Thực Tế Cho Lô Mua Này (costOfThisPurchase)
Đây là tổng số tiền bạn thực sự bỏ ra để sở hữu lô cổ phiếu này.

```
costOfThisPurchase = (Giá mua × Số lượng mua) + Phí mua
```

#### 2. Cập Nhật Danh Mục Cổ Phiếu

##### Tổng Chi Phí Mua Thực Tế Tích Lũy (totalActualCost)
```javascript
totalActualCost += costOfThisPurchase;
```

##### Tổng Số Lượng Cổ Phiếu Hiện Có (currentQuantity)
```javascript
currentQuantity += Số lượng mua;
```

##### Tính Giá Vốn Trung Bình Mới (avgCost)
```javascript
avgCost = totalActualCost / currentQuantity;
```

#### 3. Lưu Trữ Thông Tin Lô Mua (FIFO chặt chẽ)
Hệ thống lưu trữ thông tin của từng lô mua riêng biệt:
- Ngày mua
- Số lượng
- Giá vốn đơn vị (bao gồm phí)
- Số lượng còn lại chưa bán

### B. Khi Bán Cổ Phiếu (SELL)

Mỗi khi bạn thực hiện một giao dịch BÁN:

#### 1. Xác Định Giá Vốn Của Số Cổ Phiếu Đem Bán (COGS - Cost of Goods Sold)

**Theo FIFO Nghiêm ngặt**: 
- Xác định (các) lô cổ phiếu cũ nhất đã mua để đủ số lượng bán
- Tính tổng giá vốn thực tế của các lô này

**Ví dụ**: Nếu bán 150 cổ phiếu
- Lô mua đầu tiên: 100cp (với giá vốn X)  
- Lô thứ hai: 200cp (với giá vốn Y)
- COGS = (100 × giá vốn đơn vị lô 1) + (50 × giá vốn đơn vị lô 2)

#### 2. Tính Tổng Tiền Thu Về Ròng Từ Giao Dịch Bán (netProceeds)

##### Giá trị giao dịch bán (Gross)
```
grossSellValue = Giá bán × Số lượng bán
```

##### Thuế bán
```
sellingTax = grossSellValue × Tỷ lệ thuế bán (ví dụ: 0.001 cho 0.1%)
```

##### Tiền thu về ròng
```
netProceeds = grossSellValue - Phí bán - sellingTax
```

#### 3. Tính Lãi/Lỗ Của Giao Dịch Bán
```
profitOrLoss = netProceeds - COGS
```

#### 4. Cập Nhật Danh Mục Cổ Phiếu (Sau Khi Bán)

##### Cập nhật các lô mua đã sử dụng
- Giảm `remainingQuantity` của các lô đã bán theo FIFO
- Lô nào hết sẽ có `remainingQuantity = 0`

##### Tính lại giá vốn trung bình cho số cổ phiếu còn lại
```javascript
if (currentQuantity > 0) {
    avgCost = tổng giá vốn các lô còn lại / currentQuantity;
} else {
    avgCost = 0;
    totalActualCost = 0; // Hết cổ phiếu
}
```

## 4. Ví Dụ Thực Tế

**Giả sử**: Thuế bán 0.1% trên giá trị bán

### Giao dịch 1: Mua Cổ Phiếu
- **Mua**: 1000 cp ABC
- **Giá mua**: 20,000 VND/cp  
- **Phí mua**: 150,000 VND

**Tính toán**:
```
costOfThisPurchase = (20,000 × 1000) + 150,000 = 20,150,000 VND
totalActualCost = 20,150,000 VND
currentQuantity = 1000 cp
avgCost = 20,150,000 / 1000 = 20,150 VND/cp
```

**Lưu lô 1**: 1000 cp, giá vốn đơn vị thực tế 20,150 VND/cp

### Giao dịch 2: Mua Thêm Cổ Phiếu
- **Mua**: 500 cp ABC
- **Giá mua**: 22,000 VND/cp
- **Phí mua**: 80,000 VND

**Tính toán**:
```
costOfThisPurchase_lot2 = (22,000 × 500) + 80,000 = 11,080,000 VND
totalActualCost = 20,150,000 + 11,080,000 = 31,230,000 VND
currentQuantity = 1000 + 500 = 1500 cp
avgCost = 31,230,000 / 1500 = 20,820 VND/cp
```

**Lưu lô 2**: 500 cp, giá vốn đơn vị thực tế 22,160 VND/cp

### Giao dịch 3: Bán Cổ Phiếu
- **Bán**: 1200 cp ABC
- **Giá bán**: 25,000 VND/cp
- **Phí bán**: 200,000 VND

**Tính toán**:

#### Giá Vốn Hàng Bán (COGS - theo FIFO nghiêm ngặt):
- Lấy 1000 cp từ Lô 1: `1000 cp × 20,150 VND/cp = 20,150,000 VND`
- Lấy 200 cp từ Lô 2: `200 cp × 22,160 VND/cp = 4,432,000 VND`  
- **COGS** = `20,150,000 + 4,432,000 = 24,582,000 VND`

#### Tiền Thu Về Ròng Từ Bán:
```
grossSellValue = 25,000 × 1200 = 30,000,000 VND
sellingTax = 30,000,000 × 0.001 = 30,000 VND
netProceeds = 30,000,000 - 200,000 - 30,000 = 29,770,000 VND
```

#### Lãi/Lỗ Giao Dịch:
```
profitOrLoss = 29,770,000 - 24,582,000 = 5,188,000 VND (Lãi)
```

#### Cập Nhật Danh Mục (Sau Khi Bán):
- **Lô 1**: Đã hết (remainingQuantity = 0)
- **Lô 2**: Còn lại 300 cp (500 - 200 = 300)
- **totalActualCost** còn lại = `300 × 22,160 = 6,648,000 VND`
- **currentQuantity** còn lại = 300 cp
- **avgCost** mới = `6,648,000 / 300 = 22,160 VND/cp`

## 5. Đặc Điểm Quan Trọng

1. **Giá vốn bao gồm phí mua**: Giá vốn của mỗi cổ phiếu phản ánh giá mua và phí mua liên quan đến việc sở hữu nó

2. **Lãi/Lỗ tính trên giá vốn FIFO**: Để có độ chính xác cao nhất, lãi/lỗ được tính dựa trên giá vốn thực tế của lô cổ phiếu được bán theo nguyên tắc FIFO

3. **Phí bán và thuế bán trừ vào tiền thu về**: Các chi phí này làm giảm số tiền thực nhận từ giao dịch bán

4. **Theo dõi riêng biệt**: Mỗi mã cổ phiếu, mỗi tài khoản được theo dõi riêng

5. **Cập nhật thời gian thực**: Các giá trị được cập nhật sau mỗi giao dịch

## 6. Công Thức Tổng Hợp Giá Trị Vốn Danh Mục

```
Tổng giá trị vốn hiện tại của danh mục = 
Σ (Số lượng cổ phiếu i còn lại × Giá vốn trung bình hiện tại của cổ phiếu i)
```

Trong đó, "Giá vốn trung bình hiện tại của cổ phiếu i" là `avgCost` đã được cập nhật như mô tả ở trên cho từng mã cổ phiếu.

## 7. Cấu Trúc Database

### Bảng PurchaseLot
Lưu trữ thông tin từng lô mua để hỗ trợ FIFO nghiêm ngặt:

```sql
- id: Mã định danh lô mua
- userId: ID người dùng  
- stockAccountId: ID tài khoản chứng khoán
- ticker: Mã cổ phiếu
- purchaseDate: Ngày mua
- quantity: Số lượng ban đầu
- pricePerShare: Giá mua mỗi cổ phiếu
- totalCost: Tổng chi phí (giá × số lượng + phí)
- buyFee: Phí mua
- remainingQuantity: Số lượng còn lại chưa bán
```

### Bảng Transaction
Lưu trữ thông tin tất cả giao dịch:

```sql
- calculatedPl: Lãi/lỗ được tính tự động
  + Giao dịch MUA: calculatedPl = 0
  + Giao dịch BÁN: calculatedPl = netProceeds - COGS
```

## 8. API Endpoints

### POST /api/transactions
Tạo giao dịch mới - tự động xử lý FIFO và tính P/L

### GET /api/portfolio  
Lấy danh mục hiện tại với giá vốn trung bình đã cập nhật

### Migration Script
`npm run migrate:cost-basis` - Tính lại giá vốn cho tất cả dữ liệu hiện có 