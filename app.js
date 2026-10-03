/**
 * Allocata - Capital Allocation Dashboard & Money Management
 * Executive Obsidian Purple Theme with Nominal-First Category Allocation
 */

const todayIso = new Date().toISOString().split('T')[0];

// Curated Distinct Multi-Color Palette
const COLOR_PALETTE = [
  '#38bdf8', // Sky Blue
  '#f87171', // Coral / Salmon
  '#fbbf24', // Mustard Gold
  '#a78bfa', // Lavender Purple
  '#34d399', // Mint Teal
  '#f472b6', // Rose Pink
  '#fb923c', // Warm Orange
  '#2dd4bf', // Cyan Teal
  '#818cf8', // Indigo
  '#e879f9', // Magenta
  '#4ade80', // Emerald Green
  '#facc15'  // Yellow
];

// Standard Student Emojis for Adjustable Emoticon Selector
const STANDARD_EMOJIS = [
  '🏠', '🍜', '📚', '☕', '🛵', '⚡', '💰', '🚨',
  '🎮', '💳', '🛒', '📱', '💊', '👕', '🎓', '🎁',
  '🍕', '✈️', '💻', '🏖️', '🏋️', '🐱', '🚌', '🔧'
];

// Default State with Nominal-First Categories
const DEFAULT_STATE = {
  capital: 1500000,
  cycle: {
    type: 'monthly', // 'monthly' | 'weekly' | 'custom_days'
    monthlyStartDay: 1,      // 1-31
    weeklyInterval: 1,       // 1, 2, 3, 4 minggu sekali
    weeklyStartDate: todayIso,
    customIntervalDays: 1,   // 1 (harian), 3, 5, 10, atau N hari
    customStartDate: todayIso
  },
  categories: [
    { id: 'cat-needs', name: 'Kosan', targetAmount: 500000, color: '#f87171', emoji: '🏠' },
    { id: 'cat-daily', name: 'Makan & Harian', targetAmount: 450000, color: '#fbbf24', emoji: '🍜' },
    { id: 'cat-study', name: 'Kebutuhan Kuliah', targetAmount: 250000, color: '#38bdf8', emoji: '📚' },
    { id: 'cat-wants', name: 'Nongkrong & Hiburan', targetAmount: 150000, color: '#a78bfa', emoji: '☕' },
    { id: 'cat-save', name: 'Tabungan & Dana Darurat', targetAmount: 150000, color: '#34d399', emoji: '💰' }
  ],
  expenses: [
    { id: 'exp-1', amount: 25000, categoryId: 'cat-daily', note: 'Makan Siang Nasi Padang', date: todayIso },
    { id: 'exp-2', amount: 50000, categoryId: 'cat-study', note: 'Beli Paket Data / Kuota', date: todayIso },
    { id: 'exp-3', amount: 28000, categoryId: 'cat-wants', note: 'Kopi Tugas Senja', date: todayIso }
  ],
  incomes: [
    { id: 'inc-1', amount: 200000, title: 'Freelance Desain Poster BEM', date: todayIso, allocMode: 'proportional', targetCategoryId: null }
  ],
  analysisTab: 'expense', // 'expense' | 'income' | 'budget'
  cycleOffset: 0,
  theme: 'dark'
};

const STORAGE_KEY = 'kapitalkula_app_data_v1';
let state = loadState();
let pieChartInstance = null;
let barChartInstance = null;

// ==========================================
// STATE PERSISTENCE & INITIALIZATION
// ==========================================

function getCategoryEmojiFallback(cat) {
  if (cat.emoji) return cat.emoji;
  const name = (cat.name || '').toLowerCase();
  if (name.includes('makan') || name.includes('harian') || name.includes('food')) return '🍜';
  if (name.includes('kos') || name.includes('kontrakan') || name.includes('tempat') || name.includes('needs')) return '🏠';
  if (name.includes('kuliah') || name.includes('buku') || name.includes('study') || name.includes('r&d')) return '📚';
  if (name.includes('nongkrong') || name.includes('kopi') || name.includes('hiburan') || name.includes('wants')) return '☕';
  if (name.includes('tabung') || name.includes('save') || name.includes('invest') || name.includes('reserve')) return '💰';
  if (name.includes('darurat') || name.includes('emergency')) return '🚨';
  if (name.includes('transport') || name.includes('bensin') || name.includes('ojol')) return '🛵';
  if (name.includes('tagihan') || name.includes('paylater') || name.includes('listrik') || name.includes('wifi')) return '💳';
  return '📁';
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const loaded = { ...DEFAULT_STATE, ...parsed };
      if (!loaded.incomes) loaded.incomes = [];
      if (!loaded.analysisTab) loaded.analysisTab = 'expense';
      if (loaded.cycleOffset === undefined) loaded.cycleOffset = 0;

      const cap = Number(loaded.capital) || 1500000;

      // Ensure every category has emoji, distinct color, and targetAmount (Rp)
      if (Array.isArray(loaded.categories)) {
        loaded.categories.forEach((cat, idx) => {
          if (!cat.emoji) cat.emoji = getCategoryEmojiFallback(cat);
          if (!cat.color) cat.color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
          // Backward compatibility: migrate percent to targetAmount if targetAmount missing
          if (cat.targetAmount === undefined || cat.targetAmount === null || isNaN(cat.targetAmount)) {
            cat.targetAmount = Math.round(cap * ((cat.percent || 20) / 100));
          }
        });
      }

      if (loaded.cycle) {
        if (!loaded.cycle.monthlyStartDay) loaded.cycle.monthlyStartDay = loaded.cycle.startDay || 1;
        if (!loaded.cycle.weeklyInterval) loaded.cycle.weeklyInterval = 1;
        if (!loaded.cycle.weeklyStartDate) loaded.cycle.weeklyStartDate = todayIso;
        if (!loaded.cycle.customIntervalDays) loaded.cycle.customIntervalDays = 1;
        if (!loaded.cycle.customStartDate) loaded.cycle.customStartDate = todayIso;
        if (loaded.cycle.type === 'daily') loaded.cycle.type = 'custom_days';
      }
      return loaded;
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
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// ==========================================
// CYCLE CALCULATIONS & SAFE DAILY SPEND
// ==========================================

function getCycleInfo(offset = 0) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const msPerDay = 1000 * 60 * 60 * 24;
  const nowDay = new Date(year, month, today, 0, 0, 0);

  let cycleStart, cycleEnd, remainingDays, label, badge, periodLabel;

  if (state.cycle.type === 'weekly') {
    const weeks = Number(state.cycle.weeklyInterval) || 1;
    const intervalDays = weeks * 7;
    const anchorStr = state.cycle.weeklyStartDate || todayIso;
    const anchorParts = anchorStr.split('-');
    const anchorDate = new Date(Number(anchorParts[0]), Number(anchorParts[1]) - 1, Number(anchorParts[2]), 0, 0, 0);

    const diffDays = Math.floor((nowDay - anchorDate) / msPerDay);
    const cycleIndex = Math.floor(diffDays / intervalDays) + offset;
    
    cycleStart = new Date(anchorDate.getTime() + (cycleIndex * intervalDays * msPerDay));
    cycleEnd = new Date(cycleStart.getTime() + (intervalDays * msPerDay) - 1);
    remainingDays = Math.max(1, Math.ceil((cycleEnd - now) / msPerDay));

    label = weeks === 1 ? '1 Minggu Sekali' : `${weeks} Minggu Sekali`;
    badge = weeks === 1 ? '1 Minggu' : `${weeks} Minggu`;
    periodLabel = `${cycleStart.getDate()}/${cycleStart.getMonth()+1} - ${cycleEnd.getDate()}/${cycleEnd.getMonth()+1}`;
  } else if (state.cycle.type === 'custom_days') {
    const intervalDays = Math.max(1, Number(state.cycle.customIntervalDays) || 1);
    const anchorStr = state.cycle.customStartDate || todayIso;
    const anchorParts = anchorStr.split('-');
    const anchorDate = new Date(Number(anchorParts[0]), Number(anchorParts[1]) - 1, Number(anchorParts[2]), 0, 0, 0);

    const diffDays = Math.floor((nowDay - anchorDate) / msPerDay);
    const cycleIndex = Math.floor(diffDays / intervalDays) + offset;

    cycleStart = new Date(anchorDate.getTime() + (cycleIndex * intervalDays * msPerDay));
    cycleEnd = new Date(cycleStart.getTime() + (intervalDays * msPerDay) - 1);
    remainingDays = Math.max(1, Math.ceil((cycleEnd - now) / msPerDay));

    if (intervalDays === 1) {
      label = 'Harian (1 Hari)';
      badge = 'Harian';
      periodLabel = `${cycleStart.getDate()}/${cycleStart.getMonth()+1}/${cycleStart.getFullYear()}`;
    } else {
      label = `Per ${intervalDays} Hari`;
      badge = `${intervalDays} Hari`;
      periodLabel = `${cycleStart.getDate()}/${cycleStart.getMonth()+1} - ${cycleEnd.getDate()}/${cycleEnd.getMonth()+1}`;
    }
  } else {
    // Monthly
    const startDay = Math.min(Number(state.cycle.monthlyStartDay) || 1, 28);
    const targetMonth = month + offset;
    if (today >= startDay) {
      cycleStart = new Date(year, targetMonth, startDay, 0, 0, 0);
      cycleEnd = new Date(year, targetMonth + 1, startDay - 1, 23, 59, 59, 999);
    } else {
      cycleStart = new Date(year, targetMonth - 1, startDay, 0, 0, 0);
      cycleEnd = new Date(year, targetMonth, startDay - 1, 23, 59, 59, 999);
    }
    remainingDays = Math.max(1, Math.ceil((cycleEnd - now) / msPerDay));
    label = `Bulanan (Tgl ${startDay})`;
    badge = 'Bulanan';
    periodLabel = `${cycleStart.getMonth() + 1}/${cycleStart.getFullYear()}`;
  }

  return { cycleStart, cycleEnd, remainingDays, label, badge, periodLabel };
}

