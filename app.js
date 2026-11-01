'use strict';
/* FitScan – Free calorie & macro tracker – unlimited barcode scans, no paywall. Alle Daten bleiben lokal (localStorage). */
const MEALS = [['breakfast','Frühstück','🌅'],['lunch','Mittagessen','🍽️'],['dinner','Abendessen','🌙'],['snacks','Snacks','🍎']];
const KEY = 'fitscan.v1';
try { if (!localStorage.getItem(KEY) && localStorage.getItem('naehrwerk.v1')) localStorage.setItem(KEY, localStorage.getItem('naehrwerk.v1')); } catch {}
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r0 = x => Math.round(x || 0), r1 = x => Math.round((x || 0) * 10) / 10;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const iso = d => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const fmtDate = s => new Date(s + 'T12:00:00').toLocaleDateString(LOC(), { weekday: 'short', day: 'numeric', month: 'short' });
const fmtShort = s => new Date(s + 'T12:00:00').toLocaleDateString(LOC(), { day: 'numeric', month: 'numeric' });
const de = (x, d = 0) => (x ?? 0).toLocaleString(LOC(), { maximumFractionDigits: d, minimumFractionDigits: d });

// ---------- State ----------
const DEFAULT = () => ({ profile: null, goals: { kcal: 2200, p: 140, c: 240, f: 75, manual: false }, entries: {}, weights: {},
  foods: {}, products: {}, recipes: {}, recents: [], favorites: {}, settings: { theme: 'dark', lang: null } });
let S = load();
function load() { try { return Object.assign(DEFAULT(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { return DEFAULT(); } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Speicher voll – bitte Backup exportieren'); } }

let ui = { tab: 'diary', date: today(), targetMeal: null, libTab: 'search', query: '', results: null, chart: { metric: 'weight', range: 90, type: 'line', smooth: 'ema' } };

// ---------- Nutrition helpers ----------
const nutr = (food, g) => { const k = g / 100, n = food.n; return { kcal: n.kcal * k, p: n.p * k, c: n.c * k, f: n.f * k, fib: (n.fib || 0) * k, sug: (n.sug || 0) * k, salt: (n.salt || 0) * k }; };
function dayTotals(date) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, salt: 0 };
  for (const e of S.entries[date] || []) { const n = nutr(e.food, e.g); for (const k in t) t[k] += n[k]; }
  return t;
}
function mealDefault() { const h = new Date().getHours(); return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 21 ? 'dinner' : 'snacks'; }
const allFoodsById = id => id.startsWith('base:') ? BASE_FOODS[+id.slice(5)] : S.foods[id] || S.products[id.replace('off:', '')] || recipeFood(S.recipes[id]);

// ---------- Goals (Mifflin-St Jeor) ----------
const ACT = [[1.2, 'Kaum aktiv (Bürojob, wenig Sport)'], [1.375, 'Leicht aktiv (1–3× Sport/Woche)'], [1.55, 'Mäßig aktiv (3–5× Sport/Woche)'], [1.725, 'Sehr aktiv (6–7× Sport/Woche)'], [1.9, 'Extrem aktiv (körperliche Arbeit + Sport)']];
function computeGoals(p) {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  const tdee = bmr * p.activity;
  const delta = p.goal === 'maintain' ? 0 : (p.goal === 'lose' ? -1 : 1) * p.rate * 7700 / 7; // rate kg/Woche
  const kcal = Math.max(p.sex === 'm' ? 1500 : 1200, Math.round((tdee + delta) / 10) * 10);
  const prot = Math.round(p.weight * (p.goal === 'lose' ? 2.0 : 1.8));
  const fat = Math.round(kcal * 0.27 / 9);
  const carb = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4));
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, p: prot, c: carb, f: fat };
}

// ---------- Weight trend & TDEE ----------
function weightSeries() {
  const ds = Object.keys(S.weights).sort(); if (!ds.length) return [];
  const end = ds[ds.length - 1] > today() ? ds[ds.length - 1] : today();
  const out = []; let trend = null;
  for (let d = ds[0]; d <= end; d = addDays(d, 1)) { const w = S.weights[d]; if (w != null) trend = trend == null ? w : trend + 0.1 * (w - trend); out.push({ d, w: w ?? null, t: trend }); }
  return out;
}
function trendAt(series, d) { const x = series.find(s => s.d === d); return x ? x.t : null; }
function weeklyRate(series) {
  if (series.length < 8) return null;
  const end = series[series.length - 1], start = series[series.length - 8];
  return end.t - start.t;
}
function estimateTDEE() {
  const series = weightSeries(); if (!series.length) return null;
  const end = today();
  for (const N of [28, 21, 14]) {
    const start = addDays(end, -N);
    const tS = trendAt(series, start), tE = trendAt(series, end) ?? series[series.length - 1].t;
    if (tS == null) continue;
    const days = []; for (let d = addDays(start, 1); d <= end; d = addDays(d, 1)) if ((S.entries[d] || []).length) days.push(dayTotals(d).kcal);
    const nW = Object.keys(S.weights).filter(d => d > start && d <= end).length;
    if (days.length < N * 0.7 || nW < N * 0.4) continue;
    const avgIn = days.reduce((a, b) => a + b, 0) / days.length;
    const tdee = avgIn - (tE - tS) * 7700 / N;
    return { tdee: Math.round(tdee / 10) * 10, avgIn: Math.round(avgIn), change: tE - tS, N, logged: days.length };
  }
  return null;
}

// ---------- UI helpers ----------
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200); }
function openSheet(html, onMount) {
  const sh = $('#sheet'); sh.innerHTML = '<div class="grab"></div>' + html; sh.classList.remove('hidden'); $('#sheetBackdrop').classList.remove('hidden');
  sh.scrollTop = 0; onMount && onMount(sh);
}
function closeSheet() { $('#sheet').classList.add('hidden'); $('#sheetBackdrop').classList.add('hidden'); }
$('#sheetBackdrop').onclick = closeSheet;
function setTheme(t) { document.documentElement.dataset.theme = t; S.settings.theme = t; $('meta[name=theme-color]').content = t === 'dark' ? '#0e1116' : '#f4f6fb'; }
$('#themeBtn').onclick = () => { setTheme(S.settings.theme === 'dark' ? 'light' : 'dark'); save(); render(); };
document.querySelectorAll('.tabbar button').forEach(b => b.onclick = () => b.dataset.tab === 'scan' ? openScanner() : go(b.dataset.tab));
function go(tab, opts = {}) { ui.tab = tab; Object.assign(ui, opts); document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab)); window.scrollTo(0, 0); render(); }
const TITLES = { diary: 'Tagebuch', library: 'Lebensmittel', progress: 'Fortschritt', profile: 'Profil & Daten' };
function render() { $('#pageTitle').textContent = TITLES[ui.tab]; const v = $('#view'); ({ diary: renderDiary, library: renderLibrary, progress: renderProgress, profile: renderProfile })[ui.tab](v); }
const foodIcon = f => f.img ? `<img class="thumb" src="${esc(f.img)}" loading="lazy" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'thumb',textContent:'🛒'}))">` : `<div class="thumb">${({Obst:'🍎',Trockenobst:'🍇',Gemüse:'🥦',Getreide:'🌾',Beilagen:'🍚',Brot:'🍞',Milchprodukte:'🥛',Käse:'🧀',Fette:'🫒',Eier:'🥚',Fleisch:'🍗',Wurst:'🥓',Fisch:'🐟',Hülsenfrüchte:'🫘',Nüsse:'🥜',Süßes:'🍫',Snacks:'🍿',Supplemente:'💪',Getränke:'🥤',Saucen:'🥫',Gerichte:'🍲',Gericht:'🥘',Eigene:'✏️'})[f.cat] || '🍴'}</div>`;

