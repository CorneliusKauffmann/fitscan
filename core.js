'use strict';
/* FitScan – core: state, storage, calculations, Open Food Facts. All data stays on the device (localStorage). */
const MEALS = [['breakfast', 'Frühstück'], ['lunch', 'Mittagessen'], ['dinner', 'Abendessen'], ['snacks', 'Snacks']];
const KEY = 'fitscan.v1';
try { if (!localStorage.getItem(KEY) && localStorage.getItem('naehrwerk.v1')) localStorage.setItem(KEY, localStorage.getItem('naehrwerk.v1')); } catch {}

// ---------- Utils ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r0 = x => Math.round(x || 0), r1 = x => Math.round((x || 0) * 10) / 10;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const iso = d => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const fmtDate = s => new Date(s + 'T12:00:00').toLocaleDateString(LOC(), { weekday: 'short', day: 'numeric', month: 'short' });
const fmtLong = s => new Date(s + 'T12:00:00').toLocaleDateString(LOC(), { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = s => new Date(s + 'T12:00:00').toLocaleDateString(LOC(), { day: 'numeric', month: 'numeric' });
const de = (x, d = 0) => (x ?? 0).toLocaleString(LOC(), { maximumFractionDigits: d, minimumFractionDigits: d });
const signed = (x, d = 0) => (x > 0 ? '+' : x < 0 ? '−' : '') + de(Math.abs(x), d);
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
const num = (v, min = 0, max = 1e5) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : 0; };
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const mealName = id => t(MEALS.find(m => m[0] === id)?.[1] || 'Snacks');

// ---------- State ----------
const DEFAULT = () => ({ profile: null, goals: { kcal: 2200, p: 140, c: 240, f: 75, manual: false }, entries: {}, weights: {},
  foods: {}, products: {}, recipes: {}, recents: [], favorites: {}, water: {}, measures: {}, checkins: [], scanHistory: [], fast: null, fastLog: [],
  settings: { theme: 'light', lang: null } });
function sanitize(o) {
  const d = DEFAULT(); if (!isObj(o)) o = {};
  const s = Object.assign(d, o);
  for (const k of ['goals', 'entries', 'weights', 'foods', 'products', 'recipes', 'favorites', 'settings', 'water', 'measures']) if (!isObj(s[k])) s[k] = DEFAULT()[k];
  for (const k of ['recents', 'checkins', 'scanHistory', 'fastLog']) if (!Array.isArray(s[k])) s[k] = [];
  for (const k of ['kcal', 'p', 'c', 'f']) s.goals[k] = Number.isFinite(+s.goals[k]) ? +s.goals[k] : DEFAULT().goals[k];
  if (!isObj(s.profile)) s.profile = null;
  for (const [dk, w] of Object.entries(s.weights)) { const x = +w; if (!/^\d{4}-\d{2}-\d{2}$/.test(dk) || !(x > 0)) delete s.weights[dk]; else s.weights[dk] = x; }
  for (const [dk, es] of Object.entries(s.entries)) { if (!Array.isArray(es)) { delete s.entries[dk]; continue; } s.entries[dk] = es.filter(e => isObj(e) && isObj(e.food) && isObj(e.food.n) && Number.isFinite(+e.g)); }
  s.recents = s.recents.filter(f => isObj(f) && isObj(f.n));
  if (s.fast && !(+s.fast.start > 0 && +s.fast.start <= Date.now())) s.fast = null;
  s.fastLog = s.fastLog.filter(x => x && Number.isFinite(+x.h));
  const st = s.settings;
  st.waterGoal ||= 2500; st.glass ||= 250; st.fastTarget ||= 16;
  st.continuousScan ??= false; st.beep ??= true; st.showWater ??= true; st.showFasting ??= !!(s.fast || s.fastLog.length);
  if (s.profile && st.onboarded == null) st.onboarded = true;
  // v6: new light design – earlier versions defaulted to dark, so switch everyone to light once.
  if (st.ui !== 6) { st.theme = 'light'; st.ui = 6; }
  if (!['light', 'dark', 'system'].includes(st.theme)) st.theme = 'light';
  s.version = 3;
  return s;
}
function load() { try { return sanitize(JSON.parse(localStorage.getItem(KEY))); } catch { return DEFAULT(); } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast(t('Speicher voll – bitte Backup exportieren')); } }
let S = load();

