/* ================= BUDGET ================= */
function budgetRows(k) {
  const m = monthStats(k);
  return S.budgets.map(b => { const cat = catById(b.categoryId) || { name: 'Unknown', icon: '•' }; const spent = m.byCat[b.categoryId] || 0; return { b, cat, amount: +b.amount, spent, p: b.amount ? spent / b.amount : 0 }; });
}
function vBudget() {
  const k = viewMonth; const rows = budgetRows(k).sort((a, b) => b.p - a.p);
  let h = topbar('Budget', { actions: monthPicker(k, 'budget') });
  if (!rows.length) return h + emptyCard('Plan your month', 'Set a monthly limit for the categories you want to watch, like Food or Shopping. MoneyOS will let you know gently as you approach it.', 'Set a budget', 'addBudget');
  const tb = sum(rows, r => r.amount), ts = sum(rows, r => r.spent);
  const d = new Date(); const isCur = k === curMk(); const daysLeft = isCur ? dim(d.getFullYear(), d.getMonth()) - d.getDate() + 1 : 0;
  h += `<section class="card"><div class="flex between"><div><div class="muted small" style="font-weight:500">Spent of budget</div><div class="big mt8">${fmt(ts)}</div></div><div class="right"><div class="muted small">of ${fmt(tb)}</div><div class="mid mt8 ${tb - ts < 0 ? 'c-out' : ''}">${fmt(tb - ts)}</div><div class="small muted">${tb - ts >= 0 ? 'remaining' : 'over'}</div></div></div>
   <div class="mt12">${progress(ts, tb, 'lg')}</div>${isCur && tb > ts ? `<p class="small muted" style="margin:10px 0 0">You can spend about <b style="color:var(--text)">${fmt((tb - ts) / daysLeft)}</b> a day for the remaining ${daysLeft} days.</p>` : ''}</section>`;
  const notes = rows.filter(r => r.p >= 0.8).map(r => r.spent > r.amount ? `${r.cat.name} spending is ${fmt(r.spent - r.amount)} above budget.` : `You've used ${Math.round(r.p * 100)}% of your ${r.cat.name} budget.`);
  if (notes.length) h += `<div class="banner info">${notes.map(esc).join('<br>')}</div>`;
  h += `<div class="group">${rows.map(r => `<button class="row" data-budget="${r.b.id}" style="flex-wrap:wrap;row-gap:8px"><span class="ic">${esc(r.cat.icon)}</span><span class="t"><b>${esc(r.cat.name)}</b><small>${r.spent > r.amount ? `${fmt(r.spent - r.amount)} over` : `${fmt(r.amount - r.spent)} left`}</small></span><span class="a">${fmt(r.spent)}<small>of ${fmt(r.amount)}</small></span><span style="flex:0 0 100%;padding-left:50px">${progress(r.spent, r.amount)}</span></button>`).join('')}</div>
   <div class="btn-row"><button class="btn" data-act="addBudget">${I('plus', 2.2)} Add budget</button></div>`;
  const unb = Object.entries(monthStats(k).byCat).filter(([id]) => !S.budgets.some(b => b.categoryId === id)).sort((a, b) => b[1] - a[1]);
  if (unb.length) h += `<div class="section-t">Spending without a budget</div><div class="group">${unb.map(([id, v]) => `<button class="row" data-act="addBudget" data-cat="${id}"><span class="ic">${esc(catById(id)?.icon || '•')}</span><span class="t"><b>${esc(catName(id))}</b><small>Tap to set a budget</small></span><span class="a">${fmt(v)}</span></button>`).join('')}</div>`;
  return h;
}

