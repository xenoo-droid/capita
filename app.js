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

// Default Profile Template
const DEFAULT_PROFILE = {
  id: 'prof-default',
  name: 'Haryo Seno',
  role: 'Anak Kuliahan',
  avatar: 'HR',
  color: '#9d50ff',
  passwordHash: null, // null | string SHA-256 hash
  cloudSyncKey: 'SENO-7721',
  updatedAt: 1727952000000,
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
  cycleOffset: 0
};

// Default State with Multi-Profile Support
const DEFAULT_STATE = {
  activeProfileId: 'prof-default',
  profiles: [
    JSON.parse(JSON.stringify(DEFAULT_PROFILE))
  ],
  theme: 'dark'
};

const STORAGE_KEY = 'kapitalkula_app_data_v1';
let state = loadState();
let pieChartInstance = null;
let barChartInstance = null;

// Helper: Convert Hex color to RGBA
function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) {
    return `rgba(157, 80, 255, ${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

function getActiveProfile() {
  if (!state.profiles || !Array.isArray(state.profiles) || state.profiles.length === 0) {
    state.profiles = [JSON.parse(JSON.stringify(DEFAULT_PROFILE))];
    state.activeProfileId = state.profiles[0].id;
  }
  let active = state.profiles.find(p => p.id === state.activeProfileId);
  if (!active) {
    active = state.profiles[0];
    state.activeProfileId = active.id;
  }
  return active;
}

function generateSyncKey(name = 'CAP') {
  const clean = (name || 'CAP').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'CAP';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${clean}-${rand}`;
}

function syncProfileToState(targetState, profile) {
  targetState.activeProfileId = profile.id;
  targetState.capital = profile.capital !== undefined ? profile.capital : 1500000;
  targetState.cycle = profile.cycle;
  targetState.categories = profile.categories;
  targetState.expenses = profile.expenses;
  targetState.incomes = profile.incomes;
  targetState.analysisTab = profile.analysisTab || 'expense';
  targetState.cycleOffset = profile.cycleOffset || 0;
  targetState.cloudSyncKey = profile.cloudSyncKey || generateSyncKey(profile.name);
  targetState.updatedAt = profile.updatedAt || Date.now();
}

function syncStateToActiveProfile() {
  if (!state.profiles || !Array.isArray(state.profiles)) return;
  const active = getActiveProfile();
  active.capital = state.capital;
  active.cycle = state.cycle;
  active.categories = state.categories;
  active.expenses = state.expenses;
  active.incomes = state.incomes;
  active.analysisTab = state.analysisTab;
  active.cycleOffset = state.cycleOffset;
  active.cloudSyncKey = state.cloudSyncKey || active.cloudSyncKey || generateSyncKey(active.name);
  active.updatedAt = state.updatedAt || active.updatedAt || Date.now();
}

function normalizeProfile(prof, idx = 0) {
  if (!prof.id) prof.id = 'prof-' + (idx + 1) + '-' + Date.now().toString(36);
  if (!prof.name) prof.name = idx === 0 ? 'Haryo Seno' : `Pengguna ${idx + 1}`;
  if (!prof.role) prof.role = idx === 0 ? 'Anak Kuliahan' : 'Personal';
  if (!prof.avatar) {
    prof.avatar = prof.name.substring(0, 2).toUpperCase() || '👤';
  }
  if (!prof.color) prof.color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
  if (prof.passwordHash === undefined) prof.passwordHash = null;
  if (!prof.cloudSyncKey) {
    prof.cloudSyncKey = (idx === 0 && (!prof.name || prof.name === 'Haryo Seno')) ? 'SENO-7721' : generateSyncKey(prof.name);
  }
  if (!prof.updatedAt) prof.updatedAt = Date.now();
  if (prof.capital === undefined || isNaN(Number(prof.capital))) prof.capital = 1500000;
  if (!prof.expenses || !Array.isArray(prof.expenses)) prof.expenses = [];
  if (!prof.incomes || !Array.isArray(prof.incomes)) prof.incomes = [];
  if (!prof.analysisTab) prof.analysisTab = 'expense';
  if (prof.cycleOffset === undefined) prof.cycleOffset = 0;

  if (!prof.cycle || typeof prof.cycle !== 'object') {
    prof.cycle = {
      type: 'monthly',
      monthlyStartDay: 1,
      weeklyInterval: 1,
      weeklyStartDate: todayIso,
      customIntervalDays: 1,
      customStartDate: todayIso
    };
  }
  if (!prof.cycle.monthlyStartDay) prof.cycle.monthlyStartDay = prof.cycle.startDay || 1;
  if (!prof.cycle.weeklyInterval) prof.cycle.weeklyInterval = 1;
  if (!prof.cycle.weeklyStartDate) prof.cycle.weeklyStartDate = todayIso;
  if (!prof.cycle.customIntervalDays) prof.cycle.customIntervalDays = 1;
  if (!prof.cycle.customStartDate) prof.cycle.customStartDate = todayIso;
  if (prof.cycle.type === 'daily') prof.cycle.type = 'custom_days';

  const cap = Number(prof.capital) || 1500000;
  if (Array.isArray(prof.categories) && prof.categories.length > 0) {
    prof.categories.forEach((cat, cIdx) => {
      if (!cat.emoji) cat.emoji = getCategoryEmojiFallback(cat);
      if (!cat.color) cat.color = COLOR_PALETTE[cIdx % COLOR_PALETTE.length];
      if (cat.targetAmount === undefined || cat.targetAmount === null || isNaN(cat.targetAmount)) {
        cat.targetAmount = Math.round(cap * ((cat.percent || 20) / 100));
      }
    });
  } else {
    prof.categories = JSON.parse(JSON.stringify(DEFAULT_PROFILE.categories));
  }
}

function loadStateFromObject(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_STATE));
    syncProfileToState(fresh, fresh.profiles[0]);
    return fresh;
  }

  // Backward compatibility: If no `profiles` array exists, wrap legacy single-user state into profile 0
  if (!parsed.profiles || !Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
    const migratedProfile = {
      id: 'prof-default',
      name: 'Haryo Seno',
      role: 'Anak Kuliahan',
      avatar: 'HR',
      color: '#9d50ff',
      passwordHash: parsed.passwordHash || null,
      capital: parsed.capital !== undefined ? parsed.capital : 1500000,
      cycle: parsed.cycle || {
        type: 'monthly',
        monthlyStartDay: 1,
        weeklyInterval: 1,
        weeklyStartDate: todayIso,
        customIntervalDays: 1,
        customStartDate: todayIso
      },
      categories: parsed.categories || JSON.parse(JSON.stringify(DEFAULT_PROFILE.categories)),
      expenses: parsed.expenses || JSON.parse(JSON.stringify(DEFAULT_PROFILE.expenses)),
      incomes: parsed.incomes || JSON.parse(JSON.stringify(DEFAULT_PROFILE.incomes)),
      analysisTab: parsed.analysisTab || 'expense',
      cycleOffset: parsed.cycleOffset || 0
    };
    parsed.activeProfileId = 'prof-default';
    parsed.profiles = [migratedProfile];
  }

  // Normalize all profiles
  parsed.profiles.forEach((prof, idx) => normalizeProfile(prof, idx));

  // Ensure activeProfileId is valid
  if (!parsed.activeProfileId || !parsed.profiles.some(p => p.id === parsed.activeProfileId)) {
    parsed.activeProfileId = parsed.profiles[0].id;
  }

  // Mirror active profile properties to top-level state
  const active = parsed.profiles.find(p => p.id === parsed.activeProfileId) || parsed.profiles[0];
  syncProfileToState(parsed, active);

  return parsed;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return loadStateFromObject(parsed);
    }
  } catch (e) {
    console.error('Failed to load local storage state:', e);
  }
  const fresh = JSON.parse(JSON.stringify(DEFAULT_STATE));
  syncProfileToState(fresh, fresh.profiles[0]);
  return fresh;
}

