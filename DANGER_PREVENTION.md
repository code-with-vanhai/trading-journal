# 🚨 DANGER PREVENTION - NGĂN CHẶN MẤT DỮ LIỆU

## ⚠️ THẢM HỌA ĐÃ XẢY RA:
- **Ngày:** $(date)
- **Nguyên nhân:** Script test `db-clean.js` sử dụng production DATABASE_URL
- **Thiệt hại:** Toàn bộ dữ liệu production bị xóa sạch
- **Bảng bị ảnh hưởng:** user, transaction, stockAccount, stockPriceCache, purchaseLot, và tất cả bảng khác

## 🛡️ CÁC BIỆN PHÁP ĐÃ THỰC HIỆN:

### 1. Sửa lỗi scripts test:
- ✅ `tests/setup/db-clean.js` - Thêm safety check
- ✅ `tests/setup/db-seed.js` - Thêm safety check
- ✅ Tạo `.env.test` riêng biệt

### 2. Safety checks được thêm:
```javascript
if (!process.env.TEST_DATABASE_URL) {
  console.error('❌ DANGER: TEST_DATABASE_URL not set!');
  process.exit(1);
}
```

## 🚫 RULES TUYỆT ĐỐI:

1. **KHÔNG BAO GIỜ** chạy test scripts với production DATABASE_URL
2. **LUÔN LUÔN** kiểm tra environment trước khi chạy scripts
3. **BẮT BUỘC** có backup trước mọi thao tác nguy hiểm
4. **TUYỆT ĐỐI** không có fallback từ test DB sang production DB

## 🆘 KHÔI PHỤC:
- Kiểm tra Supabase Dashboard → Backups
- Point-in-time recovery nếu có
- Manual backup nếu có

## 📞 LIÊN HỆ KHẨN CẤP:
- Supabase Support: https://supabase.com/support
- Database Recovery: Kiểm tra backup policies

---
**⚠️ LƯU Ý: File này được tạo sau thảm họa để ngăn chặn tái diễn!**