// ================= HỆ THỐNG CHUYỂN TAB =================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const settingsBtn = document.getElementById('settings-btn');

tabBtns.forEach((btn) => {
  btn.onclick = () => {
    // Xóa trạng thái active của tất cả
    tabBtns.forEach((b) => b.classList.remove('active'));
    tabContents.forEach((c) => c.classList.remove('active'));

    // Active tab được chọn
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');

    // Ẩn/Hiện nút cài đặt (chỉ cần ở Tab Tính Giá)
    settingsBtn.style.display = targetId === 'tab-gia' ? 'flex' : 'none';
  };
});

// ================= HỆ THỐNG ÂM THANH =================
let audioCtx = null;
function playBeep() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.1);
}

// ================= LOGIC TAB 1: TÍNH GIÁ TEM =================
const discountRates = [20, 30, 33, 40, 50];
let currentInput = '0';
let selectedDiscount = null;

const giaGhiTemEl = document.getElementById('gia-ghi-tem');
const giaGocEl = document.getElementById('gia-goc');
const chuaLamTronEl = document.getElementById('chua-lam-tron');
const buttonContainer = document.getElementById('button-container');

function formatNumber(num) {
  if (num === 0) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
}

function customRounding(num) {
  const remainder = num % 1000;
  const base = num - remainder;
  if (remainder <= 200) return base;
  else if (remainder <= 500) return base + 500;
  else return base + 1000;
}

function initDiscountButtons() {
  buttonContainer.innerHTML = '';
  discountRates.forEach((rate) => {
    const btn = document.createElement('button');
    btn.className = 'discount-btn';
    if (rate === selectedDiscount) btn.classList.add('active');
    btn.textContent = `${rate}%`;
    btn.onclick = () => {
      document.querySelectorAll('.discount-btn').forEach((b) => b.classList.remove('active'));
      if (selectedDiscount === rate) {
        selectedDiscount = null;
      } else {
        btn.classList.add('active');
        selectedDiscount = rate;
      }
      updateDisplay();
    };
    buttonContainer.appendChild(btn);
  });
}

function updateDisplay() {
  const typedNumber = parseInt(currentInput, 10);
  const originalPrice = typedNumber * 100;

  giaGocEl.textContent = formatNumber(originalPrice) + ' đ';

  if (selectedDiscount !== null && originalPrice > 0) {
    const discountedPrice = originalPrice * (1 - selectedDiscount / 100);
    chuaLamTronEl.textContent = formatNumber(discountedPrice) + ' đ';
    giaGhiTemEl.textContent = formatNumber(customRounding(discountedPrice));
  } else {
    chuaLamTronEl.textContent = '0 đ';
    giaGhiTemEl.textContent = formatNumber(originalPrice);
  }
}

document.querySelectorAll('.key').forEach((key) => {
  key.onclick = () => {
    const val = key.getAttribute('data-key');
    if (selectedDiscount !== null) {
      playBeep();
      currentInput = '0';
      selectedDiscount = null;
      document.querySelectorAll('.discount-btn').forEach((b) => b.classList.remove('active'));
      if (val !== 'C' && val !== 'BACK') currentInput = val;
      updateDisplay();
      return;
    }
    if (val === 'C') currentInput = '0';
    else if (val === 'BACK') {
      currentInput = currentInput.slice(0, -1);
      if (currentInput === '') currentInput = '0';
    } else {
      if (currentInput === '0') currentInput = val;
      else if (currentInput.length < 11) currentInput += val;
    }
    updateDisplay();
  };
});