function saveState() {
  try {
    syncStateToActiveProfile();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    syncActiveProfileToCloud();
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

  // Multi-Profile elements & cards
  renderProfileElements();

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
  syncStateToActiveProfile();
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
      if ((imported.profiles && Array.isArray(imported.profiles)) || (imported.categories && imported.capital !== undefined)) {
        state = loadStateFromObject(imported);
        saveState();
        updateUI();
        showToast('Data & profil berhasil diimpor!');
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
  if (confirm('Yakin ingin mereset semua data ke pengaturan awal? Semua profil, pos alokasi, dan catatan akan terhapus.')) {
    localStorage.removeItem(STORAGE_KEY);
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    syncProfileToState(state, state.profiles[0]);
    saveState();
    updateUI();
    showToast('Data berhasil direset ke pengaturan awal.');
  }
}

// ==========================================
// FIREBASE REALTIME CLOUD SYNC CONFIGURATION
// ==========================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDLwh-n0Pa5_kMStx9VD1R05nb6bg2jzTA",
  authDomain: "capita-app-3e07d.firebaseapp.com",
  databaseURL: "https://capita-app-3e07d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "capita-app-3e07d",
  storageBucket: "capita-app-3e07d.firebasestorage.app",
  messagingSenderId: "825311846086",
  appId: "1:825311846086:web:7c7ef7f1f1921accf181c7",
  measurementId: "G-6Y3M7M9N03"
};

let firebaseDb = null;
let isFirebaseReady = false;
let activeCloudListenerRef = null;
let isRemoteSyncInProgress = false;
let cloudPushDebounceTimer = null;

function initFirebase() {
  if (typeof window === 'undefined') return;
  try {
    if (window.firebase && firebase.initializeApp) {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      firebaseDb = firebase.database();
      isFirebaseReady = true;
      console.log('Firebase Realtime Database successfully initialized!');
      updateCloudStatusUI('connected');
    } else {
      console.warn('Firebase SDK not loaded yet.');
      updateCloudStatusUI('offline');
    }
  } catch (err) {
    console.warn('Firebase init warning:', err);
    updateCloudStatusUI('offline');
  }
}

function updateCloudStatusUI(status = 'connected') {
  const badge = document.getElementById('cloudSyncStatusBadge');
  const desktopText = document.getElementById('desktopCloudStatusText');
  const desktopDot = document.getElementById('desktopCloudDot');

  if (status === 'connected') {
    if (badge) badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Realtime Database Terhubung';
    if (desktopText) desktopText.innerText = 'Cloud Terhubung';
    if (desktopDot) {
      desktopDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse';
    }
  } else if (status === 'syncing') {
    if (badge) badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span> Menyinkronkan...';
    if (desktopText) desktopText.innerText = 'Syncing...';
    if (desktopDot) {
      desktopDot.className = 'w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping';
    }
  } else if (status === 'synced') {
    if (badge) badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Tersinkron Otomatis';
    if (desktopText) desktopText.innerText = 'Cloud Sync';
    if (desktopDot) {
      desktopDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400';
    }
  } else {
    if (badge) badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Mode Offline (Lokal)';
    if (desktopText) desktopText.innerText = 'Offline';
    if (desktopDot) {
      desktopDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400';
    }
  }
}

function syncActiveProfileToCloud(isImmediate = false) {
  if (!isFirebaseReady || !firebaseDb) return;
  if (isRemoteSyncInProgress) return;

  const active = getActiveProfile();
  if (!active) return;
  if (!active.cloudSyncKey) {
    active.cloudSyncKey = generateSyncKey(active.name);
  }

  active.updatedAt = Date.now();

  const doPush = () => {
    try {
      updateCloudStatusUI('syncing');
      const payload = {
        syncKey: active.cloudSyncKey,
        updatedAt: active.updatedAt,
        profile: {
          id: active.id,
          name: active.name,
          role: active.role,
          avatar: active.avatar,
          color: active.color,
          capital: active.capital,
          passwordHash: active.passwordHash,
          cloudSyncKey: active.cloudSyncKey,
          cycle: active.cycle,
          categories: active.categories,
          expenses: active.expenses,
          incomes: active.incomes,
          analysisTab: active.analysisTab,
          cycleOffset: active.cycleOffset,
          updatedAt: active.updatedAt
        }
      };

      firebaseDb.ref('capita_sync/' + active.cloudSyncKey).set(payload, (err) => {
        if (!err) {
          updateCloudStatusUI('synced');
        } else {
          console.warn('Firebase set error:', err);
          updateCloudStatusUI('offline');
        }
      });
    } catch (e) {
      console.warn('Sync to cloud error:', e);
      updateCloudStatusUI('offline');
    }
  };

  if (isImmediate) {
    clearTimeout(cloudPushDebounceTimer);
    doPush();
  } else {
    clearTimeout(cloudPushDebounceTimer);
    cloudPushDebounceTimer = setTimeout(doPush, 600);
  }
}

function attachCloudListenerForActiveProfile() {
  if (!isFirebaseReady || !firebaseDb) return;
  const active = getActiveProfile();
  if (!active || !active.cloudSyncKey) return;

  if (activeCloudListenerRef) {
    try { activeCloudListenerRef.off(); } catch (e) {}
    activeCloudListenerRef = null;
  }

  const syncKey = active.cloudSyncKey;
  activeCloudListenerRef = firebaseDb.ref('capita_sync/' + syncKey);

  activeCloudListenerRef.on('value', (snapshot) => {
    const val = snapshot.val();
    if (!val || !val.profile) return;

    const cloudUpdatedAt = val.updatedAt || 0;
    const localUpdatedAt = active.updatedAt || 0;

    // Jika data dari cloud lebih baru setidaknya 600ms dari data lokal
    if (cloudUpdatedAt > localUpdatedAt + 600) {
      isRemoteSyncInProgress = true;
      try {
        const cloudProf = val.profile;
        active.name = cloudProf.name || active.name;
        active.role = cloudProf.role || active.role;
        active.avatar = cloudProf.avatar || active.avatar;
        active.color = cloudProf.color || active.color;
        active.capital = cloudProf.capital !== undefined ? cloudProf.capital : active.capital;
        active.passwordHash = cloudProf.passwordHash !== undefined ? cloudProf.passwordHash : active.passwordHash;
        active.cycle = cloudProf.cycle || active.cycle;
        active.categories = cloudProf.categories || active.categories;
        active.expenses = cloudProf.expenses || active.expenses;
        active.incomes = cloudProf.incomes || active.incomes;
        active.updatedAt = cloudUpdatedAt;

        syncProfileToState(state, active);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {}

        updateUI();
        showToast('☁️ Data tersinkron dari perangkat lain!');
      } finally {
        setTimeout(() => { isRemoteSyncInProgress = false; }, 800);
      }
    }
  }, (err) => {
    console.warn('Firebase Realtime listener error:', err);
  });
}

function openCloudSyncModal(initialTab = 'share') {
  const modal = document.getElementById('modalCloudSync');
  if (!modal) return;

  const active = getActiveProfile();
  if (!active.cloudSyncKey) {
    active.cloudSyncKey = generateSyncKey(active.name);
    saveState();
  }

  const nameEl = document.getElementById('cloudShareProfName');
  const codeEl = document.getElementById('cloudSyncCodeDisplay');
  if (nameEl) nameEl.innerText = active.name;
  if (codeEl) codeEl.innerText = active.cloudSyncKey;

  switchCloudSyncTab(initialTab);
  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeCloudSyncModal() {
  document.getElementById('modalCloudSync')?.classList.add('hidden');
}

function switchCloudSyncTab(tab) {
  const tabShare = document.getElementById('cloudTabShare');
  const tabConnect = document.getElementById('cloudTabConnect');
  const contentShare = document.getElementById('cloudContentShare');
  const contentConnect = document.getElementById('cloudContentConnect');

  if (tab === 'share') {
    if (tabShare) {
      tabShare.className = 'flex-1 py-1.5 rounded-lg font-semibold transition text-center bg-purple-600 text-white shadow-sm';
    }
    if (tabConnect) {
      tabConnect.className = 'flex-1 py-1.5 rounded-lg font-semibold transition text-center text-[#9f96b5] hover:text-white';
    }
    contentShare?.classList.remove('hidden');
    contentConnect?.classList.add('hidden');
  } else {
    if (tabShare) {
      tabShare.className = 'flex-1 py-1.5 rounded-lg font-semibold transition text-center text-[#9f96b5] hover:text-white';
    }
    if (tabConnect) {
      tabConnect.className = 'flex-1 py-1.5 rounded-lg font-semibold transition text-center bg-purple-600 text-white shadow-sm';
    }
    contentShare?.classList.add('hidden');
    contentConnect?.classList.remove('hidden');
    setTimeout(() => document.getElementById('cloudInputSyncCode')?.focus(), 150);
  }
}

function copyCloudSyncCode() {
  const active = getActiveProfile();
  const code = active.cloudSyncKey || 'SENO-7721';
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      showToast(`Kode "${code}" berhasil disalin! 📋`);
    }).catch(() => {
      prompt('Salin Kode Sinkronisasi:', code);
    });
  } else {
    prompt('Salin Kode Sinkronisasi:', code);
  }
}

