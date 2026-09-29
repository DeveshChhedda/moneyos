'use strict';
/* ================= utils ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => ymd(new Date());
const mk = s => s.slice(0, 7); // month key YYYY-MM
const curMk = () => mk(today());
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
const dim = (y, m) => new Date(y, m + 1, 0).getDate();
const addMonths = (s, n, anchor) => {
  const d = parseD(s); const day = anchor || d.getDate();
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
  t.setDate(Math.min(day, dim(t.getFullYear(), t.getMonth()))); return ymd(t);
};
const mkAdd = (k, n) => addMonths(k + '-01', n).slice(0, 7);
const mkEnd = k => { const [y, m] = k.split('-').map(Number); return `${k}-${pad(dim(y, m - 1))}`; };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mkLabel = (k, long) => { const [y, m] = k.split('-').map(Number); return long ? new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : MON[m - 1]; };
const fmtDate = (s, opt) => parseD(s).toLocaleDateString('en-IN', opt || { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDay = s => {
  const t = today(); if (s === t) return 'Today'; if (s === addDays(t, -1)) return 'Yesterday'; if (s === addDays(t, 1)) return 'Tomorrow';
  const d = parseD(s); return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) });
};
const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sum = (arr, f = x => x) => arr.reduce((s, x) => s + (+f(x) || 0), 0);
const round2 = n => Math.round(n * 100) / 100;

const CURRENCIES = { INR: ['en-IN', '₹'], USD: ['en-US', '$'], EUR: ['de-DE', '€'], GBP: ['en-GB', '£'], AED: ['en-AE', 'AED '], SGD: ['en-SG', 'S$'] };
let _nf = {};
function fmt(n, o = {}) {
  const c = S.settings.currency || 'INR'; const [loc] = CURRENCIES[c] || CURRENCIES.INR;
  const key = c + (o.dec ? 'd' : '') + (o.compact ? 'c' : '');
  if (!_nf[key]) _nf[key] = new Intl.NumberFormat(loc, { style: 'currency', currency: c, maximumFractionDigits: o.dec ? 2 : 0, minimumFractionDigits: 0, ...(o.compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}) });
  let v = n || 0; if (Object.is(v, -0)) v = 0;
  let s = _nf[key].format(o.abs ? Math.abs(v) : v);
  if (o.sign && v > 0) s = '+' + s;
  return s;
}
const fmtC = n => { // chart axis compact, Indian style
  const c = S.settings.currency || 'INR'; const a = Math.abs(n); const sym = (CURRENCIES[c] || CURRENCIES.INR)[1];
  if (c === 'INR') { if (a >= 1e7) return sym + +(n / 1e7).toFixed(1) + 'Cr'; if (a >= 1e5) return sym + +(n / 1e5).toFixed(1) + 'L'; if (a >= 1e3) return sym + +(n / 1e3).toFixed(0) + 'k'; return sym + Math.round(n); }
  return fmt(n, { compact: true });
};
const pct = (n, d = 0) => (isFinite(n) ? (n * 100).toFixed(d) : '0') + '%';
const num = v => { const n = parseFloat(String(v).replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : 0; };

/* ================= IndexedDB ================= */
const STORES = ['transactions', 'accounts', 'categories', 'budgets', 'goals', 'investments', 'loans', 'recurring', 'kv'];
const DB = {
  db: null, mem: false,
  open() {
    return new Promise(res => {
      if (!('indexedDB' in window)) { this.mem = true; return res(); }
      let req; try { req = indexedDB.open('moneyos', 1); } catch (e) { this.mem = true; return res(); }
      req.onupgradeneeded = () => { const db = req.result; STORES.forEach(s => { if (!db.objectStoreNames.contains(s)) { const os = db.createObjectStore(s, { keyPath: 'id' }); if (s === 'transactions') os.createIndex('date', 'date'); } }); };
      req.onsuccess = () => { this.db = req.result; res(); };
      req.onerror = () => { this.mem = true; res(); };
    });
  },
  tx(store, mode) { return this.db.transaction(store, mode).objectStore(store); },
  all(store) { if (this.mem) return Promise.resolve([]); return new Promise((res, rej) => { const r = this.tx(store, 'readonly').getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  put(store, obj) { if (this.mem) return Promise.resolve(); return new Promise((res, rej) => { const r = this.tx(store, 'readwrite').put(obj); r.onsuccess = () => res(); r.onerror = () => rej(r.error); }); },
  del(store, id) { if (this.mem) return Promise.resolve(); return new Promise((res, rej) => { const r = this.tx(store, 'readwrite').delete(id); r.onsuccess = () => res(); r.onerror = () => rej(r.error); }); },
  bulk(store, arr, clear) {
    if (this.mem) return Promise.resolve();
    return new Promise((res, rej) => { const t = this.db.transaction(store, 'readwrite'); const os = t.objectStore(store); if (clear) os.clear(); arr.forEach(o => os.put(o)); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
  },
};

/* ================= state ================= */
const S = { transactions: [], accounts: [], categories: [], budgets: [], goals: [], investments: [], loans: [], recurring: [], settings: {}, meta: {}, v: 0 };
const DEFAULT_SETTINGS = {
  theme: 'system', currency: 'INR', monthsInChart: 6, backupDays: 14,
  widgets: [['month', 1], ['networth', 1], ['available', 1], ['cashflow', 1], ['breakdown', 1], ['budget', 1], ['upcoming', 1], ['cards', 1], ['loans', 1], ['investments', 1], ['goals', 1], ['recent', 1]],
};
const WIDGET_NAMES = { networth: 'Net worth', month: 'This month', available: 'Available money', cashflow: 'Cash flow chart', breakdown: 'Expense breakdown', budget: 'Budgets', upcoming: 'Upcoming payments', cards: 'Credit cards', loans: 'Loans', investments: 'Investments', goals: 'Goals', recent: 'Recent transactions' };

const CAT_COLORS = ['#0B7A63', '#4B5BD6', '#C2413A', '#B26B00', '#7A5AA6', '#2E7FA8', '#9A6B4F', '#5E8C3A', '#B04F86', '#6B7080', '#3C8C88', '#8A7A2E'];
const DEFAULT_CAT_COLORS = { Housing: '#0B7A63', Food: '#D08A2E', Groceries: '#5E8C3A', Transport: '#2E7FA8', Shopping: '#7A5AA6', Utilities: '#3C8C88', Entertainment: '#B04F86', Health: '#C2413A', Travel: '#4B5BD6', EMI: '#6B4E3D', Subscriptions: '#8A7A2E', Insurance: '#56657A', Education: '#8E5B9E', 'Personal care': '#C97B63', Gifts: '#D0677A', Other: '#9BA0AC', Salary: '#0B7A63', Bonus: '#4B5BD6', Freelance: '#7A5AA6', Interest: '#3C8C88', Dividends: '#D08A2E', Refund: '#2E7FA8', 'Other income': '#9BA0AC' };
const DEFAULT_CATS = [
  ['exp', 'Housing', '🏠', 1], ['exp', 'Food', '🍽️', 1], ['exp', 'Groceries', '🛒', 1], ['exp', 'Transport', '🚕', 1], ['exp', 'Shopping', '🛍️', 0], ['exp', 'Utilities', '💡', 1],
  ['exp', 'Entertainment', '🎬', 0], ['exp', 'Health', '💊', 1], ['exp', 'Travel', '✈️', 0], ['exp', 'EMI', '🏦', 1], ['exp', 'Subscriptions', '📺', 0], ['exp', 'Insurance', '🛡️', 1],
  ['exp', 'Education', '📚', 0], ['exp', 'Personal care', '💈', 0], ['exp', 'Gifts', '🎁', 0], ['exp', 'Other', '•', 0],
  ['inc', 'Salary', '💼', 0], ['inc', 'Bonus', '🎉', 0], ['inc', 'Freelance', '🧑‍💻', 0], ['inc', 'Interest', '🏛️', 0], ['inc', 'Dividends', '📈', 0], ['inc', 'Refund', '↩️', 0], ['inc', 'Other income', '•', 0],
];
const INV_TYPES = ['Stocks', 'Mutual Funds', 'ETFs', 'Bonds', 'Gold', 'Fixed Deposits', 'PPF', 'NPS', 'Other'];
const INV_COLORS = { Stocks: '#4B5BD6', 'Mutual Funds': '#0B7A63', ETFs: '#2E7FA8', Bonds: '#7A5AA6', Gold: '#B26B00', 'Fixed Deposits': '#9A6B4F', PPF: '#5E8C3A', NPS: '#3C8C88', Other: '#6B7080' };
const ACCT_TYPES = { bank: 'Bank account', savings: 'Savings account', cash: 'Cash', wallet: 'Wallet', credit: 'Credit card', investment: 'Investment account', asset: 'Other asset', liability: 'Other liability' };
const LIQUID = ['bank', 'savings', 'cash', 'wallet'];
const PAY_METHODS = ['UPI', 'Debit card', 'Credit card', 'Cash', 'Net banking', 'Auto-debit', 'Other'];
const ACCT_COLORS = ['#1B1D22', '#0B7A63', '#4B5BD6', '#C2413A', '#B26B00', '#7A5AA6', '#2E7FA8', '#B04F86'];
const GOAL_TYPES = ['Emergency fund', 'Vacation', 'Car', 'House', 'Debt repayment', 'Investment target', 'Custom'];
const GOAL_ICONS = { 'Emergency fund': '🛟', Vacation: '🏝️', Car: '🚗', House: '🏡', 'Debt repayment': '🧾', 'Investment target': '📈', Custom: '🎯' };
const FREQS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };

function seedDefaults() {
  const now = new Date().toISOString();
  S.categories = DEFAULT_CATS.map(([kind, name, icon, essential], i) => ({ id: 'c_' + name.toLowerCase().replace(/\W+/g, '_'), kind, name, icon, essential: !!essential, color: DEFAULT_CAT_COLORS[name] || CAT_COLORS[i % CAT_COLORS.length], createdAt: now, updatedAt: now }));
  S.accounts = [{ id: 'a_cash', name: 'Cash', type: 'cash', openingBalance: 0, institution: '', last4: '', color: '#0B7A63', createdAt: now, updatedAt: now }];
}

async function loadAll() {
  await DB.open();
  const [t, a, c, b, g, i, l, r, kv] = await Promise.all(STORES.map(s => DB.all(s)));
  Object.assign(S, { transactions: t, accounts: a, categories: c, budgets: b, goals: g, investments: i, loans: l, recurring: r });
  const kvm = Object.fromEntries(kv.map(x => [x.id, x.value]));
  S.settings = { ...DEFAULT_SETTINGS, ...(kvm.settings || {}) };
  // merge any new widgets
  const have = new Set(S.settings.widgets.map(w => w[0]));
  DEFAULT_SETTINGS.widgets.forEach(w => { if (!have.has(w[0])) S.settings.widgets.push(w); });
  S.meta = kvm.meta || {};
  if (!S.categories.length) { seedDefaults(); await DB.bulk('categories', S.categories); await DB.bulk('accounts', S.accounts); }
  bump();
}
const saveSettings = () => DB.put('kv', { id: 'settings', value: S.settings });
const saveMeta = () => DB.put('kv', { id: 'meta', value: S.meta });

async function upsert(store, obj) {
  const now = new Date().toISOString();
  obj.updatedAt = now; if (!obj.createdAt) obj.createdAt = now; if (!obj.id) obj.id = uid();
  const arr = S[store]; const i = arr.findIndex(x => x.id === obj.id);
  if (i >= 0) arr[i] = obj; else arr.push(obj);
  bump(); await DB.put(store, obj); return obj;
}
async function remove(store, id) { S[store] = S[store].filter(x => x.id !== id); bump(); await DB.del(store, id); }

/* ================= derived (memoised by version) ================= */
let _memo = {};
function bump() { S.v++; _memo = {}; }
const memo = (k, f) => (k in _memo ? _memo[k] : (_memo[k] = f()));

const catById = id => memo('catmap', () => Object.fromEntries(S.categories.map(c => [c.id, c])))[id];
const acctById = id => memo('acctmap', () => Object.fromEntries(S.accounts.map(a => [a.id, a])))[id];
const catName = id => catById(id)?.name || 'Uncategorised';
const catColor = id => catById(id)?.color || '#9BA0AC';
const activeAccounts = () => S.accounts.filter(a => !a.archived);
const txSorted = () => memo('txs', () => [...S.transactions].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || '')));

// account balance effects; `upto` = inclusive date
function balances(upto) {
  return memo('bal' + (upto || ''), () => {
    const b = {}; S.accounts.forEach(a => (b[a.id] = +a.openingBalance || 0));
    for (const t of S.transactions) {
      if (upto && t.date > upto) continue; const amt = +t.amount || 0;
      if (t.type === 'income') b[t.accountId] = (b[t.accountId] || 0) + amt;
      else if (t.type === 'expense' || t.type === 'investment') b[t.accountId] = (b[t.accountId] || 0) - amt;
      else if (t.type === 'transfer') { b[t.accountId] = (b[t.accountId] || 0) - amt; if (t.toAccountId) b[t.toAccountId] = (b[t.toAccountId] || 0) + amt; }
    }
    return b;
  });
}

function monthStats(k) {
  return memo('ms' + k, () => {
    const r = { income: 0, expense: 0, investment: 0, emi: 0, essential: 0, byCat: {}, count: 0 };
    for (const t of S.transactions) {
      if (mk(t.date) !== k) continue; const a = +t.amount || 0; r.count++;
      if (t.type === 'income') r.income += a;
      else if (t.type === 'expense') { r.expense += a; r.byCat[t.categoryId] = (r.byCat[t.categoryId] || 0) + a; const c = catById(t.categoryId); if (c?.name === 'EMI') r.emi += a; if (c?.essential) r.essential += a; }
      else if (t.type === 'investment') r.investment += a;
    }
    r.savings = r.income - r.expense - r.investment; // money left over
    r.cashflow = r.income - r.expense - r.investment;
    r.savingsRate = r.income ? (r.income - r.expense) / r.income : 0; // share of income not spent (incl. invested)
    return r;
  });
}

/* ---------- loans ---------- */
function emiCalc(P, annualRate, n) { const r = annualRate / 1200; if (!r) return Math.round(P / n); return Math.round(P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)); }
function schedule(l) {
  return memo('sch' + l.id + l.updatedAt, () => {
    const P = +l.principal, n = +l.tenure, r = (+l.rate) / 1200; const emi = +l.emi || emiCalc(P, +l.rate, n);
    const rows = []; let bal = P; const first = l.firstEmiDate || addMonths(l.startDate, 1);
    for (let i = 1; i <= n && bal > 0.5; i++) {
      const int = bal * r; let pr = emi - int; if (pr > bal || i === n) pr = bal; bal -= pr;
      rows.push({ no: i, date: addMonths(first, i - 1, parseD(first).getDate()), emi: pr + int, interest: int, principal: pr, balance: Math.max(0, bal) });
    }
    return rows;
  });
}
function loanStatus(l, asOf = today()) {
  const rows = schedule(l); const paid = rows.filter(x => x.date <= asOf);
  const outstanding = paid.length ? paid[paid.length - 1].balance : +l.principal;
  const next = rows.find(x => x.date > asOf);
  return { rows, paidCount: paid.length, remaining: rows.length - paid.length, outstanding, next, emi: rows[0]?.emi || 0,
    totalInterest: sum(rows, x => x.interest), interestPaid: sum(paid, x => x.interest), principalPaid: sum(paid, x => x.principal),
    endDate: rows[rows.length - 1]?.date, remainingInterest: sum(rows.filter(x => x.date > asOf), x => x.interest) };
}

/* ---------- investments ---------- */
function invValueAt(inv, date) {
  if (inv.date > date) return 0; const t = today(); if (date >= t) return +inv.currentValue || 0;
  const span = daysBetween(inv.date, t); if (span <= 0) return +inv.currentValue || 0;
  const f = clamp(daysBetween(inv.date, date) / span, 0, 1); return (+inv.invested) + ((+inv.currentValue) - (+inv.invested)) * f;
}
function portfolio() {
  return memo('pf', () => {
    const invested = sum(S.investments, x => x.invested), current = sum(S.investments, x => x.currentValue);
    const byType = {}; S.investments.forEach(x => (byType[x.type] = (byType[x.type] || 0) + (+x.currentValue || 0)));
    return { invested, current, ret: current - invested, retPct: invested ? (current - invested) / invested : 0, byType };
  });
}

/* ---------- net worth ---------- */
function netWorth(date = today()) {
  return memo('nw' + date, () => {
    const b = date >= today() ? balances() : balances(date);
    const r = { bank: 0, cash: 0, investAcct: 0, otherAssets: 0, investments: 0, card: 0, loans: 0, otherLiab: 0 };
    for (const a of S.accounts) {
      if (a.createdAt && a.openingDate && a.openingDate > date) continue;
      const v = b[a.id] || 0;
      if (a.type === 'bank' || a.type === 'savings') r.bank += v; else if (a.type === 'cash' || a.type === 'wallet') r.cash += v;
      else if (a.type === 'investment') r.investAcct += v; else if (a.type === 'asset') r.otherAssets += v;
      else if (a.type === 'credit') r.card += Math.max(0, -v); else if (a.type === 'liability') r.otherLiab += Math.abs(v);
    }
    r.investments = sum(S.investments, x => invValueAt(x, date));
    r.loans = sum(S.loans, l => l.startDate <= date ? loanStatus(l, date).outstanding : 0);
    r.assets = r.bank + r.cash + r.investAcct + r.otherAssets + r.investments;
    r.liabilities = r.card + r.loans + r.otherLiab;
    r.net = r.assets - r.liabilities; return r;
  });
}

/* ---------- recurring ---------- */
function nextOcc(r, d) {
  const a = r.anchorDay || parseD(r.startDate).getDate();
  switch (r.frequency) {
    case 'daily': return addDays(d, 1); case 'weekly': return addDays(d, 7);
    case 'quarterly': return addMonths(d, 3, a); case 'yearly': return addMonths(d, 12, a);
    default: return addMonths(d, 1, a);
  }
}
function occurrences(r, from, to) {
  const out = []; let d = r.startDate; let guard = 0;
  while (d < from && guard++ < 5000) d = nextOcc(r, d);
  while (d <= to && guard++ < 6000) { if (r.endDate && d > r.endDate) break; out.push(d); d = nextOcc(r, d); }
  return out;
}
async function processRecurring() {
  const t = today(); const created = [];
  for (const r of S.recurring) {
    if (r.paused || !r.autoPost) continue;
    const from = r.lastPosted ? addDays(r.lastPosted, 1) : r.startDate;
    const dates = occurrences(r, from, t).slice(0, 400);
    for (const d of dates) {
      const tx = { id: uid(), type: r.type, amount: +r.amount, currency: S.settings.currency, date: d, description: r.description, categoryId: r.categoryId, accountId: r.accountId, toAccountId: r.toAccountId || null, paymentMethod: r.paymentMethod || 'Auto-debit', notes: '', tags: [], recurringId: r.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      S.transactions.push(tx); created.push(tx);
    }
    if (dates.length) { r.lastPosted = dates[dates.length - 1]; await DB.put('recurring', r); }
  }
  if (created.length) { await DB.bulk('transactions', created); bump(); }
  return created.length;
}

/* ---------- upcoming events (next N days) ---------- */
function events(from, to) {
  const ev = [];
  for (const r of S.recurring) {
    if (r.paused) continue;
    const start = r.autoPost && r.lastPosted && r.lastPosted >= from ? addDays(r.lastPosted, 1) : from;
    for (const d of occurrences(r, start, to)) ev.push({ date: d, kind: r.type === 'income' ? 'income' : r.type === 'investment' ? 'sip' : 'bill', title: r.description, amount: +r.amount, ref: r.id, src: 'recurring' });
  }
  for (const a of S.accounts) {
    if (a.type !== 'credit' || a.archived || !a.dueDay) continue;
    const out = Math.max(0, -(balances()[a.id] || 0));
    let d = cardDates(a, from).due; let g = 0;
    while (d <= to && g++ < 24) { if (d >= from) ev.push({ date: d, kind: 'card', title: a.name + ' due', amount: out, ref: a.id, src: 'card' }); d = addMonths(d, 1, +a.dueDay); }
  }
  for (const l of S.loans) {
    if (l.autoRecurringId && S.recurring.some(r => r.id === l.autoRecurringId && !r.paused)) continue;
    for (const row of loanStatus(l).rows) if (row.date >= from && row.date <= to) ev.push({ date: row.date, kind: 'emi', title: l.name + ' EMI', amount: row.emi, ref: l.id, src: 'loan' });
  }
  for (const g of S.goals) if (g.targetDate && g.targetDate >= from && g.targetDate <= to) ev.push({ date: g.targetDate, kind: 'goal', title: g.name + ' target', amount: +g.target, ref: g.id, src: 'goal' });
  return ev.sort((a, b) => a.date.localeCompare(b.date));
}
const EV_COLOR = { income: 'var(--in)', bill: 'var(--out)', sip: 'var(--inv)', card: 'var(--debt)', emi: 'var(--debt)', goal: 'var(--accent)', tx: 'var(--faint)' };

/* ---------- credit card cycle ---------- */
function cardDates(a, ref = today()) {
  const bd = +a.billingDay || 1, dd = +a.dueDay || 20; const r = parseD(ref);
  const mkDate = (y, m, d) => ymd(new Date(y, m, Math.min(d, dim(y, m))));
  let lastBill = mkDate(r.getFullYear(), r.getMonth(), bd); if (lastBill > ref) lastBill = addMonths(lastBill, -1, bd);
  const nextBill = addMonths(lastBill, 1, bd);
  let due = mkDate(parseD(lastBill).getFullYear(), parseD(lastBill).getMonth(), dd); if (due <= lastBill) due = addMonths(due, 1, dd);
  if (due < ref) due = addMonths(due, 1, dd);
  return { lastBill, nextBill, due };
}
function cardInfo(a) {
  const out = Math.max(0, -(balances()[a.id] || 0)); const limit = +a.limit || 0; const d = cardDates(a);
  const paid = sum(S.transactions.filter(t => t.type === 'transfer' && t.toAccountId === a.id && t.date > d.lastBill), t => t.amount);
  const statement = Math.max(0, -(balances(d.lastBill)[a.id] || 0));
  const minDue = a.minDue ? +a.minDue : Math.round(Math.max(0, statement - paid) * 0.05);
  return { out, limit, avail: Math.max(0, limit - out), util: limit ? out / limit : 0, paid, statement, minDue, ...d };
}

/* ---------- suggestions: remember usage ---------- */
function frequentCats(kind, n = 8) {
  const counts = {}; const since = addDays(today(), -120);
  for (const t of S.transactions) if (t.date >= since && ((kind === 'exp' && t.type === 'expense') || (kind === 'inc' && t.type === 'income'))) counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
  const cats = S.categories.filter(c => c.kind === kind && !c.archived);
  return cats.sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0) || cats.indexOf(a) - cats.indexOf(b));
}
function merchantMemory() {
  return memo('merch', () => { const m = {}; for (const t of txSorted()) { const k = (t.description || '').trim().toLowerCase(); if (k && !m[k]) m[k] = t; } return m; });
}