/* ================= RECURRING ================= */
function recRow(r) {
  const nx = occurrences(r, r.autoPost && r.lastPosted ? addDays(r.lastPosted, 1) : today(), addDays(today(), 800))[0];
  const color = r.type === 'income' ? 'c-in' : r.type === 'investment' ? 'c-inv' : '';
  return `<button class="row" data-rec="${r.id}"><span class="ic">${r.type === 'investment' ? I('trend') : esc(catById(r.categoryId)?.icon || '↻')}</span><span class="t"><b>${esc(r.description)}</b><small>${FREQS[r.frequency]}${r.paused ? ', paused' : nx ? ', next ' + fmtDate(nx, { day: 'numeric', month: 'short' }) : ', ended'}${r.autoPost ? ', auto' : ''}</small></span><span class="a ${color}">${fmt(+r.amount)}</span></button>`;
}
function vRecurring() {
  let h = topbar('Recurring', { back: 'more', actions: `<button class="btn sm primary" data-act="addRecurring">${I('plus', 2.2)} Add</button>` });
  const up = events(today(), addDays(today(), 30)).filter(e => e.src === 'recurring' || e.src === 'loan' || e.src === 'card');
  const outs = sum(up.filter(e => e.kind !== 'income'), e => e.amount), ins = sum(up.filter(e => e.kind === 'income'), e => e.amount);
  h += `<section class="card"><div class="card-h"><h3>Next 30 days</h3></div><div class="grid g2"><div class="stat"><div class="l">Commitments</div><div class="v">${fmt(outs)}</div></div><div class="stat"><div class="l">Expected income</div><div class="v c-in">${fmt(ins)}</div></div></div>
   ${up.length ? `<div class="list mt12">${up.map(evRow).join('')}</div>` : '<p class="muted small mt12">Nothing scheduled.</p>'}</section>`;
  if (!S.recurring.length) return h + emptyCard('Automate the regulars', 'Salary, rent, SIPs, subscriptions and insurance can be added once and recorded for you on schedule.', 'Add recurring', 'addRecurring');
  for (const [t, l] of [['income', 'Income'], ['expense', 'Bills & expenses'], ['investment', 'SIPs & investments'], ['transfer', 'Transfers']]) {
    const arr = S.recurring.filter(r => r.type === t); if (arr.length) h += `<div class="section-t">${l}</div><div class="group">${arr.map(recRow).join('')}</div>`;
  }
  return h;
}

/* ================= GOALS ================= */
function goalCalc(g) {
  const rem = Math.max(0, (+g.target) - (+g.current));
  const months = g.targetDate ? Math.max(1, (parseD(g.targetDate).getFullYear() - new Date().getFullYear()) * 12 + parseD(g.targetDate).getMonth() - new Date().getMonth()) : 0;
  const need = months ? rem / months : 0; const mc = +g.monthly || 0;
  const eta = mc > 0 ? addMonths(today(), Math.ceil(rem / mc)) : null;
  return { rem, months, need, eta, onTrack: !g.targetDate || !mc || mc >= need - 1 };
}
function vGoals() {
  let h = topbar('Goals', { back: 'more', actions: `<button class="btn sm primary" data-act="addGoal">${I('plus', 2.2)} Add</button>` });
  if (!S.goals.length) return h + emptyCard('What are you saving for?', 'An emergency fund, a trip, a car or a house. Set a target and a date, and MoneyOS works out the monthly amount.', 'Set a goal', 'addGoal');
  h += `<div class="two-col">${S.goals.map(g => { const c = goalCalc(g); const done = +g.current >= +g.target; return `<section class="card"><div class="card-h"><div class="flex"><span class="ic" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--surface-2);font-size:18px">${GOAL_ICONS[g.type] || '🎯'}</span><div><h3>${esc(g.name)}</h3><div class="small muted">${g.targetDate ? 'By ' + fmtDate(g.targetDate, { month: 'short', year: 'numeric' }) : esc(g.type)}</div></div></div><button class="icon-btn" data-goal="${g.id}" aria-label="Edit">${I('edit')}</button></div>
    <div class="flex between"><span class="mid">${fmt(+g.current)}</span><span class="muted small num">of ${fmt(+g.target)}</span></div><div class="mt12">${progress(+g.current, +g.target, 'lg plain')}</div><div class="util-legend"><span>${pct(+g.current / (+g.target || 1))}</span><span>${done ? 'Reached' : fmt(c.rem) + ' to go'}</span></div>
    ${done ? '' : `<div class="mt12">${g.targetDate ? `<div class="kv"><span>Needed per month</span><span>${fmt(c.need)}</span></div>` : ''}${+g.monthly ? `<div class="kv"><span>You contribute</span><span>${fmt(+g.monthly)}/mo</span></div>` : ''}${c.eta ? `<div class="kv"><span>At this pace</span><span>${fmtDate(c.eta, { month: 'short', year: 'numeric' })}</span></div>` : ''}</div>
    ${g.targetDate && +g.monthly && !c.onTrack ? `<p class="small" style="margin:8px 0 0;color:var(--debt)">Add ${fmt(c.need - g.monthly)} more a month to hit the date.</p>` : ''}
    <div class="btn-row"><button class="btn sm" data-act="goalAdd" data-id="${g.id}">Add money</button></div>`}</section>`; }).join('')}</div>`;
  return h;
}

