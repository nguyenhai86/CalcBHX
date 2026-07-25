let state = { inputStr: '', discount: 30, isFinalized: false, wakeLock: null };
// Thêm 33% vào mốc giảm giá
const discounts = [20, 25, 30, 33, 40, 50, 60];
let resetTimer = null;
let audioCtx = null;

const ui = {
  discountGroup: document.getElementById('discountGroup'),
  displayCard: document.getElementById('displayCard'),
  finalPrice: document.getElementById('finalPriceDisplay'),
  rawInput: document.getElementById('rawInputText'),
  originalPrice: document.getElementById('originalPriceText'),
  unroundedPrice: document.getElementById('unroundedPriceText'),
  historyList: document.getElementById('historyList'),
  wakeStatus: document.getElementById('wakeLockStatus')
};

function init() {
  ui.discountGroup.innerHTML = '';
  discounts.forEach((percent) => {
    const btn = document.createElement('button');
    btn.className = `btn-discount ${percent === state.discount ? 'active' : ''}`;
    btn.innerText = `${percent}%`;
    btn.onclick = () => setDiscount(percent, btn);
    ui.discountGroup.appendChild(btn);
  });

  document.body.addEventListener('touchstart', initialInteraction, { once: true });
  document.body.addEventListener('click', initialInteraction, { once: true });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      requestWakeLock();
    }
  });
}

async function initialInteraction() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  requestWakeLock();
}

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      state.wakeLock = await navigator.wakeLock.request('screen');
      ui.wakeStatus.innerText = 'Màn hình: Luôn sáng';
      
      state.wakeLock.addEventListener('release', () => {
        if (document.visibilityState !== 'visible') {
          ui.wakeStatus.innerText = 'Màn hình: Bình thường';
        }
      });
    } catch (err) {
      ui.wakeStatus.innerText = 'Lỗi giữ sáng: ' + err.message;
    }
  } else {
    ui.wakeStatus.innerText = 'Trình duyệt không hỗ trợ giữ sáng';
  }
}

function playBeep() {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.15);
}

function calculatePrices() {
  if (state.inputStr === '') return { original: 0, discounted: 0, final: 0 };

  let original = parseInt(state.inputStr, 10) * 100;
  let discounted = original * (1 - state.discount / 100);

  let basePrice = Math.floor(discounted / 1000) * 1000;
  let remainder = discounted % 1000;
  let finalPrice = basePrice;

  if (remainder < 200) {
    finalPrice = basePrice;
  } else if (remainder <= 600) {
    finalPrice = basePrice + 500;
  } else {
    finalPrice = basePrice + 1000;
  }

  return { original, discounted, final: finalPrice };
}

function updateUI() {
  const { original, discounted, final } = calculatePrices();

  ui.rawInput.innerText = state.inputStr || '...';
  ui.originalPrice.innerText = state.inputStr ? original.toLocaleString('vi-VN') + ' đ' : '0 đ';
  ui.unroundedPrice.innerText = state.inputStr ? discounted.toLocaleString('vi-VN') + ' đ' : '0 đ';
  ui.finalPrice.innerText = state.inputStr ? final.toLocaleString('vi-VN') : '0';

  if (state.isFinalized) {
    ui.displayCard.classList.add('finalized');
  } else {
    ui.displayCard.classList.remove('finalized');
  }
}

function tapKey(btnElement, key) {
  btnElement.classList.add('pressed');
  if (navigator.vibrate) navigator.vibrate(20);

  if (state.isFinalized && /^[0-9]$/.test(key)) {
    state.inputStr = '';
    state.isFinalized = false;
  }

  if (key === 'C') {
    state.inputStr = '';
    state.isFinalized = false;
  } else if (key === 'DEL') {
    state.inputStr = state.inputStr.slice(0, -1);
    state.isFinalized = false;
  } else {
    if (state.inputStr.length < 4) {
      state.inputStr += key;
    }
  }

  updateUI();
  resetAutoTimer();
}

function releaseKey(btnElement) {
  btnElement.classList.remove('pressed');
}

function setDiscount(percent, btnEl) {
  state.discount = percent;
  document.querySelectorAll('.btn-discount').forEach((b) => b.classList.remove('active'));
  btnEl.classList.add('active');
  state.isFinalized = false;
  updateUI();
  resetAutoTimer();
}

function resetAutoTimer() {
  if (resetTimer) clearTimeout(resetTimer);
  if (state.inputStr === '' || state.isFinalized) return;

  resetTimer = setTimeout(() => {
    const { original, final } = calculatePrices();
    state.isFinalized = true;
    playBeep();
    updateUI();

    const histDiv = document.createElement('div');
    histDiv.className = 'history-item';
    histDiv.innerHTML = `<span class="hist-origin">${original.toLocaleString('vi-VN')}đ (-${state.discount}%)</span><span class="hist-final">${final.toLocaleString('vi-VN')}đ</span>`;
    ui.historyList.prepend(histDiv);
  }, 1500);
}

init();