function cycleNavPrev() {
  state.cycleOffset = (state.cycleOffset || 0) - 1;
  updateUI();
}

function cycleNavNext() {
  state.cycleOffset = (state.cycleOffset || 0) + 1;
  updateUI();
}

// Filter expenses for current cycle
function getCurrentCycleExpenses() {
  const { cycleStart, cycleEnd } = getCycleInfo(state.cycleOffset || 0);
  return (state.expenses || []).filter(item => {
    const itemDate = new Date(item.date + 'T12:00:00');
    return itemDate >= cycleStart && itemDate <= cycleEnd;
  });
}

// Filter incomes for current cycle
function getCurrentCycleIncomes() {
  const { cycleStart, cycleEnd } = getCycleInfo(state.cycleOffset || 0);
  return (state.incomes || []).filter(item => {
    const itemDate = new Date(item.date + 'T12:00:00');
    return itemDate >= cycleStart && itemDate <= cycleEnd;
  });
}

// ==========================================
// NOMINAL-FIRST BUDGET & AUTO-PERCENTAGE CALCULATION
// ==========================================

function getCategoryBudgets(currentIncomes) {
  // 1. Total nominal Rupiah dari seluruh pos alokasi
  const totalBasePos = state.categories.reduce((sum, c) => sum + (Number(c.targetAmount) || 0), 0);
  
  // Jika state.capital belum diatur atau lebih kecil dari total pos, sesuaikan dengan totalBasePos
  const baseCapital = Math.max(Number(state.capital) || 0, totalBasePos);

  // 2. Persentase otomatis dihitung berdasarkan proporsi nominal pos
  state.categories.forEach(cat => {
    cat.percent = totalBasePos > 0 ? Math.round(((Number(cat.targetAmount) || 0) / totalBasePos) * 100) : 0;
  });

  // Pemasukan proporsional (dibagi rata ke semua pos sesuai bobot nominalnya)
  const propIncome = (currentIncomes || [])
    .filter(inc => inc.allocMode === 'proportional')
    .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

  // Pemasukan langsung ke pos spesifik
  const directMap = {};
  state.categories.forEach(c => directMap[c.id] = 0);
  (currentIncomes || [])
    .filter(inc => inc.allocMode === 'direct' && inc.targetCategoryId)
    .forEach(inc => {
      directMap[inc.targetCategoryId] = (directMap[inc.targetCategoryId] || 0) + (Number(inc.amount) || 0);
    });

  const budgets = {};
  state.categories.forEach(cat => {
    const baseTarget = Number(cat.targetAmount) || 0;
    const propShare = totalBasePos > 0 ? Math.round(propIncome * (baseTarget / totalBasePos)) : 0;
    const directShare = directMap[cat.id] || 0;
    budgets[cat.id] = baseTarget + propShare + directShare;
  });

  const totalExtra = (currentIncomes || []).reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
  const totalEffective = baseCapital + totalExtra;

  return { budgets, baseCapital, totalBasePos, totalExtra, totalEffective, propIncome, directMap };
}

// ==========================================
// ANALYSIS TABS: PENGELUARAN | PENGHASILAN | ANGGARAN
// ==========================================

function setAnalysisTab(tab) {
  state.analysisTab = tab;
  saveState();

  const tabExp = document.getElementById('tabAnalisisExpense');
  const tabInc = document.getElementById('tabAnalisisIncome');
  const tabBud = document.getElementById('tabAnalisisBudget');

  [tabExp, tabInc, tabBud].forEach(el => {
    if (el) {
      el.classList.remove('analisis-tab-active');
      el.classList.add('analisis-tab-inactive');
    }
  });

  if (tab === 'expense' && tabExp) {
    tabExp.classList.add('analisis-tab-active');
    tabExp.classList.remove('analisis-tab-inactive');
  } else if (tab === 'income' && tabInc) {
    tabInc.classList.add('analisis-tab-active');
    tabInc.classList.remove('analisis-tab-inactive');
  } else if (tab === 'budget' && tabBud) {
    tabBud.classList.add('analisis-tab-active');
    tabBud.classList.remove('analisis-tab-inactive');
  }

  updateUI();
}

// ==========================================
// RENDER & UI UPDATES
// ==========================================