// ---------- Diary ----------
function ring(val, goal, size = 132, stroke = 12, color = 'var(--kcal)') {
  const r = (size - stroke) / 2, C = 2 * Math.PI * r, pct = Math.min(1, goal ? val / goal : 0);
  const over = val > goal;
  return `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="var(--card2)" stroke-width="${stroke}" fill="none"/>
  <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="${over ? 'var(--danger)' : color}" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>`;
}
function renderDiary(v) {
  const d = ui.date, t = dayTotals(d), g = S.goals, rest = g.kcal - t.kcal;
  const mb = (k, lbl, col) => `<div class="mrow"><div class="lbl"><span>${lbl}</span><span><b>${r0(t[k])}</b> / ${g[k]} g</span></div><div class="bar"><i style="width:${Math.min(100, t[k] / g[k] * 100)}%;background:${t[k] > g[k] * 1.05 ? 'var(--danger)' : col}"></i></div></div>`;
  let html = `<div class="datenav"><button id="dPrev">‹</button><div class="d" id="dLabel">${d === today() ? 'Heute' : d === addDays(today(), -1) ? 'Gestern' : fmtDate(d)}<div class="small mut">${fmtDate(d)}</div></div><button id="dNext">›</button></div>
  <div class="card"><div class="summary"><div class="ring">${ring(t.kcal, g.kcal)}<div class="center"><span class="big">${de(Math.abs(rest))}</span><span class="small mut">${rest >= 0 ? 'kcal übrig' : 'kcal drüber'}</span></div></div>
  <div class="macros"><div class="small mut">${de(t.kcal)} von ${de(g.kcal)} kcal gegessen</div>${mb('p', 'Protein', 'var(--p)')}${mb('c', 'Kohlenhydrate', 'var(--c)')}${mb('f', 'Fett', 'var(--f)')}</div></div>
  <div class="row small mut" style="margin-top:10px;justify-content:space-around"><span>Ballaststoffe <b>${r0(t.fib)} g</b></span><span>Zucker <b>${r0(t.sug)} g</b></span><span>Salz <b>${r1(t.salt)} g</b></span></div></div>`;
  for (const [id, name, ico] of MEALS) {
    const es = (S.entries[d] || []).filter(e => e.meal === id), kc = es.reduce((a, e) => a + nutr(e.food, e.g).kcal, 0);
    html += `<div class="card meal"><h3><span>${ico} ${name}</span><span class="kc">${de(kc)} kcal</span></h3>`;
    for (const e of es) { const n = nutr(e.food, e.g);
      html += `<div class="entry" data-eid="${e.id}">${foodIcon(e.food)}<div class="grow"><div class="nm">${esc(e.food.name)}</div><div class="small mut">${esc(e.label || r0(e.g) + ' g')} · P ${r0(n.p)} · K ${r0(n.c)} · F ${r0(n.f)}</div></div><div class="kcal">${de(n.kcal)}</div></div>`; }
    html += `<div class="addrow"><button class="btn ghost sm" data-add="${id}">＋ Hinzufügen</button>${!es.length ? `<button class="btn ghost sm" data-copy="${id}">↺ Wie gestern</button>` : ''}</div></div>`;
  }
  const w = S.weights[d];
  html += `<div class="card"><h3><span>⚖️ Gewicht</span><button class="btn sm" id="dWeight">${w ? de(w, 1) + ' kg' : 'Eintragen'}</button></h3><div class="small mut">${S.profile ? 'Tägliches Wiegen (morgens, nüchtern) macht den Trend am genauesten.' : 'Tipp: Lege im Profil deine Ziele fest, um passende Kalorien- und Makroziele zu bekommen.'}</div></div>`;
  v.innerHTML = html;
  $('#dPrev').onclick = () => { ui.date = addDays(d, -1); render(); };
  $('#dNext').onclick = () => { ui.date = addDays(d, 1); render(); };
  $('#dLabel').onclick = () => { ui.date = today(); render(); };
  $('#dWeight').onclick = () => weightSheet(d);
  v.querySelectorAll('[data-add]').forEach(b => b.onclick = () => go('library', { targetMeal: b.dataset.add }));
  v.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => copyMeal(addDays(d, -1), d, b.dataset.copy));
  v.querySelectorAll('[data-eid]').forEach(el => el.onclick = () => { const e = (S.entries[d] || []).find(x => x.id === el.dataset.eid); e && foodSheet(e.food, { entry: e }); });
}
function copyMeal(from, to, meal) {
  const src = (S.entries[from] || []).filter(e => e.meal === meal);
  if (!src.length) return toast('Gestern nichts bei dieser Mahlzeit eingetragen');
  (S.entries[to] ||= []).push(...src.map(e => ({ ...e, id: uid() }))); save(); render(); toast(`${src.length} Einträge kopiert`);
}
function addEntry(food, g, label, meal, date = ui.date) {
  const snap = { id: food.id, name: food.name, brand: food.brand || '', img: food.img || '', cat: food.cat || '', n: food.n, serving: food.serving || null, src: food.src };
  (S.entries[date] ||= []).push({ id: uid(), meal, g, label, food: snap });
  S.recents = [snap, ...S.recents.filter(x => x.id !== snap.id)].slice(0, 40);
  save();
}

// ---------- Food sheet (amount + meal) ----------
function foodSheet(food, { entry = null } = {}) {
  const units = [['g', 'Gramm', 1]];
  if (food.serving?.g) units.push(['serv', food.serving.label || 'Portion', food.serving.g]);
  if (food.piece?.g) units.push(['pc', 'Stück', food.piece.g]);
  if (food.n && /Getränke/.test(food.cat || '')) units.push(['ml', 'ml', 1]);
  let unit = entry ? (entry.unit || 'g') : (food.serving?.g ? 'serv' : 'g');
  let qty = entry ? (entry.qty ?? entry.g) : (food.serving?.g ? 1 : 100);
  if (!units.find(u => u[0] === unit)) { unit = 'g'; qty = entry ? entry.g : 100; }
  let meal = entry ? entry.meal : (ui.targetMeal || mealDefault());
  const fav = !!S.favorites[food.id];
  const sv = food.serving?.g ? nutr(food, food.serving.g) : null;
  const n100 = food.n;
  openSheet(`<div class="prodhead">${food.img ? `<img src="${esc(food.img)}" alt="" onerror="this.style.display='none'">` : foodIcon(food).replace('thumb', 'thumb" style="width:64px;height:64px;font-size:32px')}
    <div class="grow"><h2>${esc(food.name)}</h2><div class="mut small">${esc(food.brand || food.cat || '')}${food.code ? ' · ' + esc(food.code) : ''}</div></div>
    <button class="star" id="fsFav" title="Favorit">${fav ? '★' : '☆'}</button></div>
  <div class="grid4" id="fsLive"></div>
  <div class="row" style="margin-top:12px"><input class="input" id="fsQty" type="number" inputmode="decimal" min="0" step="any" value="${qty}" style="max-width:110px">
    <select class="input" id="fsUnit">${units.map(u => `<option value="${u[0]}" ${u[0] === unit ? 'selected' : ''}>${esc(u[1])}${u[0] !== 'g' && u[0] !== 'ml' ? ' (' + de(u[2]) + ' g)' : ''}</option>`).join('')}</select></div>
  <div class="seg" id="fsMeal" style="margin-top:10px">${MEALS.map(m => `<button data-m="${m[0]}" class="${m[0] === meal ? 'on' : ''}">${m[2]} ${m[1].replace('essen', '.')}</button>`).join('')}</div>
  <button class="btn block" id="fsSave">${entry ? 'Änderung speichern' : 'Zum Tagebuch hinzufügen'}</button>
  ${entry ? '<button class="btn block ghost" id="fsDel" style="margin-top:8px;color:var(--danger)">Eintrag löschen</button>' : ''}
  <table class="ntable" style="margin-top:14px"><tr><th>Nährwerte</th><th>pro 100 g</th>${sv ? `<th>pro Portion (${de(food.serving.g)} g)</th>` : ''}</tr>
  ${[['Energie', 'kcal', ' kcal', 0], ['Protein', 'p', ' g', 1], ['Kohlenhydrate', 'c', ' g', 1], ['davon Zucker', 'sug', ' g', 1], ['Fett', 'f', ' g', 1], ['Ballaststoffe', 'fib', ' g', 1], ['Salz', 'salt', ' g', 2]]
     .map(([l, k, u, dd]) => `<tr><td>${l}</td><td>${de(n100[k] || 0, dd)}${u}</td>${sv ? `<td>${de(sv[k], dd)}${u}</td>` : ''}</tr>`).join('')}</table>
  ${food.src === 'off' ? '<div class="small mut" style="margin-top:8px">Daten: Open Food Facts (ODbL) – Angaben können unvollständig sein.</div>' : ''}`, sh => {
    const grams = () => { const u = units.find(x => x[0] === $('#fsUnit').value); return (+$('#fsQty').value || 0) * u[2]; };
    const live = () => { const n = nutr(food, grams()); $('#fsLive').innerHTML = [['kcal', 'kcal', 'var(--kcal)'], ['p', 'Protein', 'var(--p)'], ['c', 'Kohlenh.', 'var(--c)'], ['f', 'Fett', 'var(--f)']].map(([k, l, c]) => `<div class="pill"><b style="color:${c}">${de(n[k], k === 'kcal' ? 0 : 1)}</b><span class="small mut">${l}</span></div>`).join(''); };
    $('#fsQty').oninput = live; $('#fsUnit').onchange = () => { const u = $('#fsUnit').value; $('#fsQty').value = u === 'g' || u === 'ml' ? r0(food.serving?.g || 100) : 1; live(); };
    live();
    sh.querySelectorAll('#fsMeal button').forEach(b => b.onclick = () => { meal = b.dataset.m; sh.querySelectorAll('#fsMeal button').forEach(x => x.classList.toggle('on', x === b)); });
    $('#fsFav').onclick = () => { if (S.favorites[food.id]) delete S.favorites[food.id]; else S.favorites[food.id] = { ...food }; save(); $('#fsFav').textContent = S.favorites[food.id] ? '★' : '☆'; };
    $('#fsSave').onclick = () => {
      const g = grams(); if (!(g > 0)) return toast('Bitte Menge eingeben');
      const u = units.find(x => x[0] === $('#fsUnit').value), q = +$('#fsQty').value;
      const label = u[0] === 'g' ? `${de(q)} g` : u[0] === 'ml' ? `${de(q)} ml` : `${de(q, q % 1 ? 1 : 0)} × ${u[1]}`;
      if (entry) Object.assign(entry, { g, label, meal, unit: u[0], qty: q });
      else { addEntry(food, g, label, meal); const e = S.entries[ui.date].at(-1); e.unit = u[0]; e.qty = q; }
      save(); closeSheet(); toast(entry ? 'Gespeichert' : `✓ ${food.name} hinzugefügt`); if (!entry) { ui.targetMeal = null; go('diary'); } else render();
    };
    if (entry) $('#fsDel').onclick = () => { S.entries[ui.date] = S.entries[ui.date].filter(x => x.id !== entry.id); save(); closeSheet(); render(); toast('Gelöscht'); };
  });
}