/* ================= CALENDAR ================= */
let calMonth = curMk(), calSel = today();
function vCalendar() {
  const k = calMonth; const [y, m] = k.split('-').map(Number); const first = new Date(y, m - 1, 1); const lead = (first.getDay() + 6) % 7;
  const from = addDays(k + '-01', -lead); const to = addDays(from, 41);
  const ev = events(from > today() ? from : today(), to);
  const txByDay = {}; S.transactions.forEach(t => { if (t.date >= from && t.date <= to) (txByDay[t.date] = txByDay[t.date] || []).push(t); });
  const evByDay = {}; ev.forEach(e => (evByDay[e.date] = evByDay[e.date] || []).push(e));
  let h = topbar('Calendar', { back: 'more' });
  h += `<section class="card"><div class="flex between" style="margin-bottom:10px"><button class="icon-btn" data-cal="${mkAdd(k, -1)}" aria-label="Previous month">${I('back', 2)}</button><b>${mkLabel(k, true)}</b><button class="icon-btn" data-cal="${mkAdd(k, 1)}" aria-label="Next month"><span style="transform:rotate(180deg)">${I('back', 2)}</span></button></div>
    <div class="cal">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<div class="dow">${d}</div>`).join('')}`;
  for (let i = 0; i < 42; i++) {
    const d = addDays(from, i); const kinds = new Set([...(evByDay[d] || []).map(e => e.kind), ...((txByDay[d] || []).length ? ['tx'] : [])]);
    h += `<button class="${d.slice(0, 7) !== k ? 'out' : ''} ${d === today() ? 'today' : ''} ${d === calSel ? 'sel' : ''}" data-day="${d}">${parseD(d).getDate()}<span class="dots">${[...kinds].slice(0, 4).map(x => `<i style="background:${EV_COLOR[x]}"></i>`).join('')}</span></button>`;
  }
  h += `</div><div class="legend">${[['income', 'Income'], ['bill', 'Bills'], ['sip', 'SIP'], ['emi', 'EMI & cards'], ['tx', 'Recorded']].map(([k2, l]) => `<span><b style="background:${EV_COLOR[k2]};border-radius:50%"></b>${l}</span>`).join('')}</div></section>`;
  const dayEv = (evByDay[calSel] || []); const dayTx = (txByDay[calSel] || S.transactions.filter(t => t.date === calSel));
  h += `<div class="section-t">${fmtDay(calSel)}${calSel !== today() ? ', ' + fmtDate(calSel) : ''}</div>`;
  if (!dayEv.length && !dayTx.length) h += `<p class="muted small" style="margin:4px">Nothing on this day.</p>`;
  if (dayEv.length) h += `<div class="group">${dayEv.map(evRow).join('')}</div>`;
  if (dayTx.length) h += `<div class="group mt12">${dayTx.map(t => txRow(t)).join('')}</div>`;
  return h;
}

/* ================= REPORTS ================= */
function vReports() {
  const k = viewMonth; const m = monthStats(k), pm = monthStats(mkAdd(k, -1)); const nw = k === curMk() ? netWorth() : netWorth(mkEnd(k));
  const b = balances(k === curMk() ? undefined : mkEnd(k));
  const liquid = sum(S.accounts.filter(a => LIQUID.includes(a.type)), a => b[a.id] || 0);
  const ess3 = monthsBack(3, mkAdd(k, -1)).map(x => monthStats(x).essential).filter(Boolean);
  const essAvg = ess3.length ? sum(ess3) / ess3.length : m.essential;
  const debtPay = m.emi;
  const r = { sr: m.savingsRate, er: m.income ? m.expense / m.income : 0, ir: m.income ? m.investment / m.income : 0, dti: m.income ? debtPay / m.income : 0, ef: essAvg ? liquid / essAvg : 0 };
  let h = topbar('Insights', { actions: monthPicker(k, 'reports') });
  h += `<section class="card"><div class="card-h"><h3>${mkLabel(k, true)} report</h3><button class="link" data-act="exportCsv" data-month="${k}">Export CSV</button></div>
   <div class="grid g2 g4-d"><div class="stat"><div class="l">Income</div><div class="v c-in">${fmt(m.income)}</div></div><div class="stat"><div class="l">Expenses</div><div class="v">${fmt(m.expense)}</div></div><div class="stat"><div class="l">Invested</div><div class="v c-inv">${fmt(m.investment)}</div></div><div class="stat"><div class="l">Left over</div><div class="v">${fmt(m.savings)}</div></div>
   <div class="stat"><div class="l">Savings rate</div><div class="v">${pct(m.savingsRate)}</div></div><div class="stat"><div class="l">Net cash flow</div><div class="v ${m.cashflow < 0 ? 'c-out' : ''}">${fmt(m.cashflow, { sign: true })}</div></div><div class="stat"><div class="l">Net worth</div><div class="v">${fmt(nw.net)}</div></div><div class="stat"><div class="l">Transactions</div><div class="v">${m.count}</div></div></div></section>`;
  // insights
  const ins = [];
  if (pm.income && m.income) { const a = pm.savingsRate, c = m.savingsRate; if (Math.abs(c - a) > 0.01) ins.push(['📊', `Your savings rate ${c > a ? 'increased' : 'dropped'} from ${pct(a)} to ${pct(c)} this month.`]); }
  if (pm.expense) { const d = (m.expense - pm.expense) / pm.expense; if (Math.abs(d) > 0.03) ins.push([d < 0 ? '↓' : '↑', `You spent ${fmt(Math.abs(m.expense - pm.expense))} ${d < 0 ? 'less' : 'more'} than last month (${Math.abs(d * 100).toFixed(1)}%).`]); }
  const changes = Object.keys({ ...m.byCat, ...pm.byCat }).map(id => ({ id, d: (m.byCat[id] || 0) - (pm.byCat[id] || 0) })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
  if (changes[0] && Math.abs(changes[0].d) > 500) ins.push(['🔎', `Biggest change: ${catName(changes[0].id)}, ${changes[0].d > 0 ? 'up' : 'down'} ${fmt(Math.abs(changes[0].d))}.`]);
  if (r.ef) ins.push(['🛟', r.ef >= 6 ? `Liquid money covers ${r.ef.toFixed(1)} months of essentials. That's a solid cushion.` : `Liquid money covers ${r.ef.toFixed(1)} months of essentials. 6 months is a common target.`]);
  if (m.income && r.ir < 0.1 && m.investment >= 0) ins.push(['📈', `You invested ${pct(r.ir)} of income. Even a small SIP increase compounds.`]);
  if (ins.length) h += `<section class="card"><div class="card-h"><h3>What changed</h3></div>${ins.map(([i, t]) => `<div class="insight"><i>${i}</i><span>${esc(t)}</span></div>`).join('')}</section>`;
  const ratio = (name, v, f, hint, good) => `<div class="kv"><span>${name}<br><small class="faint">${hint}</small></span><span style="color:${good === undefined ? 'var(--text)' : good ? 'var(--in)' : 'var(--debt)'}">${f}</span></div>`;
  h += `<div class="two-col"><section class="card"><div class="card-h"><h3>Financial ratios</h3></div>
    ${ratio('Savings rate', r.sr, pct(r.sr), '(Income − expenses) ÷ income', m.income ? r.sr >= 0.2 : undefined)}
    ${ratio('Expense ratio', r.er, pct(r.er), 'Expenses ÷ income', m.income ? r.er <= 0.7 : undefined)}
    ${ratio('Investment rate', r.ir, pct(r.ir), 'Investments ÷ income', m.income ? r.ir >= 0.15 : undefined)}
    ${ratio('Debt-to-income', r.dti, pct(r.dti), 'EMIs ÷ income', m.income ? r.dti <= 0.4 : undefined)}
    ${ratio('Emergency fund', r.ef, r.ef ? r.ef.toFixed(1) + ' months' : '—', 'Liquid money ÷ monthly essentials', r.ef ? r.ef >= 6 : undefined)}
    <p class="small muted" style="margin:10px 0 0">Essentials are categories marked essential (housing, food, utilities, health, transport, EMI, insurance). Change this in Settings → Categories.</p></section>
   <section class="card"><div class="card-h"><h3>Biggest categories</h3></div>${Object.entries(m.byCat).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, v]) => `<div style="margin-bottom:12px"><div class="flex between small"><span style="font-weight:550">${esc(catById(id)?.icon || '')} ${esc(catName(id))}</span><span class="num">${fmt(v)} <span class="muted">${pct(v / (m.expense || 1))}</span></span></div><div class="bar mt8"><i style="width:${v / (Object.values(m.byCat).reduce((a, b) => Math.max(a, b), 0) || 1) * 100}%;background:${catColor(id)}"></i></div></div>`).join('') || '<p class="muted small">No expenses this month.</p>'}</section></div>`;
  const big = S.transactions.filter(t => t.type === 'expense' && mk(t.date) === k).sort((a, b) => b.amount - a.amount).slice(0, 5);
  h += `<section class="card"><div class="card-h"><h3>Biggest transactions</h3></div>${big.length ? `<div class="list">${big.map(t => txRow(t, true)).join('')}</div>` : '<p class="muted small">None yet.</p>'}</section>`;
  const cm = monthsBack(6, k);
  h += `<section class="card"><div class="card-h"><h3>Month on month</h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Month</th><th>Income</th><th>Spent</th><th>Invested</th><th>Saved %</th></tr></thead><tbody>${cm.slice().reverse().map(x => { const s = monthStats(x); return `<tr><td>${mkLabel(x, true)}</td><td>${fmt(s.income)}</td><td>${fmt(s.expense)}</td><td>${fmt(s.investment)}</td><td>${s.income ? pct(s.savingsRate) : '—'}</td></tr>`; }).join('')}</tbody></table></div></section>`;
  return h;
}