function updateUI() {
  const currentExpenses = getCurrentCycleExpenses();
  const currentIncomes = getCurrentCycleIncomes();
  const budgetInfo = getCategoryBudgets(currentIncomes);

  const totalSpent = currentExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const effectiveCapital = budgetInfo.totalEffective;
  const remaining = effectiveCapital - totalSpent;
  const spentPct = effectiveCapital > 0 ? Math.round((totalSpent / effectiveCapital) * 100) : 0;
  const cycleInfo = getCycleInfo(state.cycleOffset || 0);
  const { remainingDays, label, badge, periodLabel } = cycleInfo;

  // Safe daily spend
  const dailySafe = Math.max(0, Math.floor(remaining / remainingDays));

  // Period label
  const elPeriod = document.getElementById('analysisPeriodLabel');
  if (elPeriod) elPeriod.innerText = periodLabel;

  // Header badges
  const sideCycle = document.getElementById('sideCycleBadge');
  const sideRemain = document.getElementById('sideRemainingDays');
  const mobCycle = document.getElementById('mobileCycleBadge');
  const topHeaderCycle = document.getElementById('topHeaderCycle');
  
  if (sideCycle) sideCycle.innerText = badge;
  if (sideRemain) sideRemain.innerText = `Sisa ${remainingDays} hari di siklus ini`;
  if (mobCycle) mobCycle.innerText = badge;
  if (topHeaderCycle) topHeaderCycle.innerText = label;

  // Top highlight cards
  const elTotalCapital = document.getElementById('statTotalCapital');
  const elCapitalSub = document.getElementById('statCapitalSub');
  const elTotalSpent = document.getElementById('statTotalSpent');
  const elSpentPercent = document.getElementById('statSpentPercent');
  const elDailySafe = document.getElementById('statDailySafe');
  const elRemainingDays = document.getElementById('statRemainingDays');

  if (elTotalCapital) elTotalCapital.innerText = formatIDR(effectiveCapital);
  if (elCapitalSub) {
    if (remaining >= 0) {
      elCapitalSub.innerHTML = `<i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> ${formatIDR(remaining)} Sisa Kas`;
      elCapitalSub.className = 'text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1';
    } else {
      elCapitalSub.innerHTML = `<i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> Overbudget -${formatIDR(Math.abs(remaining))}`;
      elCapitalSub.className = 'text-xs text-rose-400 font-semibold mt-1 flex items-center gap-1';
    }
  }

  if (elTotalSpent) elTotalSpent.innerText = formatIDR(totalSpent);
  if (elSpentPercent) elSpentPercent.innerText = `${spentPct}% dari total pool`;

  if (elDailySafe) elDailySafe.innerHTML = `${formatIDR(dailySafe)}<span class="text-xs font-normal text-purple-300">/hari</span>`;
  if (elRemainingDays) elRemainingDays.innerText = `Sisa ${remainingDays} hari di siklus ini`;

  // Render Multi-Color Donut & Overview Charts
  renderCharts(currentExpenses, currentIncomes, budgetInfo);

  // Render Category Breakdown List
  renderAnalysisBreakdown(currentExpenses, currentIncomes, budgetInfo);

  // Category selects in forms
  populateCategorySelects();

  // Transaction list (Requests Tab)
  renderTransactionList();

  // Desktop Recent Requests Table
  const catMap = {};
  state.categories.forEach(c => catMap[c.id] = c);
  const allTx = [
    ...currentExpenses.map(e => ({ ...e, type: 'expense' })),
    ...currentIncomes.map(i => ({ ...i, type: 'income' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  renderDesktopRecentTable(allTx, catMap);

  // Allocation table in Dompet/Projects Tab (Nominal-First)
  renderAllocationTable();

  // Settings inputs
  updateSettingsInputs();

  // Refresh Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ==========================================
// CHARTS (DONUT MULTI-WARNA DENGAN EMOTE)
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

// Inline Chart.js Plugin to draw clean Emote + percentage badges inside arcs
const doughnutPercentagePlugin = {
  id: 'doughnutPercentagePlugin',
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;
    const dataset = data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || meta.data.length === 0) return;

    const total = dataset.data.reduce((a, b) => a + b, 0);
    if (total <= 0) return;

    meta.data.forEach((element, index) => {
      const value = dataset.data[index];
      const pct = Math.round((value / total) * 100);
      if (pct < 4) return; // Skip tiny slices to avoid crowding

      const { startAngle, endAngle, innerRadius, outerRadius } = element;
      const midAngle = (startAngle + endAngle) / 2;
      const midRadius = (innerRadius + outerRadius) / 2;

      const x = element.x + Math.cos(midAngle) * midRadius;
      const y = element.y + Math.sin(midAngle) * midRadius;

      // Extract emoji from dataset labels (e.g. "🏠 Kosan")
      const label = data.labels[index] || '';
      const emojiMatch = label.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
      const emoji = emojiMatch ? emojiMatch[0] : '';

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (emoji && pct >= 7) {
        // Draw Emote Icon
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", sans-serif';
        ctx.fillText(emoji, x, y - 7);
        // Draw Percentage Text
        ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(`${pct}%`, x, y + 8);
      } else {
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(`${pct}%`, x, y);
      }

      ctx.restore();
    });
  }
};

function renderCharts(currentExpenses, currentIncomes, budgetInfo) {
  const ctxPie = document.getElementById('pieChart');
  const ctxBar = document.getElementById('barChart');
  if (!ctxPie) return;

  if (!budgetInfo) {
    currentIncomes = currentIncomes || getCurrentCycleIncomes();
    budgetInfo = getCategoryBudgets(currentIncomes);
  }

  const spentMap = getCategorySpentMap(currentExpenses);
  const activeTab = state.analysisTab || 'expense';

  let labels = [];
  let pieData = [];
  let colors = [];
  let centerLabelText = 'Pengeluaran';
  let centerTotalAmount = 0;

  if (activeTab === 'expense') {
    centerLabelText = 'Pengeluaran';
    centerTotalAmount = currentExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    
    state.categories.forEach(cat => {
      const spent = spentMap[cat.id] || 0;
      if (spent > 0 || state.categories.length <= 5) {
        labels.push(`${cat.emoji} ${cat.name}`);
        pieData.push(spent);
        colors.push(cat.color);
      }
    });

  } else if (activeTab === 'income') {
    centerLabelText = 'Penghasilan';
    centerTotalAmount = currentIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    if (currentIncomes.length === 0) {
      labels.push('Belum ada pemasukan');
      pieData.push(0);
      colors.push('#2d1f50');
    } else {
      currentIncomes.forEach((inc, idx) => {
        labels.push(inc.title);
        pieData.push(Number(inc.amount) || 0);
        colors.push(COLOR_PALETTE[idx % COLOR_PALETTE.length]);
      });
    }

  } else {
    // Budget / Anggaran
    centerLabelText = 'Total Anggaran';
    centerTotalAmount = budgetInfo.totalEffective;

    state.categories.forEach(cat => {
      labels.push(`${cat.emoji} ${cat.name}`);
      pieData.push(budgetInfo.budgets[cat.id] || 0);
      colors.push(cat.color);
    });
  }

  // Update center hole text
  const labelEl = document.getElementById('chartCenterLabel');
  const amountEl = document.getElementById('chartCenterAmount');
  if (labelEl) labelEl.innerText = centerLabelText;
  if (amountEl) amountEl.innerText = formatIDR(centerTotalAmount);

  // Update Section Subtitle
  const subtitleEl = document.getElementById('donutTabSubtitle');
  if (subtitleEl) {
    subtitleEl.innerText = activeTab === 'expense' 
      ? 'Distribusi Pengeluaran' 
      : activeTab === 'income' 
        ? 'Distribusi Penghasilan' 
        : 'Distribusi Anggaran Rencana';
  }

  // Build / Update Donut Chart
  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  const hasData = pieData.some(v => v > 0);
  const displayPieData = hasData ? pieData : [1];
  const displayPieColors = hasData ? colors : ['#2d1f50'];
  const displayLabels = hasData ? labels : ['Belum ada transaksi'];

  pieChartInstance = new Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: displayLabels,
      datasets: [{
        data: displayPieData,
        backgroundColor: displayPieColors,
        borderWidth: 2.5,
        borderColor: '#1b1232',
        hoverOffset: 6
      }]
    },
    plugins: [doughnutPercentagePlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '66%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#150d28',
          titleColor: '#ffffff',
          bodyColor: '#b388ff',
          borderColor: '#2d1f50',
          borderWidth: 1,
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

  // Build / Update Bar Chart (Anggaran vs Realisasi)
  if (ctxBar) {
    if (barChartInstance) {
      barChartInstance.destroy();
    }

    const allocData = state.categories.map(c => budgetInfo.budgets[c.id] || 0);
    const spentData = state.categories.map(c => spentMap[c.id] || 0);

    barChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: state.categories.map(c => `${c.emoji} ${c.name.length > 12 ? c.name.substring(0, 12) + '..' : c.name}`),
        datasets: [
          {
            label: 'Anggaran Target',
            data: allocData,
            backgroundColor: state.categories.map(c => c.color),
            borderRadius: 6,
            maxBarThickness: 28
          },
          {
            label: 'Realisasi Belanja',
            data: spentData,
            backgroundColor: state.categories.map(c => {
              const b = budgetInfo.budgets[c.id] || 0;
              const s = spentMap[c.id] || 0;
              return s > b ? '#f56565' : 'rgba(255, 255, 255, 0.25)';
            }),
            borderRadius: 6,
            maxBarThickness: 28
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#9f96b5', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#9f96b5',
              font: { size: 10 },
              callback: value => value >= 1000 ? (value / 1000) + 'k' : value
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#9f96b5', font: { size: 11 }, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: '#150d28',
            titleColor: '#ffffff',
            bodyColor: '#b388ff',
            borderColor: '#2d1f50',
            borderWidth: 1,
            callbacks: {
              label: context => ` ${context.dataset.label}: ${formatIDR(context.raw)}`
            }
          }
        }
      }
    });
  }
}