// ---------- Open Food Facts ----------
const OFF_FIELDS = 'code,product_name,product_name_de,generic_name_de,brands,image_front_small_url,image_front_url,nutriments,serving_size,serving_quantity,quantity';
function parseOFF(p, code) {
  if (!p) return null;
  const nm = p.nutriments || {};
  const num = k => { const x = parseFloat(nm[k]); return isFinite(x) ? x : 0; };
  let kcal = num('energy-kcal_100g'); if (!kcal && num('energy_100g')) kcal = num('energy_100g') / 4.184;
  const name = p.product_name_de || p.product_name || p.generic_name_de || 'Unbenanntes Produkt';
  const sq = parseFloat(p.serving_quantity);
  const brand = Array.isArray(p.brands) ? p.brands.join(', ') : (p.brands || '');
  return { id: 'off:' + (p.code || code), src: 'off', code: p.code || code, name: name.trim(), brand: brand.split(',').slice(0, 2).join(', ').trim(), img: p.image_front_small_url || p.image_front_url || '',
    cat: '', quantity: p.quantity || '', n: { kcal: r1(kcal), p: num('proteins_100g'), c: num('carbohydrates_100g'), f: num('fat_100g'), sug: num('sugars_100g'), fib: num('fiber_100g'), salt: num('salt_100g') },
    serving: sq > 0 ? { g: sq, label: p.serving_size ? 'Portion: ' + String(p.serving_size).replace(/^1 (portion|serving)\s*/i, '').replace(/^\((.*)\)$/, '$1') : 'Portion' } : null, hasNutr: !!(kcal || nm.proteins_100g != null) };
}
async function lookupBarcode(code) {
  code = String(code).replace(/\D/g, '');
  if (S.products[code]) return { product: S.products[code], cached: true };
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}&lc=de`, { headers: { Accept: 'application/json' } });
  if (res.status === 404) return { product: null };
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const j = await res.json();
  if (j.status !== 1 || !j.product) return { product: null };
  const prod = parseOFF(j.product, code);
  S.products[code] = prod; save();
  return { product: prod, cached: false };
}
async function searchOFF(q, signal) {
  const qs = encodeURIComponent(q), F = `&fields=${OFF_FIELDS}`;
  const sal = async extra => { const r = await fetch(`https://search.openfoodfacts.org/search?q=${qs}${extra}&langs=de,en&page_size=30${F}`, { signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return (await r.json()).hits || []; };
  const cgi = async () => { const r = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${qs}&search_simple=1&json=1&page_size=30&countries_tags_en=germany&lc=de${F}`, { signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return (await r.json()).products || []; };
  const tries = [async () => { let h = await sal('%20countries_tags:%22en:germany%22'); if (h.length < 5) h = h.concat(await sal('')); return h; }, cgi,
    async () => { await new Promise(r => setTimeout(r, 1200)); return sal(''); }, async () => { await new Promise(r => setTimeout(r, 2000)); return cgi(); }];
  let err;
  for (const t of tries) { try { return dedupe((await t()).map(p => parseOFF(p)).filter(x => x && x.hasNutr)); } catch (e) { if (e?.name === 'AbortError') throw e; err = e; } }
  throw err || new Error('Suche nicht erreichbar');
}
const dedupe = arr => { const s = new Set(); return arr.filter(x => !s.has(x.id) && s.add(x.id)); };

// ---------- Library ----------
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss');
function localSearch(q) {
  const nq = norm(q).split(/\s+/).filter(Boolean);
  const pool = [...Object.values(S.recipes).map(recipeFood), ...Object.values(S.foods), ...Object.values(S.products), ...BASE_FOODS];
  return pool.filter(f => { const h = norm(f.name + ' ' + (f.brand || '') + ' ' + (f.cat || '')); return nq.every(w => h.includes(w)); })
    .sort((a, b) => norm(a.name).indexOf(nq[0]) - norm(b.name).indexOf(nq[0]) || a.name.length - b.name.length).slice(0, 40);
}
function foodRow(f) {
  const s = f.serving?.g ? ` · ${esc(f.serving.label)}` : '';
  return `<div class="food" data-fid="${esc(f.id)}">${foodIcon(f)}<div class="grow"><div class="nm">${esc(f.name)}${f.src === 'recipe' ? '<span class="badge">Gericht</span>' : f.src === 'custom' ? '<span class="badge">Eigenes</span>' : ''}</div>
  <div class="small mut">${esc(f.brand || f.cat || '')}${f.brand || f.cat ? ' · ' : ''}${de(f.n.kcal)} kcal/100 g${s}</div></div><button class="qa" data-qa="${esc(f.id)}" title="Schnell hinzufügen">＋</button></div>`;
}
let searchCtl = null, searchTimer = null, lastList = [];
function renderLibrary(v) {
  const tabs = [['search', 'Suche'], ['fav', '★ Favoriten'], ['recent', 'Zuletzt'], ['custom', 'Eigene'], ['recipes', 'Gerichte'], ['base', 'Basis']];
  v.innerHTML = `${ui.targetMeal ? `<div class="small mut" style="margin-bottom:6px">Hinzufügen zu: <b>${MEALS.find(m => m[0] === ui.targetMeal)[1]}</b> · ${fmtDate(ui.date)}</div>` : ''}
  <div class="search"><input class="input" id="lq" type="search" placeholder="Lebensmittel, Marke oder Barcode suchen…" value="${esc(ui.query)}" autocomplete="off"><button class="btn" id="lScan" title="Scannen">▥</button></div>
  <div class="chips">${tabs.map(t => `<button class="chip ${ui.libTab === t[0] ? 'on' : ''}" data-lt="${t[0]}">${t[1]}</button>`).join('')}</div>
  <div id="lActions"></div><div class="card" style="padding:4px 12px" id="lList"></div>`;
  v.querySelectorAll('[data-lt]').forEach(b => b.onclick = () => { ui.libTab = b.dataset.lt; render(); });
  $('#lScan').onclick = openScanner;
  const lq = $('#lq');
  lq.oninput = () => { ui.query = lq.value; if (ui.libTab !== 'search') { ui.libTab = 'search'; render(); $('#lq').focus(); return; } doSearch(); };
  lq.onkeydown = e => { if (e.key === 'Enter') { clearTimeout(searchTimer); doSearch(true); } };
  fillLibList();
}
function bindList(list) {
  lastList = list; const el = $('#lList');
  el.querySelectorAll('[data-fid]').forEach(r => r.onclick = e => { if (e.target.closest('[data-qa]')) return; const f = list.find(x => x.id === r.dataset.fid); f && foodSheet(f); });
  el.querySelectorAll('[data-qa]').forEach(b => b.onclick = () => { const f = list.find(x => x.id === b.dataset.qa); const g = f.serving?.g || 100;
    addEntry(f, g, f.serving?.g ? `1 × ${f.serving.label}` : '100 g', ui.targetMeal || mealDefault()); toast(`✓ ${f.name} (${de(nutr(f, g).kcal)} kcal)`); });
}
function fillLibList() {
  const el = $('#lList'), act = $('#lActions'); act.innerHTML = '';
  const show = (list, empty) => { el.innerHTML = list.length ? list.map(foodRow).join('') : `<div class="empty"><div class="e">${empty[0]}</div>${empty[1]}</div>`; bindList(list); };
  switch (ui.libTab) {
    case 'search': if (ui.query.trim()) return doSearch(true); return show(S.recents.slice(0, 15), ['🔎', 'Suche in der Basis-Bibliothek, deinen eigenen Lebensmitteln und Millionen Produkten von Open Food Facts – oder scanne einen Barcode.']);
    case 'fav': return show(Object.values(S.favorites), ['⭐', 'Noch keine Favoriten. Tippe beim Lebensmittel auf ☆.']);
    case 'recent': return show(S.recents, ['🕒', 'Hier erscheinen zuletzt eingetragene Lebensmittel.']);
    case 'custom': act.innerHTML = '<button class="btn block" id="newFood" style="margin-bottom:10px">＋ Eigenes Lebensmittel anlegen</button>'; $('#newFood').onclick = () => customFoodSheet(); 
      show(Object.values(S.foods), ['✏️', 'Lege Lebensmittel an, die es nirgends gibt.']);
      el.querySelectorAll('[data-fid]').forEach(r => r.oncontextmenu = e => { e.preventDefault(); customFoodSheet(S.foods[r.dataset.fid]); }); return;
    case 'recipes': act.innerHTML = '<button class="btn block" id="newRec" style="margin-bottom:10px">＋ Neues Gericht / Rezept</button>'; $('#newRec').onclick = () => recipeSheet();
      el.innerHTML = Object.values(S.recipes).length ? Object.values(S.recipes).map(r => { const f = recipeFood(r); return foodRow(f).replace('</div><button', ` · <a href="#" data-edit="${r.id}">bearbeiten</a></div><button`); }).join('') : '<div class="empty"><div class="e">🥘</div>Kombiniere mehrere Zutaten zu einem Gericht und trage später eine Portion mit einem Tipp ein.</div>';
      bindList(Object.values(S.recipes).map(recipeFood)); el.querySelectorAll('[data-edit]').forEach(a => a.onclick = e => { e.preventDefault(); e.stopPropagation(); recipeSheet(S.recipes[a.dataset.edit]); }); return;
    case 'base': return show(BASE_FOODS.slice().sort((a, b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name)), ['', '']);
  }
}
async function doSearch(now) {
  const q = ui.query.trim(), el = $('#lList'); if (!el) return;
  if (!q) return fillLibList();
  if (/^\d{8,14}$/.test(q)) { el.innerHTML = '<div class="spinner"></div>'; return handleBarcode(q); }
  const loc = localSearch(q);
  el.innerHTML = (loc.length ? `<div class="small mut" style="padding:8px 4px 0">Bibliothek & Eigene</div>${loc.slice(0, 12).map(foodRow).join('')}` : '') + '<div class="small mut" style="padding:10px 4px 0">Open Food Facts</div><div id="offRes"><div class="spinner"></div></div>';
  bindList(loc.slice(0, 12));
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    searchCtl?.abort(); searchCtl = new AbortController();
    try { const res = await searchOFF(q, searchCtl.signal); if (ui.query.trim() !== q) return;
      const box = $('#offRes'); if (!box) return;
      box.innerHTML = res.length ? res.map(foodRow).join('') : '<div class="empty">Keine Produkte gefunden.</div>';
      bindList(loc.slice(0, 12).concat(res));
      box.querySelectorAll('[data-fid]').forEach(r => { const f = res.find(x => x.id === r.dataset.fid); if (f) { const code = f.code; r.addEventListener('click', () => { S.products[code] ||= f; save(); }); } });
    } catch (e) { if (e.name !== 'AbortError') { const box = $('#offRes'); if (box) box.innerHTML = `<div class="empty small">Online-Suche gerade nicht erreichbar (${esc(e.message || 'offline')}). Lokale Treffer oben funktionieren trotzdem.</div>`; } }
  }, now ? 0 : 450);
}

// ---------- Custom foods & recipes ----------
function customFoodSheet(f = null, code = '') {
  const n = f?.n || {};
  const fld = (id, l, val = '') => `<div><label class="f">${l}</label><input class="input" id="${id}" type="number" inputmode="decimal" step="any" value="${val ?? ''}"></div>`;
  openSheet(`<h2>${f ? 'Lebensmittel bearbeiten' : 'Eigenes Lebensmittel'}</h2>${code ? `<div class="small mut">Barcode ${esc(code)} wurde bei Open Food Facts nicht gefunden – trage die Werte von der Verpackung ein. Beim nächsten Scan wird es automatisch erkannt.</div>` : ''}
  <label class="f">Name</label><input class="input" id="cfName" value="${esc(f?.name || '')}" placeholder="z. B. Omas Apfelkuchen">
  <label class="f">Marke (optional)</label><input class="input" id="cfBrand" value="${esc(f?.brand || '')}">
  <div class="small mut" style="margin-top:10px">Nährwerte pro 100 g</div>
  <div class="grid2">${fld('cfK', 'Kalorien (kcal)', n.kcal)}${fld('cfP', 'Protein (g)', n.p)}${fld('cfC', 'Kohlenhydrate (g)', n.c)}${fld('cfF', 'Fett (g)', n.f)}${fld('cfS', 'Zucker (g)', n.sug)}${fld('cfB', 'Ballaststoffe (g)', n.fib)}${fld('cfSa', 'Salz (g)', n.salt)}${fld('cfServ', 'Portionsgröße (g)', f?.serving?.g)}</div>
  <button class="btn block" id="cfSave" style="margin-top:14px">Speichern</button>${f ? '<button class="btn block ghost" id="cfDel" style="margin-top:8px;color:var(--danger)">Löschen</button>' : ''}`, () => {
    $('#cfSave').onclick = () => {
      const name = $('#cfName').value.trim(); if (!name) return toast('Bitte Namen eingeben');
      const v = id => +String($('#' + id).value).replace(',', '.') || 0;
      const id = f?.id || (code ? 'cust:' + code : 'cust:' + uid());
      const food = { id, src: 'custom', code: code || f?.code || '', name, brand: $('#cfBrand').value.trim(), cat: 'Eigene', n: { kcal: v('cfK'), p: v('cfP'), c: v('cfC'), f: v('cfF'), sug: v('cfS'), fib: v('cfB'), salt: v('cfSa') }, serving: v('cfServ') ? { g: v('cfServ'), label: 'Portion' } : null };
      S.foods[id] = food; if (food.code) S.products[food.code] = { ...food }; save(); closeSheet(); toast('Gespeichert'); foodSheet(food);
    };
    if (f) $('#cfDel').onclick = () => { delete S.foods[f.id]; save(); closeSheet(); render(); };
  });
}
function recipeFood(r) {
  if (!r) return null;
  const tot = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, salt: 0 }; let g = 0;
  for (const it of r.items) { const n = nutr(it.food, it.g); for (const k in tot) tot[k] += n[k]; g += it.g; }
  const per100 = {}; for (const k in tot) per100[k] = g ? r1(tot[k] / g * 100) : 0;
  return { id: r.id, src: 'recipe', name: r.name, cat: 'Gericht', brand: `${r.items.length} Zutaten · ${de(tot.kcal / (r.portions || 1))} kcal/Portion`, n: per100, serving: { g: g / (r.portions || 1), label: 'Portion' } };
}
function recipeSheet(r = null) {
  const rec = r ? JSON.parse(JSON.stringify(r)) : { id: 'rec:' + uid(), name: '', portions: 2, items: [] };
  const draw = () => {
    const f = recipeFood(rec);
    openSheet(`<h2>${r ? 'Gericht bearbeiten' : 'Neues Gericht'}</h2>
    <label class="f">Name</label><input class="input" id="rName" value="${esc(rec.name)}" placeholder="z. B. Protein-Porridge">
    <label class="f">Anzahl Portionen</label><input class="input" id="rPort" type="number" min="1" step="any" value="${rec.portions}">
    <div class="card" style="margin-top:12px;padding:6px 12px">${rec.items.map((it, i) => `<div class="entry"><div class="grow"><div class="nm">${esc(it.food.name)}</div><div class="small mut">${de(nutr(it.food, it.g).kcal)} kcal</div></div><input class="input" data-ig="${i}" type="number" value="${it.g}" style="width:84px;padding:8px"> g<button class="icon-btn" data-ir="${i}">✕</button></div>`).join('') || '<div class="empty small">Noch keine Zutaten</div>'}</div>
    <div class="search"><input class="input" id="rq" placeholder="Zutat suchen (offline-Bibliothek & Eigene)…"></div><div id="rRes"></div>
    ${rec.items.length ? `<div class="grid4" style="margin:10px 0">${[['kcal', 'kcal/Port.'], ['p', 'Protein'], ['c', 'KH'], ['f', 'Fett']].map(([k, l]) => `<div class="pill"><b>${de(nutr(f, f.serving.g)[k])}</b><span class="small mut">${l}</span></div>`).join('')}</div>` : ''}
    <button class="btn block" id="rSave">Gericht speichern</button>${r ? '<button class="btn block ghost" id="rDel" style="margin-top:8px;color:var(--danger)">Löschen</button>' : ''}`, () => {
      $('#rName').oninput = e => rec.name = e.target.value; $('#rPort').oninput = e => rec.portions = Math.max(1, +e.target.value || 1);
      document.querySelectorAll('[data-ig]').forEach(i => i.onchange = () => { rec.items[+i.dataset.ig].g = +i.value || 0; draw(); });
      document.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => { rec.items.splice(+b.dataset.ir, 1); draw(); });
      $('#rq').oninput = e => { const res = e.target.value.trim() ? localSearch(e.target.value).slice(0, 8) : [];
        $('#rRes').innerHTML = res.map(x => `<div class="food" data-add="${esc(x.id)}"><div class="grow"><div class="nm">${esc(x.name)}</div><div class="small mut">${de(x.n.kcal)} kcal/100 g</div></div><span class="qa" style="display:flex;align-items:center;justify-content:center">＋</span></div>`).join('');
        $('#rRes').querySelectorAll('[data-add]').forEach(el => el.onclick = () => { const x = res.find(y => y.id === el.dataset.add); rec.items.push({ g: x.serving?.g || 100, food: { id: x.id, name: x.name, n: x.n } }); draw(); }); };
      $('#rSave').onclick = () => { if (!rec.name.trim()) return toast('Bitte Namen eingeben'); if (!rec.items.length) return toast('Mindestens eine Zutat'); S.recipes[rec.id] = rec; save(); closeSheet(); ui.libTab = 'recipes'; render(); toast('Gericht gespeichert'); };
      if (r) $('#rDel').onclick = () => { delete S.recipes[rec.id]; save(); closeSheet(); render(); };
    });
  };
  draw();
}

// ---------- Barcode scanning ----------
let scanStream = null, scanLoop = null, zxReader = null, scanning = false;
async function openScanner() {
  $('#scanner').classList.remove('hidden'); $('#scanStatus').textContent = 'Kamera wird gestartet…'; scanning = true;
  const video = $('#scanVideo');
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error(location.protocol === 'https:' ? 'Kamera nicht verfügbar' : 'Kamera braucht HTTPS');
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    video.srcObject = scanStream; await video.play();
    $('#scanStatus').textContent = 'Barcode in den Rahmen halten';
    if ('BarcodeDetector' in window) {
      const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'].filter(Boolean) });
      const tick = async () => { if (!scanning) return; try { const r = await det.detect(video); if (r.length) return onScanned(r[0].rawValue); } catch {} scanLoop = requestAnimationFrame(tick); };
      tick();
    } else {
      zxReader = new ZXing.BrowserMultiFormatReader(zxHints());
      zxReader.decodeFromVideoElementContinuously(video, (res) => { if (res && scanning) onScanned(res.getText()); });
    }
  } catch (e) { $('#scanStatus').textContent = `${e.message || 'Kein Kamerazugriff'} – nutze „Nummer eingeben“ oder „Foto“.`; }
}
function zxHints() { const h = new Map(), F = ZXing.BarcodeFormat; h.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.QR_CODE]); h.set(ZXing.DecodeHintType.TRY_HARDER, true); return h; }
function closeScanner() {
  scanning = false; cancelAnimationFrame(scanLoop); try { zxReader?.reset(); } catch {} zxReader = null;
  scanStream?.getTracks().forEach(t => t.stop()); scanStream = null; $('#scanner').classList.add('hidden');
}
function onScanned(raw) { navigator.vibrate?.(60); closeScanner(); const code = String(raw).trim();
  if (/^\d{6,14}$/.test(code)) handleBarcode(code); else { const m = code.match(/\d{8,14}/); m ? handleBarcode(m[0]) : openSheet(`<h2>QR-Code erkannt</h2><p class="mut" style="word-break:break-all">${esc(code)}</p><p class="small mut">Dieser Code enthält keine Produktnummer.</p>`); } }
$('#scanClose').onclick = closeScanner;
$('#scanTorch').onclick = async () => { const t = scanStream?.getVideoTracks()[0]; if (!t) return; try { t._on = !t._on; await t.applyConstraints({ advanced: [{ torch: t._on }] }); } catch { toast('Licht nicht unterstützt'); } };
$('#scanManual').onclick = () => { closeScanner(); manualBarcode(); };
$('#scanFile').onchange = async e => { const file = e.target.files[0]; e.target.value = ''; if (!file) return; $('#scanStatus').textContent = 'Foto wird gelesen…';
  try { const code = await decodeImageFile(file); onScanned(code); } catch { $('#scanStatus').textContent = 'Kein Barcode im Foto gefunden'; } };
async function decodeImageFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    if ('BarcodeDetector' in window) { try { const r = await new BarcodeDetector().detect(img); if (r.length) return r[0].rawValue; } catch {} }
    const reader = new ZXing.BrowserMultiFormatReader(zxHints()); const res = await reader.decodeFromImageElement(img); return res.getText();
  } finally { URL.revokeObjectURL(url); }
}
function manualBarcode() {
  openSheet(`<h2>Barcode eingeben</h2><p class="small mut">Die Ziffern unter dem Strichcode (EAN/UPC, 8–13 Stellen).</p><input class="input" id="mbCode" inputmode="numeric" placeholder="z. B. 4000417025005" autofocus>
  <button class="btn block" id="mbGo" style="margin-top:12px">Produkt suchen</button>`, () => { const go = () => { const c = $('#mbCode').value.replace(/\D/g, ''); if (c.length < 6) return toast('Ungültiger Code'); handleBarcode(c); }; $('#mbGo').onclick = go; $('#mbCode').onkeydown = e => e.key === 'Enter' && go(); setTimeout(() => $('#mbCode')?.focus(), 250); });
}
async function handleBarcode(code) {
  openSheet(`<h2>Suche ${esc(code)}…</h2><div class="spinner"></div>`);
  try {
    const custom = Object.values(S.foods).find(f => f.code === code);
    if (custom) return foodSheet(custom);
    const { product, cached } = await lookupBarcode(code);
    if (!product) return openSheet(`<h2>Produkt nicht gefunden</h2><p class="mut">Der Barcode <b>${esc(code)}</b> ist (noch) nicht in Open Food Facts. Du kannst es selbst anlegen – es wird lokal gespeichert und beim nächsten Scan erkannt.</p><button class="btn block" id="nfAdd">＋ Lebensmittel anlegen</button>`, () => $('#nfAdd').onclick = () => customFoodSheet(null, code));
    if (!product.hasNutr) toast('Hinweis: Für dieses Produkt fehlen Nährwerte – bitte prüfen');
    foodSheet(product); if (cached) toast('Aus lokalem Speicher (offline verfügbar)');
  } catch (e) {
    openSheet(`<h2>Keine Verbindung</h2><p class="mut">Open Food Facts ist gerade nicht erreichbar (${esc(e.message)}). Versuche es gleich nochmal oder lege das Produkt selbst an.</p><button class="btn block" id="nfRetry">Erneut versuchen</button><button class="btn block ghost" id="nfAdd" style="margin-top:8px">Selbst anlegen</button>`, () => { $('#nfRetry').onclick = () => handleBarcode(code); $('#nfAdd').onclick = () => customFoodSheet(null, code); });
  }
}

// ---------- Weight ----------
function weightSheet(d = today()) {
  const cur = S.weights[d], last = S.weights[Object.keys(S.weights).sort().filter(x => x <= d).pop()] || S.profile?.weight || 75;
  openSheet(`<h2>Gewicht eintragen</h2><div class="small mut">${fmtDate(d)}</div>
  <label class="f">Datum</label><input class="input" id="wDate" type="date" value="${d}" max="${today()}">
  <div class="row" style="margin-top:12px;justify-content:center"><button class="icon-btn" id="wM">−</button><input class="input" id="wVal" type="number" step="0.1" inputmode="decimal" value="${cur ?? r1(last)}" style="max-width:140px;text-align:center;font-size:26px;font-weight:800"><span class="mut">kg</span><button class="icon-btn" id="wP">＋</button></div>
  <button class="btn block" id="wSave" style="margin-top:14px">Speichern</button>${cur ? '<button class="btn block ghost" id="wDel" style="margin-top:8px;color:var(--danger)">Eintrag löschen</button>' : ''}`, () => {
    const vi = $('#wVal'); $('#wM').onclick = () => vi.value = r1(+vi.value - 0.1); $('#wP').onclick = () => vi.value = r1(+vi.value + 0.1);
    $('#wSave').onclick = () => { const w = +String(vi.value).replace(',', '.'); if (!(w > 20 && w < 400)) return toast('Bitte gültiges Gewicht'); S.weights[$('#wDate').value] = r1(w); if (S.profile) S.profile.weight = r1(w); save(); closeSheet(); render(); toast('Gewicht gespeichert'); };
    if (cur) $('#wDel').onclick = () => { delete S.weights[d]; save(); closeSheet(); render(); };
  });
}

// ---------- Progress / Charts ----------
let chartObj = null;
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
function renderProgress(v) {
  const ws = weightSeries(), last = ws.at(-1), rate = weeklyRate(ws), est = estimateTDEE(), C = ui.chart;
  const lastW = Object.keys(S.weights).sort().pop();
  v.innerHTML = `<div class="card"><h3><span>⚖️ Gewicht</span><button class="btn sm" id="pW">＋ Wiegen</button></h3>
    <div class="grid3"><div class="stat"><span class="small mut">Aktuell</span><b>${lastW ? de(S.weights[lastW], 1) : '–'}</b><span class="small mut">kg</span></div>
    <div class="stat"><span class="small mut">Trendgewicht</span><b style="color:var(--acc)">${last?.t ? de(last.t, 1) : '–'}</b><span class="small mut">kg</span></div>
    <div class="stat"><span class="small mut">Pro Woche</span><b style="color:${rate == null ? 'inherit' : rate < 0 ? 'var(--acc2)' : 'var(--c)'}">${rate == null ? '–' : (rate > 0 ? '+' : '') + de(rate, 2)}</b><span class="small mut">kg</span></div></div></div>
  <div class="card tdee"><h3><span>🔥 Echter Energieverbrauch</span><span class="small mut">adaptiv</span></h3>${est ? `<div class="row"><div class="stat grow"><b style="font-size:30px">${de(est.tdee)} kcal</b><span class="small mut">geschätzter TDEE (letzte ${est.N} Tage)</span></div></div>
    <div class="small mut" style="margin-top:6px">Ø Aufnahme ${de(est.avgIn)} kcal · Trend ${est.change > 0 ? '+' : ''}${de(est.change, 2)} kg · ${est.logged} Tage geloggt. Berechnet aus deiner Aufnahme und der Veränderung des Trendgewichts (7.700 kcal ≈ 1 kg).</div>
    ${S.profile ? `<button class="btn sm ghost" id="pApply" style="margin-top:10px">Ziel an echten Verbrauch anpassen</button>` : ''}` : `<div class="small mut">Logge mindestens ~2 Wochen lang Essen und wiege dich regelmäßig. Dann berechnet FitScan deinen tatsächlichen Verbrauch aus Aufnahme und Trendgewicht – genauer als jede Formel.</div>`}</div>
  <div class="card"><div class="chips">${[['weight', 'Gewicht'], ['kcal', 'Kalorien'], ['macros', 'Makros'], ['protein', 'Protein'], ['weekly', 'Wochenschnitt']].map(m => `<button class="chip ${C.metric === m[0] ? 'on' : ''}" data-cm="${m[0]}">${m[1]}</button>`).join('')}</div>
    <div class="seg">${[[7, '7T'], [30, '30T'], [90, '90T'], [365, '1J'], [0, 'Alles']].map(r => `<button class="${C.range === r[0] ? 'on' : ''}" data-cr="${r[0]}">${r[1]}</button>`).join('')}</div>
    <div class="chartbox"><canvas id="chart"></canvas></div>
    <div class="row wrap" style="margin-top:10px;gap:8px"><select class="input" id="cType" style="flex:1"><option value="line">Linie</option><option value="bar">Balken</option></select>
    <select class="input" id="cSmooth" style="flex:1"><option value="none">Keine Glättung</option><option value="ema">Trend (EMA)</option><option value="ma7">7-Tage-Mittel</option></select></div>
    <div class="small mut" id="cInfo" style="margin-top:8px"></div></div>
  <div class="card wlist"><h3>Letzte Wiegungen</h3>${Object.keys(S.weights).sort().reverse().slice(0, 10).map(d => `<div class="entry" data-wd="${d}"><div class="grow">${fmtDate(d)}</div><b>${de(S.weights[d], 1)} kg</b><span class="small mut" style="width:70px;text-align:right">Trend ${de(trendAt(ws, d), 1)}</span></div>`).join('') || '<div class="empty small">Noch keine Einträge</div>'}</div>`;
  $('#pW').onclick = () => weightSheet();
  if ($('#pApply')) $('#pApply').onclick = () => { const g = computeGoals(S.profile), delta = g.kcal - g.tdee, kcal = Math.round((est.tdee + delta) / 10) * 10; Object.assign(S.goals, scaleMacros(kcal), { manual: true }); save(); toast(`Neues Ziel: ${de(kcal)} kcal`); };
  v.querySelectorAll('[data-cm]').forEach(b => b.onclick = () => { C.metric = b.dataset.cm; render(); });
  v.querySelectorAll('[data-cr]').forEach(b => b.onclick = () => { C.range = +b.dataset.cr; render(); });
  v.querySelectorAll('[data-wd]').forEach(el => el.onclick = () => weightSheet(el.dataset.wd));
  $('#cType').value = C.type; $('#cSmooth').value = C.smooth;
  $('#cType').onchange = e => { C.type = e.target.value; drawChart(); }; $('#cSmooth').onchange = e => { C.smooth = e.target.value; drawChart(); };
  drawChart();
}
function scaleMacros(kcal) { const p = S.goals.p, f = Math.round(kcal * 0.27 / 9); return { kcal, p, f, c: Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4)) }; }
function smoothArr(arr, mode) {
  if (mode === 'ma7') return arr.map((_, i) => { const w = arr.slice(Math.max(0, i - 6), i + 1).filter(x => x != null); return w.length ? w.reduce((a, b) => a + b, 0) / w.length : null; });
  if (mode === 'ema') { let t = null; return arr.map(x => { if (x != null) t = t == null ? x : t + 0.15 * (x - t); return t; }); }
  return arr;
}
function drawChart() {
  const C = ui.chart, cv = $('#chart'); if (!cv) return; chartObj?.destroy();
  const allD = [...Object.keys(S.weights), ...Object.keys(S.entries).filter(d => S.entries[d].length)].sort();
  const end = today(); let start = C.range ? addDays(end, -C.range + 1) : (allD[0] || addDays(end, -29));
  if (start > end) start = addDays(end, -29);
  const days = []; for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  const txt = css('--mut'), grid = css('--line'), acc = css('--acc'), p = css('--p'), c = css('--c'), f = css('--f');
  const grad = (col) => { const ctx = cv.getContext('2d'), g = ctx.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, col + '66'); g.addColorStop(1, col + '00'); return g; };
  let datasets = [], labels = days.map(fmtShort), info = '', stacked = false, type = C.type;
  const logged = d => (S.entries[d] || []).length;
  if (C.metric === 'weight') {
    const ws = weightSeries(), raw = days.map(d => S.weights[d] ?? null);
    const trend = C.smooth === 'ema' ? days.map(d => trendAt(ws, d)) : smoothArr(raw, C.smooth);
    datasets = [{ type: 'line', label: 'Waage', data: raw, borderColor: txt, backgroundColor: txt, showLine: false, pointRadius: 3, pointHoverRadius: 5, spanGaps: true },
      ...(C.smooth !== 'none' ? [{ type: 'line', label: C.smooth === 'ema' ? 'Trendgewicht' : '7-Tage-Mittel', data: trend, borderColor: acc, backgroundColor: grad(acc), fill: true, borderWidth: 3, pointRadius: 0, tension: .35, spanGaps: true }] : [])];
    if (type === 'bar') datasets[0] = { type: 'bar', label: 'Waage', data: raw, backgroundColor: acc + '88', borderRadius: 6 };
    const v = raw.filter(x => x != null); info = v.length ? `Min ${de(Math.min(...v), 1)} · Max ${de(Math.max(...v), 1)} kg · ${v.length} Wiegungen` : 'Noch keine Gewichtsdaten in diesem Zeitraum.';
  } else if (C.metric === 'kcal' || C.metric === 'protein') {
    const k = C.metric === 'kcal' ? 'kcal' : 'p', col = k === 'kcal' ? acc : p;
    const raw = days.map(d => logged(d) ? r0(dayTotals(d)[k]) : null), sm = smoothArr(raw, C.smooth);
    datasets = [{ type, label: k === 'kcal' ? 'Kalorien' : 'Protein (g)', data: raw, backgroundColor: type === 'bar' ? col + 'aa' : grad(col), borderColor: col, borderRadius: 6, fill: type === 'line', tension: .3, pointRadius: 2, spanGaps: true },
      { type: 'line', label: 'Ziel', data: days.map(() => S.goals[k]), borderColor: f, borderDash: [6, 5], borderWidth: 2, pointRadius: 0 },
      ...(C.smooth !== 'none' ? [{ type: 'line', label: 'Geglättet', data: sm, borderColor: txt, borderWidth: 2, pointRadius: 0, tension: .4, spanGaps: true }] : [])];
    const v = raw.filter(x => x != null); info = v.length ? `Ø ${de(v.reduce((a, b) => a + b, 0) / v.length)} ${k === 'kcal' ? 'kcal' : 'g'} an ${v.length} geloggten Tagen` : 'Keine Einträge in diesem Zeitraum.';
  } else if (C.metric === 'macros') {
    stacked = true; type = 'bar';
    const mk = (key, lbl, col, m) => ({ type: 'bar', label: lbl, data: days.map(d => logged(d) ? r0(dayTotals(d)[key] * m) : null), backgroundColor: col, borderRadius: 4, stack: 's' });
    datasets = [mk('p', 'Protein (kcal)', p, 4), mk('c', 'Kohlenhydrate (kcal)', c, 4), mk('f', 'Fett (kcal)', f, 9)];
    info = 'Makros als Kalorienanteil pro Tag (Protein/KH × 4, Fett × 9).';
  } else if (C.metric === 'weekly') {
    const weeks = {}; const ws = weightSeries();
    for (const d of days) { const dt = new Date(d + 'T12:00:00'), mon = addDays(d, -((dt.getDay() + 6) % 7)); (weeks[mon] ||= { k: [], w: [] }); if (logged(d)) weeks[mon].k.push(dayTotals(d).kcal); const t = trendAt(ws, d); if (S.weights[d] != null && t) weeks[mon].w.push(t); }
    const keys = Object.keys(weeks).sort(); labels = keys.map(k => 'KW ' + fmtShort(k));
    const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    datasets = [{ type: 'bar', label: 'Ø kcal/Tag', data: keys.map(k => avg(weeks[k].k) && r0(avg(weeks[k].k))), backgroundColor: acc + 'bb', borderRadius: 8, yAxisID: 'y' },
      { type: 'line', label: 'Ø Trendgewicht (kg)', data: keys.map(k => avg(weeks[k].w) && r1(avg(weeks[k].w))), borderColor: css('--acc2'), backgroundColor: css('--acc2'), borderWidth: 3, tension: .35, yAxisID: 'y1', spanGaps: true }];
    info = 'Wochendurchschnitt der Kalorien (Balken) und des Trendgewichts (Linie).';
  }
  $('#cInfo').textContent = info; datasets.forEach(d => d.label = tr(d.label)); labels = labels.map(l => tr(l));
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  chartObj = new Chart(cv, { data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false, animation: { duration: 500 }, interaction: { mode: 'index', intersect: false },
    plugins: { legend: { labels: { color: txt, boxWidth: 12, usePointStyle: true } }, tooltip: { backgroundColor: css('--card2'), titleColor: css('--txt'), bodyColor: css('--txt'), borderColor: grid, borderWidth: 1, padding: 10,
      callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y == null ? '–' : de(ctx.parsed.y, C.metric === 'weight' ? 1 : 0)}` } } },
    scales: { x: { stacked, ticks: { color: txt, maxTicksLimit: 7, maxRotation: 0 }, grid: { display: false } },
      y: { stacked, ticks: { color: txt }, grid: { color: grid }, beginAtZero: C.metric !== 'weight' },
      ...(C.metric === 'weekly' ? { y1: { position: 'right', ticks: { color: txt }, grid: { display: false } } } : {}) } } });
}

