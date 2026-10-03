/**
 * KapitalKula - Logic & State Management
 * Simple Capital Allocation & Money Management for College Students
 */

// Default State
const DEFAULT_STATE = {
  capital: 1500000,
  cycle: {
    type: 'monthly', // 'monthly' | 'weekly'
    startDay: 1      // 1-31 for monthly, 1 (Monday) for weekly
  },
  categories: [
    { id: 'cat-needs', name: 'Kebutuhan Pokok (Makan & Kos)', percent: 50, color: '#4f46e5' },
    { id: 'cat-study', name: 'Kuliah & Kuota Internet', percent: 20, color: '#06b6d4' },
    { id: 'cat-wants', name: 'Nongkrong & Hiburan', percent: 15, color: '#f59e0b' },
    { id: 'cat-save', name: 'Tabungan & Dana Darurat', percent: 15, color: '#10b981' }
  ],
  expenses: [
    { id: 'exp-1', amount: 25000, categoryId: 'cat-needs', note: 'Makan siang warteg + es teh', date: new Date().toISOString().split('T')[0] },
    { id: 'exp-2', amount: 50000, categoryId: 'cat-study', note: 'Beli paket kuota data', date: new Date().toISOString().split('T')[0] },
    { id: 'exp-3', amount: 28000, categoryId: 'cat-wants', note: 'Kopi susu senja tugas', date: new Date().toISOString().split('T')[0] }
  ],
  chartMode: 'alloc', // 'alloc' | 'real'
  theme: 'light'
};

const STORAGE_KEY = 'kapitalkula_app_data_v1';
let state = loadState();
let pieChartInstance = null;
let barChartInstance = null;

// ==========================================
// STATE PERSISTENCE & INITIALIZATION
// ==========================================

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load local storage state:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

// Format Rupiah
function formatIDR(amount) {
  const num = Math.round(Number(amount) || 0);
  return 'Rp ' + num.toLocaleString('id-ID');
}

// Format Date
function formatDateID(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// ==========================================
// CYCLE CALCULATIONS & SAFE DAILY SPEND
// ==========================================

function getCycleInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  let cycleStart, cycleEnd, remainingDays;

  if (state.cycle.type === 'weekly') {
    const targetDay = Number(state.cycle.startDay) || 1; // 1 = Monday
    const currentDay = now.getDay();
    const diff = (currentDay < targetDay ? currentDay + 7 : currentDay) - targetDay;
    
    cycleStart = new Date(now);
    cycleStart.setDate(now.getDate() - diff);
    cycleStart.setHours(0, 0, 0, 0);

    cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleStart.getDate() + 6);
    cycleEnd.setHours(23, 59, 59, 999);

    const msPerDay = 1000 * 60 * 60 * 24;
    remainingDays = Math.max(1, Math.ceil((cycleEnd - now) / msPerDay));
  } else {
    // Monthly
    const startDay = Math.min(Number(state.cycle.startDay) || 1, 28);
    if (today >= startDay) {
      cycleStart = new Date(year, month, startDay, 0, 0, 0);
      cycleEnd = new Date(year, month + 1, startDay - 1, 23, 59, 59);
    } else {
      cycleStart = new Date(year, month - 1, startDay, 0, 0, 0);
      cycleEnd = new Date(year, month, startDay - 1, 23, 59, 59);
    }
    const msPerDay = 1000 * 60 * 60 * 24;
    remainingDays = Math.max(1, Math.ceil((cycleEnd - now) / msPerDay));
  }

  return { cycleStart, cycleEnd, remainingDays };
}

// Filter expenses for current cycle
function getCurrentCycleExpenses() {
  const { cycleStart, cycleEnd } = getCycleInfo();
  return state.expenses.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= cycleStart && itemDate <= cycleEnd;
  });
}

// ==========================================
// RENDER & UI UPDATES
// ==========================================

