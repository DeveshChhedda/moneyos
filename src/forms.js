/* ================= helpers ================= */
const acctChips = (sel, name, filter = () => true) => `<div class="chips">${activeAccounts().filter(filter).map(a => `<button type="button" class="chip ${sel === a.id ? 'on' : ''}" data-pick="${name}" data-v="${a.id}"><span style="width:8px;height:8px;border-radius:50%;background:${esc(a.color)}"></span>${esc(a.name)}</button>`).join('')}<button type="button" class="chip" data-act="addAccountInline">${I('plus', 2)} New</button></div>`;
const opt = (v, l, sel) => `<option value="${esc(v)}" ${String(sel) === String(v) ? 'selected' : ''}>${esc(l)}</option>`;
const numIn = (name, val, ph = '0', extra = '') => `<input class="input num" name="${name}" inputmode="decimal" placeholder="${ph}" value="${val === undefined || val === null || val === '' ? '' : esc(val)}" ${extra}>`;
function formVals(root) { const o = {}; $$('[name]', root).forEach(el => { o[el.name] = el.type === 'checkbox' ? el.checked : el.value; }); return o; }
const sizeAmt = el => { el.style.width = Math.max(1, (el.value || el.placeholder).length) + 0.6 + 'ch'; };
const txLabels = { expense: 'Expense', income: 'Income', transfer: 'Transfer', investment: 'Investment' };

async function resizeImage(file, max = 1200) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const sc = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
    c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  } finally { URL.revokeObjectURL(url); }
}