// ---------- Profile & data ----------
function renderProfile(v) {
  const p = S.profile || { sex: 'm', age: 30, height: 180, weight: 80, activity: 1.375, goal: 'lose', rate: 0.5 }, g = S.goals, calc = computeGoals(p);
  v.innerHTML = `<div class="card"><h3>🎯 Profil & Ziel</h3>
  <div class="seg" id="pSex"><button data-v="m" class="${p.sex === 'm' ? 'on' : ''}">Männlich</button><button data-v="f" class="${p.sex === 'f' ? 'on' : ''}">Weiblich</button></div>
  <div class="grid3"><div><label class="f">Alter</label><input class="input" id="pAge" type="number" value="${p.age}"></div><div><label class="f">Größe (cm)</label><input class="input" id="pH" type="number" value="${p.height}"></div><div><label class="f">Gewicht (kg)</label><input class="input" id="pWt" type="number" step="0.1" value="${p.weight}"></div></div>
  <label class="f">Aktivität</label><select class="input" id="pAct">${ACT.map(a => `<option value="${a[0]}" ${+p.activity === a[0] ? 'selected' : ''}>${a[1]}</option>`).join('')}</select>
  <label class="f">Ziel</label><div class="seg" id="pGoal">${[['lose', 'Abnehmen'], ['maintain', 'Halten'], ['gain', 'Aufbauen']].map(x => `<button data-v="${x[0]}" class="${p.goal === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}</div>
  <div id="pRateBox" class="${p.goal === 'maintain' ? 'hidden' : ''}"><label class="f">Tempo: <b id="pRateL">${de(p.rate, 2)} kg/Woche</b></label><input id="pRate" type="range" min="0.1" max="1" step="0.05" value="${p.rate}" style="width:100%;accent-color:var(--acc)"></div>
  <div class="small mut" id="pCalc" style="margin:8px 0"></div><button class="btn block" id="pSave">Ziele berechnen & übernehmen</button></div>
  <div class="card"><h3>✍️ Tagesziele (manuell)</h3><div class="grid2">
  ${[['gK', 'Kalorien (kcal)', g.kcal], ['gP', 'Protein (g)', g.p], ['gC', 'Kohlenhydrate (g)', g.c], ['gF', 'Fett (g)', g.f]].map(x => `<div><label class="f">${x[1]}</label><input class="input" id="${x[0]}" type="number" value="${x[2]}"></div>`).join('')}</div>
  <div class="small mut" id="gSum" style="margin-top:6px"></div><button class="btn block ghost" id="gSave" style="margin-top:10px">Ziele speichern</button></div>
  <div class="card"><h3>💾 Daten</h3><div class="small mut" style="margin-bottom:10px">Alles bleibt auf diesem Gerät – kein Konto, keine Cloud, keine Paywall. Mach ab und zu ein Backup.</div>
  <div class="grid2"><button class="btn ghost" id="exJson">⬇️ Backup (JSON)</button><label class="btn ghost">⬆️ Import<input type="file" id="imJson" accept=".json,application/json" hidden></label>
  <button class="btn ghost" id="exCsv">📄 Tagebuch CSV</button><button class="btn ghost" id="exCsvW">📄 Gewicht CSV</button></div>
  <button class="btn ghost block" id="demo" style="margin-top:8px">🧪 Demo-Daten laden (6 Wochen)</button>
  <button class="btn danger block" id="wipe" style="margin-top:8px">Alle Daten löschen</button>
  <div class="small mut" style="margin-top:10px">${Object.keys(S.products).length} Produkte offline gespeichert · ${BASE_FOODS.length} Basis-Lebensmittel · Produktdaten von <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener" style="color:var(--acc)">Open Food Facts</a></div></div>
  <div class="small mut" style="text-align:center;padding:6px 0 20px">FitScan · 100 % kostenlos · Unbegrenzt scannen ❤️</div>`;
  const read = () => ({ sex: $('#pSex .on').dataset.v, age: +$('#pAge').value, height: +$('#pH').value, weight: +$('#pWt').value, activity: +$('#pAct').value, goal: $('#pGoal .on').dataset.v, rate: +$('#pRate').value });
  const upd = () => { const q = read(), c = computeGoals(q); $('#pRateL').textContent = de(q.rate, 2) + ' kg/Woche'; $('#pRateBox').classList.toggle('hidden', q.goal === 'maintain');
    $('#pCalc').innerHTML = `Grundumsatz ${de(c.bmr)} kcal · Gesamtumsatz ≈ ${de(c.tdee)} kcal<br>→ Ziel <b style="color:var(--txt)">${de(c.kcal)} kcal</b> · P ${c.p} g · KH ${c.c} g · F ${c.f} g`; };
  ['#pSex', '#pGoal'].forEach(s => v.querySelectorAll(s + ' button').forEach(b => b.onclick = () => { v.querySelectorAll(s + ' button').forEach(x => x.classList.toggle('on', x === b)); upd(); }));
  v.querySelectorAll('#pAge,#pH,#pWt,#pAct,#pRate').forEach(i => i.oninput = upd); upd();
  $('#pSave').onclick = () => { const q = read(); if (!(q.age > 10 && q.height > 100 && q.weight > 30)) return toast('Bitte Werte prüfen'); S.profile = q; const c = computeGoals(q); S.goals = { kcal: c.kcal, p: c.p, c: c.c, f: c.f, manual: false }; if (!S.weights[today()]) S.weights[today()] = q.weight; save(); render(); toast('Ziele übernommen'); };
  const gs = () => { const k = +$('#gP').value * 4 + +$('#gC').value * 4 + +$('#gF').value * 9; $('#gSum').textContent = `Makros ergeben ${de(k)} kcal (Ziel ${de(+$('#gK').value)} kcal)`; };
  v.querySelectorAll('#gK,#gP,#gC,#gF').forEach(i => i.oninput = gs); gs();
  $('#gSave').onclick = () => { S.goals = { kcal: +$('#gK').value || 2000, p: +$('#gP').value || 0, c: +$('#gC').value || 0, f: +$('#gF').value || 0, manual: true }; save(); toast('Gespeichert'); };
  $('#exJson').onclick = () => download(`fitscan-backup-${today()}.json`, JSON.stringify({ app: 'fitscan', version: 1, exported: new Date().toISOString(), data: S }, null, 1), 'application/json');
  $('#exCsv').onclick = () => { const rows = [['Datum', 'Mahlzeit', 'Lebensmittel', 'Marke', 'Menge (g)', 'kcal', 'Protein (g)', 'Kohlenhydrate (g)', 'Fett (g)', 'Zucker (g)', 'Ballaststoffe (g)', 'Salz (g)']];
    for (const d of Object.keys(S.entries).sort()) for (const e of S.entries[d]) { const n = nutr(e.food, e.g); rows.push([d, MEALS.find(m => m[0] === e.meal)[1], e.food.name, e.food.brand, r1(e.g), r0(n.kcal), r1(n.p), r1(n.c), r1(n.f), r1(n.sug), r1(n.fib), r1(n.salt)]); }
    download(`fitscan-diary-${today()}.csv`, csv(rows), 'text/csv'); };
  $('#exCsvW').onclick = () => { const ws = weightSeries(); download(`fitscan-weight-${today()}.csv`, csv([['Datum', 'Gewicht (kg)', 'Trend (kg)'], ...Object.keys(S.weights).sort().map(d => [d, S.weights[d], r1(trendAt(ws, d))])]), 'text/csv'); };
  $('#imJson').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const j = JSON.parse(await f.text()); const data = j.data || j; if (!data.entries || !data.goals) throw 0; if (!confirm(tr('Backup importieren? Aktuelle Daten werden ersetzt.'))) return; S = Object.assign(DEFAULT(), data); save(); setTheme(S.settings.theme); render(); toast('Backup importiert'); } catch { toast('Ungültige Backup-Datei'); } };
  $('#demo').onclick = () => { if (Object.keys(S.entries).length && !confirm(tr('Demo-Daten zu deinen Daten hinzufügen?'))) return; seedDemo(); toast('Demo-Daten geladen'); go('progress'); };
  $('#wipe').onclick = () => { if (!confirm(tr('Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden.'))) return; const th = S.settings.theme; S = DEFAULT(); S.settings.theme = th; save(); render(); toast('Alle Daten gelöscht'); };
}
const csv = rows => '\ufeff' + rows.map(r => r.map(x => { const s = String(x ?? ''); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\n');
function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }

// ---------- Demo-Daten ----------
function seedDemo() {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const F = n => BASE_FOODS.find(f => f.name === n);
  const plans = { breakfast: [['Haferflocken', 70], ['Milch 1,5%', 250], ['Banane', 120], ['Heidelbeeren', 80]], lunch: [['Hähnchenbrust gebraten', 160], ['Reis weiß gekocht', 220], ['Brokkoli', 180], ['Olivenöl', 10]],
    dinner: [['Vollkornbrot', 100], ['Gouda', 40], ['Kochschinken', 40], ['Tomate', 120], ['Skyr', 150]], snacks: [['Apfel', 180], ['Mandeln', 25], ['Proteinriegel', 60]] };
  S.profile ||= { sex: 'm', age: 32, height: 182, weight: 86, activity: 1.375, goal: 'lose', rate: 0.5 };
  const c = computeGoals(S.profile); if (!S.goals.manual) S.goals = { kcal: c.kcal, p: c.p, c: c.c, f: c.f, manual: false };
  const start = addDays(today(), -42); let w = 86.4;
  for (let i = 0; i <= 42; i++) {
    const d = addDays(start, i); S.entries[d] = [];
    for (const m in plans) for (const [n, g] of plans[m]) { if (m === 'snacks' && rnd() < 0.3) continue; const f = F(n); const gg = Math.round(g * (0.8 + rnd() * 0.45));
      S.entries[d].push({ id: uid(), meal: m, g: gg, label: gg + ' g', food: { id: f.id, name: f.name, cat: f.cat, n: f.n, src: 'base' } }); }
    if (rnd() < 0.25) { const f = F('Pizza Margherita'); S.entries[d].push({ id: uid(), meal: 'dinner', g: 175, label: '175 g', food: { id: f.id, name: f.name, cat: f.cat, n: f.n, src: 'base' } }); }
    w += -0.075 + (rnd() - 0.5) * 0.08; const noisy = w + (rnd() - 0.5) * 0.9 + (i % 7 === 6 ? 0.4 : 0);
    if (rnd() < 0.85 || i === 42) S.weights[d] = r1(noisy);
  }
  S.profile.weight = S.weights[today()]; save();
}

// ---------- Init ----------
function setLang(l) { S.settings.lang = l; $('#langBtn').textContent = l === 'en' ? 'DE' : 'EN'; $('#langBtn').title = 'Sprache / Language'; applyLang(l); }
$('#langBtn').onclick = () => { setLang(LANG === 'en' ? 'de' : 'en'); save(); render(); };
setLang(S.settings.lang || (/^de\b/i.test(navigator.language || '') ? 'de' : 'en'));
setTheme(S.settings.theme || 'dark');
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.FitScan = window.Naehrwerk = { lookupBarcode, searchOFF, dayTotals, estimateTDEE, weightSeries, decodeImageFile, seedDemo, get state() { return S; } };
