/* ================= router ================= */
const ROUTES = {
  dashboard: vDashboard, transactions: vTransactions, expenses: vExpenses, income: vIncome, accounts: vAccounts, account: vAccount, cards: vCards,
  loans: vLoans, loan: vLoan, investments: vInvestments, networth: vNetWorth, budget: vBudget, recurring: vRecurring, goals: vGoals,
  calendar: vCalendar, reports: vReports, more: vMore, settings: vSettings, privacy: vPrivacy,
};
const TAB_OF = { dashboard: 'dashboard', transactions: 'transactions', budget: 'budget', investments: 'investments' };
function parseRoute() {
  const h = location.hash.replace(/^#\/?/, ''); const [path, qs] = h.split('?');
  const [name, id] = (path || 'dashboard').split('/');
  return { name: ROUTES[name] ? name : 'dashboard', id, params: new URLSearchParams(qs || '') };
}
function go(name) { if (location.hash === '#/' + name) rerenderPage(); else location.hash = '#/' + name; }
let lastRoute = '';
function render(soft) {
  const r = parseRoute(); const main = $('#main');
  const key = r.name + '/' + (r.id || '');
  if (!soft && key !== lastRoute && r.name === 'transactions') txLimit = 80;
  for (const k in CHARTS) delete CHARTS[k];
  let html; try { html = ROUTES[r.name](r.id || r.params, r.params); } catch (e) { console.error(e); html = topbar('Something went wrong') + `<div class="card"><p class="muted">This page couldn't be displayed: ${esc(e.message)}. Your data is safe.</p><button class="btn" onclick="location.hash='#/dashboard'">Go to dashboard</button></div>`; }
  main.innerHTML = `<div class="page ${soft ? 'noanim' : ''}">${html}</div>`;
  if (!soft && key !== lastRoute) window.scrollTo(0, 0);
  lastRoute = key;
  wireDonuts(main); drawCharts(main);
  if (r.name === 'transactions') {
    renderTxList(); const q = $('#txq');
    let t; q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { txFilter.q = q.value; txLimit = 80; renderTxList(); }, 120); });
    if (r.params.has('q') && !soft) { history.replaceState(null, '', '#/transactions'); if (!r.params.get('q')) q.focus(); }
    if ((r.params.get('cat') || r.params.get('acct') || r.params.get('type')) && !soft) history.replaceState(null, '', '#/transactions');
  }
  if (r.name === 'settings') navigator.storage?.persisted?.().then(p => { const el = $('#persist'); if (el) el.textContent = p ? 'Granted' : 'Best effort'; }).catch(() => {});
  const tab = TAB_OF[r.name] || 'more';
  $$('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  $$('.sidebar a[data-r]').forEach(a => a.classList.toggle('on', a.dataset.r === r.name || (a.dataset.r === 'accounts' && r.name === 'account') || (a.dataset.r === 'loans' && r.name === 'loan')));
  document.title = (r.name === 'dashboard' ? '' : ($('.topbar h1')?.textContent || '') + ' · ') + 'MoneyOS';
}
const rerenderPage = () => render(true);
window.addEventListener('hashchange', () => render(false));

