/* ================= shared bits ================= */
function topbar(title, o = {}) {
  return `<header class="topbar">${o.back ? `<a class="back" href="#/${o.back}" aria-label="Back">${I('back', 2.2)}</a>` : ''}<h1>${esc(title)}</h1>${o.actions || ''}</header>`;
}
function txIcon(t) {
  if (t.type === 'transfer') return `<span class="ic" style="color:var(--muted)">${I('swap')}</span>`;
  const c = catById(t.categoryId);
  if (t.type === 'investment') return `<span class="ic" style="background:var(--inv-soft);color:var(--inv)">${I('trend')}</span>`;
  return `<span class="ic">${esc(c?.icon || '•')}</span>`;
}
function txAmount(t) {
  const a = +t.amount;
  if (t.type === 'income') return `<span class="c-in">+${fmt(a, { dec: a % 1 !== 0 })}</span>`;
  if (t.type === 'expense') return `<span>−${fmt(a, { dec: a % 1 !== 0 })}</span>`;
  if (t.type === 'investment') return `<span class="c-inv">${fmt(a)}</span>`;
  return `<span class="muted">${fmt(a)}</span>`;
}
function txSub(t, showDate) {
  const acct = acctById(t.accountId)?.name || '—';
  let what = t.type === 'transfer' ? `${acct} → ${acctById(t.toAccountId)?.name || '—'}` : t.type === 'investment' ? `Investment · ${acct}` : `${catName(t.categoryId)} · ${acct}`;
  what = what.replace(' · ', ', ');
  return (showDate ? fmtDate(t.date, { day: 'numeric', month: 'short' }) + ', ' : '') + what + (t.recurringId ? ' ↻' : '');
}
function txRow(t, showDate) {
  return `<button class="row" data-tx="${t.id}">${txIcon(t)}<span class="t"><b>${esc(t.description || catName(t.categoryId))}</b><small>${esc(txSub(t, showDate))}</small></span><span class="a">${txAmount(t)}</span></button>`;
}
function emptyCard(title, text, btn, action) {
  return `<div class="card empty"><h2 style="font-size:19px">${esc(title)}</h2><p>${esc(text)}</p>${btn ? `<button class="btn primary" data-act="${action}">${esc(btn)}</button>` : ''}</div>`;
}
function monthPicker(k, route) {
  const canNext = k < curMk();
  return `<div class="flex" style="gap:4px"><button class="icon-btn" data-mp="${mkAdd(k, -1)}" data-route="${route}" aria-label="Previous month">${I('back', 2)}</button>
  <span style="min-width:112px;text-align:center;font-weight:600;font-size:14px">${mkLabel(k, true)}</span>
  <button class="icon-btn" data-mp="${mkAdd(k, 1)}" data-route="${route}" aria-label="Next month" ${canNext ? '' : 'disabled style="opacity:.35"'}><span style="transform:rotate(180deg)">${I('back', 2)}</span></button></div>`;
}
let viewMonth = curMk();
const monthsBack = (n, end = curMk()) => Array.from({ length: n }, (_, i) => mkAdd(end, i - n + 1));