/* ================= QUICK ADD ================= */
function openTxForm(o = {}) {
  const ed = o.tx; const lu = S.meta.lastUsed || {};
  const st = {
    type: ed?.type || o.type || lu.type || 'expense',
    amount: ed ? String(ed.amount) : o.amt ? String(Math.round(o.amt)) : '',
    description: ed?.description || o.desc || '', date: ed?.date || today(),
    categoryId: ed?.categoryId || o.cat || null, accountId: ed?.accountId || o.acct || o.from || null, toAccountId: ed?.toAccountId || o.to || null,
    paymentMethod: ed?.paymentMethod || o.pm || lu.pm || 'UPI', notes: ed?.notes || '', tags: (ed?.tags || []).join(', '), receipt: ed?.receipt || null,
    repeat: '', investmentId: ed?.investmentId || '', newInvName: '', newInvType: 'Mutual Funds', allCats: false, catTouched: !!(ed || o.cat),
  };
  if (o.to && !o.from && !ed) { st.type = 'transfer'; st.accountId = null; }
  const defaults = () => {
    const accts = activeAccounts();
    if (!st.accountId || !acctById(st.accountId)) st.accountId = (st.type === 'transfer' ? lu.transferFrom : lu.acct) || accts.find(a => a.type === 'bank' || a.type === 'savings')?.id || accts[0]?.id;
    if (st.type === 'transfer' && (!st.toAccountId || st.toAccountId === st.accountId)) st.toAccountId = accts.find(a => a.id !== st.accountId && (!o.to || a.id === o.to))?.id || null;
    if (st.type === 'expense' || st.type === 'income') { const kind = st.type === 'expense' ? 'exp' : 'inc'; if (!st.categoryId || catById(st.categoryId)?.kind !== kind) { st.categoryId = (lu.cat || {})[st.type] && catById(lu.cat[st.type])?.kind === kind ? lu.cat[st.type] : frequentCats(kind)[0]?.id; if (!ed && !o.cat) st.catTouched = false; } }
  };
  defaults();
  const descList = [...new Set(txSorted().slice(0, 600).map(t => t.description).filter(Boolean))].slice(0, 150);

  const body = () => {
    const kind = st.type === 'expense' ? 'exp' : 'inc';
    const cats = frequentCats(kind); const shownCats = st.allCats ? cats : cats.slice(0, 11);
    if (!st.allCats && st.categoryId && !shownCats.some(c => c.id === st.categoryId)) shownCats[shownCats.length - 1] = catById(st.categoryId);
    let h = `<div class="seg" role="tablist">${Object.entries(txLabels).map(([k, l]) => `<button type="button" role="tab" class="${st.type === k ? 'on' : ''}" data-ttype="${k}">${l}</button>`).join('')}</div>
    <div class="amount-in"><span class="cur">${(CURRENCIES[S.settings.currency] || CURRENCIES.INR)[1].trim()}</span><input id="f-amt" inputmode="decimal" placeholder="0" value="${esc(st.amount)}" aria-label="Amount" autocomplete="off"></div>
    <input class="input" id="f-desc" list="f-desc-list" placeholder="${st.type === 'income' ? 'Source, e.g. Salary' : st.type === 'transfer' ? 'Note, e.g. Card bill' : st.type === 'investment' ? 'e.g. Nifty 50 index SIP' : 'What was it? e.g. Swiggy'}" value="${esc(st.description)}" autocomplete="off" aria-label="Description"><datalist id="f-desc-list">${descList.map(d => `<option value="${esc(d)}">`).join('')}</datalist>`;
    if (st.type === 'expense' || st.type === 'income') {
      h += `<div class="field"><span>Category</span><div class="cat-grid">${shownCats.map(c => `<button type="button" class="cat ${st.categoryId === c.id ? 'on' : ''}" data-cat="${c.id}"><span class="e">${esc(c.icon)}</span><span>${esc(c.name)}</span></button>`).join('')}${cats.length > 11 ? `<button type="button" class="cat" data-act="allCats"><span class="e">${st.allCats ? '−' : '⋯'}</span><span>${st.allCats ? 'Less' : 'More'}</span></button>` : ''}</div></div>`;
    }
    if (st.type === 'transfer') h += `<div class="field"><span>From</span>${acctChips(st.accountId, 'accountId')}</div><div class="field"><span>To</span>${acctChips(st.toAccountId, 'toAccountId', a => a.id !== st.accountId)}</div>`;
    else h += `<div class="field"><span>${st.type === 'income' ? 'Into account' : st.type === 'investment' ? 'Paid from' : 'Account'}</span>${acctChips(st.accountId, 'accountId')}</div>`;
    if (st.type === 'investment') h += `<label class="field"><span>Add to holding</span><select class="input" id="f-inv"><option value="">Don't link to a holding</option>${S.investments.map(x => opt(x.id, `${x.name} (${x.type})`, st.investmentId)).join('')}<option value="__new" ${st.investmentId === '__new' ? 'selected' : ''}>+ New holding…</option></select></label>
      ${st.investmentId === '__new' ? `<div class="fr"><label class="field"><span>Holding name</span><input class="input" id="f-invname" value="${esc(st.newInvName || st.description)}" placeholder="e.g. Parag Parikh Flexi Cap"></label><label class="field"><span>Type</span><select class="input" id="f-invtype">${INV_TYPES.map(t => opt(t, t, st.newInvType)).join('')}</select></label></div>` : ''}`;
    h += `<div class="field"><span>Date</span><div class="chips"><button type="button" class="chip ${st.date === today() ? 'on' : ''}" data-date="${today()}">Today</button><button type="button" class="chip ${st.date === addDays(today(), -1) ? 'on' : ''}" data-date="${addDays(today(), -1)}">Yesterday</button><input type="date" class="input" id="f-date" value="${st.date}" style="height:36px;width:auto;border-radius:999px;font-size:14px;padding:0 12px"></div></div>
    <details class="more" ${st.notes || st.tags || st.receipt || (ed && st.paymentMethod !== 'UPI') ? 'open' : ''}><summary>More details</summary>
      ${st.type === 'expense' ? `<div class="field" style="margin-top:4px"><span>Payment method</span><div class="chips">${PAY_METHODS.map(p => `<button type="button" class="chip ${st.paymentMethod === p ? 'on' : ''}" data-pm="${p}">${p}</button>`).join('')}</div></div>` : ''}
      <label class="field"><span>Notes</span><textarea class="input" id="f-notes" placeholder="Optional">${esc(st.notes)}</textarea></label>
      <label class="field"><span>Tags</span><input class="input" id="f-tags" placeholder="e.g. goa-trip, office" value="${esc(st.tags)}"></label>
      <div class="field"><span>Receipt</span><label class="btn sm" style="cursor:pointer">${I('camera')} ${st.receipt ? 'Replace photo' : 'Attach photo'}<input type="file" accept="image/*" id="f-receipt" class="hidden"></label>${st.receipt ? ` <button type="button" class="btn sm danger" data-act="rmReceipt">Remove</button><img class="receipt" src="${st.receipt}" alt="Receipt">` : ''}</div>
      ${ed ? '' : `<label class="field"><span>Repeat</span><select class="input" id="f-repeat">${opt('', 'Does not repeat', st.repeat)}${Object.entries(FREQS).map(([k, l]) => opt(k, l, st.repeat)).join('')}</select></label>`}
    </details>
    <div class="btn-row" style="position:sticky;bottom:0;background:var(--bg);padding:12px 0 2px;margin-top:14px">${ed ? `<button type="button" class="btn danger" data-act="delTx" style="flex:0 0 auto;width:52px;padding:0" aria-label="Delete">${I('trash')}</button><button type="button" class="btn" data-act="dupTx" style="flex:0 0 auto">Duplicate</button>` : ''}<button type="button" class="btn primary" data-act="saveTx">${ed ? 'Save changes' : 'Save ' + txLabels[st.type].toLowerCase()}</button></div>`;
    return h;
  };
  const sh = openSheet(ed ? 'Edit ' + txLabels[st.type].toLowerCase() : 'Add', `<div id="txf">${body()}</div>`, s => { wire(s); sizeAmt($('#f-amt', s.el)); setTimeout(() => { if (!ed) $('#f-amt', s.el)?.focus(); }, 60); });

  function syncInputs(root) {
    st.amount = $('#f-amt', root)?.value ?? st.amount; st.description = $('#f-desc', root)?.value ?? st.description;
    st.notes = $('#f-notes', root)?.value ?? st.notes; st.tags = $('#f-tags', root)?.value ?? st.tags;
    const d = $('#f-date', root)?.value; if (d) st.date = d; const r = $('#f-repeat', root); if (r) st.repeat = r.value;
    const inv = $('#f-inv', root); if (inv) st.investmentId = inv.value; const nn = $('#f-invname', root); if (nn) st.newInvName = nn.value; const nt = $('#f-invtype', root); if (nt) st.newInvType = nt.value;
  }
  function rerender(s) { syncInputs(s.el); const scroll = s.body.scrollTop; $('#txf', s.el).innerHTML = body(); sizeAmt($('#f-amt', s.el)); s.body.scrollTop = scroll; }
  function wire(s) {
    const root = s.el;
    root.addEventListener('click', async e => {
      const b = e.target.closest('button,[data-act]'); if (!b || !root.contains(b)) return;
      if (b.dataset.ttype) { syncInputs(root); st.type = b.dataset.ttype; st.allCats = false; defaults(); rerender(s); $('.sheet-h h2', root).textContent = ed ? 'Edit ' + txLabels[st.type].toLowerCase() : 'Add'; return; }
      if (b.dataset.cat) { st.categoryId = b.dataset.cat; st.catTouched = true; $$('.cat', root).forEach(x => x.classList.toggle('on', x === b)); return; }
      if (b.dataset.pick) { syncInputs(root); st[b.dataset.pick] = b.dataset.v; if (b.dataset.pick === 'accountId' && st.type === 'transfer') defaults(); rerender(s); return; }
      if (b.dataset.pm) { st.paymentMethod = b.dataset.pm; $$('[data-pm]', root).forEach(x => x.classList.toggle('on', x === b)); return; }
      if (b.dataset.date) { syncInputs(root); st.date = b.dataset.date; rerender(s); return; }
      const act = b.dataset.act;
      if (act === 'allCats') { syncInputs(root); st.allCats = !st.allCats; rerender(s); }
      if (act === 'rmReceipt') { syncInputs(root); st.receipt = null; rerender(s); }
      if (act === 'addAccountInline') { syncInputs(root); openAccountForm({ onSaved: a => { st.accountId = st.accountId || a.id; if (st.type === 'transfer' && !st.toAccountId) st.toAccountId = a.id; rerender(s); } }); }
      if (act === 'saveTx') save(s, false);
      if (act === 'dupTx') save(s, true);
      if (act === 'delTx') { if (await confirmSheet('Delete transaction?', 'This removes it from all totals and balances.', 'Delete', true)) { const copy = { ...ed }; await remove('transactions', ed.id); s.close(); rerenderPage(); toast('Transaction deleted', { label: 'Undo', fn: async () => { await upsert('transactions', copy); rerenderPage(); } }); } }
    });
    root.addEventListener('change', async e => {
      if (e.target.id === 'f-date') { syncInputs(root); rerender(s); }
      if (e.target.id === 'f-inv') { syncInputs(root); rerender(s); }
      if (e.target.id === 'f-receipt' && e.target.files[0]) { syncInputs(root); try { st.receipt = await resizeImage(e.target.files[0]); } catch { toast('Could not read that image'); } rerender(s); }
    });
    root.addEventListener('input', e => {
      if (e.target.id === 'f-amt') { e.target.value = e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'); sizeAmt(e.target); }
      if (e.target.id === 'f-desc' && !st.catTouched && (st.type === 'expense' || st.type === 'income')) {
        const m = merchantMemory()[e.target.value.trim().toLowerCase()];
        if (m && m.type === st.type && catById(m.categoryId)) { syncInputs(root); st.categoryId = m.categoryId; if (acctById(m.accountId) && !acctById(m.accountId).archived) st.accountId = m.accountId; if (m.paymentMethod) st.paymentMethod = m.paymentMethod; rerender(s); const d = $('#f-desc', root); d.focus(); d.setSelectionRange(d.value.length, d.value.length); }
      }
    });
    root.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.target.id === 'f-amt' || e.target.id === 'f-desc')) { e.preventDefault(); if (e.target.id === 'f-amt') $('#f-desc', root).focus(); else save(s, false); } });
  }
  async function save(s, dup) {
    syncInputs(s.el); const amt = round2(num(st.amount));
    if (!(amt > 0)) { toast('Enter an amount'); $('#f-amt', s.el)?.focus(); return; }
    if (!st.accountId) { toast('Add an account first'); return; }
    if (st.type === 'transfer' && (!st.toAccountId || st.toAccountId === st.accountId)) { toast('Pick two different accounts'); return; }
    const isNew = !ed || dup;
    const tx = { ...(isNew ? {} : ed), id: isNew ? uid() : ed.id, createdAt: isNew ? undefined : ed.createdAt, type: st.type, amount: amt, currency: S.settings.currency, date: st.date,
      description: st.description.trim() || (st.type === 'transfer' ? 'Transfer' : st.type === 'investment' ? 'Investment' : catName(st.categoryId)),
      categoryId: st.type === 'expense' || st.type === 'income' ? st.categoryId : st.type === 'investment' ? 'investment' : 'transfer',
      accountId: st.accountId, toAccountId: st.type === 'transfer' ? st.toAccountId : null, paymentMethod: st.type === 'expense' ? st.paymentMethod : st.type === 'income' ? 'Bank' : 'Transfer',
      notes: st.notes.trim(), tags: st.tags.split(',').map(x => x.trim()).filter(Boolean), receipt: st.receipt || null, recurringId: isNew ? null : ed.recurringId || null };
    if (st.type === 'investment' && isNew) {
      if (st.investmentId === '__new') { const inv = await upsert('investments', { name: (st.newInvName || st.description || 'Investment').trim(), type: st.newInvType, invested: amt, currentValue: amt, date: st.date, notes: '' }); tx.investmentId = inv.id; }
      else if (st.investmentId) { const inv = S.investments.find(x => x.id === st.investmentId); if (inv) { inv.invested = +inv.invested + amt; inv.currentValue = +inv.currentValue + amt; await upsert('investments', inv); tx.investmentId = inv.id; } }
    }
    if (isNew && st.repeat) { const r = await upsert('recurring', { type: tx.type, amount: amt, description: tx.description, categoryId: tx.categoryId, accountId: tx.accountId, toAccountId: tx.toAccountId, paymentMethod: tx.paymentMethod, frequency: st.repeat, startDate: st.date, anchorDay: parseD(st.date).getDate(), endDate: '', autoPost: true, lastPosted: st.date }); tx.recurringId = r.id; }
    await upsert('transactions', tx);
    S.meta.lastUsed = { ...(S.meta.lastUsed || {}), type: st.type, pm: st.type === 'expense' ? st.paymentMethod : (S.meta.lastUsed || {}).pm, ...(st.type === 'transfer' ? { transferFrom: st.accountId } : { acct: st.accountId }), cat: { ...((S.meta.lastUsed || {}).cat || {}), ...(st.categoryId && (st.type === 'expense' || st.type === 'income') ? { [st.type]: st.categoryId } : {}) } };
    saveMeta();
    s.close(); rerenderPage();
    toast(`${txLabels[st.type]} ${fmt(amt)} ${ed && !dup ? 'updated' : 'saved'}`, isNew ? { label: 'Undo', fn: async () => { await remove('transactions', tx.id); rerenderPage(); } } : null);
    budgetNudge(tx);
  }
}
function budgetNudge(tx) {
  if (tx.type !== 'expense' || mk(tx.date) !== curMk()) return;
  const b = S.budgets.find(x => x.categoryId === tx.categoryId); if (!b) return;
  const spent = monthStats(curMk()).byCat[tx.categoryId] || 0; const before = spent - tx.amount; const n = catName(tx.categoryId);
  setTimeout(() => {
    if (spent > b.amount && before <= b.amount) toast(`${n} spending is ${fmt(spent - b.amount)} above budget.`);
    else if (spent / b.amount >= 0.8 && before / b.amount < 0.8) toast(`You've used ${Math.round(spent / b.amount * 100)}% of your ${n} budget.`);
  }, 2400);
}