/* ================= global events ================= */
document.addEventListener('click', async e => {
  if (e.target.closest('.sheet')) return;
  const el = e.target.closest('[data-act],[data-tx],[data-inv],[data-budget],[data-rec],[data-goal],[data-mp],[data-cal],[data-day],[data-txtype],[data-theme-set],[data-wmove]');
  if (!el) return; const d = el.dataset;
  if (d.tx) { const t = S.transactions.find(x => x.id === d.tx); if (t) openTxForm({ tx: t }); return; }
  if (d.inv) return openInvestmentForm(S.investments.find(x => x.id === d.inv));
  if (d.budget) return openBudgetForm(S.budgets.find(x => x.id === d.budget));
  if (d.rec) return openRecurringForm(S.recurring.find(x => x.id === d.rec));
  if (d.goal) return openGoalForm(S.goals.find(x => x.id === d.goal));
  if (d.mp) { viewMonth = d.mp > curMk() ? curMk() : d.mp; return rerenderPage(); }
  if (d.cal) { calMonth = d.cal; calSel = d.cal === curMk() ? today() : d.cal + '-01'; return rerenderPage(); }
  if (d.day) { calSel = d.day; if (mk(d.day) !== calMonth) calMonth = mk(d.day); return rerenderPage(); }
  if (d.txtype) { txFilter.type = d.txtype; txLimit = 80; return rerenderPage(); }
  if (d.themeSet) { S.settings.theme = d.themeSet; saveSettings(); applyTheme(); return rerenderPage(); }
  if (d.wmove) { const i = +d.wmove, j = i + +d.dir; const w = S.settings.widgets; [w[i], w[j]] = [w[j], w[i]]; saveSettings(); return rerenderPage(); }
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  switch (d.act) {
    case 'addExpense': return openTxForm({ type: 'expense', acct: d.acct, pm: d.pm });
    case 'addIncome': return openTxForm({ type: 'income' });
    case 'addTransfer': return openTxForm({ type: 'transfer', to: d.to || undefined, from: d.from || undefined, amt: +d.amt || undefined });
    case 'addAccount': return openAccountForm({ type: d.type });
    case 'addCard': return openAccountForm({ type: 'credit' });
    case 'editAccount': return openAccountForm({ account: acctById(d.id) });
    case 'addLoan': return openLoanForm();
    case 'editLoan': return openLoanForm(S.loans.find(x => x.id === d.id));
    case 'recordEmi': { const l = S.loans.find(x => x.id === d.id); const s = loanStatus(l); return openTxForm({ type: 'expense', amt: s.next?.emi || s.emi, cat: 'c_emi', desc: l.name + ' EMI', acct: l.accountId, pm: 'Auto-debit' }); }
    case 'addInvestment': return openInvestmentForm();
    case 'addBudget': return openBudgetForm({}, d.cat);
    case 'addGoal': return openGoalForm();
    case 'goalAdd': return openGoalAdd(S.goals.find(x => x.id === d.id));
    case 'addRecurring': return openRecurringForm({}, { type: d.type });
    case 'txFilters': return openFilters();
    case 'txSort': return openSort();
    case 'clearFilters': Object.assign(txFilter, { q: '', type: 'all', from: '', to: '', cat: '', acct: '', pm: '', min: '', max: '' }); return rerenderPage();
    case 'manageCats': return openCategories();
    case 'backup': return openBackup();
    case 'restore': return openRestore();
    case 'exportCsv': return exportCsv(d.month);
    case 'exportAllCsv': return exportAllCsv();
    case 'snoozeBackup': S.meta.snoozeBackup = today(); saveMeta(); return rerenderPage();
    case 'skipOnboarding': S.meta.onboardingDone = true; saveMeta(); return rerenderPage();
    case 'demo': return loadDemo();
    case 'chartMonths': S.settings.monthsInChart = +d.n; saveSettings(); return rerenderPage();
    case 'pinChange': return setPinFlow();
    case 'wipe': return wipeAll();
  }
});
document.addEventListener('change', async e => {
  if (e.target.closest('.sheet')) return;
  const d = e.target.dataset;
  if (d.wtoggle !== undefined) { S.settings.widgets[+d.wtoggle][1] = e.target.checked ? 1 : 0; saveSettings(); }
  if (d.act === 'currency') { S.settings.currency = e.target.value; _nf = {}; saveSettings(); rerenderPage(); }
  if (d.act === 'backupDays') { S.settings.backupDays = +e.target.value; saveSettings(); }
  if (d.act === 'pinToggle') { if (e.target.checked) setPinFlow(); else { e.target.checked = true; showLock({ title: 'Enter current PIN', verify: true, onDone: () => { delete S.meta.pinHash; delete S.meta.pinSalt; saveMeta(); rerenderPage(); toast('App lock turned off'); }, cancel: true }); } }
});
document.addEventListener('keydown', e => {
  if (sheets.length || $('.lock')) return; if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  if (e.key === 'n' || e.key === 'a') { e.preventDefault(); openTxForm({}); }
  if (e.key === '/') { e.preventDefault(); location.hash = '#/transactions?q='; }
});