function manualTriggerCloudSync() {
  syncActiveProfileToCloud(true);
  showToast('☁️ Sinkronisasi ke Cloud berhasil dijalankan!');
}

async function submitConnectCloudProfile() {
  if (!isFirebaseReady || !firebaseDb) {
    alert('Koneksi ke Firebase Database sedang tidak tersedia. Periksa koneksi internet Anda.');
    return;
  }

  const inputSyncCode = document.getElementById('cloudInputSyncCode')?.value?.trim().toUpperCase();
  const inputPin = document.getElementById('cloudInputPin')?.value?.trim() || '';
  const errEl = document.getElementById('cloudConnectError');
  const errText = document.getElementById('cloudConnectErrorText');
  const btn = document.getElementById('cloudConnectBtn');

  if (!inputSyncCode) {
    if (errEl && errText) {
      errText.innerText = 'Harap masukkan Kode Sinkronisasi!';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Menghubungkan ke Cloud...';
    if (window.lucide) lucide.createIcons();
  }

  try {
    const snapshot = await firebaseDb.ref('capita_sync/' + inputSyncCode).once('value');
    const data = snapshot.val();

    if (!data || !data.profile) {
      if (errEl && errText) {
        errText.innerText = `Kode "${inputSyncCode}" tidak ditemukan di database cloud! Pastikan kode sudah benar.`;
        errEl.classList.remove('hidden');
      }
      return;
    }

    const cloudProf = data.profile;

    // Verifikasi PIN jika profil cloud dilindungi password
    if (cloudProf.passwordHash) {
      const pinHash = await hashPassword(inputPin);
      if (pinHash !== cloudProf.passwordHash) {
        if (errEl && errText) {
          errText.innerText = 'PIN/Password profil salah! Harap masukkan PIN yang benar.';
          errEl.classList.remove('hidden');
        }
        return;
      }
    }

    // Sukses! Masukkan atau perbarui profil ke daftar profil lokal
    let localProf = state.profiles.find(p => p.cloudSyncKey === inputSyncCode || p.id === cloudProf.id);
    if (!localProf) {
      localProf = { ...cloudProf };
      state.profiles.push(localProf);
    } else {
      Object.assign(localProf, cloudProf);
    }

    unlockProfileSession(localProf.id);
    doSwitchProfile(localProf.id);
    closeCloudSyncModal();
    closeProfileSwitchModal();

    showToast(`Profil "${localProf.name}" berhasil terhubung dari Cloud! ☁️🎉`);
    alert(`Berhasil! Profil "${localProf.name}" kini tersinkronisasi otomatis antar perangkat.`);
  } catch (err) {
    if (errEl && errText) {
      errText.innerText = 'Gagal mengambil data dari cloud: ' + err.message;
      errEl.classList.remove('hidden');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="cloud-download" class="w-4 h-4"></i> Hubungkan & Tarik Data Cloud';
      if (window.lucide) lucide.createIcons();
    }
  }
}

// ==========================================
// MULTI-PROFILE, SECURITY & PASSWORD MANAGEMENT
// ==========================================

// Hash password using SHA-256 (Web Crypto) with fast pure-JS FNV-1a fallback
async function hashPassword(str) {
  if (!str) return '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode('allocata_secure_salt_' + str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Crypto subtle fallback:', e);
    }
  }
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return 'h_' + (h >>> 0).toString(16);
}

function isProfileLocked(prof) {
  if (!prof || !prof.passwordHash) return false;
  try {
    return sessionStorage.getItem('unlocked_' + prof.id) !== 'true';
  } catch (e) {
    return true;
  }
}

function unlockProfileSession(profileId) {
  try {
    sessionStorage.setItem('unlocked_' + profileId, 'true');
  } catch (e) {}
}

function lockProfileSession(profileId) {
  try {
    sessionStorage.removeItem('unlocked_' + profileId);
  } catch (e) {}
}