/* ================= DASHBOARD ================= */
function onboardingSteps() {
  const has = t => S.transactions.some(x => x.type === t);
  return [
    ['Add your bank account', S.accounts.filter(a => !a.archived).length > 1, 'addAccount'],
    ['Add your income', has('income'), 'addIncome'],
    ['Add an expense', has('expense'), 'addExpense'],
    ['Set a monthly budget', S.budgets.length > 0, 'addBudget'],
    ['Set a financial goal', S.goals.length > 0, 'addGoal'],
  ];
}
function vDashboard() {
  const k = curMk(), m = monthStats(k), pm = monthStats(mkAdd(k, -1)), nw = netWorth(), b = balances();
  const fresh = !S.transactions.length;
  const steps = onboardingSteps(); const stepsLeft = steps.filter(s => !s[1]).length;
  const hr = new Date().getHours(); const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  let h = topbar(greet, { actions: `<a class="icon-btn" href="#/transactions?q=" aria-label="Search">${I('search')}</a><a class="icon-btn" href="#/settings" aria-label="Settings">${I('gear')}</a>` });

  // backup reminder
  const lb = S.meta.lastBackup; const stale = !lb || daysBetween(lb.slice(0, 10), today()) >= (S.settings.backupDays || 14);
  if (!fresh && stale && !S.meta.snoozeBackup?.startsWith(today())) h += `<div class="banner"><span style="flex:1"><b>${lb ? `Last backup was ${daysBetween(lb.slice(0, 10), today())} days ago.` : 'Your data has never been backed up.'}</b> It lives only on this device.</span><button class="btn sm primary" data-act="backup">Back up</button><button class="icon-btn" data-act="snoozeBackup" aria-label="Dismiss">${I('x')}</button></div>`;

  if (fresh) {
    h += `<div class="card empty"><h2>Let's get your money organised.</h2><p>Everything you add stays on this device. Start with one transaction, or follow the steps below.</p>
      <button class="btn primary" data-act="addExpense">Add your first transaction</button>
      <div style="margin-top:10px"><button class="link" data-act="demo" style="font-size:14px">Explore with sample data</button></div></div>`;
  }
  if (!S.meta.onboardingDone && stepsLeft) {
    h += `<div class="card"><div class="card-h"><h3>Set up MoneyOS</h3><button class="link" data-act="skipOnboarding">Skip</button></div><div class="steps">${steps.map((s, i) => `<button class="step ${s[1] ? 'done' : ''}" data-act="${s[2]}"><span class="n">${s[1] ? '✓' : i + 1}</span><b>${s[0]}</b>${s[1] ? '' : I('chev')}</button>`).join('')}</div></div>`;
  }
  if (fresh) return h;

  const W = {};
  // hero statement: answers came in / went / saved / invested
  const flowTot = Math.max(m.income, m.expense + m.investment) || 1;
  const left = Math.max(0, m.income - m.expense - m.investment);
  const health = healthLine(m, pm);
  W.month = `<section class="card hero span-12"><div class="when"><span>${mkLabel(k, true)} so far</span><a class="link" href="#/reports">Full report</a></div>
    <p class="statement"><span class="c-in">${fmt(m.income)}</span> <span class="w">came in.</span> <span>${fmt(m.expense)}</span> <span class="w">went out.</span> <span class="c-inv">${fmt(m.investment)}</span> <span class="w">invested,</span> <span style="color:${m.savings >= 0 ? 'var(--accent)' : 'var(--out)'}">${fmt(m.savings)}</span> <span class="w">${m.savings >= 0 ? 'left over.' : 'overspent.'}</span></p>
    <div class="flow" aria-hidden="true"><i style="width:${m.expense / flowTot * 100}%;background:var(--out)"></i><i style="width:${m.investment / flowTot * 100}%;background:var(--inv)"></i><i style="width:${left / flowTot * 100}%;background:var(--accent)"></i></div>
    <div class="flow-legend"><span><b style="background:var(--out)"></b>Expenses ${pct(m.income ? m.expense / m.income : 0)}</span><span><b style="background:var(--inv)"></b>Invested ${pct(m.income ? m.investment / m.income : 0)}</span><span><b style="background:var(--accent)"></b>Left over ${pct(m.income ? left / m.income : 0)}</span>${m.emi ? `<span>EMIs ${fmt(m.emi)}</span>` : ''}</div>
    <div class="grid g3 mt16"><div class="stat"><div class="l">Savings rate</div><div class="v">${pct(m.savingsRate)}</div></div><div class="stat"><div class="l">Cash flow</div><div class="v ${m.cashflow < 0 ? 'c-out' : ''}">${fmt(m.cashflow, { sign: true })}</div></div><div class="stat"><div class="l">EMI paid</div><div class="v">${fmt(m.emi)}</div></div></div>
    <div class="health"><span class="dot" style="background:${health.color}"></span><span>${health.text}</span></div></section>`;

  W.networth = `<a class="card span-5" href="#/networth" style="text-decoration:none;display:block"><div class="card-h"><h3>Net worth</h3>${I('chev')}</div>
    <div class="big ${nw.net < 0 ? 'c-out' : ''}">${fmt(nw.net)}</div>
    <div class="grid g2 mt16"><div class="stat"><div class="l">Assets</div><div class="v">${fmt(nw.assets)}</div></div><div class="stat"><div class="l">Liabilities</div><div class="v c-debt">${fmt(nw.liabilities)}</div></div></div></a>`;

  const up30 = events(addDays(today(), 1), addDays(today(), 30)).filter(e => e.kind !== 'income' && e.kind !== 'goal');
  const liquid = sum(S.accounts.filter(a => LIQUID.includes(a.type) && !a.archived), a => b[a.id]);
  W.available = `<section class="card span-7"><div class="card-h"><h3>Available money</h3><a href="#/accounts">Accounts</a></div>
    <div class="grid g2 g4-d"><div class="stat"><div class="l">Bank balance</div><div class="v">${fmt(nw.bank)}</div></div><div class="stat"><div class="l">Cash & wallets</div><div class="v">${fmt(nw.cash)}</div></div>
    <div class="stat"><div class="l">Card outstanding</div><div class="v c-debt">${fmt(nw.card)}</div></div><div class="stat"><div class="l">Due in 30 days</div><div class="v">${fmt(sum(up30, e => e.amount))}</div></div></div>
    <p class="small muted" style="margin:12px 2px 0">After upcoming payments you'd have about <b style="color:var(--text)">${fmt(liquid - sum(up30, e => e.amount))}</b> in liquid money.</p></section>`;

  const months = monthsBack(S.settings.monthsInChart || 6);
  W.cashflow = `<section class="card span-7"><div class="card-h"><h3>Cash flow</h3><div class="seg sm" style="width:150px">${[3, 6, 12].map(n => `<button class="${(S.settings.monthsInChart || 6) === n ? 'on' : ''}" data-act="chartMonths" data-n="${n}">${n}M</button>`).join('')}</div></div>
    ${barChart(months.map(x => mkLabel(x)), [{ name: 'Income', color: 'var(--in)', values: months.map(x => monthStats(x).income) }, { name: 'Expenses', color: 'var(--out)', values: months.map(x => monthStats(x).expense) }, { name: 'Invested', color: 'var(--inv)', values: months.map(x => monthStats(x).investment) }])}</section>`;

  W.breakdown = `<section class="card span-5"><div class="card-h"><h3>Where it went</h3><a href="#/expenses">Expenses</a></div>${donut(Object.entries(m.byCat).map(([id, v]) => ({ label: catName(id), value: v, color: catColor(id) })), 'Spent')}</section>`;

  const bud = budgetRows(k).sort((a, b) => b.p - a.p).slice(0, 4);
  W.budget = `<section class="card span-6"><div class="card-h"><h3>Budgets</h3><a href="#/budget">All budgets</a></div>${bud.length ? bud.map(x => `<div style="margin-bottom:14px"><div class="flex between small"><span style="font-weight:550">${esc(x.cat.icon)} ${esc(x.cat.name)}</span><span class="muted num">${fmt(x.spent)} of ${fmt(x.amount)}</span></div><div class="mt8">${progress(x.spent, x.amount)}</div></div>`).join('') : `<p class="muted small">No budgets yet. <button class="link" data-act="addBudget">Set one</button></p>`}</section>`;

  W.upcoming = `<section class="card span-6"><div class="card-h"><h3>Upcoming payments</h3><a href="#/calendar">Calendar</a></div>${up30.length ? `<div class="list">${up30.slice(0, 6).map(evRow).join('')}</div>` : `<p class="muted small">Nothing due in the next 30 days. Add rent, SIPs or subscriptions as <a class="link" href="#/recurring">recurring</a>.</p>`}</section>`;

  const cards = S.accounts.filter(a => a.type === 'credit' && !a.archived);
  if (cards.length) W.cards = `<section class="card span-6"><div class="card-h"><h3>Credit cards</h3><a href="#/cards">Details</a></div>${cards.slice(0, 3).map(a => { const c = cardInfo(a); return `<div style="margin-bottom:14px"><div class="flex between small"><span style="font-weight:550">${esc(a.name)}</span><span class="muted num">${fmt(c.out)}${c.limit ? ' / ' + fmt(c.limit) : ''}</span></div><div class="mt8">${progress(c.out, c.limit || c.out || 1)}</div><div class="util-legend"><span>${c.limit ? pct(c.util) + ' utilised' : ''}</span><span>Due ${fmtDate(c.due, { day: 'numeric', month: 'short' })}</span></div></div>`; }).join('')}</section>`;

  if (S.loans.length) { const tot = sum(S.loans, l => loanStatus(l).outstanding); const nextE = S.loans.map(l => ({ l, n: loanStatus(l).next })).filter(x => x.n).sort((a, b) => a.n.date.localeCompare(b.n.date))[0];
    W.loans = `<a class="card span-6" href="#/loans" style="text-decoration:none;display:block"><div class="card-h"><h3>Loans</h3>${I('chev')}</div><div class="mid">${fmt(tot)}</div><p class="small muted" style="margin:4px 0 0">outstanding across ${S.loans.length} loan${S.loans.length > 1 ? 's' : ''}${nextE ? `. Next EMI ${fmt(nextE.n.emi)} on ${fmtDate(nextE.n.date, { day: 'numeric', month: 'short' })}` : ''}.</p></a>`; }

  if (S.investments.length) { const p = portfolio(); W.investments = `<a class="card span-6" href="#/investments" style="text-decoration:none;display:block"><div class="card-h"><h3>Investments</h3>${I('chev')}</div><div class="mid">${fmt(p.current)}</div><p class="small" style="margin:4px 0 0"><span class="${p.ret >= 0 ? 'c-in' : 'c-out'}" style="font-weight:600">${fmt(p.ret, { sign: true })} (${(p.retPct * 100).toFixed(1)}%)</span> <span class="muted">on ${fmt(p.invested)} invested</span></p></a>`; }

  if (S.goals.length) W.goals = `<section class="card span-6"><div class="card-h"><h3>Goals</h3><a href="#/goals">All goals</a></div>${S.goals.slice(0, 3).map(g => `<div style="margin-bottom:14px"><div class="flex between small"><span style="font-weight:550">${esc(GOAL_ICONS[g.type] || '🎯')} ${esc(g.name)}</span><span class="muted num">${pct((+g.current) / (+g.target || 1))}</span></div><div class="mt8">${progress(+g.current, +g.target, 'plain')}</div></div>`).join('')}</section>`;

  W.recent = `<section class="card span-12"><div class="card-h"><h3>Recent transactions</h3><a href="#/transactions">See all</a></div><div class="list">${txSorted().slice(0, 10).map(t => txRow(t, true)).join('')}</div></section>`;

  h += `<div class="dash">${S.settings.widgets.filter(w => w[1] && W[w[0]]).map(w => W[w[0]]).join('')}</div>`;
  return h;
}
function healthLine(m, pm) {
  const over = budgetRows(curMk()).filter(x => x.spent > x.amount);
  const near = budgetRows(curMk()).filter(x => x.p >= 0.8 && x.spent <= x.amount);
  const d = new Date(); const monthFrac = d.getDate() / dim(d.getFullYear(), d.getMonth());
  if (!m.income && m.expense) return { color: 'var(--debt)', text: `No income recorded yet this month. You've spent ${fmt(m.expense)} so far.` };
  if (m.savings < 0) return { color: 'var(--out)', text: `You're ${fmt(-m.savings)} over this month's income. Worth a look at <a class="link" href="#/expenses">expenses</a>.` };
  if (over.length) return { color: 'var(--out)', text: `${over.map(x => x.cat.name).join(', ')} ${over.length > 1 ? 'are' : 'is'} over budget. Everything else is on track.` };
  if (near.length) return { color: 'var(--debt)', text: `On track, with ${m.savingsRate ? pct(m.savingsRate) : 'most'} of income kept. ${near.map(x => x.cat.name).join(', ')} ${near.length > 1 ? 'are' : 'is'} close to the limit.` };
  const pace = pm.expense && monthFrac > 0.2 ? m.expense / monthFrac / pm.expense : 0;
  if (pace > 1.15) return { color: 'var(--debt)', text: `Spending is running ${pct(pace - 1)} faster than last month.` };
  return { color: 'var(--accent)', text: m.income ? `On track. You've kept ${pct(m.savingsRate)} of this month's income.` : 'On track. Add income to see your savings rate.' };
}
function evRow(e) {
  const lbl = { income: 'Income', bill: 'Payment', sip: 'Investment', card: 'Card bill', emi: 'EMI', goal: 'Goal' }[e.kind];
  return `<div class="row"><span class="ic" style="font-size:12px;font-weight:700;flex-direction:column;line-height:1.05"><span style="font-size:10px;color:var(--muted);font-weight:600">${MON[parseD(e.date).getMonth()]}</span>${parseD(e.date).getDate()}</span><span class="t"><b>${esc(e.title)}</b><small>${lbl}, ${fmtDay(e.date)}</small></span><span class="a ${e.kind === 'income' ? 'c-in' : ''}">${fmt(e.amount)}</span></div>`;
}

