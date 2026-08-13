// ================= HỆ THỐNG CHUYỂN TAB VÀ MENU =================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Các biến của Menu Tích Hợp
const fabMenuContainer = document.getElementById('fab-menu-container');
const mainFabBtn = document.getElementById('main-fab-btn');
const fabDropdown = document.getElementById('fab-dropdown');
const menuAddDiscount = document.getElementById('menu-add-discount');
const menuToggleScroll = document.getElementById('menu-toggle-scroll');
let isScrollLocked = false;

// 1. Logic chuyển tab
tabBtns.forEach((btn) => {
  btn.onclick = () => {
    tabBtns.forEach((b) => b.classList.remove('active'));
    tabContents.forEach((c) => c.classList.remove('active'));
    btn.classList.add('active');

    const targetId = btn.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');

    // Ẩn menu khi không ở tab Giá Tem
    if (fabMenuContainer) {
      fabMenuContainer.style.display = targetId === 'tab-gia' ? 'block' : 'none';
      if (targetId !== 'tab-gia' && isScrollLocked) {
        menuToggleScroll.click(); // Nhả khóa cuộn nếu chuyển tab
      }
    }

    if (targetId === 'tab-qr') {
      if (typeof startScan === 'function') startScan();
    } else {
      if (typeof stopScan === 'function') stopScan();
    }
  };
});

// 2. Logic Bật/Tắt Dropdown Menu
if (mainFabBtn) {
  mainFabBtn.onclick = (e) => {
    e.stopPropagation();
    fabDropdown.classList.toggle('hidden');
  };
  // Bấm ra ngoài thì đóng menu
  document.addEventListener('click', (e) => {
    if (!fabMenuContainer.contains(e.target)) {
      fabDropdown.classList.add('hidden');
    }
  });
}

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
const discountRates = [20, 25, 30, 33, 40, 50];
let currentInput = '0';
let selectedDiscount = null;
let shouldResetInput = false;
let lastKeyTime = 0;

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
        shouldResetInput = false;
      } else {
        btn.classList.add('active');
        selectedDiscount = rate;
        shouldResetInput = true;
      }
      lastKeyTime = Date.now();
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
  key.addEventListener('touchstart', () => key.classList.add('pressed'), { passive: true });
  key.addEventListener('touchend', () => key.classList.remove('pressed'), { passive: true });
  key.addEventListener('mousedown', () => key.classList.add('pressed'));
  key.addEventListener('mouseup', () => key.classList.remove('pressed'));
  key.addEventListener('mouseleave', () => key.classList.remove('pressed'));

  key.onclick = () => {
    const val = key.getAttribute('data-key');
    const now = Date.now();
    const isTimeout = now - lastKeyTime > 1000 && currentInput !== '0';
    lastKeyTime = now;

    if (val === 'C') {
      currentInput = '0';
      shouldResetInput = false;
      updateDisplay();
      return;
    }
    if (val === 'BACK') {
      if (shouldResetInput || isTimeout) {
        currentInput = '0';
        shouldResetInput = false;
      } else {
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '') currentInput = '0';
      }
      updateDisplay();
      return;
    }
    if (shouldResetInput || isTimeout) {
      playBeep();
      currentInput = val;
      shouldResetInput = false;
    } else {
      if (currentInput === '0') currentInput = val;
      else if (currentInput.length < 11) currentInput += val;
    }
    updateDisplay();
  };
});