// LOGIC MODAL CÀI ĐẶT
const settingsModal = document.getElementById('settings-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnAddModal = document.getElementById('btn-add-modal');
const newDiscountInput = document.getElementById('new-discount-input');

settingsBtn.onclick = () => {
  settingsModal.classList.remove('hidden');
  newDiscountInput.value = '';
  newDiscountInput.focus();
};
btnCancelModal.onclick = () => settingsModal.classList.add('hidden');
btnAddModal.onclick = () => {
  const newRate = parseInt(newDiscountInput.value, 10);
  if (isNaN(newRate) || newRate <= 0 || newRate > 99) {
    alert('Vui lòng nhập một số phần trăm hợp lệ (từ 1 đến 99)!');
    return;
  }
  if (!discountRates.includes(newRate)) {
    discountRates.push(newRate);
    discountRates.sort((a, b) => a - b);
    initDiscountButtons();
  }
  settingsModal.classList.add('hidden');
};

// ================= LOGIC TAB 2: TÍNH NGÀY HSD =================
const nsxInput = document.getElementById('nsx-input');
const songayInput = document.getElementById('songay-input');
const chkTinhNgaySx = document.getElementById('tinh-ngay-sx');
const chkLichThucTe = document.getElementById('lich-thuc-te');

const ketQuaHsd = document.getElementById('ket-qua-hsd');
const lblNsx = document.getElementById('hsd-nsx-lbl');
const lblThoiHan = document.getElementById('hsd-thoihan-lbl');

// Format ngày ra chuỗi DD/MM/YYYY
function formatDateObj(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function calculateHSD() {
  if (!nsxInput.value || !songayInput.value) {
    ketQuaHsd.textContent = '--/--/----';
    lblNsx.textContent = '...';
    lblThoiHan.textContent = '...';
    return;
  }

  let dateObj = new Date(nsxInput.value);
  let daysToAdd = parseInt(songayInput.value, 10);

  if (isNaN(daysToAdd) || daysToAdd < 0) return;

  // Cập nhật thông tin chi tiết
  lblNsx.textContent = formatDateObj(dateObj);
  lblThoiHan.textContent = daysToAdd + ' ngày';

  // 1. Tùy chọn: Tính luôn ngày SX (Cộng vào phải trừ đi 1 ngày)
  if (chkTinhNgaySx.checked && daysToAdd > 0) {
    daysToAdd -= 1;
  }

  let resultDate;

  // 2. Tùy chọn: Lịch thực tế hay Mặc định tháng 30 ngày
  if (chkLichThucTe.checked) {
    // Lịch chuẩn (Hệ thống tự nhận diện tháng 28, 29, 31)
    dateObj.setDate(dateObj.getDate() + daysToAdd);
    resultDate = dateObj;
  } else {
    // Mặc định mọi tháng 30 ngày để tính nhẩm
    let y = dateObj.getFullYear();
    let m = dateObj.getMonth();
    let d = dateObj.getDate();

    // Quy tròn các ngày 31 về 30
    if (d > 30) d = 30;

    let totalDays = d + daysToAdd;

    // Quy đổi ngày ra tháng
    while (totalDays > 30) {
      totalDays -= 30;
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }

    let finalDay = totalDays;

    // Để hiển thị hợp lệ với lịch thực tế (VD không thể in ra ngày 30/02)
    // Nếu rơi vào tháng có ít ngày hơn (tháng 2), sẽ tự lùi về ngày cuối cùng của tháng đó.
    let maxDayInRealMonth = new Date(y, m + 1, 0).getDate();
    if (finalDay > maxDayInRealMonth) finalDay = maxDayInRealMonth;

    resultDate = new Date(y, m, finalDay);
  }

  ketQuaHsd.textContent = formatDateObj(resultDate);
}

// Bắt sự kiện mỗi khi người dùng đổi số / tích nút
nsxInput.addEventListener('change', calculateHSD);
songayInput.addEventListener('input', calculateHSD);
chkTinhNgaySx.addEventListener('change', calculateHSD);
chkLichThucTe.addEventListener('change', calculateHSD);

// ================= TÍNH NĂNG GIỮ MÀN HÌNH (WAKE LOCK) =================
let wakeLock = null;
const wakeLockStatusEl = document.getElementById('wake-lock-status');

function updateWakeLockStatus(isSuccess) {
  if (isSuccess) {
    wakeLockStatusEl.classList.remove('status-red');
    wakeLockStatusEl.classList.add('status-green');
  } else {
    wakeLockStatusEl.classList.remove('status-green');
    wakeLockStatusEl.classList.add('status-red');
  }
}
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      updateWakeLockStatus(true);
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
        updateWakeLockStatus(false);
      });
    } else updateWakeLockStatus(false);
  } catch (err) {
    updateWakeLockStatus(false);
  }
}
document.addEventListener(
  'click',
  () => {
    if (!wakeLock) requestWakeLock();
  },
  { once: true }
);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !wakeLock) requestWakeLock();
});

initDiscountButtons();