/* ================= TRANSACTIONS ================= */
const txFilter = { q: '', type: 'all', from: '', to: '', cat: '', acct: '', pm: '', min: '', max: '', sort: 'latest' };
let txLimit = 80;
function filteredTx() {
  const f = txFilter; const q = f.q.trim().toLowerCase();
  let arr = txSorted().filter(t => {
    if (f.type !== 'all' && t.type !== f.type) return false;
    if (f.from && t.date < f.from) return false; if (f.to && t.date > f.to) return false;
    if (f.cat && t.categoryId !== f.cat) return false; if (f.acct && t.accountId !== f.acct && t.toAccountId !== f.acct) return false;
    if (f.pm && t.paymentMethod !== f.pm) return false;
    if (f.min && +t.amount < +f.min) return false; if (f.max && +t.amount > +f.max) return false;
    if (q) {
      const hay = [t.description, catName(t.categoryId), acctById(t.accountId)?.name, acctById(t.toAccountId)?.name, t.notes, (t.tags || []).join(' '), t.paymentMethod, String(t.amount), t.date, fmtDate(t.date)].join(' ').toLowerCase();
      if (!q.split(/\s+/).every(w => hay.includes(w.replace(/,/g, '')))) return false;
    }
    return true;
  });
  if (f.sort === 'amount') arr = [...arr].sort((a, b) => b.amount - a.amount);
  if (f.sort === 'category') arr = [...arr].sort((a, b) => catName(a.categoryId).localeCompare(catName(b.categoryId)) || b.date.localeCompare(a.date));
  return arr;
}
function vTransactions(params) {
  if (params.has('q')) txFilter.q = params.get('q');
  if (params.get('cat')) { txFilter.cat = params.get('cat'); }
  if (params.get('acct')) { txFilter.acct = params.get('acct'); }
  if (params.get('type')) txFilter.type = params.get('type');
  const nFilters = ['from', 'to', 'cat', 'acct', 'pm', 'min', 'max'].filter(k => txFilter[k]).length;
  let h = topbar('Transactions', { actions: `<button class="icon-btn" data-act="exportCsv" aria-label="Export CSV">${I('download')}</button>` });
  h += `<div class="search"><span>${I('search')}</span><input class="input" id="txq" type="search" placeholder="Search Amazon, 499, Food, HDFC…" value="${esc(txFilter.q)}" autocomplete="off"></div>
  <div class="chips mt12">${[['all', 'All'], ['expense', 'Expenses'], ['income', 'Income'], ['transfer', 'Transfers'], ['investment', 'Investments']].map(([v, l]) => `<button class="chip ${txFilter.type === v ? 'on' : ''}" data-txtype="${v}">${l}</button>`).join('')}
  <button class="chip ${nFilters ? 'on' : ''}" data-act="txFilters">${I('filter')} Filters${nFilters ? ' · ' + nFilters : ''}</button>
  <button class="chip" data-act="txSort">Sort: ${{ latest: 'Latest', amount: 'Highest', category: 'Category' }[txFilter.sort]}</button></div>
  <div id="txlist"></div>`;
  return h;
}
function renderTxList() {
  const box = $('#txlist'); if (!box) return;
  const arr = filteredTx(); const shown = arr.slice(0, txLimit);
  const out = sum(arr.filter(t => t.type === 'expense'), t => t.amount), inn = sum(arr.filter(t => t.type === 'income'), t => t.amount);
  let h = `<div class="flex between small muted" style="padding:14px 4px 0"><span>${arr.length.toLocaleString('en-IN')} transaction${arr.length === 1 ? '' : 's'}</span><span class="num">${inn ? `<span class="c-in">+${fmt(inn)}</span> · ` : ''}−${fmt(out)}</span></div>`;
  if (!arr.length) h += `<div class="card empty mt12"><h2 style="font-size:19px">${S.transactions.length ? 'No matches' : 'No transactions yet'}</h2><p>${S.transactions.length ? 'Try a different search or clear the filters.' : 'Tap Add to record your first expense.'}</p>${S.transactions.length ? '<button class="btn" data-act="clearFilters">Clear filters</button>' : '<button class="btn primary" data-act="addExpense">Add transaction</button>'}</div>`;
  else if (txFilter.sort === 'latest') {
    let cur = null, grp = [];
    const flush = () => { if (!grp.length) return; const net = sum(grp, t => t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0); h += `<div class="day-h"><span>${fmtDay(cur)}</span><span class="num">${net ? fmt(net, { sign: true }) : ''}</span></div><div class="group">${grp.map(t => txRow(t)).join('')}</div>`; grp = []; };
    for (const t of shown) { if (t.date !== cur) { flush(); cur = t.date; } grp.push(t); } flush();
  } else h += `<div class="group mt12">${shown.map(t => txRow(t, true)).join('')}</div>`;
  if (arr.length > txLimit) h += `<div id="txmore" style="padding:18px;text-align:center" class="muted small">Loading more…</div>`;
  box.innerHTML = h;
  const more = $('#txmore');
  if (more) new IntersectionObserver((en, ob) => { if (en[0].isIntersecting) { ob.disconnect(); txLimit += 120; renderTxList(); } }, { rootMargin: '400px' }).observe(more);
}

