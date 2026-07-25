function calculatePrices() {
  if (state.inputStr === '') return { original: 0, discounted: 0, final: 0 };

  let original = parseInt(state.inputStr, 10) * 100;
  let discounted = original * (1 - state.discount / 100);

  let basePrice = Math.floor(discounted / 1000) * 1000;
  let remainder = discounted % 1000;
  let finalPrice = basePrice;

  // Logic làm tròn:
  // > 500đ (> 0.5k)        -> Làm tròn lên 1.000đ
  // > 200đ (> 0.2k) đến 500đ -> Làm tròn thành 500đ
  // <= 200đ (<= 0.2k)       -> Giữ nguyên (0đ)
  if (remainder > 500) {
    finalPrice = basePrice + 1000;
  } else if (remainder > 200) {
    finalPrice = basePrice + 500;
  } else {
    finalPrice = basePrice;
  }

  return { original, discounted, final: finalPrice };
}