/* ================= backup / restore / export ================= */
function backupPayload() {
  const meta = { ...S.meta }; delete meta.pinHash; delete meta.pinSalt;
  return { app: 'MoneyOS', version: 1, exportedAt: new Date().toISOString(), currency: S.settings.currency,
    data: { transactions: S.transactions, accounts: S.accounts, categories: S.categories, budgets: S.budgets, goals: S.goals, investments: S.investments, loans: S.loans, recurring: S.recurring, settings: S.settings, meta } };
}
async function saveFile(name, text, mime) {
  const blob = new Blob([text], { type: mime }); const file = new File([blob], name, { type: mime });
  const touch = matchMedia('(pointer:coarse)').matches;
  if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return true; } catch (e) { if (e.name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); return true;
}
function markBackedUp() { S.meta.lastBackup = new Date().toISOString(); saveMeta(); rerenderPage(); }
function openBackup() {
  const json = JSON.stringify(backupPayload()); const kb = (json.length / 1024).toFixed(0);
  openSheet('Back up your data', `<p class="muted" style="margin:4px 0 14px">Your data is stored locally. Back up regularly so you don't lose it if you clear browser data or change devices. On iPhone, choose <b style="color:var(--text)">Save to Files</b> and pick iCloud Drive.</p>
    <div class="kv"><span>Transactions</span><span>${S.transactions.length.toLocaleString('en-IN')}</span></div><div class="kv"><span>Backup size</span><span>${kb} KB</span></div>
    <button class="btn primary block mt16" data-x="file">${I('download')} Save backup file</button><button class="btn block mt12" data-x="copy">Copy backup to clipboard</button>
    <p class="small muted" style="margin:12px 0 0">Backups don't include your PIN. Keep the file private, it contains all your financial records.</p>`, s => {
    s.el.addEventListener('click', async e => {
      const x = e.target.closest('[data-x]')?.dataset.x; if (!x) return;
      if (x === 'file') { const ok = await saveFile(`moneyos-backup-${today()}.json`, json, 'application/json'); if (ok) { markBackedUp(); s.close(); toast('Backup saved'); } }
      if (x === 'copy') { try { await navigator.clipboard.writeText(json); markBackedUp(); s.close(); toast('Backup copied. Paste it into Notes or Files.'); } catch { toast('Clipboard not available here'); } }
    });
  });
}
function openRestore() {
  openSheet('Restore backup', `<p class="muted" style="margin:4px 0 14px">Restoring replaces everything currently on this device with the backup.</p>
    <label class="btn primary block" style="cursor:pointer">${I('upload')} Choose backup file<input type="file" accept=".json,application/json" class="hidden" id="rfile"></label>
    <label class="field"><span>Or paste backup text</span><textarea class="input" id="rtext" placeholder='{"app":"MoneyOS",…}'></textarea></label><button class="btn block mt12" data-x="paste">Restore from pasted text</button>`, s => {
    const doRestore = async text => {
      let p; try { p = JSON.parse(text); } catch { toast('That file isn’t valid JSON'); return; }
      const d = p.data || p; if (!Array.isArray(d.transactions) || !Array.isArray(d.accounts)) { toast('This doesn’t look like a MoneyOS backup'); return; }
      if (!(await confirmSheet('Replace current data?', `The backup from ${p.exportedAt ? fmtDate(p.exportedAt.slice(0, 10)) : 'an unknown date'} has ${d.transactions.length} transactions and ${d.accounts.length} accounts. Current data on this device will be replaced.`, 'Restore', true))) return;
      for (const st of STORES.filter(x => x !== 'kv')) { S[st] = Array.isArray(d[st]) ? d[st] : []; await DB.bulk(st, S[st], true); }
      if (!S.categories.length) { const keepA = S.accounts; seedDefaults(); S.accounts = keepA.length ? keepA : S.accounts; await DB.bulk('categories', S.categories, true); }
      S.settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) }; const pin = { pinHash: S.meta.pinHash, pinSalt: S.meta.pinSalt };
      S.meta = { ...(d.meta || {}), ...(pin.pinHash ? pin : {}), lastBackup: p.exportedAt || S.meta.lastBackup };
      await saveSettings(); await saveMeta(); _nf = {}; bump(); applyTheme(); await processRecurring();
      s.close(); go('dashboard'); toast('Backup restored');
    };
    $('#rfile', s.el).addEventListener('change', async e => { const f = e.target.files[0]; if (f) doRestore(await f.text()); });
    s.el.querySelector('[data-x="paste"]').onclick = () => { const t = $('#rtext', s.el).value.trim(); if (t) doRestore(t); };
  });
}
const csvCell = v => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csvRows = rows => rows.map(r => r.map(csvCell).join(',')).join('\r\n');
function txCsvRows(list) {
  return [['Date', 'Type', 'Description', 'Category', 'Account', 'To account', 'Amount', 'Currency', 'Payment method', 'Tags', 'Notes', 'Recurring']].concat(
    list.map(t => [t.date, t.type, t.description, t.type === 'transfer' ? '' : t.type === 'investment' ? 'Investment' : catName(t.categoryId), acctById(t.accountId)?.name || '', acctById(t.toAccountId)?.name || '', t.amount, t.currency || S.settings.currency, t.paymentMethod || '', (t.tags || []).join('; '), t.notes || '', t.recurringId ? 'yes' : '']));
}
async function exportCsv(month) {
  const list = (month ? txSorted().filter(t => mk(t.date) === month) : parseRoute().name === 'transactions' ? filteredTx() : txSorted());
  if (!list.length) return toast('No transactions to export');
  await saveFile(`moneyos-transactions${month ? '-' + month : ''}-${today()}.csv`, '\uFEFF' + csvRows(txCsvRows(list)), 'text/csv');
  toast(`Exported ${list.length} transactions`);
}
async function exportAllCsv() {
  const sec = (title, rows) => `${title}\r\n${csvRows(rows)}\r\n\r\n`;
  const b = balances(); let out = '\uFEFF';
  out += sec('TRANSACTIONS', txCsvRows(txSorted()));
  out += sec('ACCOUNTS', [['Name', 'Type', 'Institution', 'Last 4', 'Opening balance', 'Current balance', 'Credit limit']].concat(S.accounts.map(a => [a.name, ACCT_TYPES[a.type], a.institution, a.last4, a.openingBalance, round2(b[a.id] || 0), a.limit || ''])));
  out += sec('INVESTMENTS', [['Name', 'Category', 'Invested', 'Current value', 'Since']].concat(S.investments.map(x => [x.name, x.type, x.invested, x.currentValue, x.date])));
  out += sec('LOANS', [['Name', 'Principal', 'Rate %', 'Tenure (months)', 'EMI', 'Outstanding', 'Start date']].concat(S.loans.map(l => [l.name, l.principal, l.rate, l.tenure, round2(loanStatus(l).emi), round2(loanStatus(l).outstanding), l.startDate])));
  out += sec('BUDGETS', [['Category', 'Monthly limit']].concat(S.budgets.map(x => [catName(x.categoryId), x.amount])));
  out += sec('GOALS', [['Name', 'Type', 'Target', 'Current', 'Target date', 'Monthly contribution']].concat(S.goals.map(g => [g.name, g.type, g.target, g.current, g.targetDate, g.monthly])));
  out += sec('RECURRING', [['Name', 'Type', 'Amount', 'Frequency', 'Start', 'End', 'Auto']].concat(S.recurring.map(r => [r.description, r.type, r.amount, r.frequency, r.startDate, r.endDate, r.autoPost ? 'yes' : 'no'])));
  await saveFile(`moneyos-all-${today()}.csv`, out, 'text/csv'); toast('Exported everything');
}
async function wipeAll() {
  if (!(await confirmSheet('Erase all data?', 'Every transaction, account, budget and goal will be deleted from this device. Make a backup first if you might need it.', 'Erase everything', true))) return;
  for (const st of STORES) await DB.bulk(st, [], true);
  Object.assign(S, { transactions: [], budgets: [], goals: [], investments: [], loans: [], recurring: [], meta: {}, settings: { ...DEFAULT_SETTINGS, widgets: DEFAULT_SETTINGS.widgets.map(w => [...w]) } });
  seedDefaults(); await DB.bulk('categories', S.categories); await DB.bulk('accounts', S.accounts); bump(); applyTheme(); go('dashboard'); toast('All data erased');
}

