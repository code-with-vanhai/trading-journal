/**
 * 📊 VIETNAM STOCK MARKET PRICE STEP CALCULATOR
 * Tính bước giá theo quy định HSX & HNX
 */

/**
 * Tính bước giá theo quy định thị trường chứng khoán Việt Nam
 * @param {number} price - Giá hiện tại
 * @returns {number} - Bước giá tương ứng
 */
export function calculatePriceStep(price) {
  if (price < 10000) {
    return 10;
  } else if (price < 50000) {
    return 50;
  } else if (price < 100000) {
    return 100;
  } else if (price < 500000) {
    return 500;
  } else {
    return 1000;
  }
}

/**
 * Làm tròn giá theo bước giá hợp lệ
 * @param {number} price - Giá cần làm tròn
 * @returns {number} - Giá đã được làm tròn
 */
export function roundToValidPrice(price) {
  const step = calculatePriceStep(price);
  return Math.round(price / step) * step;
}

/**
 * Kiểm tra giá có hợp lệ theo bước giá không
 * @param {number} price - Giá cần kiểm tra
 * @returns {boolean} - True nếu hợp lệ
 */
export function isValidPrice(price) {
  const step = calculatePriceStep(price);
  return price % step === 0;
}

/**
 * Lấy giá gần nhất hợp lệ (cao hơn hoặc thấp hơn)
 * @param {number} price - Giá hiện tại
 * @param {string} direction - 'up' hoặc 'down'
 * @returns {number} - Giá hợp lệ tiếp theo
 */
export function getNextValidPrice(price, direction = 'up') {
  const step = calculatePriceStep(price);
  const roundedPrice = roundToValidPrice(price);
  
  if (direction === 'up') {
    return roundedPrice >= price ? roundedPrice : roundedPrice + step;
  } else {
    return roundedPrice <= price ? roundedPrice : roundedPrice - step;
  }
}

/**
 * Tạo danh sách giá hợp lệ trong khoảng
 * @param {number} minPrice - Giá tối thiểu
 * @param {number} maxPrice - Giá tối đa
 * @param {number} currentPrice - Giá hiện tại (để tính step)
 * @returns {number[]} - Mảng các giá hợp lệ
 */
export function generateValidPriceRange(minPrice, maxPrice, currentPrice) {
  const step = calculatePriceStep(currentPrice);
  const validPrices = [];
  
  let price = roundToValidPrice(minPrice);
  while (price <= maxPrice) {
    validPrices.push(price);
    price += step;
  }
  
  return validPrices;
}

/**
 * Format giá theo định dạng Việt Nam
 * @param {number} price - Giá cần format
 * @returns {string} - Giá đã được format
 */
export function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

// Export constants cho reference
export const PRICE_STEP_RULES = [
  { min: 0, max: 9999, step: 10, description: "< 10,000 VNĐ" },
  { min: 10000, max: 49999, step: 50, description: "10,000 - 49,999 VNĐ" },
  { min: 50000, max: 99999, step: 100, description: "50,000 - 99,999 VNĐ" },
  { min: 100000, max: 499999, step: 500, description: "100,000 - 499,999 VNĐ" },
  { min: 500000, max: Infinity, step: 1000, description: "≥ 500,000 VNĐ" }
];