/* ================= MORE ================= */
function vMore() {
  const items = [['income', 'Income', 'in'], ['expenses', 'Expenses', 'out'], ['accounts', 'Accounts', 'bank'], ['cards', 'Credit cards', 'card'], ['loans', 'Loans', 'loan'], ['networth', 'Net worth', 'net'], ['goals', 'Goals', 'target'], ['recurring', 'Recurring', 'repeat'], ['calendar', 'Calendar', 'cal'], ['reports', 'Insights', 'chart'], ['settings', 'Settings', 'gear'], ['privacy', 'Privacy', 'shield']];
  return topbar('More') + `<div class="more-grid">${items.map(([r, l, i]) => `<a href="#/${r}">${I(i)}${l}</a>`).join('')}</div>
  <section class="card mt16"><div class="card-h"><h3>Your data</h3></div><p class="small muted" style="margin:0 0 12px">Your data is stored locally. Back up regularly so you don't lose it if you clear browser data or change devices.</p><div class="btn-row" style="margin-top:0"><button class="btn sm primary" data-act="backup">${I('download')} Backup now</button><button class="btn sm" data-act="restore">${I('upload')} Restore backup</button></div>
  <p class="small muted" style="margin:12px 0 0">Last backup: <b style="color:var(--text)">${S.meta.lastBackup ? fmtDate(S.meta.lastBackup.slice(0, 10)) : 'Never'}</b></p></section>`;
}