// ---------- Nutrition ----------
const NKEYS = ['kcal', 'p', 'c', 'f', 'fib', 'sug', 'salt'];
const nutr = (food, g) => { const k = (+g || 0) / 100, n = food?.n || {}, o = {}; for (const key of NKEYS) o[key] = (+n[key] || 0) * k; return o; };
function dayTotals(date) {
  const tot = Object.fromEntries(NKEYS.map(k => [k, 0]));
  for (const e of S.entries[date] || []) { const n = nutr(e.food, e.g); for (const k in tot) tot[k] += n[k]; }
  return tot;
}
const isLogged = d => (S.entries[d] || []).length > 0;
function streak() { let n = 0, d = today(); if (!isLogged(d)) d = addDays(d, -1); while (isLogged(d)) { n++; d = addDays(d, -1); } return n; }
function mealDefault() { const h = new Date().getHours(); return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 21 ? 'dinner' : 'snacks'; }

function addEntry(food, g, label, meal, date = ui.date, extra = {}) {
  const snap = { id: food.id, name: food.name, brand: food.brand || '', img: food.img || '', cat: food.cat || '', n: food.n, serving: food.serving || null, src: food.src, code: food.code || '' };
  if (food.micro) snap.micro = food.micro; if (food.ns) snap.ns = food.ns; if (food.nova) snap.nova = food.nova;
  const e = { id: uid(), meal, g, label, food: snap, ...extra };
  (S.entries[date] ||= []).push(e);
  if (food.src !== 'quick') S.recents = [snap, ...S.recents.filter(x => x.id !== snap.id)].slice(0, 40);
  save(); return e;
}
const defaultPortion = f => f.serving?.g ? { g: f.serving.g, label: `1 × ${f.serving.label}`, unit: 'serv', qty: 1 } : { g: 100, label: '100 g', unit: 'g', qty: 100 };

// ---------- Goals (Mifflin-St Jeor) ----------
const ACT = [[1.2, 'Kaum aktiv', 'Bürojob, wenig Sport'], [1.375, 'Leicht aktiv', '1–3× Sport pro Woche'], [1.55, 'Mäßig aktiv', '3–5× Sport pro Woche'], [1.725, 'Sehr aktiv', '6–7× Sport pro Woche'], [1.9, 'Extrem aktiv', 'Körperliche Arbeit und Sport']];
const GOALS = [['lose', 'Abnehmen', 'Fett verlieren, Muskeln erhalten'], ['maintain', 'Gewicht halten', 'Gesund essen, Form halten'], ['gain', 'Aufbauen', 'Muskeln und Gewicht zulegen']];
const goalDelta = p => p.goal === 'maintain' ? 0 : (p.goal === 'lose' ? -1 : 1) * p.rate * 7700 / 7;
const kcalFloor = p => p.sex === 'm' ? 1500 : 1200;
function macrosFor(kcal, weight, goal) { const p = Math.round(weight * (goal === 'lose' ? 2.0 : 1.8)), f = Math.round(kcal * 0.27 / 9); return { kcal, p, f, c: Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4)) }; }
function computeGoals(p) {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161), tdee = bmr * p.activity;
  const kcal = Math.max(kcalFloor(p), Math.round((tdee + goalDelta(p)) / 10) * 10);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), ...macrosFor(kcal, p.weight, p.goal) };
}

