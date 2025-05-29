# Cập Nhật Hệ Thống Tính Giá Vốn - FIFO Nghiêm Ngặt

## Tóm Tắt Thay Đổi

Hệ thống đã được cập nhật để tính giá vốn theo phương pháp **FIFO (First In, First Out) nghiêm ngặt** theo chuẩn của các công ty chứng khoán Việt Nam.

## Các Tính Năng Mới

### 1. **FIFO Nghiêm Ngặt**
- Lưu trữ từng lô mua riêng biệt với ngày, giá và phí
- Khi bán, tự động sử dụng lô mua cũ nhất trước
- Tính P/L chính xác theo từng lô thực tế

### 2. **Tính Phí Vào Giá Vốn** 
- Phí mua được tính vào giá vốn của từng cổ phiếu
- Phí bán và thuế bán được trừ khỏi tiền thu về
- Công thức: `Giá vốn = (Giá mua × Số lượng + Phí mua) / Số lượng`

### 3. **Tính Thuế Bán Theo %**
- Thuế bán tính theo % trên tổng giá trị giao dịch
- Ví dụ: 0.1% thuế = `giá_bán × số_lượng × 0.001`

### 4. **P/L Chính Xác**
```
Lãi/Lỗ = Tiền thu ròng - COGS theo FIFO
Tiền thu ròng = (Giá bán × Số lượng) - Phí bán - Thuế bán
```

## Cấu Trúc Database Mới

### Bảng `PurchaseLot`
```sql
- id: Mã lô mua
- ticker: Mã cổ phiếu  
- purchaseDate: Ngày mua
- quantity: Số lượng ban đầu
- totalCost: Tổng chi phí (giá + phí)
- remainingQuantity: Số lượng còn lại
```

## Migration

Chạy lệnh sau để tính lại tất cả dữ liệu hiện có:

```bash
npm run migrate:cost-basis
```

## Test

Hệ thống đã được test với các trường hợp:
- ✅ Mua nhiều lô với giá khác nhau
- ✅ Bán một phần theo FIFO
- ✅ Tính P/L với phí và thuế
- ✅ Cập nhật giá vốn trung bình chính xác

## API Changes

- `POST /api/transactions`: Tự động xử lý FIFO và tính P/L
- `GET /api/portfolio`: Trả về giá vốn trung bình cập nhật

## Chi Tiết Kỹ Thuật

Xem file `docs/cost-basis-calculation.md` để hiểu chi tiết về công thức và quy trình tính toán.

---

**Lưu ý**: Hệ thống mới sẽ tính lại P/L cho tất cả transaction hiện có sau khi chạy migration. 