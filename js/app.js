/* Insightly CRM prototype — rendering and interaction. Data lives in js/data.js. */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const W = 1366, H = 1024;
const EASE = 'cubic-bezier(.22,.9,.24,1)';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const icon = id => `<svg class="ico"><use href="#i-${id}"/></svg>`;
const clone = o => JSON.parse(JSON.stringify(o));

const stage = $('#stage'), rig = $('#rig'), app = $('#app');
const listEl = $('#listScroll'), hl = $('#listHl'), glow = $('#glowGreen');
const search = $('#search'), pop = $('#pop');

/* ---------- persistence: a per-browser convenience, the prototype works without it ---------- */
const KEY = 'insightly-crm:v1';
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); return d && Array.isArray(d.contacts) ? d : null; } catch { return null; }
}
const saved = load();
let contacts = saved ? saved.contacts : clone(CONTACTS);
const prefs = Object.assign({ view: 'app', glow: true }, saved && saved.prefs);
let saveT;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try {
      const data = contacts.map(c => ({ ...c, files: c.files.filter(f => !f.blob) }));   // uploaded blobs don't survive a reload
      localStorage.setItem(KEY, JSON.stringify({ contacts: data, prefs }));
    } catch { /* storage blocked: keep working in memory */ }
  }, 250);
}

const SORTS = [null, 'asc', 'desc'];               // null = the designer's order from the shot
const state = { sel: 'aaron-rodd', history: [], query: '', favOnly: false, sort: 0, page: 'contacts', tab: 'projects', editing: false };
const byId = id => contacts.find(c => c.id === id);
const current = () => byId(state.sel);
if (!current()) state.sel = contacts[0].id;

/* ---------- small helpers ---------- */
function photo(c) {
  if (!c.noPhoto) return `assets/avatars/${c.id}.jpg`;
  const ini = c.name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
  return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88"><rect width="88" height="88" fill="#2c2c2c"/><text x="44" y="54" text-anchor="middle" font-family="Outfit,Arial,sans-serif" font-size="28" fill="#fff">${esc(ini)}</text></svg>`);
}
const avatarHTML = c => `<img class="avatar" src="${photo(c)}" alt="">`;
const emptyNote = t => `<p class="w-empty">${t}</p>`;
const twoLines = s => { const w = String(s).split(' '); return w.length > 1 ? `${esc(w[0])}<br>${esc(w.slice(1).join(' '))}` : esc(s); };
const today = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const inDays = n => new Date(Date.now() + n * 864e5).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const setPressed = (b, on) => { b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); };

function grow(root) {                               // bars render at 0 and grow to data-w on the next paint
  const bars = $$('[data-w]', root);
  requestAnimationFrame(() => requestAnimationFrame(() => bars.forEach(b => { b.style.width = b.dataset.w; b.removeAttribute('data-w'); })));
}