function updateUI() {
  const currentExpenses = getCurrentCycleExpenses();
  const totalSpent = currentExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const capital = Number(state.capital) || 0;
  const remaining = capital - totalSpent;
  const spentPct = capital > 0 ? Math.round((totalSpent / capital) * 100) : 0;
  const { remainingDays } = getCycleInfo();

  // Daily budget based on remaining money
  const dailySafe = Math.max(0, Math.floor(remaining / remainingDays));

  // Update Header Badges
  const cycleBadge = document.getElementById('cycleBadge');
  if (cycleBadge) {
    cycleBadge.innerText = state.cycle.type === 'weekly' ? 'Mingguan' : 'Bulanan';
  }

  // Update Highlight Cards
  const elTotalCapital = document.getElementById('statTotalCapital');
  const elCycleLabel = document.getElementById('statCycleLabel');
  const elTotalSpent = document.getElementById('statTotalSpent');
  const elSpentPercent = document.getElementById('statSpentPercent');
  const elRemaining = document.getElementById('statRemaining');
  const elHealthStatus = document.getElementById('statHealthStatus');
  const elDailySafe = document.getElementById('statDailySafe');
  const elRemainingDays = document.getElementById('statRemainingDays');

  if (elTotalCapital) elTotalCapital.innerText = formatIDR(capital);
  if (elCycleLabel) elCycleLabel.innerText = `Siklus: ${state.cycle.type === 'weekly' ? 'Mingguan' : 'Bulanan'}`;
  if (elTotalSpent) elTotalSpent.innerText = formatIDR(totalSpent);
  if (elSpentPercent) elSpentPercent.innerText = `${spentPct}% dari modal`;
  if (elRemaining) elRemaining.innerText = formatIDR(remaining);
  
  if (elHealthStatus) {
    if (remaining < 0) {
      elHealthStatus.innerText = 'Kondisi: Overbudget / Boncos!';
      elHealthStatus.className = 'text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-0.5';
    } else if (spentPct > 80) {
      elHealthStatus.innerText = 'Kondisi: Waspada (Sisa Sedikit)';
      elHealthStatus.className = 'text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5';
    } else {
      elHealthStatus.innerText = 'Kondisi: Aman Terkendali';
      elHealthStatus.className = 'text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5';
    }
  }

  if (elDailySafe) elDailySafe.innerHTML = `${formatIDR(dailySafe)}<span class="text-xs font-normal">/hari</span>`;
  if (elRemainingDays) elRemainingDays.innerText = `Sisa ${remainingDays} hari di siklus ini`;

  // Render Charts
  renderCharts(currentExpenses);

  // Render Category Progress Bars
  renderCategoryBars(currentExpenses);

  // Render Category Options in Expense Form & Filter
  populateCategorySelects();

  // Render Expense List
  renderExpenseList();

  // Render Allocation Table
  renderAllocationTable();

  // Update Settings Inputs
  updateSettingsInputs();

  // Refresh Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ==========================================
// CHARTS (CHART.JS)
// ==========================================

function getCategorySpentMap(expensesList) {
  const map = {};
  state.categories.forEach(c => map[c.id] = 0);
  expensesList.forEach(exp => {
    if (map[exp.categoryId] !== undefined) {
      map[exp.categoryId] += Number(exp.amount) || 0;
    } else {
      map[exp.categoryId] = (map[exp.categoryId] || 0) + (Number(exp.amount) || 0);
    }
  });
  return map;
}

function setChartMode(mode) {
  state.chartMode = mode;
  saveState();
  
  const btnAlloc = document.getElementById('btnChartAlloc');
  const btnReal = document.getElementById('btnChartReal');
  if (mode === 'alloc') {
    btnAlloc.className = 'px-2.5 py-1 rounded-md font-medium bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-xs';
    btnReal.className = 'px-2.5 py-1 rounded-md font-medium text-slate-600 dark:text-slate-300';
  } else {
    btnReal.className = 'px-2.5 py-1 rounded-md font-medium bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-xs';
    btnAlloc.className = 'px-2.5 py-1 rounded-md font-medium text-slate-600 dark:text-slate-300';
  }

  const currentExpenses = getCurrentCycleExpenses();
  renderCharts(currentExpenses);
}

function renderCharts(currentExpenses) {
  const ctxPie = document.getElementById('pieChart');
  const ctxBar = document.getElementById('barChart');
  if (!ctxPie || !ctxBar) return;

  const spentMap = getCategorySpentMap(currentExpenses);
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#cbd5e1' : '#475569';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const labels = state.categories.map(c => c.name);
  const colors = state.categories.map(c => c.color);
  const capital = Number(state.capital) || 0;

  // Pie Chart Data based on mode
  let pieData = [];
  let centerTotal = 0;
  if (state.chartMode === 'alloc') {
    pieData = state.categories.map(c => (capital * (c.percent / 100)));
    centerTotal = capital;
  } else {
    pieData = state.categories.map(c => spentMap[c.id] || 0);
    centerTotal = currentExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }

  // Update center text amount
  const centerAmountEl = document.getElementById('chartCenterAmount');
  if (centerAmountEl) {
    centerAmountEl.innerText = formatIDR(centerTotal);
  }

  // Build / Update Pie Chart
  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  // Fallback if all zeros
  const hasData = pieData.some(v => v > 0);
  const displayPieData = hasData ? pieData : [1];
  const displayPieColors = hasData ? colors : ['#cbd5e1'];

  pieChartInstance = new Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: hasData ? labels : ['Belum ada alokasi'],
      datasets: [{
        data: displayPieData,
        backgroundColor: displayPieColors,
        borderWidth: 2,
        borderColor: isDark ? '#1e293b' : '#ffffff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (!hasData) return 'Kosong';
              const val = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return ` ${context.label}: ${formatIDR(val)} (${pct}%)`;
            }
          }
        }
      }
    }
  });

  // Render Custom Legend under Pie Chart
  const legendContainer = document.getElementById('chartLegendCustom');
  if (legendContainer) {
    legendContainer.innerHTML = state.categories.map(c => `
      <div class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700/50">
        <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${c.color}"></span>
        <span class="text-slate-600 dark:text-slate-300 font-medium">${c.name}</span>
        <span class="text-slate-400">(${c.percent}%)</span>
      </div>
    `).join('');
  }

  // Build / Update Bar Chart (Allocated vs Spent)
  if (barChartInstance) {
    barChartInstance.destroy();
  }

  const allocData = state.categories.map(c => Math.round(capital * (c.percent / 100)));
  const spentData = state.categories.map(c => spentMap[c.id] || 0);

  barChartInstance = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: state.categories.map(c => c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name),
      datasets: [
        {
          label: 'Alokasi Budget',
          data: allocData,
          backgroundColor: isDark ? '#4338ca' : '#6366f1',
          borderRadius: 6,
          maxBarThickness: 24
        },
        {
          label: 'Realisasi Terpakai',
          data: spentData,
          backgroundColor: state.categories.map(c => {
            const budget = capital * (c.percent / 100);
            const spent = spentMap[c.id] || 0;
            return spent > budget ? '#f43f5e' : (isDark ? '#059669' : '#10b981');
          }),
          borderRadius: 6,
          maxBarThickness: 24
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { size: 10 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { size: 10 },
            callback: value => value >= 1000 ? (value / 1000) + 'k' : value
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor, font: { size: 11 }, boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${formatIDR(context.raw)}`;
            }
          }
        }
      }
    }
  });
}

// Category Progress Cards
function renderCategoryBars(currentExpenses) {
  const container = document.getElementById('categoryCardsContainer');
  if (!container) return;

  const spentMap = getCategorySpentMap(currentExpenses);
  const capital = Number(state.capital) || 0;

  container.innerHTML = state.categories.map(cat => {
    const budget = Math.round(capital * (cat.percent / 100));
    const spent = spentMap[cat.id] || 0;
    const remaining = budget - spent;
    const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    
    let barColor = 'bg-indigo-500';
    let statusText = `${formatIDR(remaining)} tersisa`;
    let statusClass = 'text-slate-500 dark:text-slate-400';

    if (spent > budget) {
      barColor = 'bg-rose-500';
      statusText = `Overbudget +${formatIDR(spent - budget)}`;
      statusClass = 'text-rose-500 font-semibold';
    } else if (pct >= 85) {
      barColor = 'bg-amber-500';
      statusClass = 'text-amber-500 font-semibold';
    } else {
      barColor = 'bg-emerald-500';
    }

    return `
      <div class="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/60">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full shrink-0" style="background-color: ${cat.color}"></span>
            <span class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">${cat.name}</span>
          </div>
          <span class="text-xs font-semibold ${statusClass}">${statusText}</span>
        </div>

        <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-1.5">
          <div class="${barColor} h-full rounded-full transition-all duration-300" style="width: ${Math.min(pct, 100)}%"></div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span>Terpakai: <strong class="text-slate-700 dark:text-slate-300">${formatIDR(spent)}</strong></span>
          <span>Target Alokasi: <strong class="text-slate-700 dark:text-slate-300">${formatIDR(budget)} (${cat.percent}%)</strong></span>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// EXPENSE TRACKING
// ==========================================

function populateCategorySelects() {
  const selForm = document.getElementById('expCategory');
  const selFilter = document.getElementById('filterExpCategory');
  if (!selForm) return;

  const currentFilter = selFilter ? selFilter.value : 'ALL';

  selForm.innerHTML = state.categories.map(c => `
    <option value="${c.id}">${c.name}</option>
  `).join('');

  if (selFilter) {
    selFilter.innerHTML = `
      <option value="ALL">Semua Pos Alokasi</option>
      ${state.categories.map(c => `<option value="${c.id}" ${c.id === currentFilter ? 'selected' : ''}>${c.name}</option>`).join('')}
    `;
  }
}

function handleExpenseSubmit(e) {
  e.preventDefault();
  const amount = Number(document.getElementById('expAmount').value);
  const categoryId = document.getElementById('expCategory').value;
  const note = document.getElementById('expNote').value.trim();
  const date = document.getElementById('expDate').value;

  if (!amount || amount <= 0) {
    alert('Masukkan jumlah pengeluaran yang valid.');
    return;
  }

  const newExpense = {
    id: 'exp-' + Date.now(),
    amount,
    categoryId,
    note,
    date
  };

  state.expenses.unshift(newExpense);
  saveState();

  // Reset form
  document.getElementById('expAmount').value = '';
  document.getElementById('expNote').value = '';
  document.getElementById('expDate').value = new Date().toISOString().split('T')[0];

  updateUI();
}

function setQuickExp(val) {
  const input = document.getElementById('expAmount');
  if (input) {
    const cur = Number(input.value) || 0;
    input.value = cur + val;
  }
}

function deleteExpense(id) {
  if (confirm('Hapus catatan pengeluaran ini?')) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveState();
    updateUI();
  }
}

function renderExpenseList() {
  const container = document.getElementById('expenseListContainer');
  const txCountBadge = document.getElementById('txCountBadge');
  if (!container) return;

  const currentExpenses = getCurrentCycleExpenses();
  const filterCat = document.getElementById('filterExpCategory')?.value || 'ALL';

  let filtered = currentExpenses;
  if (filterCat !== 'ALL') {
    filtered = currentExpenses.filter(e => e.categoryId === filterCat);
  }

  if (txCountBadge) txCountBadge.innerText = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-slate-400">
        <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
        <p class="text-xs">Belum ada transaksi pengeluaran di siklus ini.</p>
        <p class="text-[11px] mt-1 text-slate-500">Mulai catat pengeluaran harianmu di form sebelah kiri.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const catMap = {};
  state.categories.forEach(c => catMap[c.id] = c);

  container.innerHTML = `
    <div class="divide-y divide-slate-100 dark:divide-slate-700/60">
      ${filtered.map(item => {
        const cat = catMap[item.categoryId] || { name: 'Lainnya', color: '#94a3b8' };
        return `
          <div class="py-3 flex items-center justify-between gap-3 group">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-10 rounded-full shrink-0" style="background-color: ${cat.color}"></span>
              <div>
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">${escapeHtml(item.note)}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    ${cat.name}
                  </span>
                  <span class="text-[11px] text-slate-400">${formatDateID(item.date)}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-rose-500 dark:text-rose-400">-${formatIDR(item.amount)}</span>
              <button onclick="deleteExpense('${item.id}')" title="Hapus" class="p-1.5 text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <i data-lucide="trash" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// ALLOCATION EDITOR & PRESETS
// ==========================================

function onCapitalChanged(val) {
  const num = Number(val) || 0;
  state.capital = num;
  saveState();
  updateUI();
}

function setQuickCapital(val) {
  state.capital = val;
  const input = document.getElementById('inputCapital');
  if (input) input.value = val;
  saveState();
  updateUI();
}

function applyPreset(presetKey) {
  const presets = {
    standard_student: [
      { id: 'cat-needs', name: 'Kebutuhan Pokok (Makan, Kost, Transport)', percent: 50, color: '#4f46e5' },
      { id: 'cat-study', name: 'Kuliah, Fotokopi & Kuota Internet', percent: 20, color: '#06b6d4' },
      { id: 'cat-wants', name: 'Nongkrong & Hiburan (Self Reward)', percent: 15, color: '#f59e0b' },
      { id: 'cat-save', name: 'Tabungan & Dana Darurat', percent: 15, color: '#10b981' }
    ],
    rule_50_30_20: [
      { id: 'cat-needs', name: 'Kebutuhan Pokok (Needs)', percent: 50, color: '#4f46e5' },
      { id: 'cat-wants', name: 'Keinginan & Gaya Hidup (Wants)', percent: 30, color: '#ec4899' },
      { id: 'cat-save', name: 'Tabungan & Investasi (Savings)', percent: 20, color: '#10b981' }
    ],
    frugal: [
      { id: 'cat-needs', name: 'Kebutuhan Pokok (Mode Hemat)', percent: 65, color: '#4f46e5' },
      { id: 'cat-wants', name: 'Jajan & Hiburan Minimalis', percent: 10, color: '#f59e0b' },
      { id: 'cat-save', name: 'Tabungan Masa Depan', percent: 25, color: '#10b981' }
    ],
    weekly_compact: [
      { id: 'cat-daily', name: 'Makan & Operasional Harian', percent: 60, color: '#4f46e5' },
      { id: 'cat-weekend', name: 'Nongkrong & Weekend', percent: 25, color: '#f59e0b' },
      { id: 'cat-reserve', name: 'Cadangan & Tabungan', percent: 15, color: '#10b981' }
    ]
  };

  if (presets[presetKey]) {
    state.categories = JSON.parse(JSON.stringify(presets[presetKey]));
    saveState();
    updateUI();
  }
}

function updateCategoryPercent(catId, newPercent) {
  const num = Math.max(0, Math.min(100, Number(newPercent) || 0));
  const cat = state.categories.find(c => c.id === catId);
  if (cat) {
    cat.percent = num;
    saveState();
    updateUI();
  }
}

function updateCategoryName(catId, newName) {
  const cat = state.categories.find(c => c.id === catId);
  if (cat && newName.trim()) {
    cat.name = newName.trim();
    saveState();
    updateUI();
  }
}

function deleteCategory(catId) {
  if (state.categories.length <= 1) {
    alert('Minimal harus ada 1 pos alokasi.');
    return;
  }
  if (confirm('Hapus pos alokasi ini? Transaksi pada pos ini tetap ada di riwayat.')) {
    state.categories = state.categories.filter(c => c.id !== catId);
    saveState();
    updateUI();
  }
}

function renderAllocationTable() {
  const container = document.getElementById('allocationTableContainer');
  const badgeTotal = document.getElementById('allocTotalPercentBadge');
  if (!container) return;

  const totalPercent = state.categories.reduce((sum, c) => sum + (Number(c.percent) || 0), 0);
  const capital = Number(state.capital) || 0;

  if (badgeTotal) {
    badgeTotal.innerText = `${totalPercent}%`;
    if (totalPercent === 100) {
      badgeTotal.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
    } else {
      badgeTotal.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 animate-pulse';
    }
  }

  container.innerHTML = state.categories.map(cat => {
    const allocatedRp = Math.round(capital * (cat.percent / 100));
    return `
      <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <input type="color" value="${cat.color}" onchange="updateCategoryColor('${cat.id}', this.value)" class="w-8 h-8 rounded-lg cursor-pointer border-0 shrink-0">
          <input type="text" value="${escapeHtml(cat.name)}" onchange="updateCategoryName('${cat.id}', this.value)"
            class="text-sm font-semibold bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none w-full sm:w-72 text-slate-800 dark:text-slate-100">
        </div>

        <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div class="flex items-center gap-1.5">
            <input type="number" min="0" max="100" value="${cat.percent}" onchange="updateCategoryPercent('${cat.id}', this.value)"
              class="w-16 px-2 py-1 text-center font-bold text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <span class="text-xs text-slate-500 font-semibold">%</span>
          </div>

          <div class="text-right min-w-[120px]">
            <span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">${formatIDR(allocatedRp)}</span>
          </div>

          <button onclick="deleteCategory('${cat.id}')" title="Hapus Pos" class="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <i data-lucide="trash" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function updateCategoryColor(catId, color) {
  const cat = state.categories.find(c => c.id === catId);
  if (cat) {
    cat.color = color;
    saveState();
    updateUI();
  }
}

// Modal Category Add
function openAddCategoryModal() {
  document.getElementById('catNameInput').value = '';
  document.getElementById('catPercentInput').value = '';
  document.getElementById('modalCategory').classList.remove('hidden');
}

function closeCategoryModal() {
  document.getElementById('modalCategory').classList.add('hidden');
}

function saveCategoryModal() {
  const name = document.getElementById('catNameInput').value.trim();
  const percent = Number(document.getElementById('catPercentInput').value);
  const color = document.getElementById('catColorInput').value;

  if (!name) {
    alert('Nama pos alokasi tidak boleh kosong.');
    return;
  }
  if (isNaN(percent) || percent <= 0) {
    alert('Persentase harus berupa angka lebih dari 0.');
    return;
  }

  state.categories.push({
    id: 'cat-' + Date.now(),
    name,
    percent,
    color
  });

  saveState();
  closeCategoryModal();
  updateUI();
}

// ==========================================
// CYCLE SETTINGS
// ==========================================

function onCycleTypeChanged(type) {
  state.cycle.type = type;
  saveState();
  updateUI();
}

function updateCycleDateSettings() {
  const mDay = document.getElementById('monthlyStartDay');
  const wDay = document.getElementById('weeklyStartDay');

  if (state.cycle.type === 'monthly' && mDay) {
    state.cycle.startDay = Number(mDay.value) || 1;
  } else if (state.cycle.type === 'weekly' && wDay) {
    state.cycle.startDay = Number(wDay.value) || 1;
  }
  saveState();
  updateUI();
}

function updateSettingsInputs() {
  const inputCap = document.getElementById('inputCapital');
  if (inputCap && document.activeElement !== inputCap) {
    inputCap.value = state.capital;
  }

  const allocCycleText = document.getElementById('allocCycleText');
  if (allocCycleText) {
    allocCycleText.innerText = state.cycle.type === 'weekly' ? 'Mingguan' : 'Bulanan';
  }

  const radioMonthly = document.querySelector('input[name="cycleType"][value="monthly"]');
  const radioWeekly = document.querySelector('input[name="cycleType"][value="weekly"]');
  const mWrap = document.getElementById('monthlySettingsWrap');
  const wWrap = document.getElementById('weeklySettingsWrap');
  const mInput = document.getElementById('monthlyStartDay');
  const wInput = document.getElementById('weeklyStartDay');

  if (state.cycle.type === 'weekly') {
    if (radioWeekly) radioWeekly.checked = true;
    if (mWrap) mWrap.classList.add('opacity-50', 'pointer-events-none');
    if (wWrap) wWrap.classList.remove('opacity-50', 'pointer-events-none');
    if (wInput) wInput.value = state.cycle.startDay;
  } else {
    if (radioMonthly) radioMonthly.checked = true;
    if (mWrap) mWrap.classList.remove('opacity-50', 'pointer-events-none');
    if (wWrap) wWrap.classList.add('opacity-50', 'pointer-events-none');
    if (mInput) mInput.value = state.cycle.startDay;
  }
}

// ==========================================
// BACKUP & RESTORE DATA (JSON)
// ==========================================

function exportDataJSON() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const dlAnchor = document.createElement('a');
  const filename = `kapitalkula_backup_${new Date().toISOString().split('T')[0]}.json`;
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', filename);
  dlAnchor.click();
}

function importDataJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.categories && imported.capital !== undefined) {
        state = { ...DEFAULT_STATE, ...imported };
        saveState();
        updateUI();
        alert('Data berhasil diimpor!');
      } else {
        alert('Format file JSON tidak sesuai.');
      }
    } catch (err) {
      alert('Gagal membaca file JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function confirmResetData() {
  if (confirm('Yakin ingin mereset semua data ke pengaturan awal? Semua catatan pengeluaran akan terhapus.')) {
    localStorage.removeItem(STORAGE_KEY);
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
    updateUI();
    alert('Data berhasil direset.');
  }
}

// ==========================================
// TABS & THEME
// ==========================================

function switchTab(tabId) {
  const tabs = ['dashboard', 'expenses', 'allocation', 'settings'];
  tabs.forEach(t => {
    const content = document.getElementById(`tabContent-${t}`);
    const deskBtn = document.getElementById(`tabBtn-${t}`);
    const mobBtn = document.getElementById(`mTabBtn-${t}`);

    if (t === tabId) {
      if (content) content.classList.remove('hidden');
      if (deskBtn) {
        deskBtn.classList.remove('inactive-tab');
        deskBtn.classList.add('active-tab');
      }
      if (mobBtn) {
        mobBtn.classList.remove('inactive-m-tab');
        mobBtn.classList.add('active-m-tab');
      }
    } else {
      if (content) content.classList.add('hidden');
      if (deskBtn) {
        deskBtn.classList.remove('active-tab');
        deskBtn.classList.add('inactive-tab');
      }
      if (mobBtn) {
        mobBtn.classList.remove('active-m-tab');
        mobBtn.classList.add('inactive-m-tab');
      }
    }
  });

  // Re-render chart size when tab becomes visible
  if (tabId === 'dashboard') {
    const currentExpenses = getCurrentCycleExpenses();
    setTimeout(() => renderCharts(currentExpenses), 50);
  }
  
  if (window.lucide) lucide.createIcons();
}

function initTheme() {
  const savedTheme = localStorage.getItem('kapitalkula_theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  applyTheme(savedTheme);

  const btnTheme = document.getElementById('btnThemeToggle');
  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('kapitalkula_theme', next);
      const currentExpenses = getCurrentCycleExpenses();
      renderCharts(currentExpenses);
    });
  }
}

function applyTheme(theme) {
  const icon = document.getElementById('themeIcon');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    if (icon) icon.setAttribute('data-lucide', 'sun');
  } else {
    document.documentElement.classList.remove('dark');
    if (icon) icon.setAttribute('data-lucide', 'moon');
  }
  if (window.lucide) lucide.createIcons();
}

// Help Modal
const btnHelp = document.getElementById('btnMobileHelp');
if (btnHelp) {
  btnHelp.addEventListener('click', () => {
    document.getElementById('modalHelp').classList.remove('hidden');
  });
}

function closeHelpModal() {
  document.getElementById('modalHelp').classList.add('hidden');
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// ==========================================
// INIT APP
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
  // Set default expense date to today
  const dateInput = document.getElementById('expDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  initTheme();
  updateUI();
});