/* ================= ACCOUNT ================= */
function openAccountForm(o = {}) {
  const a = o.account || {}; const type0 = a.type || o.type || 'bank';
  const html = t => `<form id="af" onsubmit="return false">
    <label class="field" style="margin-top:4px"><span>Account name</span><input class="input" name="name" value="${esc(a.name || '')}" placeholder="${t === 'credit' ? 'e.g. HDFC Regalia' : 'e.g. HDFC Savings'}" required></label>
    <label class="field"><span>Type</span><select class="input" name="type">${Object.entries(ACCT_TYPES).map(([k, l]) => opt(k, l, t)).join('')}</select></label>
    <label class="field"><span>${t === 'credit' ? 'Current outstanding' : t === 'liability' ? 'Amount owed' : 'Opening balance'}</span>${numIn('openingBalance', a.id ? (t === 'credit' || t === 'liability' ? Math.abs(a.openingBalance || 0) : a.openingBalance) : '')}</label>
    ${t === 'credit' ? `<div class="fr"><label class="field"><span>Credit limit</span>${numIn('limit', a.limit)}</label><label class="field"><span>Minimum due (optional)</span>${numIn('minDue', a.minDue, 'Auto 5%')}</label></div>
      <div class="fr"><label class="field"><span>Bill generated on day</span>${numIn('billingDay', a.billingDay || '', 'e.g. 15', 'inputmode="numeric"')}</label><label class="field"><span>Payment due on day</span>${numIn('dueDay', a.dueDay || '', 'e.g. 5', 'inputmode="numeric"')}</label></div>` : ''}
    <div class="fr"><label class="field"><span>Institution</span><input class="input" name="institution" value="${esc(a.institution || '')}" placeholder="Optional"></label><label class="field"><span>Last 4 digits</span><input class="input num" name="last4" value="${esc(a.last4 || '')}" maxlength="4" inputmode="numeric" placeholder="Optional"></label></div>
    <div class="field"><span>Colour</span><div class="swatches">${ACCT_COLORS.map(c => `<button type="button" class="${(a.color || ACCT_COLORS[S.accounts.length % ACCT_COLORS.length]) === c ? 'on' : ''}" data-color="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}</div><input type="hidden" name="color" value="${esc(a.color || ACCT_COLORS[S.accounts.length % ACCT_COLORS.length])}"></div>
    <div class="btn-row">${a.id ? `<button type="button" class="btn danger" data-act="delAcct" style="flex:0 0 auto">${a.archived ? 'Delete' : 'Archive or delete'}</button>` : ''}<button type="button" class="btn primary" data-act="saveAcct">${a.id ? 'Save changes' : 'Add account'}</button></div></form>`;
  openSheet(a.id ? 'Edit account' : 'Add account', html(type0), s => {
    const f = () => $('#af', s.el);
    s.el.addEventListener('change', e => { if (e.target.name === 'type') { const v = formVals(f()); a.name = v.name; a.institution = v.institution; a.last4 = v.last4; a.color = v.color; s.body.innerHTML = html(e.target.value); } });
    s.el.addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.color) { $$('[data-color]', s.el).forEach(x => x.classList.toggle('on', x === b)); f().color.value = b.dataset.color; }
      if (b.dataset.act === 'saveAcct') {
        const v = formVals(f()); if (!v.name.trim()) { toast('Give the account a name'); return; }
        const ob = num(v.openingBalance);
        const acc = { ...a, name: v.name.trim(), type: v.type, openingBalance: v.type === 'credit' || v.type === 'liability' ? -Math.abs(ob) : ob, institution: v.institution.trim(), last4: v.last4.replace(/\D/g, '').slice(0, 4), color: v.color };
        if (v.type === 'credit') Object.assign(acc, { limit: num(v.limit), minDue: v.minDue ? num(v.minDue) : 0, billingDay: clamp(parseInt(v.billingDay) || 1, 1, 31), dueDay: clamp(parseInt(v.dueDay) || 20, 1, 31) });
        const saved = await upsert('accounts', acc); s.close(); toast(a.id ? 'Account updated' : 'Account added'); o.onSaved ? o.onSaved(saved) : rerenderPage();
      }
      if (b.dataset.act === 'delAcct') { s.close(); deleteAccountFlow(a); }
    });
  });
}
async function deleteAccountFlow(a) {
  const n = S.transactions.filter(t => t.accountId === a.id || t.toAccountId === a.id).length;
  if (!n) { if (await confirmSheet('Delete account?', `"${esc(a.name)}" has no transactions.`, 'Delete account', true)) { await remove('accounts', a.id); go('accounts'); toast('Account deleted'); } return; }
  openSheet('Remove account', `<p class="muted" style="margin:4px 0 14px">"${esc(a.name)}" has <b style="color:var(--text)">${n} transaction${n > 1 ? 's' : ''}</b>. Archiving hides it but keeps its history in your reports.</p>
    ${a.archived ? `<button class="btn block" data-x="unarchive">Unarchive</button>` : `<button class="btn primary block" data-x="archive">Archive and keep history</button>`}<button class="btn danger block mt12" data-x="delete">Delete account and ${n} transactions</button>`, s => {
    s.el.addEventListener('click', async e => {
      const x = e.target.closest('[data-x]')?.dataset.x; if (!x) return;
      if (x === 'archive' || x === 'unarchive') { a.archived = x === 'archive'; await upsert('accounts', a); s.close(); go('accounts'); toast(a.archived ? 'Account archived' : 'Account restored'); }
      if (x === 'delete') { s.close(); if (await confirmSheet('This can’t be undone', `Delete "${esc(a.name)}" and all ${n} of its transactions permanently?`, `Delete ${n} transactions`, true)) { const ids = S.transactions.filter(t => t.accountId === a.id || t.toAccountId === a.id).map(t => t.id); S.transactions = S.transactions.filter(t => !ids.includes(t.id)); for (const id of ids) await DB.del('transactions', id); await remove('accounts', a.id); go('accounts'); toast('Account and history deleted'); } }
    });
  });
}

/* ================= LOAN ================= */
function openLoanForm(l = {}) {
  const html = `<form id="lf" onsubmit="return false"><label class="field" style="margin-top:4px"><span>Loan name</span><input class="input" name="name" value="${esc(l.name || '')}" placeholder="e.g. Home loan, SBI"></label>
   <div class="fr"><label class="field"><span>Principal</span>${numIn('principal', l.principal)}</label><label class="field"><span>Interest rate (% p.a.)</span>${numIn('rate', l.rate, '8.5')}</label></div>
   <div class="fr"><label class="field"><span>Tenure (months)</span>${numIn('tenure', l.tenure, '240', 'inputmode="numeric"')}</label><label class="field"><span>EMI</span>${numIn('emi', l.emiOverride ? l.emi : '', 'Auto')}</label></div>
   <div class="fr"><label class="field"><span>Loan start date</span><input type="date" class="input" name="startDate" value="${l.startDate || today()}"></label><label class="field"><span>First EMI date</span><input type="date" class="input" name="firstEmiDate" value="${l.firstEmiDate || addMonths(l.startDate || today(), 1)}"></label></div>
   <label class="field"><span>EMI paid from</span><select class="input" name="accountId">${activeAccounts().filter(a => a.type !== 'credit').map(a => opt(a.id, a.name, l.accountId)).join('')}</select></label>
   ${l.id ? '' : `<label class="row" style="padding:14px 0 0;min-height:0"><span class="t"><b>Record EMIs automatically</b><small>Adds each upcoming EMI as an expense on its due date</small></span><span class="toggle"><input type="checkbox" name="auto" checked><i></i></span></label>`}
   <p class="small muted" id="lcalc" style="margin:14px 0 0"></p>
   <div class="btn-row">${l.id ? `<button type="button" class="btn danger" data-act="delLoan" style="flex:0 0 auto">Delete</button>` : ''}<button type="button" class="btn primary" data-act="saveLoan">${l.id ? 'Save changes' : 'Add loan'}</button></div></form>`;
  openSheet(l.id ? 'Edit loan' : 'Add loan', html, s => {
    const f = $('#lf', s.el);
    const calc = () => { const v = formVals(f); const P = num(v.principal), n = parseInt(v.tenure) || 0; if (P && n) { const e = v.emi ? num(v.emi) : emiCalc(P, num(v.rate), n); $('#lcalc', s.el).innerHTML = `EMI <b style="color:var(--text)">${fmt(e)}</b>, total interest about <b style="color:var(--text)">${fmt(e * n - P)}</b>.`; } };
    f.addEventListener('input', calc); calc();
    s.el.addEventListener('click', async e => {
      const act = e.target.closest('button')?.dataset.act;
      if (act === 'saveLoan') {
        const v = formVals(f); const P = num(v.principal), n = parseInt(v.tenure) || 0;
        if (!v.name.trim() || !P || !n) { toast('Name, principal and tenure are required'); return; }
        const emi = v.emi ? num(v.emi) : emiCalc(P, num(v.rate), n);
        const loan = await upsert('loans', { ...l, name: v.name.trim(), principal: P, rate: num(v.rate), tenure: n, emi, emiOverride: !!v.emi, startDate: v.startDate, firstEmiDate: v.firstEmiDate, accountId: v.accountId });
        if (!l.id && v.auto) {
          const nextRow = loanStatus(loan).next;
          if (nextRow) { const r = await upsert('recurring', { type: 'expense', amount: round2(emi), description: loan.name + ' EMI', categoryId: 'c_emi', accountId: v.accountId, paymentMethod: 'Auto-debit', frequency: 'monthly', startDate: nextRow.date, anchorDay: parseD(v.firstEmiDate).getDate(), endDate: loanStatus(loan).endDate, autoPost: true, loanId: loan.id }); loan.autoRecurringId = r.id; await upsert('loans', loan); }
        }
        s.close(); rerenderPage(); toast(l.id ? 'Loan updated' : 'Loan added');
      }
      if (act === 'delLoan' && await confirmSheet('Delete loan?', 'Past EMI transactions stay in your history.', 'Delete loan', true)) { await remove('loans', l.id); s.close(); go('loans'); }
    });
  });
}

/* ================= INVESTMENT ================= */
function openInvestmentForm(x = {}) {
  const html = `<form id="if" onsubmit="return false"><label class="field" style="margin-top:4px"><span>Name</span><input class="input" name="name" value="${esc(x.name || '')}" placeholder="e.g. Parag Parikh Flexi Cap"></label>
   <label class="field"><span>Category</span><select class="input" name="type">${INV_TYPES.map(t => opt(t, t, x.type || 'Mutual Funds')).join('')}</select></label>
   <div class="fr"><label class="field"><span>Invested amount</span>${numIn('invested', x.invested)}</label><label class="field"><span>Current value</span>${numIn('currentValue', x.currentValue)}</label></div>
   <label class="field"><span>Invested since</span><input type="date" class="input" name="date" value="${x.date || today()}"></label>
   <label class="field"><span>Notes</span><input class="input" name="notes" value="${esc(x.notes || '')}" placeholder="Folio, platform, maturity date…"></label>
   ${x.id ? '' : '<p class="small muted" style="margin:12px 0 0">This records a holding you already own. To log new money going in from a bank account, use Add → Investment instead.</p>'}
   <div class="btn-row">${x.id ? `<button type="button" class="btn danger" data-act="delInv" style="flex:0 0 auto">Delete</button>` : ''}<button type="button" class="btn primary" data-act="saveInv">${x.id ? 'Save changes' : 'Add holding'}</button></div></form>`;
  openSheet(x.id ? 'Edit holding' : 'Add holding', html, s => {
    s.el.addEventListener('click', async e => {
      const act = e.target.closest('button')?.dataset.act;
      if (act === 'saveInv') { const v = formVals($('#if', s.el)); if (!v.name.trim()) { toast('Give it a name'); return; } const inv = num(v.invested); await upsert('investments', { ...x, name: v.name.trim(), type: v.type, invested: inv, currentValue: v.currentValue === '' ? inv : num(v.currentValue), date: v.date, notes: v.notes }); s.close(); rerenderPage(); toast(x.id ? 'Holding updated' : 'Holding added'); }
      if (act === 'delInv' && await confirmSheet('Delete holding?', 'Linked investment transactions stay in your history.', 'Delete', true)) { await remove('investments', x.id); s.close(); rerenderPage(); }
    });
  });
}

/* ================= BUDGET ================= */
function openBudgetForm(b = {}, catPre) {
  const cats = S.categories.filter(c => c.kind === 'exp' && !c.archived);
  const html = `<form id="bf" onsubmit="return false"><label class="field" style="margin-top:4px"><span>Category</span><select class="input" name="categoryId" ${b.id ? 'disabled' : ''}>${cats.map(c => opt(c.id, `${c.icon} ${c.name}`, b.categoryId || catPre)).join('')}</select></label>
   <label class="field"><span>Monthly limit</span>${numIn('amount', b.amount)}</label><p class="small muted" id="bhint" style="margin:10px 0 0"></p>
   <div class="btn-row">${b.id ? `<button type="button" class="btn danger" data-act="delBud" style="flex:0 0 auto">Remove</button>` : ''}<button type="button" class="btn primary" data-act="saveBud">${b.id ? 'Save changes' : 'Set budget'}</button></div></form>`;
  openSheet(b.id ? 'Edit budget' : 'Set a budget', html, s => {
    const f = $('#bf', s.el);
    const hint = () => { const id = f.categoryId.value; const avg = sum(monthsBack(3, mkAdd(curMk(), -1)).map(k => monthStats(k).byCat[id] || 0)) / 3; $('#bhint', s.el).textContent = avg ? `You spent about ${fmt(avg)} a month on ${catName(id)} over the last 3 months.` : ''; };
    f.addEventListener('change', hint); hint(); setTimeout(() => f.amount.focus(), 80);
    s.el.addEventListener('click', async e => {
      const act = e.target.closest('button')?.dataset.act;
      if (act === 'saveBud') { const v = formVals(f); const amt = num(v.amount); if (!amt) { toast('Enter a monthly limit'); return; } const catId = b.categoryId || v.categoryId; const ex = S.budgets.find(x => x.categoryId === catId); await upsert('budgets', { ...(ex || b), categoryId: catId, amount: amt }); s.close(); rerenderPage(); toast('Budget saved'); }
      if (act === 'delBud') { await remove('budgets', b.id); s.close(); rerenderPage(); }
    });
  });
}

/* ================= GOAL ================= */
function openGoalForm(g = {}) {
  const html = `<form id="gf" onsubmit="return false"><label class="field" style="margin-top:4px"><span>Goal type</span><select class="input" name="type">${GOAL_TYPES.map(t => opt(t, `${GOAL_ICONS[t]} ${t}`, g.type || 'Emergency fund')).join('')}</select></label>
   <label class="field"><span>Name</span><input class="input" name="name" value="${esc(g.name || '')}" placeholder="e.g. Emergency fund"></label>
   <div class="fr"><label class="field"><span>Target amount</span>${numIn('target', g.target)}</label><label class="field"><span>Saved so far</span>${numIn('current', g.current)}</label></div>
   <div class="fr"><label class="field"><span>Target date</span><input type="date" class="input" name="targetDate" value="${g.targetDate || ''}"></label><label class="field"><span>Monthly contribution</span>${numIn('monthly', g.monthly)}</label></div>
   <p class="small muted" id="ghint" style="margin:12px 0 0"></p>
   <div class="btn-row">${g.id ? `<button type="button" class="btn danger" data-act="delGoal" style="flex:0 0 auto">Delete</button>` : ''}<button type="button" class="btn primary" data-act="saveGoal">${g.id ? 'Save changes' : 'Create goal'}</button></div></form>`;
  openSheet(g.id ? 'Edit goal' : 'New goal', html, s => {
    const f = $('#gf', s.el);
    const hint = () => { const v = formVals(f); const c = goalCalc({ target: num(v.target), current: num(v.current), targetDate: v.targetDate, monthly: num(v.monthly) }); $('#ghint', s.el).innerHTML = v.targetDate && c.rem ? `To reach it by ${fmtDate(v.targetDate, { month: 'short', year: 'numeric' })}, put aside <b style="color:var(--text)">${fmt(c.need)}</b> a month.` : ''; };
    f.addEventListener('input', hint); f.addEventListener('change', e => { if (e.target.name === 'type' && !f.name.value) f.name.value = e.target.value; if (e.target.name === 'type' && e.target.value === 'Emergency fund' && !f.target.value) { const ess = sum(monthsBack(3, mkAdd(curMk(), -1)).map(k => monthStats(k).essential)) / 3; if (ess) f.target.value = Math.round(ess * 6); } hint(); }); hint();
    s.el.addEventListener('click', async e => {
      const act = e.target.closest('button')?.dataset.act;
      if (act === 'saveGoal') { const v = formVals(f); if (!num(v.target)) { toast('Set a target amount'); return; } await upsert('goals', { ...g, type: v.type, name: v.name.trim() || v.type, target: num(v.target), current: num(v.current), targetDate: v.targetDate, monthly: num(v.monthly) }); s.close(); rerenderPage(); toast('Goal saved'); }
      if (act === 'delGoal' && await confirmSheet('Delete goal?', '', 'Delete', true)) { await remove('goals', g.id); s.close(); rerenderPage(); }
    });
  });
}
function openGoalAdd(g) {
  openSheet('Add to ' + g.name, `<div class="amount-in"><span class="cur">₹</span><input id="ga" inputmode="decimal" placeholder="0"></div><div class="btn-row"><button class="btn primary" data-x>Add money</button></div>`, s => {
    setTimeout(() => $('#ga', s.el).focus(), 80);
    s.el.querySelector('[data-x]').onclick = async () => { const a = num($('#ga', s.el).value); if (!a) return; g.current = (+g.current || 0) + a; await upsert('goals', g); s.close(); rerenderPage(); toast(`${fmt(a)} added to ${g.name}`); };
  });
}

/* ================= RECURRING ================= */
function openRecurringForm(r = {}, pre = {}) {
  let type = r.type || pre.type || 'expense';
  const html = () => {
    const kind = type === 'income' ? 'inc' : 'exp';
    return `<form id="rf" onsubmit="return false"><div class="seg">${Object.entries(txLabels).map(([k, l]) => `<button type="button" class="${type === k ? 'on' : ''}" data-rt="${k}">${l}</button>`).join('')}</div>
    <label class="field"><span>Name</span><input class="input" name="description" value="${esc(r.description || '')}" placeholder="${type === 'income' ? 'Salary' : type === 'investment' ? 'Index fund SIP' : 'Rent, Netflix, LIC premium…'}"></label>
    <div class="fr"><label class="field"><span>Amount</span>${numIn('amount', r.amount)}</label><label class="field"><span>Frequency</span><select class="input" name="frequency">${Object.entries(FREQS).map(([k, l]) => opt(k, l, r.frequency || 'monthly')).join('')}</select></label></div>
    ${type === 'expense' || type === 'income' ? `<label class="field"><span>Category</span><select class="input" name="categoryId">${S.categories.filter(c => c.kind === kind && !c.archived).map(c => opt(c.id, `${c.icon} ${c.name}`, r.categoryId)).join('')}</select></label>` : ''}
    <div class="fr"><label class="field"><span>${type === 'transfer' ? 'From' : type === 'income' ? 'Into' : 'Account'}</span><select class="input" name="accountId">${activeAccounts().map(a => opt(a.id, a.name, r.accountId || (S.meta.lastUsed || {}).acct)).join('')}</select></label>
    ${type === 'transfer' ? `<label class="field"><span>To</span><select class="input" name="toAccountId">${activeAccounts().map(a => opt(a.id, a.name, r.toAccountId)).join('')}</select></label>` : ''}</div>
    <div class="fr"><label class="field"><span>Starts</span><input type="date" class="input" name="startDate" value="${r.startDate || today()}"></label><label class="field"><span>Ends (optional)</span><input type="date" class="input" name="endDate" value="${r.endDate || ''}"></label></div>
    <label class="row" style="padding:14px 0 0;min-height:0"><span class="t"><b>Record automatically</b><small>Adds the transaction on each date. Off: shows as a reminder only.</small></span><span class="toggle"><input type="checkbox" name="autoPost" ${r.id ? (r.autoPost ? 'checked' : '') : 'checked'}><i></i></span></label>
    ${r.id ? `<label class="row" style="padding:10px 0 0;min-height:0"><span class="t"><b>Paused</b></span><span class="toggle"><input type="checkbox" name="paused" ${r.paused ? 'checked' : ''}><i></i></span></label>` : ''}
    <div class="btn-row">${r.id ? `<button type="button" class="btn danger" data-act="delRec" style="flex:0 0 auto">Delete</button>` : ''}<button type="button" class="btn primary" data-act="saveRec">${r.id ? 'Save changes' : 'Add recurring'}</button></div></form>`;
  };
  openSheet(r.id ? 'Edit recurring' : 'New recurring', html(), s => {
    s.el.addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.rt) { const v = formVals($('#rf', s.el)); Object.assign(r, { description: v.description, amount: v.amount, frequency: v.frequency, startDate: v.startDate, endDate: v.endDate }); type = b.dataset.rt; s.body.innerHTML = html(); return; }
      if (b.dataset.act === 'saveRec') {
        const v = formVals($('#rf', s.el)); const amt = num(v.amount); if (!v.description.trim() || !amt) { toast('Name and amount are required'); return; }
        if (type === 'transfer' && v.accountId === v.toAccountId) { toast('Pick two different accounts'); return; }
        const changedStart = r.startDate !== v.startDate;
        const rec = { ...r, type, description: v.description.trim(), amount: amt, frequency: v.frequency, categoryId: v.categoryId || (type === 'investment' ? 'investment' : 'transfer'), accountId: v.accountId, toAccountId: type === 'transfer' ? v.toAccountId : null, startDate: v.startDate, anchorDay: parseD(v.startDate).getDate(), endDate: v.endDate, autoPost: v.autoPost, paused: !!v.paused, paymentMethod: 'Auto-debit' };
        if (!r.id && v.startDate < today() && v.autoPost) {
          const past = occurrences(rec, v.startDate, today()).length;
          if (past > 0 && !(await confirmSheet('Add past entries?', `This schedule started ${fmtDate(v.startDate)}. MoneyOS will add ${past} transaction${past > 1 ? 's' : ''} up to today.`, `Add ${past}`, false))) rec.lastPosted = today();
        }
        if (r.id && changedStart) delete rec.lastPosted;
        await upsert('recurring', rec); await processRecurring(); s.close(); rerenderPage(); toast(r.id ? 'Recurring updated' : 'Recurring added');
      }
      if (b.dataset.act === 'delRec' && await confirmSheet('Delete recurring?', 'Transactions already recorded stay in your history.', 'Delete', true)) { await remove('recurring', r.id); s.close(); rerenderPage(); }
    });
  });
}

/* ================= CATEGORIES ================= */
function openCategories() {
  let kind = 'exp';
  const html = () => `<div class="seg"><button class="${kind === 'exp' ? 'on' : ''}" data-k="exp">Expense</button><button class="${kind === 'inc' ? 'on' : ''}" data-k="inc">Income</button></div>
   <div class="group mt12">${S.categories.filter(c => c.kind === kind).map(c => `<button class="row" data-c="${c.id}" style="${c.archived ? 'opacity:.5' : ''}"><span class="ic">${esc(c.icon)}</span><span class="t"><b>${esc(c.name)}</b><small>${c.archived ? 'Hidden' : c.essential ? 'Essential' : 'Discretionary'}</small></span><span style="width:10px;height:10px;border-radius:50%;background:${c.color}"></span></button>`).join('')}</div>
   <div class="btn-row"><button class="btn" data-c="__new">${I('plus', 2.2)} Add category</button></div>`;
  openSheet('Categories', html(), s => {
    s.el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.k) { kind = b.dataset.k; s.body.innerHTML = html(); }
      if (b.dataset.c) { const c = b.dataset.c === '__new' ? { kind, icon: '•', color: CAT_COLORS[S.categories.length % CAT_COLORS.length] } : catById(b.dataset.c); editCat(c, () => (s.body.innerHTML = html())); }
    });
  });
}
function editCat(c, done) {
  const used = c.id ? S.transactions.some(t => t.categoryId === c.id) : false;
  openSheet(c.id ? 'Edit category' : 'New category', `<form id="cf" onsubmit="return false"><div class="fr" style="grid-template-columns:90px 1fr"><label class="field" style="margin-top:4px"><span>Icon</span><input class="input" name="icon" value="${esc(c.icon)}" maxlength="4" style="text-align:center;font-size:22px"></label><label class="field" style="margin-top:4px"><span>Name</span><input class="input" name="name" value="${esc(c.name || '')}"></label></div>
    ${c.kind === 'exp' ? `<label class="row" style="padding:14px 0 0;min-height:0"><span class="t"><b>Essential</b><small>Counts toward emergency fund coverage</small></span><span class="toggle"><input type="checkbox" name="essential" ${c.essential ? 'checked' : ''}><i></i></span></label>` : ''}
    <div class="field"><span>Colour</span><div class="swatches">${CAT_COLORS.map(x => `<button type="button" data-color="${x}" class="${c.color === x ? 'on' : ''}" style="background:${x}"></button>`).join('')}</div><input type="hidden" name="color" value="${c.color}"></div>
    <div class="btn-row">${c.id ? `<button type="button" class="btn danger" data-act="delCat" style="flex:0 0 auto">${used ? (c.archived ? 'Unhide' : 'Hide') : 'Delete'}</button>` : ''}<button type="button" class="btn primary" data-act="saveCat">Save</button></div></form>`, s => {
    s.el.addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return; const f = $('#cf', s.el);
      if (b.dataset.color) { $$('[data-color]', s.el).forEach(x => x.classList.toggle('on', x === b)); f.color.value = b.dataset.color; }
      if (b.dataset.act === 'saveCat') { const v = formVals(f); if (!v.name.trim()) return; await upsert('categories', { ...c, name: v.name.trim(), icon: v.icon || '•', essential: !!v.essential, color: v.color }); s.close(); done(); rerenderPage(); }
      if (b.dataset.act === 'delCat') { if (used) { c.archived = !c.archived; await upsert('categories', c); } else { await remove('categories', c.id); S.budgets.filter(x => x.categoryId === c.id).forEach(x => remove('budgets', x.id)); } s.close(); done(); rerenderPage(); }
    });
  });
}

/* ================= FILTERS / SORT ================= */
function openFilters() {
  const f = txFilter; const t = today(); const k = curMk();
  const presets = [['This month', k + '-01', t], ['Last month', mkAdd(k, -1) + '-01', mkEnd(mkAdd(k, -1))], ['Last 3 months', mkAdd(k, -2) + '-01', t], ['This year', t.slice(0, 4) + '-01-01', t]];
  openSheet('Filters', `<form id="ff" onsubmit="return false"><div class="chips" style="margin-top:4px">${presets.map(([l, a, b]) => `<button type="button" class="chip ${f.from === a && f.to === b ? 'on' : ''}" data-from="${a}" data-to="${b}">${l}</button>`).join('')}</div>
    <div class="fr"><label class="field"><span>From</span><input type="date" class="input" name="from" value="${f.from}"></label><label class="field"><span>To</span><input type="date" class="input" name="to" value="${f.to}"></label></div>
    <label class="field"><span>Category</span><select class="input" name="cat">${opt('', 'All categories', f.cat)}${S.categories.map(c => opt(c.id, `${c.icon} ${c.name}`, f.cat)).join('')}</select></label>
    <label class="field"><span>Account</span><select class="input" name="acct">${opt('', 'All accounts', f.acct)}${S.accounts.map(a => opt(a.id, a.name, f.acct)).join('')}</select></label>
    <label class="field"><span>Payment method</span><select class="input" name="pm">${opt('', 'Any', f.pm)}${PAY_METHODS.map(p => opt(p, p, f.pm)).join('')}</select></label>
    <div class="fr"><label class="field"><span>Min amount</span>${numIn('min', f.min, 'Any')}</label><label class="field"><span>Max amount</span>${numIn('max', f.max, 'Any')}</label></div>
    <div class="btn-row"><button type="button" class="btn" data-x="clear">Clear all</button><button type="button" class="btn primary" data-x="apply">Show results</button></div></form>`, s => {
    const form = $('#ff', s.el);
    s.el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.from) { form.from.value = b.dataset.from; form.to.value = b.dataset.to; $$('[data-from]', s.el).forEach(x => x.classList.toggle('on', x === b)); }
      if (b.dataset.x === 'clear') { Object.assign(txFilter, { from: '', to: '', cat: '', acct: '', pm: '', min: '', max: '' }); s.close(); rerenderPage(); }
      if (b.dataset.x === 'apply') { const v = formVals(form); Object.assign(txFilter, { from: v.from, to: v.to, cat: v.cat, acct: v.acct, pm: v.pm, min: v.min ? num(v.min) : '', max: v.max ? num(v.max) : '' }); s.close(); rerenderPage(); }
    });
  });
}
function openSort() {
  openSheet('Sort by', `<div class="group">${[['latest', 'Latest first'], ['amount', 'Highest amount'], ['category', 'Category']].map(([v, l]) => `<button class="row" data-s="${v}"><span class="t"><b>${l}</b></span>${txFilter.sort === v ? '<span class="c-in" style="font-weight:700">✓</span>' : ''}</button>`).join('')}</div>`, s => {
    s.el.addEventListener('click', e => { const v = e.target.closest('[data-s]')?.dataset.s; if (v) { txFilter.sort = v; s.close(); rerenderPage(); } });
  });
}