/* ================= SETTINGS ================= */
function vSettings() {
  const s = S.settings;
  const toggleRow = (label, on, act, sub) => `<label class="row" style="cursor:pointer"><span class="t"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="toggle"><input type="checkbox" data-act="${act}" ${on ? 'checked' : ''}><i></i></span></label>`;
  let h = topbar('Settings', { back: 'more' });
  h += `<div class="section-t">Appearance</div><div class="card"><div class="seg">${[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<button class="${s.theme === v ? 'on' : ''}" data-theme-set="${v}">${l}</button>`).join('')}</div>
    <label class="field"><span>Currency</span><select class="input" data-act="currency">${Object.keys(CURRENCIES).map(c => `<option ${s.currency === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
  <div class="section-t">Dashboard widgets</div><div class="group">${s.widgets.map(([id, on], i) => `<div class="row"><span class="t"><b>${WIDGET_NAMES[id]}</b></span><button class="icon-btn" data-wmove="${i}" data-dir="-1" aria-label="Move up" ${i === 0 ? 'disabled style="opacity:.3"' : ''}><span style="transform:rotate(90deg)">${I('back', 2)}</span></button><button class="icon-btn" data-wmove="${i}" data-dir="1" aria-label="Move down" ${i === s.widgets.length - 1 ? 'disabled style="opacity:.3"' : ''}><span style="transform:rotate(-90deg)">${I('back', 2)}</span></button><span class="toggle"><input type="checkbox" data-wtoggle="${i}" ${on ? 'checked' : ''} aria-label="Show ${WIDGET_NAMES[id]}"><i></i></span></div>`).join('')}</div>
  <div class="section-t">Security</div><div class="group">${toggleRow('App lock', !!S.meta.pinHash, 'pinToggle', S.meta.pinHash ? 'PIN required when you open MoneyOS' : 'Protect the app with a 4-digit PIN')}
    ${S.meta.pinHash ? `<button class="row" data-act="pinChange"><span class="t"><b>Change PIN</b></span>${I('chev')}</button>` : ''}</div>
    <p class="small muted" style="margin:8px 4px 0">Face ID unlock isn't reliably available to web apps on iPhone, so MoneyOS uses a PIN. The PIN keeps casual eyes out; for full protection keep your iPhone passcode on.</p>
  <div class="section-t">Categories</div><div class="group"><button class="row" data-act="manageCats"><span class="t"><b>Manage categories</b><small>${S.categories.length} categories, rename, add, mark essentials</small></span>${I('chev')}</button></div>
  <div class="section-t">Backup & data</div><div class="group">
    <button class="row" data-act="backup"><span class="t"><b>Backup now</b><small>Last backup: ${S.meta.lastBackup ? fmtDate(S.meta.lastBackup.slice(0, 10)) : 'Never'}</small></span>${I('download')}</button>
    <button class="row" data-act="restore"><span class="t"><b>Restore backup</b><small>From a MoneyOS .json file</small></span>${I('upload')}</button>
    <button class="row" data-act="exportCsv"><span class="t"><b>Export transactions</b><small>CSV, opens in Excel and Numbers</small></span>${I('download')}</button>
    <button class="row" data-act="exportAllCsv"><span class="t"><b>Export everything as CSV</b><small>One file with a section per table</small></span>${I('download')}</button>
    <label class="row"><span class="t"><b>Backup reminder</b><small>Remind me when my last backup is older than</small></span><select class="input" style="width:110px;height:40px" data-act="backupDays">${[7, 14, 30, 60].map(d => `<option value="${d}" ${+s.backupDays === d ? 'selected' : ''}>${d} days</option>`).join('')}</select></label></div>
  <div class="section-t">Storage</div><div class="card small"><div class="kv"><span>Transactions</span><span>${S.transactions.length.toLocaleString('en-IN')}</span></div><div class="kv"><span>Stored in</span><span>${DB.mem ? 'Memory only (not saved!)' : 'IndexedDB on this device'}</span></div><div class="kv"><span>Persistent storage</span><span id="persist">Checking…</span></div></div>
  <div class="section-t">Danger zone</div><div class="group"><button class="row" data-act="wipe"><span class="t"><b class="c-out">Erase all data</b><small>Deletes everything from this device</small></span></button></div>
  <p class="small faint" style="text-align:center;margin:22px 0">MoneyOS 1.0, local-first. <a href="#/privacy" class="link">Privacy</a></p>`;
  return h;
}

function vPrivacy() {
  return topbar('Privacy', { back: 'more' }) + `<section class="card"><h2 style="font:700 24px/1.2 var(--display);letter-spacing:-.02em;margin:0 0 10px">Your financial data stays on your device.</h2>
   <p class="muted" style="margin:0 0 14px">MoneyOS has no server, no account and no sign-in. Everything you enter is saved in your browser's IndexedDB storage on this device and every calculation happens here.</p>
   <div class="kv"><span>Transactions sent to a server</span><span>None</span></div><div class="kv"><span>Analytics or tracking</span><span>None</span></div><div class="kv"><span>Advertising SDKs</span><span>None</span></div><div class="kv"><span>Bank logins requested</span><span>Never</span></div><div class="kv"><span>Works offline</span><span>Yes, once installed</span></div></section>
   <section class="card"><div class="card-h"><h3>What this means for you</h3></div><p class="small muted" style="margin:0">Because nothing is stored in the cloud, clearing Safari website data, deleting the Home Screen app or switching phones removes your data. Back up regularly and keep the .json file somewhere safe, such as iCloud Drive. Backups are plain JSON, so treat them like a bank statement.</p>
   <div class="btn-row"><button class="btn sm primary" data-act="backup">Backup now</button><button class="btn sm" data-act="restore">Restore backup</button></div></section>`;
}