/* ================= PIN lock ================= */
async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(salt + ':' + pin);
  if (crypto?.subtle) { const h = await crypto.subtle.digest('SHA-256', data); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join(''); }
  let h = 0; for (const b of data) h = (h * 31 + b) >>> 0; return 'x' + h.toString(16);
}
function showLock({ title = 'Enter PIN', verify = true, onDone, cancel = false } = {}) {
  if ($('.lock')) return; let pin = '';
  const el = document.createElement('div'); el.className = 'lock'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', title);
  const draw = () => { el.innerHTML = `<div class="brand" style="font:700 20px var(--display);display:flex;gap:10px;align-items:center"><span style="width:30px;height:30px;border-radius:9px;background:var(--text);display:grid;place-items:center"><span style="width:11px;height:11px;border-radius:3px;background:var(--accent)"></span></span>MoneyOS</div><h2>${esc(title)}</h2><div class="pin-dots">${[0, 1, 2, 3].map(i => `<i class="${i < pin.length ? 'f' : ''}"></i>`).join('')}</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}<button class="ghost" data-k="${cancel ? 'cancel' : 'forgot'}">${cancel ? 'Cancel' : 'Forgot?'}</button><button data-k="0">0</button><button class="ghost" data-k="del" aria-label="Delete">⌫</button></div>`; };
  draw(); document.body.appendChild(el);
  const press = async k => {
    if (k === 'cancel') { el.remove(); return; }
    if (k === 'forgot') { el.style.zIndex = 30; if (await confirmSheet('Forgot your PIN?', 'The PIN can’t be recovered because nothing is stored online. You can erase this device’s MoneyOS data and restore from a backup.', 'Erase and start over', true)) { el.remove(); for (const st of STORES) await DB.bulk(st, [], true); location.reload(); } el.style.zIndex = ''; return; }
    if (k === 'del') { pin = pin.slice(0, -1); draw(); return; }
    if (pin.length >= 4) return; pin += k; draw();
    if (pin.length === 4) {
      if (!verify) { setTimeout(() => { el.remove(); onDone(pin); }, 120); return; }
      if (await hashPin(pin, S.meta.pinSalt) === S.meta.pinHash) { setTimeout(() => { el.remove(); onDone && onDone(); }, 100); }
      else { const dots = $('.pin-dots', el); dots.classList.add('shake'); navigator.vibrate?.(80); setTimeout(() => { pin = ''; draw(); }, 380); }
    }
  };
  el.addEventListener('click', e => { const k = e.target.closest('[data-k]')?.dataset.k; if (k) press(k); });
  const kd = e => { if (!document.body.contains(el)) return document.removeEventListener('keydown', kd); if (/^\d$/.test(e.key)) press(e.key); if (e.key === 'Backspace') press('del'); };
  document.addEventListener('keydown', kd);
}
function setPinFlow() {
  showLock({ title: 'Choose a 4-digit PIN', verify: false, cancel: true, onDone: p1 => showLock({ title: 'Enter it again', verify: false, cancel: true, onDone: async p2 => {
    if (p1 !== p2) { toast('PINs didn’t match. Try again.'); rerenderPage(); return; }
    S.meta.pinSalt = uid(); S.meta.pinHash = await hashPin(p1, S.meta.pinSalt); await saveMeta(); rerenderPage(); toast('App lock is on');
  } }) });
  setTimeout(rerenderPage, 50);
}
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else if (S.meta.pinHash && hiddenAt && Date.now() - hiddenAt > 60000) showLock({ title: 'Enter PIN' });
});