/* ================= EXPENSES ================= */
let expPeriod = 'month';
function vExpenses() {
  const k = viewMonth; const m = monthStats(k), pm = monthStats(mkAdd(k, -1));
  let h = topbar('Expenses', { actions: monthPicker(k, 'expenses') });
  const txs = S.transactions.filter(t => t.type === 'expense' && mk(t.date) === k);
  const t = today(); const weekStart = addDays(t, -((new Date().getDay() + 6) % 7));
  const wk = sum(S.transactions.filter(x => x.type === 'expense' && x.date >= weekStart && x.date <= t), x => x.amount);
  const td = sum(S.transactions.filter(x => x.type === 'expense' && x.date === t), x => x.amount);
  const days = k === curMk() ? new Date().getDate() : dim(+k.slice(0, 4), +k.slice(5) - 1);
  h += `<section class="card"><div class="muted small" style="font-weight:500">Spent in ${mkLabel(k, true)}</div><div class="big mt8">${fmt(m.expense)}</div><div class="mt8">${deltaPill(m.expense, pm.expense, true)}</div>
    <div class="grid g3 mt16"><div class="stat"><div class="l">Today</div><div class="v">${fmt(td)}</div></div><div class="stat"><div class="l">This week</div><div class="v">${fmt(wk)}</div></div><div class="stat"><div class="l">Daily average</div><div class="v">${fmt(m.expense / Math.max(1, days))}</div></div></div></section>`;
  // daily bars
  const nd = dim(+k.slice(0, 4), +k.slice(5) - 1); const daily = Array(nd).fill(0); txs.forEach(x => (daily[parseD(x.date).getDate() - 1] += +x.amount));
  h += `<section class="card"><div class="card-h"><h3>Day by day</h3></div>${barChart(daily.map((_, i) => (i + 1) % 5 === 1 ? String(i + 1) : ''), [{ name: 'Spent', color: 'var(--out)', values: daily }], 150)}</section>`;
  h += `<div class="two-col"><section class="card"><div class="card-h"><h3>By category</h3></div>${donut(Object.entries(m.byCat).map(([id, v]) => ({ label: catName(id), value: v, color: catColor(id) })), 'Spent')}
    <div class="list mt12">${Object.entries(m.byCat).sort((a, b) => b[1] - a[1]).map(([id, v]) => { const pv = pm.byCat[id] || 0; return `<a class="row" href="#/transactions?cat=${id}&type=expense"><span class="ic">${esc(catById(id)?.icon || '•')}</span><span class="t"><b>${esc(catName(id))}</b><small>${pct(v / m.expense)} of spend${pv && Math.abs(v - pv) >= 1 ? `, ${v > pv ? '↑' : '↓'} ${fmt(Math.abs(v - pv))} vs last month` : pv ? ', same as last month' : ''}</small></span><span class="a">${fmt(v)}</span></a>`; }).join('')}</div></section>`;
  const group = f => { const g = {}; txs.forEach(x => { const key = f(x) || '—'; g[key] = (g[key] || 0) + +x.amount; }); return Object.entries(g).sort((a, b) => b[1] - a[1]); };
  const merch = group(x => (x.description || '').trim()).slice(0, 8);
  const byPm = group(x => x.paymentMethod); const byAc = group(x => acctById(x.accountId)?.name);
  const kvList = arr => arr.map(([n, v]) => `<div class="kv"><span>${esc(n)}</span><span>${fmt(v)}</span></div>`).join('') || '<p class="muted small">No data.</p>';
  h += `<div><section class="card"><div class="card-h"><h3>Top merchants</h3></div>${merch.map(([n, v]) => `<a class="kv" style="text-decoration:none" href="#/transactions?q=${encodeURIComponent(n)}"><span>${esc(n)}</span><span>${fmt(v)}</span></a>`).join('') || '<p class="muted small">No data.</p>'}</section>
    <section class="card"><div class="card-h"><h3>By payment method</h3></div>${kvList(byPm)}</section>
    <section class="card"><div class="card-h"><h3>By account</h3></div>${kvList(byAc)}</section></div></div>`;
  return h;
}