// Logic nút "Thêm mức giảm" trong Menu
const settingsModal = document.getElementById('settings-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnAddModal = document.getElementById('btn-add-modal');
const newDiscountInput = document.getElementById('new-discount-input');

menuAddDiscount.onclick = () => {
  fabDropdown.classList.add('hidden'); // Đóng menu
  settingsModal.classList.remove('hidden');
  newDiscountInput.value = '';
  newDiscountInput.focus();
};

btnCancelModal.onclick = () => settingsModal.classList.add('hidden');
btnAddModal.onclick = () => {
  const newRate = parseInt(newDiscountInput.value, 10);
  if (isNaN(newRate) || newRate <= 0 || newRate > 99) {
    alert('Vui lòng nhập một số % hợp lệ!');
    return;
  }
  if (!discountRates.includes(newRate)) {
    discountRates.push(newRate);
    discountRates.sort((a, b) => a - b);
    initDiscountButtons();
  }
  settingsModal.classList.add('hidden');
};

// ================= LOGIC KHÓA CUỘN (TỪ MENU) =================
menuToggleScroll.onclick = () => {
  isScrollLocked = !isScrollLocked;
  if (isScrollLocked) {
    document.body.classList.add('no-scroll');
    menuToggleScroll.innerHTML =
      '🔒 Khóa cuộn trang: <span style="color:var(--bhx-orange)">ĐANG BẬT</span>';
  } else {
    document.body.classList.remove('no-scroll');
    menuToggleScroll.innerHTML = '🔓 Khóa cuộn trang: TẮT';
  }
  fabDropdown.classList.add('hidden'); // Đóng menu sau khi chọn
};

// ================= LOGIC TAB 2: TÍNH NGÀY HSD =================
const nsxInput = document.getElementById('nsx-input');
const songayInput = document.getElementById('songay-input');
const chkTinhNgaySx = document.getElementById('tinh-ngay-sx');
const chkLichThucTe = document.getElementById('lich-thuc-te');
const ketQuaHsd = document.getElementById('ket-qua-hsd');
const lblNsx = document.getElementById('hsd-nsx-lbl');
const lblThoiHan = document.getElementById('hsd-thoihan-lbl');

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

  lblNsx.textContent = formatDateObj(dateObj);
  lblThoiHan.textContent = daysToAdd + ' ngày';

  if (chkTinhNgaySx.checked && daysToAdd > 0) daysToAdd -= 1;

  let resultDate;
  if (chkLichThucTe.checked) {
    dateObj.setDate(dateObj.getDate() + daysToAdd);
    resultDate = dateObj;
  } else {
    let y = dateObj.getFullYear();
    let m = dateObj.getMonth();
    let d = dateObj.getDate();
    if (d > 30) d = 30;
    let totalDays = d + daysToAdd;
    while (totalDays > 30) {
      totalDays -= 30;
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
    let finalDay = totalDays;
    let maxDayInRealMonth = new Date(y, m + 1, 0).getDate();
    if (finalDay > maxDayInRealMonth) finalDay = maxDayInRealMonth;
    resultDate = new Date(y, m, finalDay);
  }
  ketQuaHsd.textContent = formatDateObj(resultDate);
}

nsxInput.addEventListener('change', calculateHSD);
songayInput.addEventListener('input', calculateHSD);
chkTinhNgaySx.addEventListener('change', calculateHSD);
chkLichThucTe.addEventListener('change', calculateHSD);

// ================= LOGIC TAB 3: QUÉT MÃ QR & BARCODE =================
let html5QrCode = null;
let isScanning = false;
let qrHistory = JSON.parse(localStorage.getItem('qrHistory') || '[]');

let lastScannedText = '';
let lastScannedTime = 0;

const qrResultText = document.getElementById('qr-result-text');
const btnScan = document.getElementById('btn-scan');
const qrHistoryList = document.getElementById('qr-history-list');
const btnClearQr = document.getElementById('btn-clear-qr');

function renderQrHistory() {
  qrHistoryList.innerHTML = '';
  qrHistory.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'qr-item';

    if (item.copied) {
      li.classList.add('copied');
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'qr-item-content';
    const copyStatusHtml = item.copied
      ? '<span style="color:#188038; font-weight:bold; margin-left: 5px;">(Đã Copy)</span>'
      : '';
    contentDiv.innerHTML = `<div class="qr-item-time">${item.time} ${copyStatusHtml}</div><div class="qr-item-text">${item.text}</div>`;

    li.onclick = () => {
      navigator.clipboard
        .writeText(item.text)
        .then(() => {
          playBeep();
          qrHistory[index].copied = true;
          localStorage.setItem('qrHistory', JSON.stringify(qrHistory));
          renderQrHistory();
        })
        .catch((err) => {
          alert('Lỗi không thể copy: ' + err);
        });
    };

    const delBtn = document.createElement('button');
    delBtn.className = 'del-btn';
    delBtn.innerText = 'Xóa';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      qrHistory.splice(index, 1);
      localStorage.setItem('qrHistory', JSON.stringify(qrHistory));
      renderQrHistory();
    };

    li.appendChild(contentDiv);
    li.appendChild(delBtn);
    qrHistoryList.appendChild(li);
  });
}