// ==========================================
// CATEGORY BREAKDOWN LIST (EXACT LAYOUT DARI GAMBAR REFERENSI)
// ==========================================

function renderAnalysisBreakdown(currentExpenses, currentIncomes, budgetInfo) {
  const container = document.getElementById('analysisBreakdownContainer');
  const sectionTitle = document.getElementById('breakdownSectionTitle');
  const sectionSub = document.getElementById('breakdownSectionSub');
  if (!container) return;

  const activeTab = state.analysisTab || 'expense';
  const spentMap = getCategorySpentMap(currentExpenses);

  if (activeTab === 'expense') {
    if (sectionTitle) sectionTitle.innerHTML = `<i data-lucide="layers" class="w-4 h-4 text-purple-400"></i> Rincian Pengeluaran per Kategori`;
    if (sectionSub) sectionSub.innerText = `Persentase & jumlah uang yang dibelanjakan`;

    const totalSpent = currentExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const sorted = [...state.categories].sort((a, b) => (spentMap[b.id] || 0) - (spentMap[a.id] || 0));

    if (totalSpent === 0) {
      container.innerHTML = `
        <div class="py-10 text-center text-[#6f6585]">
          <p class="text-sm">Belum ada pengeluaran di siklus ini.</p>
          <p class="text-xs mt-1 text-[#9f96b5]">Gunakan tab <strong>Buku Kas</strong> untuk mencatat pengeluaran.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = sorted.map(cat => {
      const spent = spentMap[cat.id] || 0;
      const budget = budgetInfo.budgets[cat.id] || 0;
      const pct = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;
      const remaining = budget - spent;

      let subText = `Kuota ${formatIDR(budget)} • Sisa ${formatIDR(remaining)}`;
      if (spent > budget) {
        subText = `Overbudget +${formatIDR(spent - budget)}`;
      }

      return `
        <div class="flex items-center justify-between py-3 px-2 hover:bg-white/[0.03] rounded-xl transition group">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${cat.color}"></span>
            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-[#231840] border border-[#2d1f50] shrink-0 group-hover:border-purple-500/50 transition shadow-inner">
              ${cat.emoji}
            </div>
            <div class="truncate">
              <p class="font-bold text-sm text-white truncate group-hover:text-purple-300 transition">${escapeHtml(cat.name)}</p>
              <p class="text-[11px] text-[#9f96b5] truncate">${subText}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 sm:gap-6 shrink-0 text-right">
            <span class="text-xs sm:text-sm font-semibold text-[#9f96b5] w-10 text-right">${pct}%</span>
            <span class="font-extrabold text-sm sm:text-base text-white min-w-[95px] text-right">${formatIDR(spent)}</span>
          </div>
        </div>
      `;
    }).join('');

  } else if (activeTab === 'income') {
    if (sectionTitle) sectionTitle.innerHTML = `<i data-lucide="arrow-down-left" class="w-4 h-4 text-emerald-400"></i> Rincian Sumber Pemasukan`;
    if (sectionSub) sectionSub.innerText = `Pemasukan rutin & rezeki dadakan di siklus ini`;

    const totalIncome = currentIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    if (currentIncomes.length === 0) {
      container.innerHTML = `
        <div class="py-10 text-center text-[#6f6585]">
          <p class="text-sm">Belum ada pemasukan tambahan tercatat di siklus ini.</p>
          <p class="text-xs mt-1 text-[#9f96b5]">Tambahkan rezeki dadakan lewat form <strong>+ Rezeki</strong>.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = currentIncomes.map((inc, idx) => {
      const amt = Number(inc.amount) || 0;
      const pct = totalIncome > 0 ? Math.round((amt / totalIncome) * 100) : 0;
      const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
      const isDirect = inc.allocMode === 'direct' && inc.targetCategoryId;
      const targetCat = isDirect ? state.categories.find(c => c.id === inc.targetCategoryId) : null;
      const allocText = isDirect ? `Masuk ke: ${targetCat?.emoji || ''} ${targetCat?.name || 'Pos Khusus'}` : 'Dibagi rata ke semua pos';

      return `
        <div class="flex items-center justify-between py-3 px-2 hover:bg-white/[0.03] rounded-xl transition group">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${color}"></span>
            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 shrink-0 shadow-inner">
              💰
            </div>
            <div class="truncate">
              <p class="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition">${escapeHtml(inc.title)}</p>
              <p class="text-[11px] text-emerald-400 truncate">${allocText}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 sm:gap-6 shrink-0 text-right">
            <span class="text-xs sm:text-sm font-semibold text-[#9f96b5] w-10 text-right">${pct}%</span>
            <span class="font-extrabold text-sm sm:text-base text-emerald-400 min-w-[95px] text-right">+${formatIDR(amt)}</span>
          </div>
        </div>
      `;
    }).join('');

  } else {
    // Budget / Anggaran
    if (sectionTitle) sectionTitle.innerHTML = `<i data-lucide="pie-chart" class="w-4 h-4 text-purple-400"></i> Rincian Alokasi Anggaran`;
    if (sectionSub) sectionSub.innerText = `Target proporsi formula pembagian dana kamu`;

    const totalBasePos = state.categories.reduce((sum, c) => sum + (Number(c.targetAmount) || 0), 0);

    container.innerHTML = state.categories.map(cat => {
      const budget = budgetInfo.budgets[cat.id] || 0;
      const pct = totalBasePos > 0 ? Math.round(((Number(cat.targetAmount) || 0) / totalBasePos) * 100) : 0;

      return `
        <div class="flex items-center justify-between py-3 px-2 hover:bg-white/[0.03] rounded-xl transition group">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${cat.color}"></span>
            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-[#231840] border border-[#2d1f50] shrink-0 group-hover:border-purple-500/50 transition shadow-inner">
              ${cat.emoji}
            </div>
            <div class="truncate">
              <p class="font-bold text-sm text-white truncate group-hover:text-purple-300 transition">${escapeHtml(cat.name)}</p>
              <p class="text-[11px] text-[#9f96b5] truncate">Proporsi: ${pct}%</p>
            </div>
          </div>

          <div class="flex items-center gap-3 sm:gap-6 shrink-0 text-right">
            <span class="text-xs sm:text-sm font-semibold text-purple-300 w-10 text-right">${pct}%</span>
            <span class="font-extrabold text-sm sm:text-base text-white min-w-[95px] text-right">${formatIDR(budget)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// TRANSACTIONS (EXPENSE & INCOME)
// ==========================================

function setTxFormType(type) {
  const btnExp = document.getElementById('btnTypeExpense');
  const btnInc = document.getElementById('btnTypeIncome');
  const formExp = document.getElementById('formExpense');
  const formInc = document.getElementById('formIncome');

  if (!btnExp || !btnInc) return;

  if (type === 'expense') {
    btnExp.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-purple-600 text-white shadow-md flex items-center justify-center gap-1.5 transition';
    btnInc.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-[#9f96b5] hover:text-emerald-400 flex items-center justify-center gap-1.5 transition';
    if (formExp) formExp.classList.remove('hidden');
    if (formInc) formInc.classList.add('hidden');
  } else {
    btnInc.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white shadow-md flex items-center justify-center gap-1.5 transition';
    btnExp.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-[#9f96b5] hover:text-purple-400 flex items-center justify-center gap-1.5 transition';
    if (formInc) formInc.classList.remove('hidden');
    if (formExp) formExp.classList.add('hidden');
  }
  if (window.lucide) lucide.createIcons();
}

function onIncomeAllocModeChanged(mode) {
  const wrap = document.getElementById('incTargetCategoryWrap');
  if (!wrap) return;
  if (mode === 'direct') {
    wrap.classList.remove('hidden');
  } else {
    wrap.classList.add('hidden');
  }
}

function setQuickExp(val) {
  const input = document.getElementById('expAmount');
  if (input) {
    const cur = Number(input.value) || 0;
    input.value = cur + val;
  }
}

function setQuickInc(val) {
  const input = document.getElementById('incAmount');
  if (input) {
    const cur = Number(input.value) || 0;
    input.value = cur + val;
  }
}

function populateCategorySelects() {
  const selForm = document.getElementById('expCategory');
  const selFilter = document.getElementById('filterExpCategory');
  const selTarget = document.getElementById('incTargetCategory');
  if (!selForm) return;

  const currentFilter = selFilter ? selFilter.value : 'ALL';

  selForm.innerHTML = state.categories.map(c => `
    <option value="${c.id}">${c.emoji} ${c.name}</option>
  `).join('');

  if (selTarget) {
    selTarget.innerHTML = state.categories.map(c => `
      <option value="${c.id}">${c.emoji} ${c.name}</option>
    `).join('');
  }

  if (selFilter) {
    selFilter.innerHTML = `
      <option value="ALL">Semua Pos Alokasi</option>
      ${state.categories.map(c => `<option value="${c.id}" ${c.id === currentFilter ? 'selected' : ''}>${c.emoji} ${c.name}</option>`).join('')}
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

  document.getElementById('expAmount').value = '';
  document.getElementById('expNote').value = '';
  document.getElementById('expDate').value = todayIso;

  updateUI();
}

function handleIncomeSubmit(e) {
  e.preventDefault();
  const amount = Number(document.getElementById('incAmount').value);
  const title = document.getElementById('incTitle').value.trim();
  const allocMode = document.getElementById('incAllocMode').value;
  const targetCategoryId = document.getElementById('incTargetCategory')?.value || null;
  const date = document.getElementById('incDate').value;

  if (!amount || amount <= 0) {
    alert('Masukkan jumlah pemasukan yang valid.');
    return;
  }

  const newIncome = {
    id: 'inc-' + Date.now(),
    amount,
    title,
    date,
    allocMode,
    targetCategoryId: allocMode === 'direct' ? targetCategoryId : null
  };

  if (!state.incomes) state.incomes = [];
  state.incomes.unshift(newIncome);
  saveState();

  document.getElementById('incAmount').value = '';
  document.getElementById('incTitle').value = '';
  document.getElementById('incDate').value = todayIso;
  document.getElementById('incAllocMode').value = 'proportional';
  onIncomeAllocModeChanged('proportional');

  updateUI();
}

function deleteExpense(id) {
  if (confirm('Hapus catatan pengeluaran ini?')) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveState();
    updateUI();
  }
}

function deleteIncome(id) {
  if (confirm('Hapus catatan pemasukan ini?')) {
    state.incomes = (state.incomes || []).filter(i => i.id !== id);
    saveState();
    updateUI();
  }
}

// Render Desktop Table in Dashboard
function renderDesktopRecentTable(allTx, catMap) {
  const tableBody = document.getElementById('desktopRecentTxTable');
  if (!tableBody) return;

  if (!allTx || allTx.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="py-6 text-center text-[#6f6585]">
          Belum ada transaksi di siklus ini. Klik <strong>+ Catat Transaksi</strong> untuk memulai.
        </td>
      </tr>
    `;
    return;
  }

  const recent6 = allTx.slice(0, 6);
  tableBody.innerHTML = recent6.map(item => {
    if (item.type === 'expense') {
      const cat = catMap[item.categoryId] || { name: 'Lainnya', color: '#b388ff', emoji: '📁' };
      return `
        <tr class="hover:bg-white/[0.02] transition">
          <td class="py-2.5 font-semibold text-white flex items-center gap-2">
            <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${cat.color}"></span>
            <span>${cat.emoji}</span>
            <span class="truncate max-w-[140px] sm:max-w-[200px]">${escapeHtml(item.note)}</span>
          </td>
          <td class="py-2.5 text-[#9f96b5]">${cat.name}</td>
          <td class="py-2.5 font-bold text-white">-${formatIDR(item.amount)}</td>
          <td class="py-2.5 text-right text-[#9f96b5]">${formatDateID(item.date)}</td>
        </tr>
      `;
    } else {
      const isDirect = item.allocMode === 'direct' && item.targetCategoryId;
      const targetCat = isDirect ? (catMap[item.targetCategoryId] || { name: 'Pos Khusus', emoji: '🎯' }) : null;
      const catLabel = isDirect ? `${targetCat.emoji || ''} ${targetCat.name}` : 'Semua Pos';
      return `
        <tr class="hover:bg-white/[0.02] transition bg-emerald-950/10">
          <td class="py-2.5 font-semibold text-white flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span>💰</span>
            <span class="truncate max-w-[140px] sm:max-w-[200px] text-emerald-300">${escapeHtml(item.title)}</span>
          </td>
          <td class="py-2.5 text-emerald-400 font-medium">${catLabel}</td>
          <td class="py-2.5 font-bold text-emerald-400">+${formatIDR(item.amount)}</td>
          <td class="py-2.5 text-right text-[#9f96b5]">${formatDateID(item.date)}</td>
        </tr>
      `;
    }
  }).join('');
}

// Render Transaction List (Requests Tab)
function renderTransactionList() {
  const container = document.getElementById('expenseListContainer');
  const txCountBadge = document.getElementById('txCountBadge');
  const typeFilter = document.getElementById('filterTxType')?.value || 'ALL';
  const catFilter = document.getElementById('filterExpCategory')?.value || 'ALL';
  if (!container) return;

  const currentExpenses = getCurrentCycleExpenses();
  const currentIncomes = getCurrentCycleIncomes();

  let allTx = [];

  if (typeFilter !== 'INCOME') {
    const filteredExp = currentExpenses.filter(e => catFilter === 'ALL' || e.categoryId === catFilter);
    allTx.push(...filteredExp.map(e => ({ ...e, type: 'expense' })));
  }

  if (typeFilter !== 'EXPENSE') {
    const filteredInc = currentIncomes.filter(i => {
      if (catFilter === 'ALL') return true;
      return i.allocMode === 'direct' && i.targetCategoryId === catFilter;
    });
    allTx.push(...filteredInc.map(i => ({ ...i, type: 'income' })));
  }

  allTx.sort((a, b) => new Date(b.date) - new Date(a.date));

  const catMap = {};
  state.categories.forEach(c => catMap[c.id] = c);

  if (txCountBadge) txCountBadge.innerText = allTx.length;

  if (allTx.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-[#6f6585]">
        <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-40"></i>
        <p class="text-xs">Belum ada transaksi di siklus ini.</p>
        <p class="text-[11px] mt-1 text-[#9f96b5]">Mulai catat transaksi baru di form sebelah kiri.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = allTx.map(item => {
    if (item.type === 'expense') {
      const cat = catMap[item.categoryId] || { name: 'Lainnya', color: '#b388ff', emoji: '📁' };
      return `
        <div class="p-4 rounded-2xl bg-[#150d28] border border-[#2d1f50] hover:border-purple-500/40 transition group flex flex-col gap-2">
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#231840] border border-[#2d1f50] flex items-center justify-center text-xl shrink-0 shadow-inner">
                ${cat.emoji}
              </div>
              <div>
                <h4 class="font-bold text-sm text-white group-hover:text-purple-300 transition">${escapeHtml(item.note)}</h4>
                <p class="text-xs text-[#9f96b5] mt-0.5 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full" style="background-color: ${cat.color}"></span>
                  ${cat.name}
                </p>
              </div>
            </div>
            <button onclick="deleteExpense('${item.id}')" title="Hapus" class="p-1.5 text-[#6f6585] hover:text-rose-400 rounded-lg hover:bg-white/5 transition">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-[#2d1f50]/60">
            <span class="font-extrabold text-base text-white">-${formatIDR(item.amount)}</span>
            <div class="flex items-center gap-2">
              <span class="badge-approved px-2.5 py-0.5 rounded-full text-[10px] font-bold">Approved</span>
              <span class="text-[11px] text-[#9f96b5]">${formatDateID(item.date)}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      // Income
      const isDirect = item.allocMode === 'direct' && item.targetCategoryId;
      const targetCat = isDirect ? (catMap[item.targetCategoryId] || { name: 'Pos Khusus', emoji: '🎯' }) : null;
      const allocLabel = isDirect ? `${targetCat.emoji || ''} ${targetCat.name}` : 'Semua Pos (Proporsional)';
      return `
        <div class="p-4 rounded-2xl bg-[#150d28] border border-emerald-500/30 hover:border-emerald-500/60 transition group flex flex-col gap-2">
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0 text-emerald-300 shadow-inner">
                💰
              </div>
              <div>
                <h4 class="font-bold text-sm text-white group-hover:text-emerald-300 transition">${escapeHtml(item.title)}</h4>
                <p class="text-xs text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <i data-lucide="arrow-down-left" class="w-3.5 h-3.5"></i>
                  Masuk ke: ${allocLabel}
                </p>
              </div>
            </div>
            <button onclick="deleteIncome('${item.id}')" title="Hapus" class="p-1.5 text-[#6f6585] hover:text-rose-400 rounded-lg hover:bg-white/5 transition">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-[#2d1f50]/60">
            <span class="font-extrabold text-base text-emerald-400">+${formatIDR(item.amount)}</span>
            <div class="flex items-center gap-2">
              <span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">+Rezeki</span>
              <span class="text-[11px] text-[#9f96b5]">${formatDateID(item.date)}</span>
            </div>
          </div>
        </div>
      `;
    }
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// ALLOCATION EDITOR (NOMINAL-FIRST & AUTO-PERCENTAGE)
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

function syncCapitalWithTotalPos() {
  const totalBasePos = state.categories.reduce((sum, c) => sum + (Number(c.targetAmount) || 0), 0);
  state.capital = totalBasePos;
  saveState();
  updateUI();
}

function applyPreset(presetKey) {
  const cap = Number(state.capital) || 1500000;
  const presets = {
    standard_student: [
      { id: 'cat-needs', name: 'Kosan', targetAmount: Math.round(cap * 0.35), color: '#f87171', emoji: '🏠' },
      { id: 'cat-daily', name: 'Makan & Harian', targetAmount: Math.round(cap * 0.30), color: '#fbbf24', emoji: '🍜' },
      { id: 'cat-study', name: 'Kebutuhan Kuliah', targetAmount: Math.round(cap * 0.15), color: '#38bdf8', emoji: '📚' },
      { id: 'cat-wants', name: 'Nongkrong & Hiburan', targetAmount: Math.round(cap * 0.10), color: '#a78bfa', emoji: '☕' },
      { id: 'cat-save', name: 'Tabungan & Dana Darurat', targetAmount: Math.round(cap * 0.10), color: '#34d399', emoji: '💰' }
    ],
    rule_50_30_20: [
      { id: 'cat-needs', name: 'Needs / Kebutuhan Pokok', targetAmount: Math.round(cap * 0.50), color: '#38bdf8', emoji: '🏠' },
      { id: 'cat-wants', name: 'Wants / Hiburan & Nongkrong', targetAmount: Math.round(cap * 0.30), color: '#f472b6', emoji: '☕' },
      { id: 'cat-save', name: 'Savings / Tabungan Masa Depan', targetAmount: Math.round(cap * 0.20), color: '#34d399', emoji: '💰' }
    ],
    frugal: [
      { id: 'cat-daily', name: 'Makan Pokok (Hemat)', targetAmount: Math.round(cap * 0.65), color: '#fbbf24', emoji: '🍜' },
      { id: 'cat-transport', name: 'Transport & Bensin', targetAmount: Math.round(cap * 0.10), color: '#38bdf8', emoji: '🛵' },
      { id: 'cat-save', name: 'Dana Darurat & Tabungan', targetAmount: Math.round(cap * 0.25), color: '#34d399', emoji: '🚨' }
    ],
    weekly_compact: [
      { id: 'cat-daily', name: 'Operasional Harian', targetAmount: Math.round(cap * 0.60), color: '#fbbf24', emoji: '🍜' },
      { id: 'cat-weekend', name: 'Weekend / Jajan Santai', targetAmount: Math.round(cap * 0.25), color: '#a78bfa', emoji: '☕' },
      { id: 'cat-reserve', name: 'Cadangan Simpanan', targetAmount: Math.round(cap * 0.15), color: '#34d399', emoji: '💰' }
    ]
  };

  if (presets[presetKey]) {
    state.categories = JSON.parse(JSON.stringify(presets[presetKey]));
    saveState();
    updateUI();
  }
}

// User adjusts the nominal amount directly!
function updateCategoryNominal(catId, newVal) {
  const num = Math.max(0, Number(newVal) || 0);
  const cat = state.categories.find(c => c.id === catId);
  if (cat) {
    cat.targetAmount = num;
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

// Render Allocation Table with Editable Nominal (Rp) & Auto-Calculated (%)
function renderAllocationTable() {
  const container = document.getElementById('allocationTableContainer');
  const badgeTotalPct = document.getElementById('allocTotalPercentBadge');
  const badgeTotalNom = document.getElementById('allocTotalNominalBadge');
  if (!container) return;

  const totalNominal = state.categories.reduce((sum, c) => sum + (Number(c.targetAmount) || 0), 0);

  if (badgeTotalNom) badgeTotalNom.innerText = formatIDR(totalNominal);
  if (badgeTotalPct) {
    badgeTotalPct.innerText = '100%';
    badgeTotalPct.className = 'text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  }

  container.innerHTML = state.categories.map(cat => {
    const catNominal = Number(cat.targetAmount) || 0;
    const pct = totalNominal > 0 ? Math.round((catNominal / totalNominal) * 100) : 0;
    
    return `
      <div class="p-3 sm:p-3.5 rounded-xl border border-[#2d1f50] bg-[#150d28] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group hover:border-purple-500/40 transition">
        <!-- Left: Emote, Color, Name -->
        <div class="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <!-- Clickable Emote Badge to Open Quick Editor -->
          <button type="button" onclick="openAddCategoryModal('${cat.id}')" title="Klik untuk ganti emote & warna"
            class="w-10 h-10 rounded-xl bg-[#231840] border border-[#2d1f50] hover:border-purple-500 flex items-center justify-center text-xl shrink-0 transition shadow-inner">
            ${cat.emoji}
          </button>

          <!-- Color Swatch Picker -->
          <input type="color" value="${cat.color}" onchange="updateCategoryColor('${cat.id}', this.value)" title="Pilih warna pos"
            class="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent shrink-0">

          <!-- Category Name Inline Input -->
          <input type="text" value="${escapeHtml(cat.name)}" onchange="updateCategoryName('${cat.id}', this.value)"
            class="text-sm font-semibold bg-transparent border-b border-dashed border-[#2d1f50] focus:border-purple-500 focus:outline-none w-full sm:w-64 text-white">
        </div>

        <!-- Right: Editable Nominal Rp & Auto-Calculated Percent -->
        <div class="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
          
          <!-- Editable Nominal Rupiah Input -->
          <div class="relative flex items-center">
            <span class="absolute left-2.5 text-xs text-[#9f96b5] font-semibold pointer-events-none">Rp</span>
            <input type="number" min="0" step="10000" value="${catNominal}" 
              onchange="updateCategoryNominal('${cat.id}', this.value)"
              title="Ketik nominal rupiah pos ini"
              placeholder="100000"
              class="w-32 sm:w-40 pl-8 pr-2.5 py-1.5 text-sm font-extrabold bg-[#1b1232] border border-[#2d1f50] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-white text-right">
          </div>

          <!-- Auto-Calculated Percentage Pill -->
          <div class="min-w-[50px] text-center">
            <span class="inline-block px-2.5 py-1 rounded-lg bg-[#231840] border border-[#2d1f50] text-xs font-bold text-purple-300">
              ${pct}%
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <button onclick="openAddCategoryModal('${cat.id}')" title="Edit Emoticon & Pos" class="p-1.5 text-[#6f6585] hover:text-purple-300 rounded-lg hover:bg-white/5 transition">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteCategory('${cat.id}')" title="Hapus Pos" class="p-1.5 text-[#6f6585] hover:text-rose-400 rounded-lg hover:bg-white/5 transition">
              <i data-lucide="trash" class="w-4 h-4"></i>
            </button>
          </div>

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

// ==========================================
// MODAL: ADD / EDIT CATEGORY (NOMINAL-FIRST)
// ==========================================

function openAddCategoryModal(catId) {
  const modal = document.getElementById('modalCategory');
  const title = document.getElementById('modalCategoryTitle');
  const editIdInput = document.getElementById('catEditId');
  const nameInput = document.getElementById('catNameInput');
  const amountInput = document.getElementById('catAmountInput');
  const emojiInput = document.getElementById('catEmojiInput');
  const emojiPreview = document.getElementById('catEmojiPreview');
  const colorInput = document.getElementById('catColorInput');

  if (!modal) return;

  let selectedEmoji = '🏠';
  let selectedColor = COLOR_PALETTE[state.categories.length % COLOR_PALETTE.length];
  let defaultAmount = 250000;

  if (catId) {
    const cat = state.categories.find(c => c.id === catId);
    if (cat) {
      editIdInput.value = cat.id;
      nameInput.value = cat.name;
      defaultAmount = cat.targetAmount || 0;
      selectedEmoji = cat.emoji || '🏠';
      selectedColor = cat.color || '#38bdf8';
      if (title) title.innerHTML = `<i data-lucide="edit-2" class="w-4 h-4 text-purple-400"></i> Edit Pos Alokasi`;
    }
  } else {
    editIdInput.value = '';
    nameInput.value = '';
    selectedEmoji = '🏠';
    selectedColor = COLOR_PALETTE[state.categories.length % COLOR_PALETTE.length];
    if (title) title.innerHTML = `<i data-lucide="folder-plus" class="w-4 h-4 text-purple-400"></i> Tambah Pos Alokasi`;
  }

  if (amountInput) amountInput.value = defaultAmount;
  if (emojiInput) emojiInput.value = selectedEmoji;
  if (emojiPreview) emojiPreview.innerText = selectedEmoji;
  if (colorInput) colorInput.value = selectedColor;

  updateModalPercentHint(defaultAmount);
  renderEmojiPickerGrid(selectedEmoji);
  renderColorSwatchesGrid(selectedColor);

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function setQuickModalNominal(val) {
  const input = document.getElementById('catAmountInput');
  if (input) {
    const cur = Number(input.value) || 0;
    input.value = cur + val;
    updateModalPercentHint(input.value);
  }
}

function onModalAmountChanged(val) {
  updateModalPercentHint(val);
}

function updateModalPercentHint(nominalVal) {
  const hint = document.getElementById('catModalPercentHint');
  if (!hint) return;
  const amt = Number(nominalVal) || 0;
  const currentTotal = state.categories.reduce((s, c) => s + (Number(c.targetAmount) || 0), 0);
  const newTotal = currentTotal > 0 ? currentTotal : amt;
  const pct = newTotal > 0 ? Math.round((amt / newTotal) * 100) : 0;
  hint.innerHTML = `<i data-lucide="info" class="w-3.5 h-3.5"></i> Estimasi porsi: ~${pct}% dari total alokasi pos`;
  if (window.lucide) lucide.createIcons();
}

function renderEmojiPickerGrid(activeEmoji) {
  const grid = document.getElementById('emojiPickerGrid');
  if (!grid) return;

  grid.innerHTML = STANDARD_EMOJIS.map(em => `
    <button type="button" onclick="onEmojiSelect('${em}')"
      class="emoji-picker-btn flex items-center justify-center ${em === activeEmoji ? 'selected' : ''}">
      ${em}
    </button>
  `).join('');
}

function onEmojiSelect(em) {
  const emojiInput = document.getElementById('catEmojiInput');
  const emojiPreview = document.getElementById('catEmojiPreview');
  if (emojiInput) emojiInput.value = em;
  if (emojiPreview) emojiPreview.innerText = em;
  renderEmojiPickerGrid(em);
}

function onEmojiInputChanged(val) {
  const emojiPreview = document.getElementById('catEmojiPreview');
  const trimmed = val.trim();
  if (trimmed && emojiPreview) {
    emojiPreview.innerText = trimmed;
  }
}

function renderColorSwatchesGrid(activeColor) {
  const grid = document.getElementById('colorSwatchesGrid');
  if (!grid) return;

  grid.innerHTML = COLOR_PALETTE.map(col => `
    <button type="button" onclick="onColorSelect('${col}')"
      class="color-swatch-btn ${col.toLowerCase() === activeColor.toLowerCase() ? 'selected' : ''}"
      style="background-color: ${col}">
    </button>
  `).join('');
}

function onColorSelect(col) {
  const colorInput = document.getElementById('catColorInput');
  if (colorInput) colorInput.value = col;
  renderColorSwatchesGrid(col);
}

function onCustomColorPick(col) {
  renderColorSwatchesGrid(col);
}

function closeCategoryModal() {
  const modal = document.getElementById('modalCategory');
  if (modal) modal.classList.add('hidden');
}

function saveCategoryModal() {
  const editId = document.getElementById('catEditId').value;
  const name = document.getElementById('catNameInput').value.trim();
  const targetAmount = Number(document.getElementById('catAmountInput').value) || 0;
  const color = document.getElementById('catColorInput').value;
  const emoji = document.getElementById('catEmojiInput').value.trim() || '🏠';

  if (!name) {
    alert('Nama pos alokasi tidak boleh kosong.');
    return;
  }

  if (editId) {
    // Edit Existing
    const cat = state.categories.find(c => c.id === editId);
    if (cat) {
      cat.name = name;
      cat.targetAmount = targetAmount;
      cat.color = color;
      cat.emoji = emoji;
    }
  } else {
    // Add New
    state.categories.push({
      id: 'cat-' + Date.now(),
      name,
      targetAmount,
      color,
      emoji
    });
  }

  saveState();
  closeCategoryModal();
  updateUI();
}

// ==========================================
// CYCLE SETTINGS
// ==========================================

function selectCycleRadio(type) {
  const radio = document.querySelector(`input[name="cycleType"][value="${type}"]`);
  if (radio) radio.checked = true;
  onCycleTypeChanged(type);
}

function setQuickCustomDays(days) {
  state.cycle.type = 'custom_days';
  state.cycle.customIntervalDays = days;
  const input = document.getElementById('customDaysInput');
  if (input) input.value = days;
  saveState();
  updateUI();
}

function onCycleTypeChanged(type) {
  state.cycle.type = type;
  saveState();
  updateUI();
}

function updateCycleDateSettings() {
  const mDay = document.getElementById('monthlyStartDay');
  const wSelect = document.getElementById('weeklyIntervalSelect');
  const wStart = document.getElementById('weeklyStartDateInput');
  const cDays = document.getElementById('customDaysInput');
  const cStart = document.getElementById('customStartDateInput');

  if (mDay) state.cycle.monthlyStartDay = Math.max(1, Math.min(31, Number(mDay.value) || 1));
  if (wSelect) state.cycle.weeklyInterval = Number(wSelect.value) || 1;
  if (wStart && wStart.value) state.cycle.weeklyStartDate = wStart.value;
  if (cDays) state.cycle.customIntervalDays = Math.max(1, Number(cDays.value) || 1);
  if (cStart && cStart.value) state.cycle.customStartDate = cStart.value;

  saveState();
  updateUI();
}

function updateSettingsInputs() {
  const inputCap = document.getElementById('inputCapital');
  if (inputCap && document.activeElement !== inputCap) {
    inputCap.value = state.capital;
  }

  const cycleInfo = getCycleInfo(state.cycleOffset || 0);
  const allocCycleText = document.getElementById('allocCycleText');
  if (allocCycleText) {
    allocCycleText.innerText = cycleInfo.label;
  }

  // Radios
  const curType = state.cycle.type;
  const radio = document.querySelector(`input[name="cycleType"][value="${curType}"]`);
  if (radio) radio.checked = true;

  // Cards styling
  const cardMonthly = document.getElementById('cardCycleMonthly');
  const cardWeekly = document.getElementById('cardCycleWeekly');
  const cardCustom = document.getElementById('cardCycleCustom');

  const mWrap = document.getElementById('monthlySettingsWrap');
  const wWrap = document.getElementById('weeklySettingsWrap');
  const cWrap = document.getElementById('customSettingsWrap');

  [cardMonthly, cardWeekly, cardCustom].forEach(card => {
    if (card) card.classList.remove('border-purple-500', 'bg-[#1b1232]');
  });

  if (curType === 'monthly') {
    if (cardMonthly) cardMonthly.classList.add('border-purple-500', 'bg-[#1b1232]');
    if (mWrap) mWrap.classList.remove('opacity-40', 'pointer-events-none');
    if (wWrap) wWrap.classList.add('opacity-40', 'pointer-events-none');
    if (cWrap) cWrap.classList.add('opacity-40', 'pointer-events-none');
  } else if (curType === 'weekly') {
    if (cardWeekly) cardWeekly.classList.add('border-purple-500', 'bg-[#1b1232]');
    if (mWrap) mWrap.classList.add('opacity-40', 'pointer-events-none');
    if (wWrap) wWrap.classList.remove('opacity-40', 'pointer-events-none');
    if (cWrap) cWrap.classList.add('opacity-40', 'pointer-events-none');
  } else {
    // custom_days
    if (cardCustom) cardCustom.classList.add('border-purple-500', 'bg-[#1b1232]');
    if (mWrap) mWrap.classList.add('opacity-40', 'pointer-events-none');
    if (wWrap) wWrap.classList.add('opacity-40', 'pointer-events-none');
    if (cWrap) cWrap.classList.remove('opacity-40', 'pointer-events-none');
  }

  // Populate input values
  const mDay = document.getElementById('monthlyStartDay');
  const wSelect = document.getElementById('weeklyIntervalSelect');
  const wStart = document.getElementById('weeklyStartDateInput');
  const cDays = document.getElementById('customDaysInput');
  const cStart = document.getElementById('customStartDateInput');

  if (mDay) mDay.value = state.cycle.monthlyStartDay || 1;
  if (wSelect) wSelect.value = state.cycle.weeklyInterval || 1;
  if (wStart) wStart.value = state.cycle.weeklyStartDate || todayIso;
  if (cDays) cDays.value = state.cycle.customIntervalDays || 1;
  if (cStart) cStart.value = state.cycle.customStartDate || todayIso;
}

// ==========================================
// BACKUP & RESTORE DATA (JSON)
// ==========================================

function exportDataJSON() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const dlAnchor = document.createElement('a');
  const filename = `allocata_backup_${new Date().toISOString().split('T')[0]}.json`;
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
        const cap = Number(state.capital) || 1500000;
        state.categories.forEach((cat, idx) => {
          if (!cat.emoji) cat.emoji = getCategoryEmojiFallback(cat);
          if (!cat.color) cat.color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
          if (cat.targetAmount === undefined || cat.targetAmount === null || isNaN(cat.targetAmount)) {
            cat.targetAmount = Math.round(cap * ((cat.percent || 20) / 100));
          }
        });
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
  if (confirm('Yakin ingin mereset semua data ke pengaturan awal? Semua catatan akan terhapus.')) {
    localStorage.removeItem(STORAGE_KEY);
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
    updateUI();
    alert('Data berhasil direset.');
  }
}

// ==========================================
// TABS & MODALS
// ==========================================

function switchTab(tabId) {
  const tabs = ['dashboard', 'expenses', 'allocation', 'settings'];
  tabs.forEach(t => {
    const content = document.getElementById(`tabContent-${t}`);
    const sideBtn = document.getElementById(`sideBtn-${t}`);
    const mNavBtn = document.getElementById(`mNavBtn-${t}`);

    if (t === tabId) {
      if (content) content.classList.remove('hidden');
      if (sideBtn) sideBtn.classList.add('active-sidebar');
      if (mNavBtn) mNavBtn.classList.add('active-m-nav');
    } else {
      if (content) content.classList.add('hidden');
      if (sideBtn) sideBtn.classList.remove('active-sidebar');
      if (mNavBtn) mNavBtn.classList.remove('active-m-nav');
    }
  });

  if (tabId === 'dashboard') {
    setTimeout(() => updateUI(), 50);
  }
  
  if (window.lucide) lucide.createIcons();
}

function openHelpModal() {
  document.getElementById('modalHelp')?.classList.remove('hidden');
}

function closeHelpModal() {
  document.getElementById('modalHelp')?.classList.add('hidden');
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
  const expDateInput = document.getElementById('expDate');
  const incDateInput = document.getElementById('incDate');
  if (expDateInput) expDateInput.value = todayIso;
  if (incDateInput) incDateInput.value = todayIso;

  // Set default analysis tab
  setAnalysisTab(state.analysisTab || 'expense');

  updateUI();
});