/* ================= INCOME ================= */
function vIncome() {
  const k = viewMonth; const m = monthStats(k), pm = monthStats(mkAdd(k, -1));
  const last12 = monthsBack(12, k); const inc = last12.map(x => monthStats(x).income);
  const withInc = inc.filter(Boolean); const avg = withInc.length ? sum(withInc) / withInc.length : 0;
  const y = k.slice(0, 4); const annual = sum(S.transactions.filter(t => t.type === 'income' && t.date.startsWith(y)), t => t.amount);
  const fyStart = +k.slice(5) >= 4 ? `${y}-04-01` : `${+y - 1}-04-01`; const fyEnd = addDays(addMonths(fyStart, 12), -1);
  const fy = sum(S.transactions.filter(t => t.type === 'income' && t.date >= fyStart && t.date <= fyEnd), t => t.amount);
  const bySrc = {}; S.transactions.filter(t => t.type === 'income' && mk(t.date) === k).forEach(t => (bySrc[t.categoryId] = (bySrc[t.categoryId] || 0) + +t.amount));
  const growth = pm.income ? (m.income - pm.income) / pm.income : 0;
  let h = topbar('Income', { actions: monthPicker(k, 'income') });
  h += `<section class="card"><div class="muted small" style="font-weight:500">Earned in ${mkLabel(k, true)}</div><div class="big mt8 c-in">${fmt(m.income)}</div><div class="mt8">${deltaPill(m.income, pm.income)}</div>
    <div class="grid g3 mt16"><div class="stat"><div class="l">FY ${fyStart.slice(2, 4)}–${fyEnd.slice(2, 4)}</div><div class="v">${fmt(fy)}</div></div><div class="stat"><div class="l">Calendar ${y}</div><div class="v">${fmt(annual)}</div></div><div class="stat"><div class="l">Monthly avg</div><div class="v">${fmt(avg)}</div><div class="s">${pm.income ? (growth >= 0 ? '+' : '') + (growth * 100).toFixed(1) + '% MoM' : ''}</div></div></div></section>
  <div class="two-col"><section class="card"><div class="card-h"><h3>Last 12 months</h3></div>${barChart(last12.map(x => mkLabel(x)), [{ name: 'Income', color: 'var(--in)', values: inc }], 170)}</section>
  <section class="card"><div class="card-h"><h3>Sources this month</h3></div>${donut(Object.entries(bySrc).map(([id, v]) => ({ label: catName(id), value: v, color: catColor(id) })), 'Income')}</section></div>`;
  const rec = S.recurring.filter(r => r.type === 'income');
  h += `<section class="card"><div class="card-h"><h3>Recurring income</h3><button class="link" data-act="addRecurring" data-type="income">Add</button></div>${rec.length ? `<div class="list">${rec.map(recRow).join('')}</div>` : `<p class="muted small">Add your salary once and MoneyOS will record it automatically every month.</p>`}</section>`;
  const list = txSorted().filter(t => t.type === 'income' && mk(t.date) === k);
  h += `<section class="card"><div class="card-h"><h3>Income entries</h3></div>${list.length ? `<div class="list">${list.map(t => txRow(t, true)).join('')}</div>` : '<p class="muted small">No income recorded for this month.</p>'}</section>`;
  return h;
}