// ---------- Weight trend & expenditure ----------
function weightSeries() {
  const ds = Object.keys(S.weights).sort(); if (!ds.length) return [];
  const end = ds.at(-1) > today() ? ds.at(-1) : today(), out = []; let trend = null;
  for (let d = ds[0]; d <= end; d = addDays(d, 1)) { const w = S.weights[d]; if (w != null) trend = trend == null ? w : trend + 0.1 * (w - trend); out.push({ d, w: w ?? null, t: trend }); }
  return out;
}
const trendAt = (series, d) => series.find(s => s.d === d)?.t ?? null;
const weeklyRate = series => series.length < 8 ? null : series.at(-1).t - series.at(-8).t;
function estimateTDEE(end = today(), windows = [28, 21, 14], series = weightSeries()) {
  if (!series.length) return null;
  for (const N of windows) {
    const start = addDays(end, -N), tS = trendAt(series, start), tE = trendAt(series, end) ?? (end === today() ? series.at(-1).t : null);
    if (tS == null || tE == null) continue;
    const days = []; for (let d = addDays(start, 1); d <= end; d = addDays(d, 1)) if (isLogged(d)) days.push(dayTotals(d).kcal);
    const nW = Object.keys(S.weights).filter(d => d > start && d <= end).length;
    if (days.length < N * 0.7 || nW < N * 0.4) continue;
    const avgIn = avg(days);
    return { tdee: Math.round((avgIn - (tE - tS) * 7700 / N) / 10) * 10, avgIn: Math.round(avgIn), change: tE - tS, N, logged: days.length };
  }
  return null;
}
function insights() {
  const days = n => Array.from({ length: n }, (_, i) => addDays(today(), -i)), g = S.goals;
  const stat = arr => { const tt = arr.filter(isLogged).map(dayTotals), a = k => avg(tt.map(x => x[k])) || 0;
    return { n: tt.length, kcal: a('kcal'), p: a('p'), adh: tt.filter(x => Math.abs(x.kcal - g.kcal) <= g.kcal * 0.1).length, ph: tt.filter(x => x.p >= g.p * 0.9).length }; };
  return { cur: stat(days(7)), prev: stat(days(14).slice(7)) };
}

// ---------- Weekly check-in ----------
function checkinData() {
  if (!S.profile) return null;
  const ws = weightSeries(), w = ws.at(-1)?.t || S.profile.weight, est = estimateTDEE();
  const tdee = est ? est.tdee : computeGoals({ ...S.profile, weight: w }).tdee;
  const kcal = Math.max(kcalFloor(S.profile), Math.round((tdee + goalDelta(S.profile)) / 10) * 10);
  return { est, tdee, kcal, macros: macrosFor(kcal, w, S.profile.goal), old: { ...S.goals }, source: est ? 'data' : 'formula', rate: weeklyRate(ws) };
}
function checkinDue() {
  if (!S.profile) return false;
  const last = S.checkins.at(-1)?.date || S.settings.planStart || Object.keys(S.entries).sort()[0];
  return !!last && daysBetween(last, today()) >= 7;
}

// ---------- Open Food Facts ----------
const MICROS = [['saturated-fat', 'Gesättigte Fettsäuren', 'g', 1], ['sodium', 'Natrium', 'mg', 1000], ['cholesterol', 'Cholesterin', 'mg', 1000], ['potassium', 'Kalium', 'mg', 1000], ['calcium', 'Calcium', 'mg', 1000],
  ['magnesium', 'Magnesium', 'mg', 1000], ['iron', 'Eisen', 'mg', 1000], ['zinc', 'Zink', 'mg', 1000], ['vitamin-a', 'Vitamin A', 'µg', 1e6], ['vitamin-c', 'Vitamin C', 'mg', 1000], ['vitamin-d', 'Vitamin D', 'µg', 1e6],
  ['vitamin-e', 'Vitamin E', 'mg', 1000], ['vitamin-b12', 'Vitamin B12', 'µg', 1e6], ['vitamin-b6', 'Vitamin B6', 'mg', 1000], ['folates', 'Folat', 'µg', 1e6], ['caffeine', 'Koffein', 'mg', 1000]];