let toastT;
function toast(html) {
  const t = $('#toast');
  t.innerHTML = html; t.classList.add('is-on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2300);
}
function nope(el, msg = 'This contact is locked') {
  if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  toast(msg);
}
const locked = () => !!current().locked;

/* layout position of an element inside the 1366×1024 canvas — independent of the stage scale/3D transform */
function canvasRect(el) {
  let x = 0, y = 0, n = el;
  while (n && n !== app) {
    x += n.offsetLeft; y += n.offsetTop;
    const p = n.offsetParent;
    if (p && p !== app) { x -= p.scrollLeft; y -= p.scrollTop; }
    n = p;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

function download(blobOrUrl, name) {
  const a = document.createElement('a');
  a.href = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  if (typeof blobOrUrl !== 'string') setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---------- contact list ---------- */
const rows = new Map();
function visible() {
  const q = state.query.trim().toLowerCase();
  let l = contacts.filter(c => (!state.favOnly || c.fav) && (!q || `${c.name} ${c.role} ${c.org}`.toLowerCase().includes(q)));
  const dir = SORTS[state.sort];
  if (dir) l = [...l].sort((a, b) => a.name.localeCompare(b.name) * (dir === 'asc' ? 1 : -1));
  return l;
}
function rowFor(c) {
  let r = rows.get(c.id);
  if (!r) {
    r = document.createElement('button');
    r.className = 'row'; r.dataset.id = c.id; r.setAttribute('role', 'option');
    r.innerHTML = `${avatarHTML(c)}<span class="row-name"></span><i class="fav-dot" hidden></i><span class="row-role"></span>`;
    rows.set(c.id, r);
  }
  r.querySelector('.avatar').src = photo(c);
  r.querySelector('.row-name').textContent = c.name;
  r.querySelector('.row-role').textContent = c.role;
  r.querySelector('.fav-dot').hidden = !c.fav;
  const sel = c.id === state.sel;
  r.classList.toggle('is-sel', sel); r.setAttribute('aria-selected', sel);
  return r;
}
function renderList(animate = false) {
  const items = visible();
  const before = new Map();
  if (animate) rows.forEach((r, id) => r.isConnected && before.set(id, r.offsetTop));
  const ids = new Set(items.map(c => c.id));
  rows.forEach((r, id) => { if (!ids.has(id)) r.remove(); });
  items.forEach(c => listEl.appendChild(rowFor(c)));

  let empty = $('.list-empty', listEl);
  if (!items.length) {
    if (!empty) { empty = document.createElement('p'); empty.className = 'list-empty'; listEl.appendChild(empty); }
    empty.textContent = state.favOnly && !state.query ? 'No favorites yet. Tap the star on a contact.' : 'No contacts match your search.';
  } else empty?.remove();

  if (animate && !reduce) items.forEach((c, i) => {
    const r = rows.get(c.id), old = before.get(c.id);
    if (old == null) r.animate([{ opacity: 0, transform: 'translateX(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: i * 14, easing: EASE, fill: 'backwards' });
    else if (old !== r.offsetTop) r.animate([{ transform: `translateY(${old - r.offsetTop}px)` }, { transform: 'none' }], { duration: 560, easing: EASE });
  });
  $('#count').textContent = items.length;
  placeHighlight(!animate);
}
function placeHighlight(instant) {
  const r = rows.get(state.sel), on = !!(r && r.isConnected);
  hl.style.opacity = on ? 1 : 0;
  if (on) {
    if (instant) hl.style.transition = 'none';
    hl.style.transform = `translateY(${r.offsetTop}px)`;
    if (instant) { void hl.offsetHeight; hl.style.transition = ''; }
  }
  moveGlow();
}
function moveGlow() {                               // the green light sits behind the selected row, as in the shot
  const r = rows.get(state.sel);
  let y = 334;
  if (r && r.isConnected) y = 159 + r.offsetTop + 24 - listEl.scrollTop;
  y = Math.max(200, Math.min(860, y));
  glow.style.top = (y - 320) + 'px';
}
function revealRow(id) {
  const r = rows.get(id); if (!r) return;
  const top = r.offsetTop, st = listEl.scrollTop, h = listEl.clientHeight;
  if (top < st + 7) listEl.scrollTo({ top: top - 7, behavior: reduce ? 'auto' : 'smooth' });
  else if (top + 48 > st + h - 12) listEl.scrollTo({ top: top + 60 - h, behavior: reduce ? 'auto' : 'smooth' });
}
let glowRaf;
listEl.addEventListener('scroll', () => { cancelAnimationFrame(glowRaf); glowRaf = requestAnimationFrame(moveGlow); });
listEl.addEventListener('click', e => { const r = e.target.closest('.row'); if (r) select(r.dataset.id); });

function select(id, { push = true } = {}) {
  if (!byId(id)) return;
  if (state.page !== 'contacts') go('contacts');
  if (id === state.sel) return;
  if (state.editing) stopEditing();
  closePop();
  if (push) state.history.push(state.sel);
  state.sel = id;
  rows.forEach((r, rid) => { r.classList.toggle('is-sel', rid === id); r.setAttribute('aria-selected', rid === id); });
  placeHighlight();
  revealRow(id);
  renderDetail(true);
}
function move(step) {
  const l = visible(); if (!l.length) return;
  const i = l.findIndex(c => c.id === state.sel);
  const n = l[Math.max(0, Math.min(l.length - 1, (i < 0 ? 0 : i + step)))];
  select(n.id);
  rows.get(n.id)?.focus({ preventScroll: true });
}

/* ---------- detail panel ---------- */
const STAT_KEYS = c => ({
  contacts: c.related.length, opps: c.opps.length, projects: c.projects.length, orgs: c.orgs.length,
  notes: Object.values(c.notes).reduce((n, l) => n + l.length, 0), files: c.files.reduce((n, f) => n + f.count, 0),
});
function countTo(el, to) {
  const from = +el.textContent || 0;
  cancelAnimationFrame(el._raf);
  if (from === to || reduce) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 560;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (p < 1) el._raf = requestAnimationFrame(step);
  };
  el._raf = requestAnimationFrame(step);
}
function renderStats() {
  const v = STAT_KEYS(current());
  $$('.stat').forEach(s => {
    const k = s.dataset.key, n = v[k];
    countTo(s.querySelector('.stat-num'), n);
    s.querySelector('.stat-track i').style.width = (n ? Math.max(8, Math.min(1, n / STAT_MAX[k]) * 120) : 0) + 'px';
  });
}
function renderHead() {
  const c = current();
  $('#dAvatar').src = photo(c);
  $('#dName').textContent = c.name;
  $('#dRole').textContent = c.role;
  $$('#info dd').forEach(dd => { dd.textContent = c[dd.dataset.field] || '—'; dd.title = c[dd.dataset.field] || ''; });
  setPressed($('#actFav'), !!c.fav);
  setPressed($('#actLock'), !!c.locked);
  $('#actLock use').setAttribute('href', c.locked ? '#i-lock' : '#i-unlock');
  $('#actLock').setAttribute('aria-label', c.locked ? 'Unlock contact' : 'Lock contact');
  $('#detail').classList.toggle('is-locked', !!c.locked);
}
function renderRelated() {
  const c = current();
  $('#relList').innerHTML = c.related.map(([id, tag], i) => {
    const p = byId(id); if (!p) return '';
    return `<div class="rel" data-i="${i}">${avatarHTML(p)}<button class="rel-name" data-open="${p.id}">${esc(p.name)}</button>`
      + `<span class="tag${PERSONAL_TAGS.includes(tag) ? ' is-personal' : ''}">${esc(tag)}</span>`
      + `<button class="kebab" data-menu="${i}" aria-label="More for ${esc(p.name)}">${icon('more')}</button></div>`;
  }).join('') || emptyNote('There are no linked<br>contacts at this time!');
}
function renderOrgs() {
  const c = current();
  $('#orgList').innerHTML = c.orgs.map(([key, since, role], i) =>
    `<button class="org" data-i="${i}" aria-label="${esc(ORGS[key]?.name || key)}"><span class="org-since">${esc(since)}</span>`
    + `<span class="org-logo">${ORG_LOGOS[key] || esc(ORGS[key]?.name || key)}</span><span class="org-role">${twoLines(role)}</span></button>`
  ).join('') || emptyNote('There are no<br>organizations<br>at this time!');
}
function renderNotes() {
  const c = current(), list = c.notes[state.tab] || [];
  $$('.tab').forEach(t => { const on = t.dataset.tab === state.tab; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
  $('#noteList').innerHTML = list.map((n, i) =>
    `<li class="note${n.done ? ' is-done' : ''}" data-i="${i}"><button class="check" aria-pressed="${n.done}" aria-label="Done">${icon('check')}</button>`
    + `<span class="note-text">${esc(n.t)}</span>${n.done && n.time ? `<span class="note-time">${esc(n.time)}</span>` : ''}</li>`
  ).join('') || `<li class="note-empty">No ${state.tab === 'projects' ? 'project' : state.tab} notes yet.<br>Press + to write one.</li>`;
}
function renderOpps() {
  const c = current();
  $('#oppList').innerHTML = c.opps.map((o, i) =>
    `<button class="opp" data-i="${i}" style="width:100%;text-align:left"><span class="opp-org">${esc(ORGS[o.org]?.name || o.org)}</span>`
    + `<span class="opp-name">${esc(o.name)}</span><span class="opp-date">${esc(o.date)}</span>`
    + `<span class="opp-bar hatch${o.lost ? ' is-lost' : ''}"><i style="width:0" data-w="${Math.round(o.progress * 100)}%"></i></span></button>`
  ).join('') || emptyNote('There are no<br>opportunities<br>at this time!');
  grow($('#oppList'));
}
const docSrc = f => f.blob || DOCS[f.doc] || '';
function renderFiles() {
  const c = current();
  $('#fileList').innerHTML = c.files.map((f, i) =>
    `<button class="file" data-i="${i}" aria-label="Open ${esc(f.name)}">`
    + `<span class="file-doc${docSrc(f) ? '' : ' generic'}">${docSrc(f) ? `<img src="${docSrc(f)}" alt="">` : '<i></i>'.repeat(16)}</span>`
    + `<span class="file-frost"></span><span class="file-badge">${f.count}</span><span class="file-label">${twoLines(f.name)}</span>`
    + `<svg class="ico file-arrow"><use href="#i-right"/></svg></button>`
  ).join('') || emptyNote('There are no<br>files<br>at this time!');
}
function renderProjects() {
  const c = current(), free = PROJECT_POOL.filter(p => !c.projects.some(x => x.name === p));
  const actions = cls => `<div class="proj-actions ${cls}"><button class="circle" data-proj="assign" aria-label="Assign a project">${icon('assign')}</button>`
    + `<button class="circle proj-add" data-proj="new" aria-label="New project">${icon('plus')}${free.length ? `<span class="proj-badge">${free.length}</span>` : ''}</button></div>`;
  $('#projBody').innerHTML = c.projects.length
    ? `<div class="proj-list scroll-y" id="projList">${c.projects.map((p, i) =>
        `<button class="proj" data-i="${i}" style="width:100%;text-align:left"><span class="proj-name">${esc(p.name)}</span><span class="proj-due">${esc(p.due)}</span>`
        + `<span class="proj-bar hatch"><i style="width:0" data-w="${Math.round(p.progress * 100)}%"></i></span></button>`).join('')}</div>${actions('compact')}`
    : `<div class="proj-empty">${actions('')}${emptyNote('There are no<br>assigned projects<br>at this time!')}</div>`;
  grow($('#projBody'));
}
function renderDetail(animate) {
  renderHead(); renderStats(); renderRelated(); renderOrgs(); renderNotes(); renderOpps(); renderFiles(); renderProjects();
  if (!animate || reduce) return;
  [$('.d-head'), $('#info'), ...$$('.stat'), ...$$('.widget')].forEach((el, i) =>
    el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
      { duration: 460, delay: 30 + i * 28, easing: EASE, fill: 'backwards' }));
}
function changed(...parts) {                        // re-render the touched widgets + the counters
  const map = { related: renderRelated, orgs: renderOrgs, notes: renderNotes, opps: renderOpps, files: renderFiles, projects: renderProjects, head: renderHead };
  parts.forEach(p => map[p]?.());
  renderStats(); save();
}

/* ---------- header actions: favorite, edit, lock ---------- */
function toggleFav() {
  const c = current(); c.fav = !c.fav;
  renderHead(); rowFor(c); save();
  if (state.favOnly) renderList(true);
  toast(c.fav ? `<b>★</b> ${esc(c.name)} added to favorites` : `${esc(c.name)} removed from favorites`);
}
const editables = () => [$('#dName'), ...$$('#info dd')];
function startEditing() {
  if (locked()) return nope($('#actEdit'));
  state.editing = true;
  $('#detail').classList.add('is-editing'); setPressed($('#actEdit'), true);
  const c = current();
  editables().forEach(el => {
    if (el.dataset.field && !c[el.dataset.field]) el.textContent = '';
    el.contentEditable = 'plaintext-only';
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    el.spellcheck = false;
  });
  focusEnd($('#dName'));
}
function stopEditing() {
  if (!state.editing) return;
  const c = current(), name = $('#dName').textContent.trim();
  if (name) c.name = name;
  $$('#info dd').forEach(dd => { c[dd.dataset.field] = dd.textContent.trim(); });
  editables().forEach(el => { el.contentEditable = 'false'; });
  state.editing = false;
  $('#detail').classList.remove('is-editing'); setPressed($('#actEdit'), false);
  renderHead(); rowFor(c); renderRelated(); save();
  toast('<b>✓</b> Contact saved');
}
function focusEnd(el) {
  el.focus();
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
}
$('#actFav').onclick = toggleFav;
$('#actEdit').onclick = () => state.editing ? stopEditing() : startEditing();
$('#actLock').onclick = () => {
  const c = current(); c.locked = !c.locked;
  if (c.locked) stopEditing();
  renderHead(); save();
  toast(c.locked ? `${esc(c.name)} is locked` : `${esc(c.name)} is unlocked`);
};
$('#detail').addEventListener('keydown', e => {
  if (!state.editing || e.key !== 'Enter') return;
  e.preventDefault();
  const f = editables(), i = f.indexOf(e.target);
  if (i >= 0 && i < f.length - 1) focusEnd(f[i + 1]); else stopEditing();
});

/* ---------- stats jump to their widget ---------- */
$('#stats').addEventListener('click', e => {
  const s = e.target.closest('.stat'); if (!s) return;
  const w = $('#' + s.dataset.target);
  w.classList.remove('flash'); void w.offsetWidth; w.classList.add('flash');
  setTimeout(() => w.classList.remove('flash'), 900);
});

/* ---------- popover ---------- */
let popAnchor = null, popItems = [];
function openPop(anchor, items, { title, align = 'end' } = {}) {
  if (popAnchor === anchor && pop.classList.contains('is-open')) return closePop();
  popItems = items;
  pop.innerHTML = (title ? `<div class="pop-title">${esc(title)}</div>` : '') + items.map((it, i) =>
    it.sep ? '<div class="pop-sep"></div>'
    : it.html ? it.html
    : `<button class="pop-item${it.danger ? ' is-danger' : ''}" data-i="${i}" role="menuitem">${it.lead || ''}<span>${esc(it.label)}</span>${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ''}${it.after || ''}</button>`
  ).join('');
  pop.classList.remove('is-open');
  pop.style.left = '0px'; pop.style.top = '0px';
  const a = canvasRect(anchor), pw = pop.offsetWidth, ph = pop.offsetHeight;
  let x = align === 'end' ? a.x + a.w - pw : align === 'center' ? a.x + a.w / 2 - pw / 2 : a.x;
  let y = a.y + a.h + 8, up = false;
  if (y + ph > H - 16) { y = a.y - ph - 8; up = true; }
  x = Math.max(12, Math.min(W - pw - 12, x));
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
  pop.style.setProperty('--ox', (a.x + a.w / 2 - x) + 'px');
  pop.style.setProperty('--oy', up ? '100%' : '0');
  popAnchor = anchor;
  requestAnimationFrame(() => pop.classList.add('is-open'));
}
function closePop() { pop.classList.remove('is-open'); popAnchor = null; }
pop.addEventListener('click', e => {
  const v = e.target.closest('.pop-seg [data-view]');      // scoped: #stage carries data-view too
  if (v) { setView(v.dataset.view); $$('.pop-seg [data-view]', pop).forEach(b => b.setAttribute('aria-pressed', b === v)); return; }
  const b = e.target.closest('[data-i]'); if (!b) return;
  const it = popItems[+b.dataset.i];
  if (!it.keep) closePop();
  it.act?.(b);
});
document.addEventListener('pointerdown', e => {
  if (pop.classList.contains('is-open') && !pop.contains(e.target) && !(popAnchor && popAnchor.contains(e.target))) closePop();
}, true);

/* inline "type and press Enter" row used by notes, opportunities and projects */
function inlineAdd(container, { tag = 'div', cls = '', lead = '', placeholder, commit, cancel }) {
  const row = document.createElement(tag);
  row.className = cls;
  row.innerHTML = `${lead}<input class="inline-input" placeholder="${esc(placeholder)}" maxlength="70">`;
  container.querySelector('.note-empty, .w-empty')?.remove();
  container.prepend(row); container.scrollTop = 0;
  const inp = row.querySelector('input');
  let done = false;
  const finish = ok => {
    if (done) return; done = true;
    const v = inp.value.trim();
    if (ok && v) commit(v); else { row.remove(); cancel?.(); }
  };
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') finish(true);
    else if (e.key === 'Escape') { e.stopPropagation(); finish(false); }
  });
  inp.addEventListener('blur', () => finish(true));
  inp.focus();
}

/* ---------- widgets ---------- */
$('.widgets').addEventListener('click', e => {
  const add = e.target.closest('[data-add]');
  if (add) {
    if (locked()) return nope(add);
    return ({ contact: addRelated, org: addOrg, note: addNote, opp: addOpp, file: () => $('#fileInput').click() })[add.dataset.add](add);
  }
  const open = e.target.closest('[data-open]');
  if (open) return select(open.dataset.open);
  const menu = e.target.closest('[data-menu]');
  if (menu) return relatedMenu(menu, +menu.dataset.menu);
  const tab = e.target.closest('.tab');
  if (tab) { state.tab = tab.dataset.tab; renderNotes(); fadeIn($('#noteList')); return; }
  const check = e.target.closest('button.check');
  if (check) {
    if (locked()) return nope(check);
    const n = current().notes[state.tab][+check.closest('.note').dataset.i];
    n.done = !n.done; n.time = n.done ? 'now' : '';
    return changed('notes');
  }
  const org = e.target.closest('.org');
  if (org) return orgMenu(org, +org.dataset.i);
  const op = e.target.closest('.opp');
  if (op) return oppMenu(op, +op.dataset.i);
  const f = e.target.closest('.file');
  if (f) return openFile(+f.dataset.i);
  const pj = e.target.closest('[data-proj]');
  if (pj) { if (locked()) return nope(pj); return pj.dataset.proj === 'assign' ? assignProject(pj) : newProject(); }
  const pr = e.target.closest('.proj');
  if (pr) return projMenu(pr, +pr.dataset.i);
});
const fadeIn = el => reduce || el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: EASE });

function addRelated(anchor) {
  const c = current(), taken = new Set([c.id, ...c.related.map(r => r[0])]);
  const cands = contacts.filter(p => !taken.has(p.id));
  if (!cands.length) return toast('Everyone is already linked');
  openPop(anchor, cands.map(p => ({ lead: avatarHTML(p), label: p.name, sub: p.role,
    act: () => { c.related.push([p.id, 'Colleague']); changed('related'); toast(`<b>+</b> ${esc(p.name)} linked`); } })), { title: 'Link a contact' });
}
function relatedMenu(anchor, i) {
  const c = current(), [id, tag] = c.related[i], p = byId(id);
  if (locked()) return openPop(anchor, [{ label: 'Open contact', act: () => select(id) }]);
  openPop(anchor, [
    { label: 'Open contact', act: () => select(id) },
    { label: 'Change tag', sub: tag, keep: true, act: () => closePop() || openPop(anchor, TAG_CYCLE.map(t => ({ label: t, sub: t === tag ? '✓' : '',
      act: () => { c.related[i][1] = t; changed('related'); } })), { title: `Tag for ${p.name}` }) },
    { sep: true },
    { label: 'Unlink', danger: true, act: () => { c.related.splice(i, 1); changed('related'); toast(`${esc(p.name)} unlinked`); } },
  ]);
}
function addOrg(anchor) {
  const c = current(), taken = new Set(c.orgs.map(o => o[0]));
  const free = Object.keys(ORGS).filter(k => !taken.has(k));
  if (!free.length) return toast('All organizations are linked');
  openPop(anchor, free.map(k => ({ label: ORGS[k].name,
    act: () => { c.orgs.push([k, 'new', c.title || c.role]); changed('orgs'); const l = $('#orgList'); l.scrollTo({ left: l.scrollWidth, behavior: 'smooth' }); } })),
  { title: 'Link an organization' });
}
function orgMenu(anchor, i) {
  const c = current(), [key] = c.orgs[i];
  openPop(anchor, [{ label: `${ORGS[key]?.name || key}`, sub: c.orgs[i][1] }, { sep: true },
    ...(locked() ? [] : [{ label: 'Unlink organization', danger: true, act: () => { c.orgs.splice(i, 1); changed('orgs'); } }])], { align: 'center' });
}
function addNote() {
  inlineAdd($('#noteList'), { tag: 'li', cls: 'note', lead: '<span class="check"></span>', placeholder: 'Write a note, press Enter',
    commit: v => { current().notes[state.tab].unshift(note(v)); changed('notes'); }, cancel: renderNotes });
}
function addOpp() {
  const c = current();
  inlineAdd($('#oppList'), { cls: 'opp', placeholder: 'Opportunity name, press Enter',
    commit: v => { c.opps.unshift(opp(c.orgs[0]?.[0] || 'clampett', v, today(), .12)); changed('opps'); }, cancel: renderOpps });
}
function oppMenu(anchor, i) {
  const c = current(), o = c.opps[i];
  if (locked()) return;
  openPop(anchor, [
    { label: 'Mark as won', act: () => { Object.assign(o, { progress: 1, lost: false }); changed('opps'); toast(`<b>✓</b> ${esc(o.name)} won`); } },
    { label: 'Mark as lost', act: () => { Object.assign(o, { progress: .06, lost: true }); changed('opps'); } },
    { label: 'Move forward', sub: '+20%', keep: true, act: () => { o.lost = false; o.progress = Math.min(1, o.progress + .2); changed('opps'); closePop(); } },
    { sep: true },
    { label: 'Remove', danger: true, act: () => { c.opps.splice(i, 1); changed('opps'); } },
  ], { align: 'center' });
}
$('#fileInput').addEventListener('change', e => {
  const c = current();
  [...e.target.files].forEach(f => {
    const isImg = f.type.startsWith('image/');
    const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim().slice(0, 40) || 'Untitled';
    c.files.push({ name: name[0].toUpperCase() + name.slice(1), count: 1, doc: null, blob: isImg ? URL.createObjectURL(f) : null });
  });
  e.target.value = '';
  changed('files');
  const l = $('#fileList'); l.scrollTo({ left: l.scrollWidth, behavior: 'smooth' });
  toast('<b>↑</b> File uploaded');
});
function assignProject(anchor) {
  const c = current(), free = PROJECT_POOL.filter(p => !c.projects.some(x => x.name === p));
  if (!free.length) return toast('No free projects to assign');
  openPop(anchor, free.map(name => ({ label: name, act: () => { c.projects.push(proj(name, inDays(30), .05)); changed('projects'); toast(`<b>+</b> ${esc(name)} assigned`); } })),
    { title: 'Assign a project', align: 'center' });
}
function newProject() {
  const c = current();
  if (!c.projects.length) $('#projBody').innerHTML = '<div class="proj-list scroll-y" id="projList"></div>';
  inlineAdd($('#projList'), { cls: 'proj', placeholder: 'Project name, press Enter',
    commit: v => { c.projects.unshift(proj(v, inDays(45), 0)); changed('projects'); }, cancel: renderProjects });
}
function projMenu(anchor, i) {
  const c = current(), p = c.projects[i];
  if (locked()) return;
  openPop(anchor, [
    { label: 'Mark complete', act: () => { p.progress = 1; changed('projects'); } },
    { label: 'Unassign', danger: true, act: () => { c.projects.splice(i, 1); changed('projects'); } },
  ], { align: 'center' });
}

/* ---------- file preview ---------- */
const modal = $('#modal');
let openFileRef = null;
function openFile(i) {
  const c = current(), f = c.files[i];
  openFileRef = f;
  const src = docSrc(f);
  $('#sheetImg').src = src || DOCS.employment;
  $('#sheetImg').style.opacity = src ? 1 : .15;
  $('#sheetName').textContent = f.name;
  $('#sheetSub').textContent = `${f.count} ${f.count === 1 ? 'page' : 'pages'} · ${c.name}`;
  modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
  $('#sheetClose').focus({ preventScroll: true });
}
function closeModal() { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); }
$('#sheetClose').onclick = closeModal;
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
$('#sheetDownload').onclick = () => {
  const f = openFileRef, src = f && docSrc(f);
  if (!src) return toast('Nothing to download for this file');
  download(src, `${f.name}.jpg`);
};

/* ---------- navigation ---------- */
const PAGES = { home: 'Home', contacts: 'Contacts', tasks: 'Tasks', organizations: 'Organizations', leads: 'Leads', opportunities: 'Opportunities', projects: 'Projects', reports: 'Reports' };
const pill = $('#navPill');
function placePill(instant) {
  const a = $('#nav [data-page].is-active');
  if (instant) pill.style.transition = 'none';
  pill.style.width = a.offsetWidth + 'px';
  pill.style.transform = `translateX(${a.offsetLeft}px)`;
  if (instant) { void pill.offsetWidth; pill.style.transition = ''; }
}
function go(page) {
  if (page === state.page) return;
  const items = $$('#nav [data-page]'), before = items.map(b => b.offsetLeft);
  state.page = page;
  items.forEach(b => b.classList.toggle('is-active', b.dataset.page === page));
  if (!reduce) items.forEach((b, i) => {                         // FLIP: the active item is wider, neighbours glide
    const d = before[i] - b.offsetLeft;
    if (d) b.animate([{ transform: `translateX(${d}px)` }, { transform: 'none' }], { duration: 550, easing: EASE });
  });
  placePill();
  const away = page !== 'contacts';
  if (away && state.editing) stopEditing();
  closePop();
  app.classList.toggle('is-away', away);
  $('#crumb').textContent = PAGES[page];
  $('#title').textContent = page === 'home' ? 'Overview' : `All ${PAGES[page]}`;
  $('#count').style.opacity = away ? 0 : 1;
  $('#awayText').innerHTML = `${PAGES[page]} isn’t part of this shot.<br>Only the Contacts screen was designed.`;
}
$('#nav').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (b) go(b.dataset.page); });
$('#awayBack').onclick = () => go('contacts');
$('#back').onclick = () => {
  if (state.page !== 'contacts') return go('contacts');
  let id;
  while ((id = state.history.pop()) && !byId(id));
  if (id) select(id, { push: false }); else nope($('#back'), 'Nothing to go back to');
};