/* ================= ACCOUNTS ================= */
function acctSwatch(a) { return `<span class="acct-swatch" style="background:${esc(a.color || '#1B1D22')}">${a.type === 'credit' ? I('card', 2) : a.type === 'cash' ? '₹' : esc((a.name || '?')[0].toUpperCase())}</span>`; }
function vAccounts() {
  const b = balances(); const nw = netWorth();
  let h = topbar('Accounts', { actions: `<button class="btn sm primary" data-act="addAccount">${I('plus', 2.2)} Add</button>` });
  h += `<div class="grid g2 g4-d"><div class="stat"><div class="l">Bank</div><div class="v">${fmt(nw.bank)}</div></div><div class="stat"><div class="l">Cash & wallets</div><div class="v">${fmt(nw.cash)}</div></div><div class="stat"><div class="l">Cards owed</div><div class="v c-debt">${fmt(nw.card)}</div></div><div class="stat"><div class="l">Other</div><div class="v">${fmt(nw.investAcct + nw.otherAssets - nw.otherLiab)}</div></div></div>`;
  const groups = [['Bank & savings', ['bank', 'savings']], ['Cash & wallets', ['cash', 'wallet']], ['Credit cards', ['credit']], ['Investment accounts', ['investment']], ['Other', ['asset', 'liability']]];
  for (const [title, types] of groups) {
    const arr = activeAccounts().filter(a => types.includes(a.type)); if (!arr.length) continue;
    h += `<div class="section-t">${title}</div><div class="group">${arr.map(a => { const v = b[a.id] || 0; const owe = a.type === 'credit' || a.type === 'liability'; return `<a class="row" href="#/account/${a.id}">${acctSwatch(a)}<span class="t"><b>${esc(a.name)}</b><small>${esc([a.institution, a.last4 ? '•• ' + a.last4 : '', ACCT_TYPES[a.type]].filter(Boolean).join(', '))}</small></span><span class="a ${owe && v < 0 ? 'c-debt' : v < 0 ? 'c-out' : ''}">${fmt(owe ? Math.abs(v) : v)}${owe && v < 0 ? '<small>owed</small>' : ''}</span></a>`; }).join('')}</div>`;
  }
  const arch = S.accounts.filter(a => a.archived);
  if (arch.length) h += `<div class="section-t">Archived</div><div class="group">${arch.map(a => `<a class="row" href="#/account/${a.id}">${acctSwatch(a)}<span class="t"><b>${esc(a.name)}</b><small>History kept</small></span><span class="a muted">${fmt(b[a.id] || 0)}</span></a>`).join('')}</div>`;
  h += `<p class="small muted" style="margin:16px 4px">MoneyOS never asks for bank logins. Balances are calculated from your opening balance and the transactions you record.</p>`;
  return h;
}
function vAccount(id) {
  const a = acctById(id); if (!a) return topbar('Account', { back: 'accounts' }) + emptyCard('Account not found', 'It may have been deleted.');
  const b = balances()[a.id] || 0; const txs = txSorted().filter(t => t.accountId === id || t.toAccountId === id);
  const k = curMk(); const inflow = sum(txs.filter(t => mk(t.date) === k && (t.type === 'income' || (t.type === 'transfer' && t.toAccountId === id))), t => t.amount);
  const outflow = sum(txs.filter(t => mk(t.date) === k && (t.type === 'expense' || t.type === 'investment' || (t.type === 'transfer' && t.accountId === id))), t => t.amount);
  let h = topbar(a.name, { back: a.type === 'credit' ? 'cards' : 'accounts', actions: `<button class="icon-btn" data-act="editAccount" data-id="${id}" aria-label="Edit">${I('edit')}</button>` });
  h += `<section class="card"><div class="flex">${acctSwatch(a)}<div><div style="font-weight:600">${esc(ACCT_TYPES[a.type])}</div><div class="small muted">${esc([a.institution, a.last4 ? '•• ' + a.last4 : ''].filter(Boolean).join(', ') || 'Manual account')}</div></div></div>
    <div class="muted small mt16" style="font-weight:500">${a.type === 'credit' ? 'Outstanding' : 'Current balance'}</div><div class="big mt8">${fmt(a.type === 'credit' ? Math.max(0, -b) : b)}</div>
    <div class="grid g2 mt16"><div class="stat"><div class="l">In this month</div><div class="v c-in">${fmt(inflow)}</div></div><div class="stat"><div class="l">Out this month</div><div class="v">${fmt(outflow)}</div></div></div>
    <div class="btn-row"><button class="btn sm" data-act="addExpense" data-acct="${id}">Add expense</button><button class="btn sm" data-act="addTransfer" data-to="${a.type === 'credit' ? id : ''}" data-from="${a.type === 'credit' ? '' : id}">${a.type === 'credit' ? 'Pay bill' : 'Transfer'}</button></div></section>`;
  h += `<div class="section-t">History</div>${txs.length ? `<div class="group">${txs.slice(0, 300).map(t => txRow(t, true)).join('')}</div>` : '<p class="muted small" style="margin:4px">No transactions on this account yet.</p>'}`;
  return h;
}

/* ================= CREDIT CARDS ================= */
function vCards() {
  const cards = S.accounts.filter(a => a.type === 'credit' && !a.archived);
  let h = topbar('Credit cards', { actions: `<button class="btn sm primary" data-act="addAccount" data-type="credit">${I('plus', 2.2)} Add card</button>` });
  if (!cards.length) return h + emptyCard('No credit cards yet', 'Add a card to track utilisation, bills and due dates. Spending on the card is recorded as an expense; paying the bill is a transfer.', 'Add a credit card', 'addCard');
  const infos = cards.map(a => ({ a, c: cardInfo(a) }));
  const totOut = sum(infos, x => x.c.out), totLim = sum(infos, x => x.c.limit);
  h += `<section class="card"><div class="muted small" style="font-weight:500">Total outstanding</div><div class="big mt8">${fmt(totOut)}</div>${totLim ? `<div class="mt12">${progress(totOut, totLim, 'lg')}</div><div class="util-legend"><span>${pct(totOut / totLim)} of ${fmt(totLim)} limit</span><span>${fmt(totLim - totOut)} available</span></div>` : ''}</section>`;
  const up = infos.filter(x => x.c.out > 0).sort((p, q) => p.c.due.localeCompare(q.c.due));
  if (up.length) h += `<section class="card"><div class="card-h"><h3>Upcoming card payments</h3></div><div class="list">${up.map(({ a, c }) => { const d = daysBetween(today(), c.due); return `<div class="row">${acctSwatch(a)}<span class="t"><b>${esc(a.name)}</b><small>${d === 0 ? 'Due today' : d < 0 ? 'Overdue' : `Due in ${d} day${d > 1 ? 's' : ''}`}, ${fmtDate(c.due, { day: 'numeric', month: 'short' })}</small></span><button class="btn sm accent" data-act="addTransfer" data-to="${a.id}" data-amt="${c.out}">Pay</button></div>`; }).join('')}</div></section>`;
  h += `<div class="two-col">` + infos.map(({ a, c }) => `<section class="card"><a class="card-h" href="#/account/${a.id}" style="text-decoration:none"><div class="flex">${acctSwatch(a)}<div><h3>${esc(a.name)}</h3><div class="small muted">${esc([a.institution, a.last4 ? '•• ' + a.last4 : ''].filter(Boolean).join(', '))}</div></div></div>${I('chev')}</a>
    <div class="flex between"><span class="mid">${fmt(c.out)}</span><span class="muted small num">${c.limit ? 'of ' + fmt(c.limit) : 'No limit set'}</span></div>
    ${c.limit ? `<div class="mt12">${progress(c.out, c.limit, 'lg')}</div><div class="util-legend"><span>${pct(c.util)} utilised${c.util > 0.3 ? ' (keep under 30%)' : ''}</span><span>${fmt(c.avail)} available</span></div>` : ''}
    <div class="mt12"><div class="kv"><span>Last statement</span><span>${fmt(c.statement)} on ${fmtDate(c.lastBill, { day: 'numeric', month: 'short' })}</span></div><div class="kv"><span>Next bill date</span><span>${fmtDate(c.nextBill, { day: 'numeric', month: 'short' })}</span></div><div class="kv"><span>Payment due</span><span>${fmtDate(c.due, { day: 'numeric', month: 'short' })}</span></div><div class="kv"><span>Minimum due</span><span>${fmt(c.minDue)}</span></div><div class="kv"><span>Paid this cycle</span><span class="c-in">${fmt(c.paid)}</span></div></div>
    <div class="btn-row"><button class="btn sm" data-act="addExpense" data-acct="${a.id}" data-pm="Credit card">Add spend</button><button class="btn sm accent" data-act="addTransfer" data-to="${a.id}" data-amt="${c.out}">Pay bill</button></div></section>`).join('') + `</div>`;
  return h;
}