function checkLockScreenState() {
  const active = getActiveProfile();
  const overlay = document.getElementById('lockScreenOverlay');
  if (!overlay) return;

  if (isProfileLocked(active)) {
    overlay.classList.remove('hidden');
    const avatarEl = document.getElementById('lockScreenAvatar');
    const nameEl = document.getElementById('lockScreenName');
    const inputEl = document.getElementById('lockScreenPasswordInput');
    const errEl = document.getElementById('lockScreenError');

    if (avatarEl) {
      avatarEl.innerText = active.avatar || '👤';
      const color = active.color || '#9d50ff';
      avatarEl.style.backgroundColor = hexToRgba(color, 0.2);
      avatarEl.style.borderColor = hexToRgba(color, 0.5);
      avatarEl.style.color = color;
    }
    if (nameEl) nameEl.innerText = active.name;
    if (errEl) errEl.classList.add('hidden');
    if (inputEl) {
      inputEl.value = '';
      setTimeout(() => inputEl.focus(), 150);
    }
  } else {
    overlay.classList.add('hidden');
  }
}

async function submitLockScreenUnlock() {
  const active = getActiveProfile();
  const inputEl = document.getElementById('lockScreenPasswordInput');
  const errEl = document.getElementById('lockScreenError');
  const pass = inputEl?.value || '';

  const inputHash = await hashPassword(pass);
  if (inputHash === active.passwordHash) {
    unlockProfileSession(active.id);
    if (errEl) errEl.classList.add('hidden');
    document.getElementById('lockScreenOverlay')?.classList.add('hidden');
    updateUI();
    showToast(`Profil "${active.name}" berhasil dibuka`);
  } else {
    if (errEl) {
      errEl.classList.remove('hidden');
      errEl.innerText = 'Password salah, silakan coba lagi!';
    }
    if (inputEl) {
      inputEl.classList.add('ring-2', 'ring-rose-500');
      setTimeout(() => inputEl.classList.remove('ring-2', 'ring-rose-500'), 1000);
      inputEl.value = '';
      inputEl.focus();
    }
  }
}

function lockCurrentProfile() {
  const active = getActiveProfile();
  if (!active.passwordHash) {
    openQuickSetPinModal(active.id);
    return;
  }
  lockProfileSession(active.id);
  checkLockScreenState();
  showToast(`Profil "${active.name}" berhasil dikunci 🔒`);
}

function openProfileSwitchModalFromLock() {
  openProfileSwitchModal();
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  if (btn) {
    btn.innerHTML = isPass ? '<i data-lucide="eye-off" class="w-4 h-4"></i>' : '<i data-lucide="eye" class="w-4 h-4"></i>';
    if (window.lucide) lucide.createIcons();
  }
}

// Verification Modal for Switching / Editing / Deleting locked profiles
let pendingAuthAction = null; // { type: 'switch'|'edit'|'delete', profileId: '...' }