/* ================= theme ================= */
function applyTheme() {
  const t = S.settings.theme; if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t;
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121316' : '#F5F6F8');
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

/* ================= demo data ================= */
async function loadDemo() {
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = a => a[Math.floor(rnd() * a.length)]; const now = new Date().toISOString();
  const start = mkAdd(curMk(), -4) + '-01';
  const A = { hdfc: 'a_demo_hdfc', icici: 'a_demo_icici', card: 'a_demo_card', paytm: 'a_demo_paytm' };
  const accts = [
    { id: A.hdfc, name: 'HDFC Salary', type: 'bank', openingBalance: 92000, institution: 'HDFC Bank', last4: '4417', color: '#4B5BD6' },
    { id: A.icici, name: 'ICICI Savings', type: 'savings', openingBalance: 185000, institution: 'ICICI Bank', last4: '0932', color: '#C2413A' },
    { id: A.card, name: 'Amazon Pay ICICI', type: 'credit', openingBalance: -12400, institution: 'ICICI Bank', last4: '7781', color: '#1B1D22', limit: 150000, billingDay: 18, dueDay: 5 },
    { id: 'a_demo_flat', name: 'Apartment, Whitefield', type: 'asset', openingBalance: 6200000, institution: 'Market estimate', last4: '', color: '#6B4E3D' },
    { id: A.paytm, name: 'Paytm Wallet', type: 'wallet', openingBalance: 1850, institution: 'Paytm', last4: '', color: '#2E7FA8' },
  ].map(a => ({ ...a, createdAt: now, updatedAt: now }));
  const merchants = [['Swiggy', 'c_food', 180, 650], ['Zomato', 'c_food', 220, 780], ['Blue Tokai', 'c_food', 240, 420], ['BigBasket', 'c_groceries', 900, 3200], ['Zepto', 'c_groceries', 250, 1100], ['Uber', 'c_transport', 140, 520], ['Metro recharge', 'c_transport', 300, 500], ['Indian Oil', 'c_transport', 1500, 2800], ['Amazon', 'c_shopping', 399, 3499], ['Myntra', 'c_shopping', 799, 2899], ['BookMyShow', 'c_entertainment', 350, 1200], ['Apollo Pharmacy', 'c_health', 180, 1400], ['Cult.fit', 'c_health', 1200, 1200], ['Haircut', 'c_personal_care', 350, 600], ['Airtel broadband', 'c_utilities', 799, 799], ['BESCOM electricity', 'c_utilities', 1400, 2600]];
  const tx = []; let cardSpend = {};
  for (let d = start; d <= today(); d = addDays(d, 1)) {
    const n = rnd() < 0.25 ? 0 : rnd() < 0.7 ? 1 : 2;
    for (let i = 0; i < n; i++) {
      const [m, c, lo, hi] = pick(merchants); if ((m === 'Airtel broadband' || m === 'BESCOM electricity' || m === 'Cult.fit') && parseD(d).getDate() !== (m === 'Cult.fit' ? 2 : 12)) continue;
      const amt = Math.round((lo + rnd() * (hi - lo)) / 10) * 10; const onCard = ['c_shopping', 'c_entertainment'].includes(c) || rnd() < 0.2;
      const acct = onCard ? A.card : A.hdfc;
      if (onCard) cardSpend[mk(d)] = (cardSpend[mk(d)] || 0) + amt;
      tx.push({ id: uid(), type: 'expense', amount: amt, currency: 'INR', date: d, description: m, categoryId: c, accountId: acct, paymentMethod: onCard ? 'Credit card' : 'UPI', notes: '', tags: [], recurringId: null, createdAt: now, updatedAt: now });
    }
    if (parseD(d).getDate() === 5 && d > start) { const pm = mkAdd(mk(d), -1); const amt = Math.round((cardSpend[pm] || 12400)); tx.push({ id: uid(), type: 'transfer', amount: amt, currency: 'INR', date: d, description: 'Card bill payment', categoryId: 'transfer', accountId: A.hdfc, toAccountId: A.card, paymentMethod: 'Transfer', notes: '', tags: [], createdAt: now, updatedAt: now }); }
  }
  tx.push({ id: uid(), type: 'expense', amount: 18600, currency: 'INR', date: addDays(start, 40), description: 'IndiGo, Goa flights', categoryId: 'c_travel', accountId: A.card, paymentMethod: 'Credit card', notes: '', tags: ['goa-trip'], createdAt: now, updatedAt: now });
  tx.push({ id: uid(), type: 'income', amount: 25000, currency: 'INR', date: addDays(start, 70), description: 'Quarterly bonus', categoryId: 'c_bonus', accountId: A.hdfc, paymentMethod: 'Bank', notes: '', tags: [], createdAt: now, updatedAt: now });
  tx.push({ id: uid(), type: 'income', amount: 1840, currency: 'INR', date: addDays(start, 90), description: 'Savings interest', categoryId: 'c_interest', accountId: A.icici, paymentMethod: 'Bank', notes: '', tags: [], createdAt: now, updatedAt: now });
  const loanStart = addMonths(start, -22);
  const loan = { id: 'l_demo_home', name: 'Home loan, SBI', principal: 3500000, rate: 8.6, tenure: 240, emi: emiCalc(3500000, 8.6, 240), startDate: loanStart, firstEmiDate: addMonths(loanStart, 1, 5).slice(0, 8) + '05', accountId: A.hdfc, createdAt: now, updatedAt: now };
  const recs = [
    { id: 'r_demo_salary', type: 'income', amount: 125000, description: 'Salary', categoryId: 'c_salary', accountId: A.hdfc, frequency: 'monthly', startDate: start, anchorDay: 1, autoPost: true, paymentMethod: 'Bank' },
    { id: 'r_demo_rent', type: 'expense', amount: 26000, description: 'Rent', categoryId: 'c_housing', accountId: A.hdfc, frequency: 'monthly', startDate: addDays(start, 2), anchorDay: 3, autoPost: true, paymentMethod: 'Auto-debit' },
    { id: 'r_demo_sip', type: 'investment', amount: 15000, description: 'Nifty 50 index SIP', categoryId: 'investment', accountId: A.hdfc, frequency: 'monthly', startDate: addDays(start, 9), anchorDay: 10, autoPost: true, paymentMethod: 'Auto-debit' },
    { id: 'r_demo_netflix', type: 'expense', amount: 649, description: 'Netflix', categoryId: 'c_subscriptions', accountId: A.card, frequency: 'monthly', startDate: addDays(start, 14), anchorDay: 15, autoPost: true, paymentMethod: 'Credit card' },
    { id: 'r_demo_emi', type: 'expense', amount: round2(loan.emi), description: 'Home loan EMI', categoryId: 'c_emi', accountId: A.hdfc, frequency: 'monthly', startDate: addDays(start, 4), anchorDay: 5, endDate: '', autoPost: true, loanId: loan.id, paymentMethod: 'Auto-debit' },
    { id: 'r_demo_lic', type: 'expense', amount: 24500, description: 'LIC premium', categoryId: 'c_insurance', accountId: A.icici, frequency: 'yearly', startDate: addMonths(start, 5, 20).slice(0, 8) + '20', anchorDay: 20, autoPost: false, paymentMethod: 'Net banking' },
  ].map(r => ({ ...r, createdAt: now, updatedAt: now }));
  loan.autoRecurringId = 'r_demo_emi';
  const invs = [
    { name: 'UTI Nifty 50 Index Fund', type: 'Mutual Funds', invested: 240000, currentValue: 286400, date: addMonths(start, -18) },
    { name: 'Parag Parikh Flexi Cap', type: 'Mutual Funds', invested: 150000, currentValue: 181900, date: addMonths(start, -14) },
    { name: 'PPF', type: 'PPF', invested: 300000, currentValue: 338000, date: addMonths(start, -36) },
    { name: 'Gold BeES', type: 'ETFs', invested: 60000, currentValue: 71800, date: addMonths(start, -10) },
    { name: 'SBI FD 7.1%', type: 'Fixed Deposits', invested: 200000, currentValue: 209400, date: addMonths(start, -6) },
    { name: 'Infosys', type: 'Stocks', invested: 45000, currentValue: 41200, date: addMonths(start, -8) },
  ].map(x => ({ ...x, id: uid(), notes: '', createdAt: now, updatedAt: now }));
  const buds = [['c_food', 9000], ['c_groceries', 9000], ['c_shopping', 6000], ['c_transport', 5000], ['c_entertainment', 2500]].map(([c, a]) => ({ id: uid(), categoryId: c, amount: a, createdAt: now, updatedAt: now }));
  const goals = [
    { id: uid(), type: 'Emergency fund', name: 'Emergency fund', target: 500000, current: 260000, targetDate: addMonths(today(), 12), monthly: 15000 },
    { id: uid(), type: 'Vacation', name: 'Japan trip', target: 250000, current: 70000, targetDate: addMonths(today(), 9), monthly: 15000 },
    { id: uid(), type: 'Car', name: 'New car down payment', target: 400000, current: 55000, targetDate: addMonths(today(), 24), monthly: 12000 },
  ].map(g => ({ ...g, createdAt: now, updatedAt: now }));
  Object.assign(S, { accounts: [...S.accounts.filter(a => a.id === 'a_cash'), ...accts], transactions: tx, recurring: recs, loans: [loan], investments: invs, budgets: buds, goals });
  for (const st of ['accounts', 'transactions', 'recurring', 'loans', 'investments', 'budgets', 'goals']) await DB.bulk(st, S[st], true);
  bump(); await processRecurring(); S.meta.onboardingDone = true; S.meta.demo = true; await saveMeta();
  rerenderPage(); toast('Sample data loaded. Erase it anytime in Settings.');
}

/* ================= boot ================= */
async function boot() {
  await loadAll(); applyTheme();
  await processRecurring();
  const start = () => { render(false); $('#app').classList.remove('hidden'); };
  if (S.meta.pinHash) { $('#app').classList.add('hidden'); showLock({ title: 'Enter PIN', onDone: start }); } else start();
  if (DB.mem) setTimeout(() => toast('Storage is unavailable in this browser mode. Data won’t be saved.'), 800);
  try { navigator.storage?.persist?.(); } catch {}
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/claude|anthropic/.test(location.hostname)) navigator.serviceWorker.register('./sw.js').catch(() => {});
  // new day while app is open → post recurring
  setInterval(async () => { if (await processRecurring()) rerenderPage(); }, 30 * 60 * 1000);
}
boot();