/* ================= LOANS ================= */
function vLoans() {
  let h = topbar('Loans & EMIs', { actions: `<button class="btn sm primary" data-act="addLoan">${I('plus', 2.2)} Add loan</button>` });
  if (!S.loans.length) return h + emptyCard('No loans tracked', 'Add a home, car or personal loan to see outstanding principal, interest left and your payoff date.', 'Add a loan', 'addLoan');
  const st = S.loans.map(l => ({ l, s: loanStatus(l) }));
  h += `<section class="card"><div class="muted small" style="font-weight:500">Total outstanding principal</div><div class="big mt8 c-debt">${fmt(sum(st, x => x.s.outstanding))}</div>
   <div class="grid g3 mt16"><div class="stat"><div class="l">Monthly EMIs</div><div class="v">${fmt(sum(st.filter(x => x.s.remaining), x => x.s.emi))}</div></div><div class="stat"><div class="l">Interest left</div><div class="v">${fmt(sum(st, x => x.s.remainingInterest))}</div></div><div class="stat"><div class="l">Debt-free by</div><div class="v" style="font-size:16px">${fmtDate(st.map(x => x.s.endDate).sort().pop(), { month: 'short', year: 'numeric' })}</div></div></div></section>`;
  h += `<div class="two-col">${st.map(({ l, s }) => `<a class="card" href="#/loan/${l.id}" style="text-decoration:none;display:block"><div class="card-h"><h3>${esc(l.name)}</h3>${I('chev')}</div><div class="flex between"><span class="mid">${fmt(s.outstanding)}</span><span class="small muted">${(+l.rate).toFixed(2)}% p.a.</span></div><div class="mt12">${progress(+l.principal - s.outstanding, +l.principal, 'plain')}</div><div class="util-legend"><span>${pct((+l.principal - s.outstanding) / l.principal)} repaid</span><span>${s.remaining} EMIs left</span></div>
   <div class="mt12"><div class="kv"><span>EMI</span><span>${fmt(s.emi)}</span></div><div class="kv"><span>Next EMI</span><span>${s.next ? fmtDate(s.next.date) : 'Paid off'}</span></div></div></a>`).join('')}</div>`;
  return h;
}
function vLoan(id) {
  const l = S.loans.find(x => x.id === id); if (!l) return topbar('Loan', { back: 'loans' }) + emptyCard('Loan not found', '');
  const s = loanStatus(l);
  let h = topbar(l.name, { back: 'loans', actions: `<button class="icon-btn" data-act="editLoan" data-id="${id}" aria-label="Edit">${I('edit')}</button>` });
  h += `<section class="card"><div class="muted small" style="font-weight:500">Outstanding principal</div><div class="big mt8">${fmt(s.outstanding)}</div><div class="mt12">${progress(+l.principal - s.outstanding, +l.principal, 'lg plain')}</div><div class="util-legend"><span>${s.paidCount} of ${s.rows.length} EMIs paid</span><span>Ends ${fmtDate(s.endDate, { month: 'short', year: 'numeric' })}</span></div>
   <div class="grid g2 g4-d mt16"><div class="stat"><div class="l">EMI</div><div class="v">${fmt(s.emi)}</div></div><div class="stat"><div class="l">Principal</div><div class="v">${fmt(+l.principal)}</div></div><div class="stat"><div class="l">Total interest</div><div class="v">${fmt(s.totalInterest)}</div></div><div class="stat"><div class="l">Interest left</div><div class="v">${fmt(s.remainingInterest)}</div></div></div>
   <div class="mt16">${donut([{ label: 'Principal', value: +l.principal, color: 'var(--inv)' }, { label: 'Interest', value: s.totalInterest, color: 'var(--debt)' }], 'Total cost')}</div>
   <div class="btn-row"><button class="btn sm" data-act="recordEmi" data-id="${id}">Record EMI as expense</button></div></section>
   <section class="card"><div class="card-h"><h3>Amortisation schedule</h3></div><div class="tbl-wrap" style="max-height:460px;overflow:auto"><table class="tbl"><thead><tr><th>#</th><th>Date</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody>
   ${s.rows.map(r => `<tr class="${r.date <= today() ? 'paid' : ''}"><td>${r.no}</td><td>${fmtDate(r.date, { month: 'short', year: '2-digit' })}</td><td>${fmt(r.emi)}</td><td>${fmt(r.principal)}</td><td>${fmt(r.interest)}</td><td>${fmt(r.balance)}</td></tr>`).join('')}</tbody></table></div>
   <p class="small muted" style="margin:10px 0 0">EMIs dated on or before today are treated as paid.</p></section>`;
  return h;
}