function onScanSuccess(decodedText, decodedResult) {
  const now = Date.now();

  if (decodedText === lastScannedText && now - lastScannedTime < 2000) {
    return;
  }

  lastScannedText = decodedText;
  lastScannedTime = now;

  playBeep();
  qrResultText.textContent = decodedText;

  const d = new Date();
  const timeString = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

  qrHistory.unshift({ text: decodedText, time: timeString, copied: false });

  if (qrHistory.length > 50) qrHistory.pop();
  localStorage.setItem('qrHistory', JSON.stringify(qrHistory));
  renderQrHistory();
}

function startScan() {
  if (isScanning) return;

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode('qr-reader');
  }

  btnScan.textContent = 'Đang mở camera...';
  btnScan.disabled = true;

  html5QrCode
    .start(
      {
        // Ưu tiên camera sau một cách an toàn cho iOS
        facingMode: 'environment',
        // Yêu cầu độ phân giải HD (Safari xử lý mức này mượt nhất mà không bị méo ảnh)
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      {
        // 25 fps là mức "chân ái" cho iPhone: Đủ nhanh để quét nhạy, không làm nóng máy
        fps: 25,

        // Mở rộng vùng quét vạch ngang, rất quan trọng vì iOS không cho web kiểm soát ống kính Macro
        qrbox: (videoWidth, videoHeight) => {
          return { width: videoWidth * 0.9, height: 250 };
        },

        // Buộc trình duyệt duy trì tỷ lệ khung hình chuẩn
        aspectRatio: 1.333334,
        disableFlip: false
      },
      onScanSuccess,
      (errorMessage) => {}
    )
    .then(() => {
      isScanning = true;
      btnScan.textContent = 'TẮT CAMERA';
      btnScan.disabled = false;
      btnScan.classList.add('scanning');
    })
    .catch((err) => {
      // Fallback: Nếu iOS vẫn từ chối độ phân giải, thử mở lại với cấu hình mặc định thấp nhất
      console.warn('Fallback camera iOS: ', err);
      html5QrCode
        .start({ facingMode: 'environment' }, { fps: 20, qrbox: 250 }, onScanSuccess, () => {})
        .then(() => {
          isScanning = true;
          btnScan.textContent = 'TẮT CAMERA';
          btnScan.disabled = false;
          btnScan.classList.add('scanning');
        })
        .catch((e) => {
          alert('Không thể mở camera. Vui lòng kiểm tra quyền truy cập!');
          btnScan.textContent = 'BẬT CAMERA QUÉT';
          btnScan.disabled = false;
        });
    });
}

function stopScan() {
  if (html5QrCode && isScanning) {
    html5QrCode
      .stop()
      .then(() => {
        isScanning = false;
        btnScan.textContent = 'BẬT CAMERA QUÉT';
        btnScan.classList.remove('scanning');
      })
      .catch((err) => console.error(err));
  }
}

if (btnScan) {
  btnScan.onclick = () => {
    if (isScanning) stopScan();
    else startScan();
  };
}

if (btnClearQr) {
  btnClearQr.onclick = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ danh sách mã đã quét?')) {
      qrHistory = [];
      localStorage.setItem('qrHistory', JSON.stringify(qrHistory));
      renderQrHistory();
      qrResultText.textContent = 'Chưa quét mã nào';
    }
  };
}

// ================= TÍNH NĂNG GIỮ MÀN HÌNH (WAKE LOCK) =================
let wakeLock = null;
const wakeLockIndicator = document.getElementById('wake-lock-indicator');

function updateWakeLockStatus(isSuccess) {
  if (wakeLockIndicator) {
    if (isSuccess) {
      wakeLockIndicator.classList.remove('status-red');
      wakeLockIndicator.classList.add('status-green');
    } else {
      wakeLockIndicator.classList.remove('status-green');
      wakeLockIndicator.classList.add('status-red');
    }
  }
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      const timeoutMs = 5000;
      wakeLock = await Promise.race([
        navigator.wakeLock.request('screen'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Wake lock request timeout')), timeoutMs)
        )
      ]);
      updateWakeLockStatus(true);
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
        updateWakeLockStatus(false);
      });
    } else updateWakeLockStatus(false);
  } catch (err) {
    wakeLock = null;
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

// Khởi chạy khi tải trang
initDiscountButtons();
renderQrHistory();