function openPasswordPromptModal(action) {
  pendingAuthAction = action;
  const targetProf = state.profiles.find(p => p.id === action.profileId);
  if (!targetProf) return;

  const modal = document.getElementById('modalPasswordPrompt');
  const avatarEl = document.getElementById('promptTargetAvatar');
  const nameEl = document.getElementById('promptTargetName');
  const actionEl = document.getElementById('promptTargetAction');
  const inputEl = document.getElementById('promptPasswordInput');
  const errEl = document.getElementById('promptPasswordError');

  if (avatarEl) {
    avatarEl.innerText = targetProf.avatar || '👤';
    const color = targetProf.color || '#9d50ff';
    avatarEl.style.backgroundColor = hexToRgba(color, 0.2);
    avatarEl.style.borderColor = hexToRgba(color, 0.5);
    avatarEl.style.color = color;
  }
  if (nameEl) nameEl.innerText = targetProf.name;
  if (actionEl) {
    if (action.type === 'switch') actionEl.innerText = 'Masukkan password untuk beralih ke profil ini';
    else if (action.type === 'edit') actionEl.innerText = 'Masukkan password untuk mengedit profil ini';
    else if (action.type === 'delete') actionEl.innerText = 'Masukkan password untuk menghapus profil ini';
  }
  if (errEl) errEl.classList.add('hidden');
  if (inputEl) {
    inputEl.value = '';
    setTimeout(() => inputEl.focus(), 150);
  }

  modal?.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closePasswordPromptModal() {
  pendingAuthAction = null;
  document.getElementById('modalPasswordPrompt')?.classList.add('hidden');
}

async function submitPasswordPrompt() {
  if (!pendingAuthAction) return;
  const targetProf = state.profiles.find(p => p.id === pendingAuthAction.profileId);
  if (!targetProf) {
    closePasswordPromptModal();
    return;
  }

  const inputEl = document.getElementById('promptPasswordInput');
  const errEl = document.getElementById('promptPasswordError');
  const pass = inputEl?.value || '';

  const inputHash = await hashPassword(pass);
  if (inputHash === targetProf.passwordHash) {
    // Kunci sesi profil sebelumnya agar tidak bisa disusupi
    if (state.activeProfileId && state.activeProfileId !== targetProf.id) {
      lockProfileSession(state.activeProfileId);
    }
    unlockProfileSession(targetProf.id);
    const action = { ...pendingAuthAction };
    closePasswordPromptModal();

    if (action.type === 'switch') {
      doSwitchProfile(action.profileId);
    } else if (action.type === 'edit') {
      openProfileEditModal(action.profileId, true);
    } else if (action.type === 'delete') {
      doDeleteProfile(action.profileId);
    }
  } else {
    if (errEl) {
      errEl.classList.remove('hidden');
      errEl.innerText = 'Password salah, silakan coba lagi!';
    }
    if (inputEl) {
      inputEl.classList.add('ring-2', 'ring-rose-500');
      setTimeout(() => inputEl.classList.remove('ring-2', 'ring-rose-500'), 1000);
      inputEl.value = '';
      inputEl.focus();
    }
  }
}

// ==========================================
// UNPROTECTED PROFILE WARNING MODAL
// ==========================================
let pendingUnprotectedProfileId = null;

function openUnprotectedProfileModal(profileId) {
  const targetProf = state.profiles.find(p => p.id === profileId);
  if (!targetProf) return;

  pendingUnprotectedProfileId = profileId;
  const modal = document.getElementById('modalUnprotectedProfile');
  const avatarEl = document.getElementById('unprotectedAvatar');
  const nameEl = document.getElementById('unprotectedName');

  if (avatarEl) {
    avatarEl.innerText = targetProf.avatar || '👤';
    const color = targetProf.color || '#9d50ff';
    avatarEl.style.backgroundColor = hexToRgba(color, 0.2);
    avatarEl.style.borderColor = hexToRgba(color, 0.5);
    avatarEl.style.color = color;
  }
  if (nameEl) nameEl.innerText = targetProf.name;

  modal?.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeUnprotectedProfileModal() {
  pendingUnprotectedProfileId = null;
  document.getElementById('modalUnprotectedProfile')?.classList.add('hidden');
}

function onProceedToSetPinForUnprotected() {
  const profId = pendingUnprotectedProfileId;
  closeUnprotectedProfileModal();
  if (profId) {
    openQuickSetPinModal(profId);
  }
}

function onProceedSwitchWithoutPin() {
  const profId = pendingUnprotectedProfileId;
  closeUnprotectedProfileModal();
  if (profId) {
    doSwitchProfile(profId);
  }
}

// ==========================================
// QUICK SET PIN MODAL
// ==========================================
let pendingQuickPinProfileId = null;

function openQuickSetPinModal(profileId) {
  const targetProf = state.profiles.find(p => p.id === profileId);
  if (!targetProf) return;

  pendingQuickPinProfileId = profileId;
  const modal = document.getElementById('modalQuickSetPin');
  const avatarEl = document.getElementById('quickPinAvatar');
  const nameEl = document.getElementById('quickPinTargetName');
  const inputEl = document.getElementById('quickPinInput');
  const confirmEl = document.getElementById('quickPinConfirmInput');
  const errEl = document.getElementById('quickPinError');

  if (avatarEl) {
    avatarEl.innerText = targetProf.avatar || '👤';
    const color = targetProf.color || '#9d50ff';
    avatarEl.style.backgroundColor = hexToRgba(color, 0.2);
    avatarEl.style.borderColor = hexToRgba(color, 0.5);
    avatarEl.style.color = color;
  }
  if (nameEl) nameEl.innerText = targetProf.name;
  if (inputEl) inputEl.value = '';
  if (confirmEl) confirmEl.value = '';
  if (errEl) errEl.classList.add('hidden');

  modal?.classList.remove('hidden');
  setTimeout(() => inputEl?.focus(), 150);
  if (window.lucide) lucide.createIcons();
}

function closeQuickSetPinModal() {
  pendingQuickPinProfileId = null;
  document.getElementById('modalQuickSetPin')?.classList.add('hidden');
}

async function submitQuickSetPin() {
  if (!pendingQuickPinProfileId) return;
  const targetProf = state.profiles.find(p => p.id === pendingQuickPinProfileId);
  if (!targetProf) {
    closeQuickSetPinModal();
    return;
  }

  const inputEl = document.getElementById('quickPinInput');
  const confirmEl = document.getElementById('quickPinConfirmInput');
  const errEl = document.getElementById('quickPinError');
  const errText = document.getElementById('quickPinErrorText');

  const pin = inputEl?.value?.trim() || '';
  const confirm = confirmEl?.value?.trim() || '';

  if (!pin) {
    if (errEl && errText) {
      errText.innerText = 'PIN/Password tidak boleh kosong!';
      errEl.classList.remove('hidden');
    }
    inputEl?.focus();
    return;
  }

  if (pin !== confirm) {
    if (errEl && errText) {
      errText.innerText = 'Konfirmasi PIN tidak cocok!';
      errEl.classList.remove('hidden');
    }
    confirmEl?.focus();
    return;
  }

  const hash = await hashPassword(pin);
  targetProf.passwordHash = hash;
  unlockProfileSession(targetProf.id);

  if (state.activeProfileId === targetProf.id) {
    syncStateToActiveProfile();
  }

  saveState();
  closeQuickSetPinModal();
  closeProfileSwitchModal();

  if (state.activeProfileId !== targetProf.id) {
    doSwitchProfile(targetProf.id);
  } else {
    updateUI();
    checkLockScreenState();
  }

  showToast(`Profil "${targetProf.name}" berhasil diamankan dengan PIN! 🔒`);
}

function switchProfile(profileId) {
  const target = state.profiles.find(p => p.id === profileId);
  if (!target) return;

  // Jika memilih profil yang sedang aktif
  if (target.id === state.activeProfileId) {
    if (isProfileLocked(target)) {
      closeProfileSwitchModal();
      checkLockScreenState();
    } else {
      closeProfileSwitchModal();
    }
    return;
  }

  // Jika profil target dilindungi password: WAJIB verifikasi password setiap kali beralih!
  if (target.passwordHash) {
    openPasswordPromptModal({ type: 'switch', profileId });
    return;
  }

  // Jika profil target belum dilindungi password: beri peringatan & opsi pasang PIN
  openUnprotectedProfileModal(profileId);
}

function doSwitchProfile(profileId) {
  // Selalu kunci sesi profil sebelumnya saat meninggalkan akun
  if (state.activeProfileId && state.activeProfileId !== profileId) {
    lockProfileSession(state.activeProfileId);
  }

  syncStateToActiveProfile();
  const target = state.profiles.find(p => p.id === profileId);
  if (!target) return;

  syncProfileToState(state, target);
  saveState();
  closeProfileSwitchModal();
  closeUnprotectedProfileModal();
  attachCloudListenerForActiveProfile();
  syncActiveProfileToCloud(true);
  updateUI();
  checkLockScreenState();
  showToast(`Beralih ke profil "${target.name}"`);
}

function createProfile(name, role, avatar, color, initialCapital, templateKey, passwordHash = null) {
  syncStateToActiveProfile();
  const newId = 'prof-' + Date.now();
  const cap = Number(initialCapital) || 1500000;
  let newCategories = [];

  if (templateKey === 'standard') {
    newCategories = [
      { id: 'cat-needs-' + Date.now(), name: 'Kosan', targetAmount: Math.round(cap * 0.35), color: '#f87171', emoji: '🏠' },
      { id: 'cat-daily-' + Date.now(), name: 'Makan & Harian', targetAmount: Math.round(cap * 0.30), color: '#fbbf24', emoji: '🍜' },
      { id: 'cat-study-' + Date.now(), name: 'Kebutuhan Kuliah', targetAmount: Math.round(cap * 0.15), color: '#38bdf8', emoji: '📚' },
      { id: 'cat-wants-' + Date.now(), name: 'Nongkrong & Hiburan', targetAmount: Math.round(cap * 0.10), color: '#a78bfa', emoji: '☕' },
      { id: 'cat-save-' + Date.now(), name: 'Tabungan & Darurat', targetAmount: Math.round(cap * 0.10), color: '#34d399', emoji: '💰' }
    ];
  } else if (templateKey === 'simple') {
    newCategories = [
      { id: 'cat-main-' + Date.now(), name: 'Operasional Utama', targetAmount: cap, color: '#38bdf8', emoji: '💼' }
    ];
  } else {
    newCategories = [
      { id: 'cat-gen-' + Date.now(), name: 'Pengeluaran Umum', targetAmount: cap, color: '#a78bfa', emoji: '📁' }
    ];
  }

  const cleanName = name.trim() || 'Pengguna Baru';
  const newProf = {
    id: newId,
    name: cleanName,
    role: role.trim() || 'Personal',
    avatar: avatar.trim() || (cleanName.substring(0, 2).toUpperCase() || '👤'),
    color: color || '#818cf8',
    capital: cap,
    passwordHash: passwordHash || null,
    cloudSyncKey: generateSyncKey(cleanName),
    updatedAt: Date.now(),
    cycle: {
      type: 'monthly',
      monthlyStartDay: 1,
      weeklyInterval: 1,
      weeklyStartDate: todayIso,
      customIntervalDays: 1,
      customStartDate: todayIso
    },
    categories: newCategories,
    expenses: [],
    incomes: [],
    analysisTab: 'expense',
    cycleOffset: 0
  };

  state.profiles.push(newProf);
  unlockProfileSession(newId);
  doSwitchProfile(newId);
  showToast(`Profil baru "${newProf.name}" berhasil dibuat!`);
}

function updateProfile(profileId, name, role, avatar, color, passwordHash) {
  const prof = state.profiles.find(p => p.id === profileId);
  if (!prof) return;

  prof.name = name.trim() || prof.name;
  prof.role = role.trim() || prof.role;
  prof.avatar = avatar.trim() || prof.avatar;
  prof.color = color || prof.color;
  prof.passwordHash = passwordHash !== undefined ? passwordHash : prof.passwordHash;

  if (state.activeProfileId === profileId) {
    syncStateToActiveProfile();
  }
  saveState();
  updateUI();
  checkLockScreenState();
  showToast(`Profil "${prof.name}" berhasil diperbarui`);
}

function deleteProfile(profileId) {
  if (state.profiles.length <= 1) {
    alert('Tidak bisa menghapus profil karena minimal harus ada 1 profil aktif.');
    return;
  }
  const prof = state.profiles.find(p => p.id === profileId);
  if (!prof) return;

  if (prof.passwordHash) {
    closeProfileSwitchModal();
    openPasswordPromptModal({ type: 'delete', profileId });
    return;
  }

  doDeleteProfile(profileId);
}

function doDeleteProfile(profileId) {
  const prof = state.profiles.find(p => p.id === profileId);
  if (!prof) return;

  if (!confirm(`Hapus profil "${prof.name}"? Semua pos alokasi dan catatan transaksi di profil ini akan dihapus permanen.`)) {
    return;
  }

  state.profiles = state.profiles.filter(p => p.id !== profileId);
  lockProfileSession(profileId);

  if (state.activeProfileId === profileId) {
    const fallback = state.profiles[0];
    syncProfileToState(state, fallback);
  } else {
    syncStateToActiveProfile();
  }

  saveState();
  closeProfileSwitchModal();
  updateUI();
  checkLockScreenState();
  showToast(`Profil "${prof.name}" telah dihapus`);
}

function openProfileSwitchModal() {
  renderProfileSwitchModal();
  document.getElementById('modalProfileSwitch')?.classList.remove('hidden');
}

function closeProfileSwitchModal() {
  document.getElementById('modalProfileSwitch')?.classList.add('hidden');
}

function renderProfileSwitchModal() {
  const container = document.getElementById('modalProfileSwitchList');
  if (!container) return;

  container.innerHTML = state.profiles.map(prof => {
    const isActive = prof.id === state.activeProfileId;
    const catCount = (prof.categories || []).length;
    const txCount = (prof.expenses || []).length + (prof.incomes || []).length;
    const color = prof.color || '#9d50ff';
    const bgRgba = hexToRgba(color, 0.18);
    const borderRgba = hexToRgba(color, 0.45);

    const passBadge = prof.passwordHash
      ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 shrink-0"><i data-lucide="lock" class="w-3 h-3 text-rose-400"></i> Dilindungi PIN</span>`
      : `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0"><i data-lucide="alert-triangle" class="w-3 h-3 text-amber-400"></i> Belum Ber-PIN</span>`;

    return `
      <div class="p-3.5 rounded-2xl border ${isActive ? 'border-purple-500 bg-[#241744] shadow-lg shadow-purple-950/40' : 'border-[#2d1f50] bg-[#150d28] hover:bg-[#1f153a]'} transition flex items-center justify-between gap-3 cursor-pointer group" onclick="switchProfile('${prof.id}')">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold shrink-0 transition group-hover:scale-105 shadow-md relative"
            style="background-color: ${bgRgba}; border: 1.5px solid ${borderRgba}; color: ${color};">
            ${escapeHtml(prof.avatar || '👤')}
            ${prof.passwordHash ? `<span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px]"><i data-lucide="lock" class="w-2.5 h-2.5"></i></span>` : ''}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="font-bold text-white text-sm truncate">${escapeHtml(prof.name)}</p>
              ${isActive ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Aktif</span>` : ''}
              ${passBadge}
            </div>
            <p class="text-xs text-[#9f96b5] truncate">${escapeHtml(prof.role || 'Personal')} &bull; <span class="text-purple-300 font-semibold">${formatIDR(prof.capital)}</span></p>
            <p class="text-[10px] text-[#6f6585] mt-0.5">${catCount} pos alokasi &bull; ${txCount} riwayat transaksi</p>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0" onclick="event.stopPropagation()">
          ${!prof.passwordHash ? `
            <button onclick="openQuickSetPinModal('${prof.id}')" title="Pasang PIN Pengaman" class="p-1.5 px-2 text-[11px] font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition flex items-center gap-1">
              <i data-lucide="key" class="w-3 h-3"></i> <span class="hidden sm:inline">Pasang PIN</span>
            </button>
          ` : ''}
          <button onclick="openProfileEditModal('${prof.id}')" title="Edit Profil" class="p-2 text-[#9f96b5] hover:text-white rounded-xl hover:bg-white/10 transition">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          ${state.profiles.length > 1 ? `
            <button onclick="deleteProfile('${prof.id}')" title="Hapus Profil" class="p-2 text-rose-400 hover:text-rose-300 rounded-xl hover:bg-rose-500/10 transition">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function openProfileEditModal(profileId, isVerified = false) {
  closeProfileSwitchModal();
  const modal = document.getElementById('modalProfileEdit');
  if (!modal) return;

  const titleEl = document.getElementById('modalProfileEditTitle');
  const editIdInput = document.getElementById('profEditId');
  const nameInput = document.getElementById('profNameInput');
  const roleInput = document.getElementById('profRoleInput');
  const avatarInput = document.getElementById('profAvatarInput');
  const colorInput = document.getElementById('profColorInput');
  const extraFields = document.getElementById('profNewExtraFields');

  // Password sections
  const statusBadge = document.getElementById('profPassStatusBadge');
  const setPassSection = document.getElementById('profSetPassSection');
  const existingPassSection = document.getElementById('profExistingPassSection');
  const currentPassInput = document.getElementById('profCurrentPassInput');
  const newPassInput = document.getElementById('profNewPassInput');
  const removePassCheck = document.getElementById('profRemovePassCheck');
  const passInput = document.getElementById('profPassInput');
  const passConfirmInput = document.getElementById('profPassConfirmInput');

  // Populate color swatches
  const colorGrid = document.getElementById('profColorSwatches');
  if (colorGrid) {
    colorGrid.innerHTML = COLOR_PALETTE.map(c => `
      <button type="button" onclick="setQuickProfColor('${c}')" class="w-6 h-6 rounded-full border border-white/20 transition hover:scale-110 shadow-sm" style="background-color: ${c};"></button>
    `).join('');
  }

  if (profileId) {
    const prof = state.profiles.find(p => p.id === profileId);
    if (!prof) return;

    if (!isVerified && prof.passwordHash) {
      openPasswordPromptModal({ type: 'edit', profileId });
      return;
    }

    if (titleEl) titleEl.innerHTML = `<i data-lucide="edit-3" class="w-4 h-4 text-purple-400"></i> Edit Profil: ${escapeHtml(prof.name)}`;
    if (editIdInput) editIdInput.value = prof.id;
    if (nameInput) nameInput.value = prof.name;
    if (roleInput) roleInput.value = prof.role || '';
    if (avatarInput) avatarInput.value = prof.avatar || '👤';
    if (colorInput) colorInput.value = prof.color || '#9d50ff';
    if (extraFields) extraFields.classList.add('hidden');

    if (prof.passwordHash) {
      if (statusBadge) {
        statusBadge.innerHTML = '<i data-lucide="lock" class="w-3 h-3 text-rose-400 inline"></i> Terkunci (Berpassword)';
        statusBadge.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1';
      }
      if (setPassSection) setPassSection.classList.add('hidden');
      if (existingPassSection) existingPassSection.classList.remove('hidden');
      if (currentPassInput) currentPassInput.value = '';
      if (newPassInput) newPassInput.value = '';
      if (removePassCheck) removePassCheck.checked = false;
    } else {
      if (statusBadge) {
        statusBadge.innerText = 'Tanpa Password';
        statusBadge.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      }
      if (setPassSection) setPassSection.classList.remove('hidden');
      if (existingPassSection) existingPassSection.classList.add('hidden');
      if (passInput) passInput.value = '';
      if (passConfirmInput) passConfirmInput.value = '';
    }

    onProfAvatarChanged(prof.avatar || '👤');
    onProfColorChanged(prof.color || '#9d50ff');
  } else {
    if (titleEl) titleEl.innerHTML = `<i data-lucide="user-plus" class="w-4 h-4 text-purple-400"></i> Tambah Profil Baru`;
    if (editIdInput) editIdInput.value = '';
    if (nameInput) nameInput.value = '';
    if (roleInput) roleInput.value = 'Anak Kuliahan';
    const initialColor = COLOR_PALETTE[state.profiles.length % COLOR_PALETTE.length];
    if (avatarInput) avatarInput.value = '👤';
    if (colorInput) colorInput.value = initialColor;
    if (extraFields) extraFields.classList.remove('hidden');
    const capInput = document.getElementById('profCapitalInput');
    if (capInput) capInput.value = '1500000';

    if (statusBadge) {
      statusBadge.innerText = 'Opsional';
      statusBadge.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30';
    }
    if (setPassSection) setPassSection.classList.remove('hidden');
    if (existingPassSection) existingPassSection.classList.add('hidden');
    if (passInput) passInput.value = '';
    if (passConfirmInput) passConfirmInput.value = '';

    onProfAvatarChanged('👤');
    onProfColorChanged(initialColor);
  }

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeProfileEditModal() {
  document.getElementById('modalProfileEdit')?.classList.add('hidden');
}

function onProfAvatarChanged(val) {
  const preview = document.getElementById('profAvatarPreview');
  if (preview) preview.innerText = val.trim() || '👤';
}

function onProfColorChanged(color) {
  const preview = document.getElementById('profAvatarPreview');
  if (preview) {
    preview.style.borderColor = color;
    preview.style.color = color;
    preview.style.backgroundColor = hexToRgba(color, 0.2);
  }
}

function setQuickProfAvatar(emote) {
  const input = document.getElementById('profAvatarInput');
  if (input) {
    input.value = emote;
    onProfAvatarChanged(emote);
  }
}

function setQuickProfColor(color) {
  const colorInput = document.getElementById('profColorInput');
  if (colorInput) {
    colorInput.value = color;
    onProfColorChanged(color);
  }
}

function onProfNameInputChanged(val) {
  const avatarInput = document.getElementById('profAvatarInput');
  const editId = document.getElementById('profEditId')?.value;
  if (!editId && avatarInput && (avatarInput.value === '👤' || avatarInput.value === '')) {
    const initials = val.trim().split(' ').filter(Boolean).map(w => w[0]).join('').substring(0, 2).toUpperCase();
    if (initials) {
      avatarInput.value = initials;
      onProfAvatarChanged(initials);
    }
  }
}

async function saveProfileModal() {
  const editId = document.getElementById('profEditId')?.value;
  const name = document.getElementById('profNameInput')?.value.trim();
  const role = document.getElementById('profRoleInput')?.value.trim();
  const avatar = document.getElementById('profAvatarInput')?.value.trim();
  const color = document.getElementById('profColorInput')?.value || '#9d50ff';

  if (!name) {
    alert('Silakan masukkan nama profil.');
    return;
  }

  if (editId) {
    const prof = state.profiles.find(p => p.id === editId);
    if (!prof) return;

    let updatedHash = prof.passwordHash;

    if (prof.passwordHash) {
      const currentPass = document.getElementById('profCurrentPassInput')?.value || '';
      const currentHash = await hashPassword(currentPass);
      if (currentHash !== prof.passwordHash) {
        alert('Password saat ini salah! Harap masukkan password yang benar untuk mengubah profil ini.');
        return;
      }

      const removeCheck = document.getElementById('profRemovePassCheck')?.checked;
      if (removeCheck) {
        updatedHash = null;
        lockProfileSession(prof.id);
      } else {
        const newPass = document.getElementById('profNewPassInput')?.value || '';
        if (newPass.trim()) {
          updatedHash = await hashPassword(newPass.trim());
          unlockProfileSession(prof.id);
        }
      }
    } else {
      const pass = document.getElementById('profPassInput')?.value || '';
      const confirmPass = document.getElementById('profPassConfirmInput')?.value || '';
      if (pass.trim()) {
        if (pass !== confirmPass) {
          alert('Konfirmasi password tidak cocok! Harap ketik ulang password.');
          return;
        }
        updatedHash = await hashPassword(pass.trim());
        unlockProfileSession(prof.id);
      }
    }

    updateProfile(editId, name, role, avatar, color, updatedHash);
    closeProfileEditModal();
  } else {
    // New profile
    const capital = Number(document.getElementById('profCapitalInput')?.value) || 1500000;
    const templateKey = document.getElementById('profTemplateSelect')?.value || 'standard';
    const pass = document.getElementById('profPassInput')?.value || '';
    const confirmPass = document.getElementById('profPassConfirmInput')?.value || '';

    let passwordHash = null;
    if (pass.trim()) {
      if (pass !== confirmPass) {
        alert('Konfirmasi password tidak cocok! Harap ketik ulang password.');
        return;
      }
      passwordHash = await hashPassword(pass.trim());
    } else {
      const proceed = confirm('Profil baru ini belum diberi PIN/Password.\n\nPengguna lain di perangkat ini dapat membukanya secara bebas tanpa password.\n\nApakah yakin ingin membuat profil tanpa password?');
      if (!proceed) {
        document.getElementById('profPassInput')?.focus();
        return;
      }
    }

    createProfile(name, role, avatar, color, capital, templateKey, passwordHash);
    closeProfileEditModal();
  }
}

function renderProfileElements() {
  const active = getActiveProfile();
  const color = active.color || '#9d50ff';
  const bgRgba = hexToRgba(color, 0.2);
  const borderRgba = hexToRgba(color, 0.45);

  // Sidebar User Card
  const sideAvatar = document.getElementById('sideUserAvatar');
  const sideName = document.getElementById('sideUserName');
  const sideRole = document.getElementById('sideUserRole');
  if (sideAvatar) {
    sideAvatar.innerText = active.avatar || '👤';
    sideAvatar.style.backgroundColor = bgRgba;
    sideAvatar.style.borderColor = borderRgba;
    sideAvatar.style.color = color;
  }
  if (sideName) sideName.innerText = active.name;
  if (sideRole) sideRole.innerText = active.role || 'Personal';

  // Mobile Top Bar
  const mobAvatar = document.getElementById('mobileUserAvatar');
  const mobBtn = document.getElementById('mobileProfileBtn');
  if (mobAvatar) {
    mobAvatar.innerText = active.avatar || '👤';
  }
  if (mobBtn) {
    mobBtn.style.backgroundColor = bgRgba;
    mobBtn.style.borderColor = borderRgba;
    mobBtn.style.color = color;
  }

  // Desktop Header Badge
  const deskAvatar = document.getElementById('desktopUserAvatar');
  const deskName = document.getElementById('desktopUserName');
  if (deskAvatar) {
    deskAvatar.innerText = active.avatar || '👤';
    deskAvatar.style.backgroundColor = bgRgba;
    deskAvatar.style.borderColor = borderRgba;
    deskAvatar.style.color = color;
  }
  if (deskName) deskName.innerText = active.name;

  // Lock buttons: selalu tampil agar user tahu status keamanan profil
  const hasPass = Boolean(active.passwordHash);
  const sideLockBtn = document.getElementById('sideLockBtn');
  const headerLockBtn = document.getElementById('headerLockBtn');
  const mobileLockBtn = document.getElementById('mobileLockBtn');
  [sideLockBtn, headerLockBtn, mobileLockBtn].forEach(btn => {
    if (btn) {
      btn.classList.remove('hidden');
      if (hasPass) {
        btn.title = 'Kunci Profil Ini Sekarang';
        btn.innerHTML = '<i data-lucide="lock" class="w-4 h-4 text-purple-300"></i>';
      } else {
        btn.title = 'Pasang PIN Pengaman Profil';
        btn.innerHTML = '<i data-lucide="shield-alert" class="w-4 h-4 text-amber-400"></i>';
      }
    }
  });

  // Render in Settings Tab
  renderProfileManager();
}

function renderProfileManager() {
  const container = document.getElementById('settingsProfilesList');
  if (!container) return;

  container.innerHTML = state.profiles.map(prof => {
    const isActive = prof.id === state.activeProfileId;
    const catCount = (prof.categories || []).length;
    const txCount = (prof.expenses || []).length + (prof.incomes || []).length;
    const color = prof.color || '#9d50ff';
    const bgRgba = hexToRgba(color, 0.15);
    const borderRgba = hexToRgba(color, 0.4);

    const passBadge = prof.passwordHash
      ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 shrink-0"><i data-lucide="lock" class="w-3 h-3 text-rose-400"></i> Dilindungi PIN</span>`
      : `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0"><i data-lucide="alert-triangle" class="w-3 h-3 text-amber-400"></i> Belum Ber-PIN</span>`;

    return `
      <div class="p-4 rounded-xl border ${isActive ? 'border-purple-500/80 bg-[#1e1438] shadow-lg shadow-purple-900/20' : 'border-[#2d1f50] bg-[#150d28] hover:bg-[#1b1232]'} transition flex flex-col justify-between gap-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold shrink-0 shadow-md relative"
              style="background-color: ${bgRgba}; border: 1.5px solid ${borderRgba}; color: ${color};">
              ${escapeHtml(prof.avatar || '👤')}
              ${prof.passwordHash ? `<span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px]"><i data-lucide="lock" class="w-2.5 h-2.5"></i></span>` : ''}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-bold text-white text-sm truncate">${escapeHtml(prof.name)}</h4>
                ${isActive ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Aktif</span>` : ''}
                ${passBadge}
              </div>
              <p class="text-xs text-[#9f96b5] truncate">${escapeHtml(prof.role || 'Personal')}</p>
            </div>
          </div>

          <div class="flex items-center gap-1">
            ${!prof.passwordHash ? `
              <button onclick="openQuickSetPinModal('${prof.id}')" title="Pasang PIN Pengaman" class="p-1.5 text-amber-400 hover:text-amber-300 rounded-lg hover:bg-amber-500/10 transition">
                <i data-lucide="key" class="w-4 h-4"></i>
              </button>
            ` : ''}
            <button onclick="openProfileEditModal('${prof.id}')" title="Edit Profil" class="p-1.5 text-[#9f96b5] hover:text-white rounded-lg hover:bg-white/5 transition">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            ${state.profiles.length > 1 ? `
              <button onclick="deleteProfile('${prof.id}')" title="Hapus Profil" class="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="pt-2 border-t border-[#2d1f50]/60 flex items-center justify-between text-xs">
          <div>
            <span class="text-[#9f96b5] text-[11px]">Total Modal: </span>
            <span class="font-bold text-purple-300">${formatIDR(prof.capital)}</span>
          </div>
          <div class="text-[11px] text-[#6f6585]">
            ${catCount} pos &bull; ${txCount} tx
          </div>
        </div>

        ${!isActive ? `
          <button onclick="switchProfile('${prof.id}')" class="w-full mt-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-500 transition flex items-center justify-center gap-1.5">
            <i data-lucide="${prof.passwordHash ? 'lock' : 'check'}" class="w-3.5 h-3.5"></i> Gunakan Profil Ini
          </button>
        ` : `
          <div class="w-full mt-1 py-1 px-3 text-[11px] font-semibold text-center text-emerald-400 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center justify-center gap-1.5">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Sedang Digunakan
          </div>
        `}
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function showToast(message) {
  let toast = document.getElementById ? document.getElementById('appToast') : null;
  if (!toast && document.createElement) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-2xl shadow-purple-600/50 border border-purple-400/40 transform transition-all duration-300 translate-y-12 opacity-0 flex items-center gap-2';
    if (document.body) {
      document.body.appendChild(toast);
    }
  }
  if (!toast) return;
  toast.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>${escapeHtml(message)}</span>`;
  if (window.lucide) lucide.createIcons();

  if (toast.classList) {
    toast.classList.remove('translate-y-12', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  }

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    if (toast.classList) {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-12', 'opacity-0');
    }
  }, 2500);
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

  // Firebase Realtime Cloud Sync
  initFirebase();
  attachCloudListenerForActiveProfile();
  syncActiveProfileToCloud(true);

  updateUI();
  checkLockScreenState();
});