/* ================= INVESTMENTS ================= */
function vInvestments() {
  const p = portfolio();
  let h = topbar('Investments', { actions: `<button class="btn sm primary" data-act="addInvestment">${I('plus', 2.2)} Add</button>` });
  if (!S.investments.length) return h + emptyCard('Track your portfolio', 'Add stocks, mutual funds, FDs, PPF, NPS or gold manually. No brokerage login needed.', 'Add an investment', 'addInvestment');
  h += `<section class="card"><div class="muted small" style="font-weight:500">Current value</div><div class="big mt8">${fmt(p.current)}</div>
   <div class="mt8"><span class="delta ${p.ret >= 0 ? 'good' : 'bad'}">${fmt(p.ret, { sign: true })} (${(p.retPct * 100).toFixed(2)}%)</span></div>
   <div class="grid g2 mt16"><div class="stat"><div class="l">Invested</div><div class="v">${fmt(p.invested)}</div></div><div class="stat"><div class="l">Absolute return</div><div class="v ${p.ret >= 0 ? 'c-in' : 'c-out'}">${fmt(p.ret, { sign: true })}</div></div></div></section>
   <div class="two-col"><section class="card"><div class="card-h"><h3>Asset allocation</h3></div>${donut(Object.entries(p.byType).map(([t, v]) => ({ label: t, value: v, color: INV_COLORS[t] || '#6B7080' })), 'Portfolio')}</section>
   <section class="card"><div class="card-h"><h3>This month</h3></div><div class="kv"><span>Invested this month</span><span>${fmt(monthStats(curMk()).investment)}</span></div><div class="kv"><span>Investment rate</span><span>${pct(monthStats(curMk()).income ? monthStats(curMk()).investment / monthStats(curMk()).income : 0)}</span></div><div class="kv"><span>Active SIPs</span><span>${S.recurring.filter(r => r.type === 'investment' && !r.paused).length}</span></div><p class="small muted" style="margin:10px 0 0">Update current values whenever you check your statements. Tap a holding to edit.</p></section></div>`;
  for (const t of INV_TYPES) {
    const arr = S.investments.filter(x => x.type === t); if (!arr.length) continue;
    h += `<div class="section-t">${t}</div><div class="group">${arr.map(x => { const r = (+x.currentValue) - (+x.invested); return `<button class="row" data-inv="${x.id}"><span class="ic" style="background:${INV_COLORS[t]}1f;color:${INV_COLORS[t]};font-weight:700;font-size:14px">${esc((x.name || '?')[0])}</span><span class="t"><b>${esc(x.name)}</b><small>${fmt(+x.invested)} invested since ${fmtDate(x.date, { month: 'short', year: 'numeric' })}</small></span><span class="a">${fmt(+x.currentValue)}<small class="${r >= 0 ? 'c-in' : 'c-out'}">${r >= 0 ? '+' : ''}${x.invested ? ((r / x.invested) * 100).toFixed(1) : 0}%</small></span></button>`; }).join('')}</div>`;
  }
  return h;
}

/* ================= NET WORTH ================= */
function vNetWorth() {
  const nw = netWorth(); const ms = monthsBack(12);
  const earliest = S.transactions.length ? txSorted()[txSorted().length - 1].date : today();
  const shown = ms.filter(k => mkEnd(k) >= earliest.slice(0, 7) + '-01' || k === curMk());
  const series = shown.map(k => (k === curMk() ? nw : netWorth(mkEnd(k))));
  const first = series[0], prev = series.length > 1 ? series[series.length - 2] : null;
  const g = (a, b) => (b ? (a - b) / Math.abs(b) : 0);
  let h = topbar('Net worth', { back: 'more' });
  h += `<section class="card"><div class="muted small" style="font-weight:500">Assets minus liabilities, today</div><div class="big mt8 ${nw.net < 0 ? 'c-out' : ''}">${fmt(nw.net)}</div>${prev ? `<div class="mt8">${deltaPill(nw.net, prev.net)}</div>` : ''}
    <div class="mt16">${lineChart(shown.map(k => mkLabel(k)), series.map(x => x.net))}</div></section>
  <div class="grid g3"><div class="stat"><div class="l">Asset growth</div><div class="v">${fmt(nw.assets - first.assets, { sign: true })}</div><div class="s">since ${mkLabel(shown[0])}</div></div><div class="stat"><div class="l">Liabilities reduced</div><div class="v">${fmt(first.liabilities - nw.liabilities, { sign: true })}</div><div class="s">since ${mkLabel(shown[0])}</div></div><div class="stat"><div class="l">Net worth growth</div><div class="v">${(g(nw.net, first.net) * 100).toFixed(1)}%</div><div class="s">since ${mkLabel(shown[0])}</div></div></div>
  <div class="two-col mt12"><section class="card"><div class="card-h"><h3>Assets</h3><span class="num" style="font-weight:600">${fmt(nw.assets)}</span></div>
    <div class="kv"><span>Bank & savings</span><span>${fmt(nw.bank)}</span></div><div class="kv"><span>Cash & wallets</span><span>${fmt(nw.cash)}</span></div><div class="kv"><span>Investments</span><span>${fmt(nw.investments)}</span></div><div class="kv"><span>Investment accounts</span><span>${fmt(nw.investAcct)}</span></div><div class="kv"><span>Other assets</span><span>${fmt(nw.otherAssets)}</span></div></section>
  <section class="card"><div class="card-h"><h3>Liabilities</h3><span class="num c-debt" style="font-weight:600">${fmt(nw.liabilities)}</span></div>
    <div class="kv"><span>Credit cards</span><span>${fmt(nw.card)}</span></div><div class="kv"><span>Loans</span><span>${fmt(nw.loans)}</span></div><div class="kv"><span>Other liabilities</span><span>${fmt(nw.otherLiab)}</span></div>
    <p class="small muted" style="margin:10px 0 0">Add property, vehicles or money lent as an <button class="link" data-act="addAccount" data-type="asset">other asset</button> account.</p></section></div>
  <section class="card"><div class="card-h"><h3>Month by month</h3></div>${series.slice().reverse().map((x, i, arr) => `<div class="kv"><span>${mkLabel(shown[shown.length - 1 - i], true)}</span><span>${fmt(x.net)}${arr[i + 1] ? ` <span class="${x.net >= arr[i + 1].net ? 'c-in' : 'c-out'}" style="font-weight:500;font-size:12.5px">${x.net >= arr[i + 1].net ? '↑' : '↓'}${fmtC(Math.abs(x.net - arr[i + 1].net))}</span>` : ''}</span></div>`).join('')}
  <p class="small muted" style="margin:10px 0 0">Past months use recorded balances and loan schedules; investment values between purchase and today are estimated.</p></section>`;
  return h;
}