/* ---------- search ---------- */
search.addEventListener('input', () => {
  if (state.page !== 'contacts') go('contacts');
  state.query = search.value; renderList(true);
});
search.addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.stopPropagation(); search.value = ''; state.query = ''; renderList(true); search.blur(); }
  if (e.key === 'Enter') { const first = visible()[0]; if (first) { select(first.id); search.blur(); } }
  if (e.key === 'ArrowDown') { e.preventDefault(); search.blur(); move(1); }
});

/* ---------- dock ---------- */
const privacy = $('#privacy');
$('#dockPrivacy').onclick = () => { closePop(); privacy.classList.add('is-open'); privacy.setAttribute('aria-hidden', 'false'); };
privacy.onclick = () => { privacy.classList.remove('is-open'); privacy.setAttribute('aria-hidden', 'true'); };
$('#dockView').onclick = () => setView({ app: 'shot', shot: '3d', '3d': 'app' }[prefs.view]);
$('#dockSearch').onclick = () => search.focus();
$('#dockFav').onclick = () => {
  state.favOnly = !state.favOnly;
  setPressed($('#dockFav'), state.favOnly);
  if (state.page !== 'contacts') go('contacts');
  renderList(true);
  toast(state.favOnly ? 'Showing <b>favorites</b>' : 'Showing all contacts');
};
$('#dockSort').onclick = () => {
  state.sort = (state.sort + 1) % SORTS.length;
  setPressed($('#dockSort'), state.sort !== 0);
  renderList(true);
  toast(['Original order', 'Sorted <b>A → Z</b>', 'Sorted <b>Z → A</b>'][state.sort]);
};
$('#dockAdd').onclick = () => {
  if (state.page !== 'contacts') go('contacts');
  let c;
  if (!byId(NEW_CONTACT_TEMPLATE.id)) c = clone(NEW_CONTACT_TEMPLATE);
  else c = { ...clone(NEW_CONTACT_TEMPLATE), id: `contact-${Date.now()}`, name: 'New Contact', role: 'Lead', title: 'Lead', phone: '', email: '', noPhoto: true, orgs: [] };
  contacts.push(c);
  state.query = ''; search.value = ''; state.favOnly = false; setPressed($('#dockFav'), false);
  renderList(true); select(c.id); save();
  toast(`<b>+</b> ${esc(c.name)} created`);
  if (c.noPhoto) setTimeout(startEditing, 350);
};
$('#dockExport').onclick = () => {
  const l = visible();
  const table = [['Name', 'Role', 'Title', 'Organization', 'Phone', 'Email', 'Owner'], ...l.map(c => [c.name, c.role, c.title, c.org, c.phone, c.email, c.owner])];
  const csv = table.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  download(new Blob([csv], { type: 'text/csv' }), 'insightly-contacts.csv');
  toast(`<b>↓</b> Exported ${l.length} contacts`);
};
$('#dockCal').onclick = e => {
  $('#calDot').classList.add('is-off');
  openPop(e.currentTarget, [
    { label: 'Arkham Project interview', sub: 'Today 14:00', act: () => select('aaron-rodd') },
    { label: 'Clampett renewal call', sub: 'Thu 11:30', act: () => select('beth-simpson') },
    { label: 'Partner summit venue tour', sub: 'Fri 16:00', act: () => select('charles-lynch') },
  ], { title: 'Upcoming' });
};
$('#dockSettings').onclick = e => {
  openPop(e.currentTarget, [
    { html: `<div class="pop-title">Presentation</div><div class="pop-seg">${['app', 'shot', '3d'].map(v =>
      `<button data-view="${v}" aria-pressed="${prefs.view === v}">${v === '3d' ? '3D' : v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</div>` },
    { label: 'Ambient light', keep: true, after: `<span class="toggle${prefs.glow ? ' is-on' : ''}"></span>`,
      act: b => { prefs.glow = !prefs.glow; app.classList.toggle('no-glow', !prefs.glow); b.querySelector('.toggle').classList.toggle('is-on', prefs.glow); save(); } },
    { sep: true },
    { label: 'Reset demo data', danger: true, act: () => {
      contacts = clone(CONTACTS); rows.forEach(r => r.remove()); rows.clear();
      Object.assign(state, { sel: 'aaron-rodd', history: [], query: '', favOnly: false, sort: 0 });
      search.value = ''; setPressed($('#dockFav'), false); setPressed($('#dockSort'), false);
      renderList(); renderDetail(true); save(); toast('Demo data restored');
    } },
  ], { title: '' });
};
$('#dockMe').onclick = e => {
  const me = e.currentTarget;                     // captured: currentTarget is null once the event is done
  openPop(me, [
    { html: `<div class="pop-profile"><img class="avatar" src="${ME.avatar}" alt=""><div><b>${esc(ME.name)}</b><span>${esc(ME.role)}</span></div></div>` },
    { sep: true },
    { label: 'Keyboard shortcuts', keep: true, act: () => closePop() || openPop(me, [
      ['↑ ↓', 'Move through contacts'], ['/', 'Search'], ['E', 'Edit contact'], ['F', 'Favorite'], ['1 2 3', 'App · Shot · 3D'], ['Esc', 'Close / cancel'],
    ].map(([k, v]) => ({ label: v, sub: k }))) },
  ]);
};

/* ---------- presentation: app / flat shot / 3D like the Dribbble mockups ---------- */
const tilt = { x: 0, y: 0 };
function fit(animate) {
  rig.classList.toggle('no-anim', !animate);
  const vw = innerWidth, vh = innerHeight;
  let t;
  if (prefs.view === 'app') t = `scale(${Math.min(vw / W, vh / H)})`;
  else if (prefs.view === 'shot') t = `translateY(-26px) scale(${Math.min((vw - 64) / W, (vh - 150) / H)})`;
  else t = `translate3d(4%,-3%,0) scale(${Math.min(vw / W, vh / H) * .7}) rotateX(${42 + tilt.y}deg) rotateZ(${-26 + tilt.x}deg)`;
  rig.style.transform = t;
}
function setView(v) {
  prefs.view = v; stage.dataset.view = v;
  $$('#viewSwitch button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === v));
  fit(true); save();
}
$('#viewSwitch').addEventListener('click', e => { const b = e.target.closest('#viewSwitch [data-view]'); if (b) setView(b.dataset.view); });
let tiltRaf;
stage.addEventListener('pointermove', e => {
  if (prefs.view !== '3d' || reduce) return;
  cancelAnimationFrame(tiltRaf);
  tiltRaf = requestAnimationFrame(() => {
    tilt.x = (e.clientX / innerWidth - .5) * 5;
    tilt.y = (e.clientY / innerHeight - .5) * -4;
    fit(true);
  });
});
addEventListener('resize', () => fit(false));

/* ---------- keyboard ---------- */
addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (modal.classList.contains('is-open')) return closeModal();
    if (pop.classList.contains('is-open')) return closePop();
    if (privacy.classList.contains('is-open')) return privacy.click();
    if (state.editing) return stopEditing();
    if (state.query) { search.value = ''; state.query = ''; return renderList(true); }
    return;
  }
  const typing = e.target.closest('input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]');
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (state.page === 'contacts') { e.preventDefault(); move(e.key === 'ArrowDown' ? 1 : -1); } }
  else if (e.key === '/') { e.preventDefault(); search.focus(); }
  else if (e.key === 'e' || e.key === 'E') { state.editing ? stopEditing() : startEditing(); }
  else if (e.key === 'f' || e.key === 'F') toggleFav();
  else if (e.key === '1') setView('app');
  else if (e.key === '2') setView('shot');
  else if (e.key === '3') setView('3d');
});

/* ---------- boot ---------- */
stage.dataset.view = prefs.view;
$$('#viewSwitch button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === prefs.view));
app.classList.toggle('no-glow', !prefs.glow);
fit(false);
renderList();
renderDetail(false);
placePill(true);
document.fonts?.ready.then(() => { placePill(true); placeHighlight(true); });
requestAnimationFrame(() => rig.classList.remove('no-anim'));
if (!reduce) {
  $$('.row').forEach((r, i) => r.animate([{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 80 + i * 22, easing: EASE, fill: 'backwards' }));
  [$('.d-head'), $('#info'), ...$$('.stat'), ...$$('.widget')].forEach((el, i) =>
    el.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 120 + i * 30, easing: EASE, fill: 'backwards' }));
}
})();