const NS_COL = { a: '#038141', b: '#85bb2f', c: '#fecb02', d: '#ee8100', e: '#e63e11' };
const OFF_FIELDS = 'code,product_name,product_name_de,generic_name_de,brands,image_front_small_url,image_front_url,nutriments,serving_size,serving_quantity,quantity,countries_tags,nutriscore_grade,nova_group,completeness';
function parseOFF(p, code) {
  if (!p) return null;
  const nm = p.nutriments || {}, n = k => { const x = parseFloat(nm[k]); return isFinite(x) ? x : 0; };
  let kcal = n('energy-kcal_100g'); if (!kcal && n('energy_100g')) kcal = n('energy_100g') / 4.184;
  const name = p.product_name_de || p.product_name || p.generic_name_de || 'Unbenanntes Produkt', sq = parseFloat(p.serving_quantity);
  const brand = Array.isArray(p.brands) ? p.brands.join(', ') : (p.brands || '');
  const f = { id: 'off:' + (p.code || code), src: 'off', code: p.code || code, name: name.trim(), brand: brand.split(',').slice(0, 2).join(', ').trim(), img: p.image_front_small_url || p.image_front_url || '',
    cat: '', quantity: p.quantity || '', n: { kcal: r1(kcal), p: n('proteins_100g'), c: n('carbohydrates_100g'), f: n('fat_100g'), sug: n('sugars_100g'), fib: n('fiber_100g'), salt: n('salt_100g') },
    serving: sq > 0 ? { g: sq, label: p.serving_size ? 'Portion: ' + String(p.serving_size).replace(/^1 (portion|serving)\s*/i, '').replace(/^\((.*)\)$/, '$1') : 'Portion' } : null,
    hasNutr: !!(kcal || nm.proteins_100g != null) };
  const mic = {}; for (const [k] of MICROS) { const v = parseFloat(nm[k + '_100g']); if (isFinite(v) && v > 0) mic[k] = v; }
  if (Object.keys(mic).length) f.micro = mic;
  if (/^[a-e]$/.test(p.nutriscore_grade || '')) f.ns = p.nutriscore_grade;
  if (p.nova_group) f.nova = +p.nova_group;
  f.de = Array.isArray(p.countries_tags) && p.countries_tags.includes('en:germany');
  f.compl = +p.completeness || 0;
  return f;
}
async function lookupBarcode(code) {
  code = String(code).replace(/\D/g, '');
  const custom = Object.values(S.foods).find(f => f.code === code); if (custom) return { product: custom, cached: true };
  if (S.products[code]) return { product: S.products[code], cached: true };
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}&lc=de`, { headers: { Accept: 'application/json' } });
  if (res.status === 404) return { product: null };
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const j = await res.json();
  if (j.status !== 1 || !j.product) return { product: null };
  const prod = parseOFF(j.product, code); S.products[code] = prod; save();
  return { product: prod, cached: false };
}
const dedupe = arr => { const s = new Set(); return arr.filter(x => !s.has(x.id) && s.add(x.id)); };
async function searchOFF(q, signal) {
  const qs = encodeURIComponent(q), F = `&fields=${OFF_FIELDS}`;
  const sal = async extra => { const r = await fetch(`https://search.openfoodfacts.org/search?q=${qs}${extra}&langs=de,en&page_size=30${F}`, { signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return (await r.json()).hits || []; };
  const cgi = async () => { const r = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${qs}&search_simple=1&json=1&page_size=30&countries_tags_en=germany&lc=de${F}`, { signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return (await r.json()).products || []; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const tries = [async () => { let h = await sal('%20countries_tags:%22en:germany%22'); if (h.length < 5) h = h.concat(await sal('')); return h; }, cgi,
    async () => { await wait(1200); return sal(''); }, async () => { await wait(2000); return cgi(); }];
  let err;
  for (const tryFn of tries) {
    try { const list = dedupe((await tryFn()).map(p => parseOFF(p)).filter(x => x && x.hasNutr)); return rank(list, q); }
    catch (e) { if (e?.name === 'AbortError') throw e; err = e; }
  }
  throw err || new Error('offline');
}

// ---------- Search & ranking ----------
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
function scoreFood(f, q) {
  const nq = norm(q).trim(), name = norm(f.name), brand = norm(f.brand), words = nq.split(/\s+/).filter(Boolean);
  let s = 0;
  if (name === nq) s += 100; else if (name.startsWith(nq)) s += 60; else if (new RegExp('\\b' + nq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(name)) s += 40;
  if (words.every(w => (name + ' ' + brand).includes(w))) s += 25;
  if (brand && words.some(w => brand.includes(w))) s += 15;
  if (f.de) s += 20;
  if (f.n && f.n.kcal > 0) s += 10;
  if (f.img) s += 5; if (f.serving?.g) s += 5; if (f.ns) s += 3; s += Math.min(10, (f.compl || 0) * 10);
  if (f.src === 'custom' || f.src === 'recipe') s += 30;
  const rc = S.recents.findIndex(r => r.id === f.id); if (rc >= 0) s += 30 - rc * 0.5;
  if (S.favorites[f.id]) s += 25;
  return s - Math.max(0, name.length - 40) * 0.3;
}
const rank = (list, q) => list.map(f => [scoreFood(f, q), f]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
function localSearch(q) {
  const nq = norm(q).split(/\s+/).filter(Boolean);
  const pool = dedupe([...Object.values(S.recipes).map(recipeFood), ...Object.values(S.foods), ...Object.values(S.products), ...BASE_FOODS].filter(Boolean));
  return rank(pool.filter(f => nq.every(w => norm(f.name + ' ' + (f.brand || '') + ' ' + (f.cat || '')).includes(w))), q).slice(0, 40);
}
function recipeFood(r) {
  if (!r) return null;
  const tot = Object.fromEntries(NKEYS.map(k => [k, 0])); let g = 0;
  for (const it of r.items) { const n = nutr(it.food, it.g); for (const k in tot) tot[k] += n[k]; g += it.g; }
  const per100 = {}; for (const k in tot) per100[k] = g ? r1(tot[k] / g * 100) : 0;
  const portions = r.portions || 1;
  return { id: r.id, src: 'recipe', name: r.name, cat: 'Gericht', brand: t('{n} Zutaten · {k} kcal/Portion', { n: r.items.length, k: de(tot.kcal / portions) }), n: per100, serving: { g: g / portions, label: 'Portion' } };
}
function pushScan(code) { S.scanHistory = [{ code, t: Date.now() }, ...S.scanHistory.filter(h => h.code !== code)].slice(0, 100); save(); }

// ---------- Export ----------
const csv = rows => '﻿' + rows.map(r => r.map(x => { const s = String(x ?? ''); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\n');
function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }

// ---------- Demo data ----------
function seedDemo() {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const F = n => BASE_FOODS.find(f => f.name === n);
  const plans = { breakfast: [['Haferflocken', 70], ['Milch 1,5%', 250], ['Banane', 120], ['Heidelbeeren', 80]], lunch: [['Hähnchenbrust gebraten', 160], ['Reis weiß gekocht', 220], ['Brokkoli', 180], ['Olivenöl', 10]],
    dinner: [['Vollkornbrot', 100], ['Gouda', 40], ['Kochschinken', 40], ['Tomate', 120], ['Skyr', 150]], snacks: [['Apfel', 180], ['Mandeln', 25], ['Proteinriegel', 60]] };
  S.profile ||= { sex: 'm', age: 32, height: 182, weight: 86, activity: 1.375, goal: 'lose', rate: 0.5 };
  const c = computeGoals(S.profile); if (!S.goals.manual) S.goals = { kcal: c.kcal, p: c.p, c: c.c, f: c.f, manual: false };
  const start = addDays(today(), -42); let w = 86.4;
  const push = (d, meal, f, g) => S.entries[d].push({ id: uid(), meal, g, label: g + ' g', unit: 'g', qty: g, food: { id: f.id, name: f.name, cat: f.cat, n: f.n, src: 'base', serving: f.serving } });
  for (let i = 0; i <= 42; i++) {
    const d = addDays(start, i); S.entries[d] = [];
    for (const m in plans) for (const [n, g] of plans[m]) { if ((m === 'snacks' && rnd() < 0.3) || (i === 42 && (m === 'dinner' || m === 'snacks'))) continue; push(d, m, F(n), Math.round(g * (0.8 + rnd() * 0.45))); }
    if (rnd() < 0.25 && i < 42) push(d, 'dinner', F('Pizza Margherita'), 175);
    w += -0.075 + (rnd() - 0.5) * 0.08; const noisy = w + (rnd() - 0.5) * 0.9 + (i % 7 === 6 ? 0.4 : 0);
    if (rnd() < 0.85 || i === 42) S.weights[d] = r1(noisy);
    S.water[d] = Math.round((1500 + rnd() * 1500) / 250) * 250;
    if (i % 7 === 0) S.measures[d] = { waist: r1(94 - i * 0.07 + (rnd() - .5) * .6), hip: r1(102 - i * 0.04), chest: r1(104 - i * 0.02), arm: r1(36 + (rnd() - .5) * .3), bf: r1(22 - i * 0.05) };
  }
  S.profile.weight = S.weights[today()];
  S.recents = dedupe([...Object.values(plans).flat().map(([n]) => F(n)), F('Pizza Margherita'), ...S.recents]).slice(0, 40);
  S.settings.planStart = start; S.checkins = []; S.settings.onboarded = true; save();
}
