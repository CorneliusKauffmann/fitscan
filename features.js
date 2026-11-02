'use strict';
/* FitScan v2 – Erweiterungen: Onboarding, wöchentlicher Check-in, Schnelleintrag, Mehrfachauswahl, Portions-Presets,
   Wasser, Fasten, Körpermaße, Streaks, Mikronährstoffe, Nutri-Score, Serienscan, Scan-Verlauf, Insights, besseres Ranking. */

// ---------- Migration ----------
function migrate() {
  S.water ||= {}; S.measures ||= {}; S.checkins ||= []; S.scanHistory ||= []; S.fast ||= null; S.fastLog ||= [];
  S.settings.waterGoal ||= 2500; S.settings.glass ||= 250; S.settings.fastTarget ||= 16; S.settings.checkinDay ??= 1;
  S.settings.continuousScan ??= false; S.settings.beep ??= true;
  if (S.profile && S.settings.onboarded == null) S.settings.onboarded = true;
  for (const k of ['water', 'measures']) if (typeof S[k] !== 'object' || Array.isArray(S[k]) || !S[k]) S[k] = {};
  for (const k of ['checkins', 'scanHistory', 'fastLog']) if (!Array.isArray(S[k])) S[k] = [];
  if (S.fast && !(+S.fast.start > 0 && +S.fast.start <= Date.now())) S.fast = null;
  S.fastLog = S.fastLog.filter(x => x && Number.isFinite(+x.h));
  S.version = 2; save();
}
migrate();
// Datum nach Mitternacht weiterschalten, wenn die App offen bleibt
let _lastToday = today();
const _dayTick = () => { const t = today(); if (t !== _lastToday) { if (ui.date === _lastToday) ui.date = t; _lastToday = t; if (!document.getElementById('onb')) render(); } };
setInterval(_dayTick, 60000); document.addEventListener('visibilitychange', () => { if (!document.hidden) _dayTick(); });

// ---------- Helpers ----------
const beep = () => { if (!S.settings.beep) return; try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = 1320; g.gain.setValueAtTime(.18, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .14); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + .15); setTimeout(() => a.close(), 300); } catch {} };
const isLogged = d => (S.entries[d] || []).length > 0;
function streak() { let n = 0, d = today(); if (!isLogged(d)) d = addDays(d, -1); while (isLogged(d)) { n++; d = addDays(d, -1); } return n; }
function goalDelta(p) { return p.goal === 'maintain' ? 0 : (p.goal === 'lose' ? -1 : 1) * p.rate * 7700 / 7; }
function macrosFor(kcal, weight, goal) { const p = Math.round(weight * (goal === 'lose' ? 2.0 : 1.8)), f = Math.round(kcal * 0.27 / 9); return { kcal, p, f, c: Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4)) }; }
const NS_COL = { a: '#038141', b: '#85bb2f', c: '#fecb02', d: '#ee8100', e: '#e63e11' };
const nutriBadge = g => g && NS_COL[g] ? `<span class="ns" style="background:${NS_COL[g]}">Nutri-Score ${g.toUpperCase()}</span>` : '';
const nsMini = g => g && NS_COL[g] ? `<span class="nsm" style="background:${NS_COL[g]}">${g.toUpperCase()}</span>` : '';

// ---------- OFF: Mikronährstoffe, Nutri-Score, Länder ----------
const MICROS = [['saturated-fat', 'Gesättigte Fettsäuren', 'g', 1], ['sodium', 'Natrium', 'mg', 1000], ['cholesterol', 'Cholesterin', 'mg', 1000], ['potassium', 'Kalium', 'mg', 1000], ['calcium', 'Calcium', 'mg', 1000],
  ['magnesium', 'Magnesium', 'mg', 1000], ['iron', 'Eisen', 'mg', 1000], ['zinc', 'Zink', 'mg', 1000], ['vitamin-a', 'Vitamin A', 'µg', 1e6], ['vitamin-c', 'Vitamin C', 'mg', 1000], ['vitamin-d', 'Vitamin D', 'µg', 1e6],
  ['vitamin-e', 'Vitamin E', 'mg', 1000], ['vitamin-b12', 'Vitamin B12', 'µg', 1e6], ['vitamin-b6', 'Vitamin B6', 'mg', 1000], ['folates', 'Folat', 'µg', 1e6], ['caffeine', 'Koffein', 'mg', 1000]];
const _parseOFF = parseOFF;
parseOFF = function (p, code) {
  const f = _parseOFF(p, code); if (!f) return f;
  const nm = p.nutriments || {}, mic = {};
  for (const [k] of MICROS) { const v = parseFloat(nm[k + '_100g']); if (isFinite(v) && v > 0) mic[k] = v; }
  if (Object.keys(mic).length) f.micro = mic;
  if (p.nutriscore_grade && /^[a-e]$/.test(p.nutriscore_grade)) f.ns = p.nutriscore_grade;
  if (p.nova_group) f.nova = +p.nova_group;
  f.de = Array.isArray(p.countries_tags) && p.countries_tags.includes('en:germany');
  f.compl = +p.completeness || 0;
  return f;
};

// ---------- Ranking ----------
function scoreFood(f, q) {
  const nq = norm(q).trim(), name = norm(f.name || ''), brand = norm(f.brand || ''), words = nq.split(/\s+/).filter(Boolean);
  let s = 0;
  if (name === nq) s += 100; else if (name.startsWith(nq)) s += 60; else if (new RegExp('\\b' + nq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(name)) s += 40;
  if (words.every(w => (name + ' ' + brand).includes(w))) s += 25;
  if (brand && words.some(w => brand.includes(w))) s += 15;
  if (f.de) s += 20;
  if (f.n && f.n.kcal > 0 && f.n.p != null && f.n.c != null && f.n.f != null) s += 10;
  if (f.img) s += 5; if (f.serving?.g) s += 5; if (f.ns) s += 3; s += Math.min(10, (f.compl || 0) * 10);
  if (f.src === 'custom' || f.src === 'recipe') s += 30;
  const rc = S.recents.findIndex(r => r.id === f.id); if (rc >= 0) s += 30 - rc * 0.5;
  if (S.favorites[f.id]) s += 25;
  s -= Math.max(0, name.length - 40) * 0.3;
  return s;
}
const _searchOFF = searchOFF;
searchOFF = async function (q, signal) { const r = await _searchOFF(q, signal); return r.map(f => [scoreFood(f, q), f]).sort((a, b) => b[0] - a[0]).map(x => x[1]); };
const _localSearch = localSearch;
localSearch = function (q) {
  const nq = norm(q).split(/\s+/).filter(Boolean);
  const pool = [...Object.values(S.recipes).map(recipeFood), ...Object.values(S.foods), ...Object.values(S.products), ...BASE_FOODS];
  return pool.filter(f => f && nq.every(w => norm(f.name + ' ' + (f.brand || '') + ' ' + (f.cat || '')).includes(w)))
    .map(f => [scoreFood(f, q), f]).sort((a, b) => b[0] - a[0]).map(x => x[1]).slice(0, 40);
};

// ---------- Onboarding ----------
function onboarding(step = 0, d = null) {
  d ||= { sex: 'm', age: 30, height: 178, weight: 80, activity: 1.375, goal: 'lose', rate: 0.5, target: 75 };
  const el = document.getElementById('onb') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'onb', className: 'onb' }));
  const steps = 5, dots = `<div class="dots">${Array.from({ length: steps }, (_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>`;
  const nav = (back = true, next = 'Weiter') => `<div class="onb-nav">${back ? '<button class="btn ghost" id="oB">Zurück</button>' : '<button class="btn ghost" id="oSkip">Überspringen</button>'}<button class="btn" id="oN">${next}</button></div>`;
  let body = '';
  if (step === 0) body = `<div class="onb-hero"><img src="icons/icon-512.png" alt=""><h1>FitScan</h1><p class="mut">Kostenloser Kalorien- & Makro-Tracker. Unbegrenzt scannen, keine Paywall, kein Konto – deine Daten bleiben auf deinem Gerät.</p>
    <div class="seg" id="oLang" style="max-width:240px;margin:18px auto"><button data-v="de" class="${LANG === 'de' ? 'on' : ''}">Deutsch</button><button data-v="en" class="${LANG === 'en' ? 'on' : ''}">English</button></div></div>${nav(false, "Los geht's")}`;
  if (step === 1) body = `<h2>Was ist dein Ziel?</h2><div class="opts">${[['lose', I('trendDown'), 'Abnehmen', 'Fett verlieren, Muskeln erhalten'], ['maintain', I('scale'), 'Gewicht halten', 'Gesund essen, Form halten'], ['gain', I('trendUp'), 'Aufbauen', 'Muskeln & Gewicht zulegen']]
    .map(o => `<button class="opt ${d.goal === o[0] ? 'on' : ''}" data-v="${o[0]}"><span class="oi">${o[1]}</span><span><b>${o[2]}</b><br><span class="small mut">${o[3]}</span></span></button>`).join('')}</div>${nav()}`;
  if (step === 2) body = `<h2>Über dich</h2><p class="small mut">Für die Startschätzung deines Verbrauchs. FitScan lernt danach aus deinen echten Daten.</p>
    <div class="seg" id="oSex"><button data-v="m" class="${d.sex === 'm' ? 'on' : ''}">Männlich</button><button data-v="f" class="${d.sex === 'f' ? 'on' : ''}">Weiblich</button></div>
    <div class="grid3"><div><label class="f">Alter</label><input class="input" id="oAge" type="text" inputmode="decimal" autocomplete="off" value="${d.age}"></div><div><label class="f">Größe (cm)</label><input class="input" id="oH" type="text" inputmode="decimal" autocomplete="off" value="${d.height}"></div><div><label class="f">Gewicht (kg)</label><input class="input" id="oW" type="text" inputmode="decimal" autocomplete="off" step="0.1" value="${d.weight}"></div></div>${nav()}`;
  if (step === 3) body = `<h2>Wie aktiv bist du?</h2><div class="opts">${ACT.map(a => `<button class="opt ${+d.activity === a[0] ? 'on' : ''}" data-v="${a[0]}"><span>${a[1]}</span></button>`).join('')}</div>${nav()}`;
  if (step === 4) { const c = computeGoals(d);
    body = `<h2>Dein Plan</h2>${d.goal !== 'maintain' ? `<label class="f">Tempo: <b id="oRL">${de(d.rate, 2)} kg/Woche</b></label><input id="oRate" type="range" min="0.1" max="1" step="0.05" value="${d.rate}" style="width:100%;accent-color:var(--acc)">` : ''}
    <div class="plan"><div class="big" id="oK">${de(c.kcal)}</div><div class="mut">kcal pro Tag</div>
    <div class="grid3" style="margin-top:14px"><div class="pill"><b style="color:var(--p)" id="oP">${c.p} g</b><span class="small mut">Protein</span></div><div class="pill"><b style="color:var(--c)" id="oC">${c.c} g</b><span class="small mut">Kohlenhydrate</span></div><div class="pill"><b style="color:var(--f)" id="oF">${c.f} g</b><span class="small mut">Fett</span></div></div>
    <p class="small mut" id="oInfo">Geschätzter Verbrauch ≈ ${de(c.tdee)} kcal. Jede Woche passt der Check-in dein Ziel an deinen gemessenen Verbrauch an.</p></div>${nav(true, 'Plan übernehmen')}`; }
  el.innerHTML = `<div class="onb-card">${dots}${body}</div>`;
  const q = s => el.querySelector(s);
  const read = () => { if (q('#oAge')) Object.assign(d, { age: num(q('#oAge').value, 14, 100) || 30, height: num(q('#oH').value, 120, 230) || 175, weight: num(q('#oW').value, 30, 300) || 75, sex: q('#oSex .on').dataset.v }); };
  el.querySelectorAll('.opt').forEach(b => b.onclick = () => { el.querySelectorAll('.opt').forEach(x => x.classList.toggle('on', x === b)); if (step === 1) d.goal = b.dataset.v; else d.activity = +b.dataset.v; });
  el.querySelectorAll('#oSex button').forEach(b => b.onclick = () => el.querySelectorAll('#oSex button').forEach(x => x.classList.toggle('on', x === b)));
  el.querySelectorAll('#oLang button').forEach(b => b.onclick = () => { setLang(b.dataset.v); save(); onboarding(0, d); });
  if (q('#oRate')) q('#oRate').oninput = e => { d.rate = +e.target.value; const c = computeGoals(d); q('#oRL').textContent = de(d.rate, 2) + ' kg/Woche'; q('#oK').textContent = de(c.kcal); q('#oP').textContent = c.p + ' g'; q('#oC').textContent = c.c + ' g'; q('#oF').textContent = c.f + ' g'; };
  if (q('#oB')) q('#oB').onclick = () => { read(); onboarding(step - 1, d); };
  if (q('#oSkip')) q('#oSkip').onclick = () => { S.settings.onboarded = true; save(); el.remove(); render(); };
  q('#oN').onclick = () => {
    read();
    if (step === 2 && !(d.age > 10 && d.age < 110 && d.height > 100 && d.weight > 30)) return toast('Bitte Werte prüfen');
    if (step < 4) return onboarding(step + 1, d);
    S.profile = { sex: d.sex, age: d.age, height: d.height, weight: d.weight, activity: d.activity, goal: d.goal, rate: d.rate };
    const c = computeGoals(S.profile); S.goals = { kcal: c.kcal, p: c.p, c: c.c, f: c.f, manual: false };
    S.weights[today()] ??= d.weight; S.settings.onboarded = true; S.settings.planStart = today(); save();
    el.classList.add('out'); setTimeout(() => el.remove(), 300); go('diary'); toast('Plan übernommen – viel Erfolg!');
  };
}

// ---------- Weekly check-in (MacroFactor-Stil) ----------
function checkinData() {
  if (!S.profile) return null;
  const est = estimateTDEE(), formula = computeGoals({ ...S.profile, weight: weightSeries().at(-1)?.t || S.profile.weight });
  const tdee = est ? est.tdee : formula.tdee, delta = goalDelta(S.profile);
  const floor = S.profile.sex === 'm' ? 1500 : 1200;
  const kcal = Math.max(floor, Math.round((tdee + delta) / 10) * 10);
  const w = weightSeries().at(-1)?.t || S.profile.weight;
  return { est, tdee, kcal, macros: macrosFor(kcal, w, S.profile.goal), old: { ...S.goals }, source: est ? 'data' : 'formula', rate: weeklyRate(weightSeries()) };
}
function checkinDue() {
  if (!S.profile) return false;
  const last = S.checkins.at(-1)?.date || S.settings.planStart || Object.keys(S.entries).sort()[0];
  if (!last) return false;
  return daysBetween(last, today()) >= 7;
}
function checkinSheet() {
  const c = checkinData(); if (!c) return toast('Lege zuerst dein Profil an');
  const diff = c.kcal - c.old.kcal, sign = diff > 0 ? '+' : '';
  openSheet(`<h2>${I('calendar')}Wöchentlicher Check-in</h2><p class="small mut">${c.source === 'data' ? `Berechnet aus ${c.est.logged} geloggten Tagen und deinem Trendgewicht der letzten ${c.est.N} Tage.` : 'Noch zu wenig Daten – Schätzung per Formel. Logge weiter Essen und Gewicht, dann wird es genauer.'}</p>
  <div class="grid2" style="margin:12px 0"><div class="pill"><span class="small mut">Verbrauch</span><b>${de(c.tdee)} kcal</b></div><div class="pill"><span class="small mut">Trend/Woche</span><b>${c.rate == null ? '–' : (c.rate > 0 ? '+' : '') + de(c.rate, 2) + ' kg'}</b></div></div>
  <div class="card ci"><div class="row"><div class="grow"><div class="small mut">Bisher</div><b style="font-size:20px">${de(c.old.kcal)} kcal</b></div><div class="mut">${I('arrowR')}</div><div class="grow right"><div class="small mut">Neu</div><b style="font-size:24px;color:var(--acc)">${de(c.kcal)} kcal</b></div></div>
  <div class="small mut" style="margin-top:6px">${diff === 0 ? 'Keine Änderung nötig' : `${sign}${de(diff)} kcal pro Tag`} · P ${c.macros.p} g · KH ${c.macros.c} g · F ${c.macros.f} g</div></div>
  <button class="btn block" id="ciOk">Neue Ziele übernehmen</button><button class="btn block ghost" id="ciKeep" style="margin-top:8px">Ziele beibehalten</button>
  ${S.checkins.length ? `<div class="small mut" style="margin-top:14px">Letzte Check-ins</div>${S.checkins.slice(-5).reverse().map(x => `<div class="entry"><div class="grow">${fmtDate(x.date)}</div><span class="small mut">${de(x.tdee)} kcal</span><b>${de(x.kcal)}</b></div>`).join('')}` : ''}`, () => {
    const rec = accepted => { S.checkins.push({ date: today(), tdee: c.tdee, kcal: accepted ? c.kcal : c.old.kcal, src: c.source }); save(); };
    $('#ciOk').onclick = () => { S.goals = { ...c.macros, manual: false }; rec(true); closeSheet(); render(); toast('Ziele aktualisiert'); };
    $('#ciKeep').onclick = () => { rec(false); closeSheet(); render(); };
  });
}

// ---------- Quick add ----------
function quickAddSheet(meal) {
  meal ||= ui.targetMeal || mealDefault();
  openSheet(`<h2>${I('zap')}Schnelleintrag</h2><p class="small mut">Nur Kalorien oder Makros eintragen – z. B. im Restaurant.</p>
  <label class="f">Bezeichnung (optional)</label><input class="input" id="qaN" placeholder="Schnelleintrag">
  <div class="grid2">${[['qaK', 'Kalorien (kcal)'], ['qaP', 'Protein (g)'], ['qaC', 'Kohlenhydrate (g)'], ['qaF', 'Fett (g)']].map(x => `<div><label class="f">${x[1]}</label><input class="input" id="${x[0]}" type="text" inputmode="decimal" autocomplete="off" step="any"></div>`).join('')}</div>
  <div class="small mut" id="qaHint" style="margin-top:6px"></div>
  <div class="seg" id="qaM" style="margin-top:10px">${MEALS.map(m => `<button data-m="${m[0]}" class="${m[0] === meal ? 'on' : ''}">${I(m[2])}${m[1].replace('essen', '.')}</button>`).join('')}</div>
  <button class="btn block" id="qaSave">Hinzufügen</button>`, sh => {
    const v = id => num($('#' + id).value, 0, id === 'qaK' ? 20000 : 2000);
    const hint = () => { const k = v('qaP') * 4 + v('qaC') * 4 + v('qaF') * 9; $('#qaHint').textContent = k && !v('qaK') ? `≈ ${de(k)} kcal aus Makros` : ''; };
    sh.querySelectorAll('#qaP,#qaC,#qaF,#qaK').forEach(i => i.oninput = hint);
    sh.querySelectorAll('#qaM button').forEach(b => b.onclick = () => { meal = b.dataset.m; sh.querySelectorAll('#qaM button').forEach(x => x.classList.toggle('on', x === b)); });
    $('#qaSave').onclick = () => {
      const p = v('qaP'), c = v('qaC'), f = v('qaF'), kcal = v('qaK') || Math.round(p * 4 + c * 4 + f * 9);
      if (!kcal) return toast('Bitte Kalorien oder Makros eingeben');
      const name = $('#qaN').value.trim() || 'Schnelleintrag';
      (S.entries[ui.date] ||= []).push({ id: uid(), meal, g: 100, label: 'Schnelleintrag', quick: true, food: { id: 'quick:' + uid(), name, cat: 'Eigene', src: 'quick', n: { kcal, p, c, f, fib: 0, sug: 0, salt: 0 } } });
      save(); closeSheet(); go('diary'); toast(`${de(kcal)} kcal hinzugefügt`);
    };
  });
}

// ---------- Diary extras ----------
const _renderDiary = renderDiary;
renderDiary = function (v) {
  _renderDiary(v);
  const d = ui.date, st = streak();
  const nav = v.querySelector('.datenav');
  if (nav && st > 0) nav.insertAdjacentHTML('afterend', `<div class="streak"><span>${I('flame')}${st} ${st === 1 ? 'Tag' : 'Tage'} in Folge</span>${(S.entries[d] || []).length ? '' : '<span class="mut small">Logge heute, um die Serie zu halten</span>'}</div>`);
  if (d === today() && checkinDue()) v.querySelector('.datenav').insertAdjacentHTML('afterend', `<button class="card cta" id="ciBanner"><span class="cta-ic">${I('calendar')}</span><span class="grow" style="text-align:left"><b>Wöchentlicher Check-in fällig</b><br><span class="small mut">Ziele an deinen echten Verbrauch anpassen</span></span><span class="mut">${I('chevR')}</span></button>`);
  if ($('#ciBanner')) $('#ciBanner').onclick = checkinSheet;
  const sum = v.querySelector('.card .summary'); if (sum) { sum.parentElement.style.cursor = 'pointer'; sum.parentElement.onclick = () => dayDetailSheet(d); }
  v.querySelectorAll('.addrow').forEach((row, i) => { const m = MEALS[i][0]; row.insertAdjacentHTML('beforeend', `<button class="btn ghost sm" data-quick="${m}" title="Schnelleintrag">${I('zap')}</button><button class="btn ghost sm" data-mscan="${m}" title="Scannen">${I('scan')}</button>`); });
  v.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => quickAddSheet(b.dataset.quick));
  v.querySelectorAll('[data-mscan]').forEach(b => b.onclick = () => { ui.targetMeal = b.dataset.mscan; openScanner(); });
  if (!(S.entries[d] || []).length && isLogged(addDays(d, -1))) v.querySelector('.card.meal')?.insertAdjacentHTML('beforebegin', `<button class="btn ghost block" id="copyDay" style="margin-bottom:12px">${I('undo')}Ganzen Tag von gestern kopieren</button>`);
  if ($('#copyDay')) $('#copyDay').onclick = () => { const src = S.entries[addDays(d, -1)]; (S.entries[d] ||= []).push(...src.map(e => ({ ...e, id: uid() }))); save(); render(); toast(`${src.length} Einträge kopiert`); };
  // Wasser
  const ml = S.water[d] || 0, goal = S.settings.waterGoal, gl = S.settings.glass, n = Math.max(8, Math.ceil(goal / gl));
  const wcard = `<div class="card"><h3><span>${I('drop')}Wasser</span><span class="kc mut small">${de(ml / 1000, 2)} / ${de(goal / 1000, 1)} L</span></h3>
    <div class="glasses">${Array.from({ length: n }, (_, i) => `<button class="glass ${i < Math.round(ml / gl) ? 'on' : ''}" data-gi="${i}" aria-label="Glas"></button>`).join('')}</div>
    <div class="row" style="margin-top:8px"><button class="btn ghost sm" id="wMinus">${I('minus')}${gl} ml</button><div class="grow bar"><i style="width:${Math.min(100, ml / goal * 100)}%;background:#06b6d4"></i></div><button class="btn sm" id="wPlus">${I('plus')}${gl} ml</button></div></div>`;
  // Fasten
  const f = S.fast, tgt = S.settings.fastTarget;
  const el = f ? (Date.now() - f.start) / 36e5 : 0;
  const fcard = `<div class="card"><h3><span>${I('timer')}Intervallfasten</span><select class="input" id="fTgt" style="width:auto;padding:6px 10px">${[12, 14, 16, 18, 20, 24].map(h => `<option value="${h}" ${h === tgt ? 'selected' : ''}>${h}:${24 - h}</option>`).join('')}</select></h3>
    ${f ? `<div class="row"><div class="ring" style="width:84px;height:84px">${ring(el, tgt, 84, 9, 'var(--acc2)')}<div class="center"><b id="fEl">${Math.floor(el)}:${String(Math.floor(el % 1 * 60)).padStart(2, '0')}</b></div></div>
      <div class="grow"><div class="small mut">Seit ${new Date(f.start).toLocaleTimeString(LOC(), { hour: '2-digit', minute: '2-digit' })} · Ziel ${tgt} h</div><div><b>${el >= tgt ? 'Ziel erreicht!' : `noch ${Math.floor(Math.ceil((tgt - el) * 60) / 60)} h ${Math.ceil((tgt - el) * 60) % 60} min`}</b></div><button class="btn sm" id="fStop" style="margin-top:8px">Fasten beenden</button></div></div>`
      : `<div class="row"><div class="grow small mut">${S.fastLog.length ? `Letztes Fasten: ${de(S.fastLog.at(-1).h, 1)} h` : 'Starte dein Fastenfenster, wenn du die letzte Mahlzeit gegessen hast.'}</div><button class="btn sm" id="fStart">Fasten starten</button></div>`}</div>`;
  const wcardEl = v.querySelector('#dWeight')?.closest('.card');
  wcardEl?.insertAdjacentHTML('beforebegin', wcard); wcardEl?.insertAdjacentHTML('afterend', fcard);
  const setW = x => { S.water[d] = Math.max(0, x); save(); render(); if (S.water[d] >= goal && x - gl < goal) toast('Wasserziel erreicht!'); };
  $('#wPlus').onclick = () => setW(ml + gl); $('#wMinus').onclick = () => setW(ml - gl);
  v.querySelectorAll('[data-gi]').forEach(b => b.onclick = () => { const i = +b.dataset.gi; setW(i < Math.round(ml / gl) && i === Math.round(ml / gl) - 1 ? i * gl : (i + 1) * gl); });
  $('#fTgt').onchange = e => { S.settings.fastTarget = +e.target.value; save(); render(); };
  if ($('#fStart')) $('#fStart').onclick = () => { S.fast = { start: Date.now() }; save(); render(); toast('Fasten gestartet'); };
  if ($('#fStop')) $('#fStop').onclick = () => { S.fastLog.push({ start: f.start, end: Date.now(), h: (Date.now() - f.start) / 36e5 }); S.fast = null; save(); render(); toast('Fasten beendet'); };
  v.querySelectorAll('.card').forEach((c, i) => c.style.animationDelay = Math.min(i, 8) * 30 + 'ms');
};
setInterval(() => { if (ui.tab === 'diary' && S.fast && $('#sheet').classList.contains('hidden') && !document.getElementById('onb')) { const y = window.scrollY; render(); window.scrollTo(0, y); } }, 60000);

function dayDetailSheet(d) {
  const t = dayTotals(d), mic = {}, cover = {}; let n = 0;
  for (const e of S.entries[d] || []) { n++; const m = e.food.micro; if (!m) continue; for (const k in m) { mic[k] = (mic[k] || 0) + m[k] * e.g / 100; cover[k] = (cover[k] || 0) + 1; } }
  const g = S.goals, pk = t.p * 4, ck = t.c * 4, fk = t.f * 9, tot = pk + ck + fk || 1;
  openSheet(`<h2>Tagesdetails</h2><div class="small mut">${fmtDate(d)}</div>
  <div class="macrobar"><i style="width:${pk / tot * 100}%;background:var(--p)"></i><i style="width:${ck / tot * 100}%;background:var(--c)"></i><i style="width:${fk / tot * 100}%;background:var(--f)"></i></div>
  <div class="row small" style="justify-content:space-between"><span>Protein ${r0(pk / tot * 100)} %</span><span>Kohlenhydrate ${r0(ck / tot * 100)} %</span><span>Fett ${r0(fk / tot * 100)} %</span></div>
  <table class="ntable" style="margin-top:12px"><tr><th>Nährwert</th><th>Heute</th><th>Ziel</th></tr>
  ${[['Energie', de(t.kcal) + ' kcal', de(g.kcal) + ' kcal'], ['Protein', r0(t.p) + ' g', g.p + ' g'], ['Kohlenhydrate', r0(t.c) + ' g', g.c + ' g'], ['davon Zucker', r0(t.sug) + ' g', '< 50 g'], ['Fett', r0(t.f) + ' g', g.f + ' g'], ['Ballaststoffe', r0(t.fib) + ' g', '≥ 30 g'], ['Salz', de(t.salt, 1) + ' g', '< 6 g']].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>
  <h3 style="margin:16px 0 4px;font-size:15px">Mikronährstoffe</h3>
  ${Object.keys(mic).length ? `<table class="ntable">${MICROS.filter(m => mic[m[0]]).map(([k, l, u, f]) => `<tr><td>${l}</td><td>${de(mic[k] * f, u === 'g' ? 1 : 0)} ${u}</td><td class="small mut">${cover[k]}/${n}</td></tr>`).join('')}</table><div class="small mut" style="margin-top:6px">Nur aus Produkten mit Angaben (Open Food Facts). Rechte Spalte: Einträge mit Daten.</div>` : '<div class="small mut">Keine Mikronährstoff-Daten für diesen Tag. Gescannte Produkte liefern oft Werte wie Natrium, Calcium oder Vitamine.</div>'}`);
}

// ---------- Food sheet extras ----------
const _foodSheet = foodSheet;
foodSheet = function (food, opts = {}) {
  _foodSheet(food, opts);
  const sh = $('#sheet'), head = sh.querySelector('.prodhead .grow');
  if (head && (food.ns || food.nova)) head.insertAdjacentHTML('beforeend', `<div style="margin-top:6px">${nutriBadge(food.ns)}${food.nova ? `<span class="badge" style="margin-left:6px">NOVA ${food.nova}</span>` : ''}</div>`);
  const qty = $('#fsQty'), unit = $('#fsUnit'); if (!qty) return;
  const presets = [];
  if (food.serving?.g) presets.push(['½', 'serv', 0.5], ['1×', 'serv', 1], ['2×', 'serv', 2]);
  presets.push(['50 g', 'g', 50], ['100 g', 'g', 100], ['150 g', 'g', 150], ['200 g', 'g', 200]);
  const last = !opts.entry && Object.values(S.entries).flat().reverse().find(e => e.food.id === food.id);
  if (last) presets.unshift([`${last.label}`, last.unit || 'g', last.qty ?? last.g]);
  qty.closest('.row').insertAdjacentHTML('afterend', `<div class="chips presets" style="margin:8px 0 0">${presets.map((p, i) => `<button class="chip" data-pi="${i}">${esc(p[0])}</button>`).join('')}</div>`);
  sh.querySelectorAll('[data-pi]').forEach(b => b.onclick = () => { const p = presets[+b.dataset.pi]; if ([...unit.options].some(o => o.value === p[1])) unit.value = p[1]; qty.value = p[2]; qty.dispatchEvent(new Event('input')); sh.querySelectorAll('[data-pi]').forEach(x => x.classList.toggle('on', x === b)); });
  if (food.micro) { const tbl = sh.querySelector('.ntable'); const sv = food.serving?.g;
    tbl.insertAdjacentHTML('beforeend', MICROS.filter(m => food.micro[m[0]]).map(([k, l, u, f]) => `<tr class="micro"><td>${l}</td><td>${de(food.micro[k] * f, u === 'g' ? 1 : u === 'mg' ? 1 : 1)} ${u}</td>${sv ? `<td>${de(food.micro[k] * f * sv / 100, 1)} ${u}</td>` : ''}</tr>`).join('')); }
};

// ---------- Library: Scans, Mehrfachauswahl ----------
let multi = false, picked = new Map();
const _renderLibrary = renderLibrary;
renderLibrary = function (v) {
  _renderLibrary(v);
  const chips = v.querySelector('.chips');
  chips.insertAdjacentHTML('beforeend', `<button class="chip ${ui.libTab === 'scans' ? 'on' : ''}" data-lt2="scans">${I('scan')}Scans</button>`);
  chips.querySelector('[data-lt2]').onclick = () => { ui.libTab = 'scans'; render(); };
  v.querySelector('.search').insertAdjacentHTML('afterend', `<div class="row wrap" style="margin:-2px 0 8px;gap:8px"><button class="btn ghost sm" id="lQuick">${I('zap')}Schnelleintrag</button><button class="btn ghost sm ${multi ? 'onb2' : ''}" id="lMulti">${I('checksq')}Mehrfachauswahl</button></div>`);
  $('#lQuick').onclick = () => quickAddSheet(); $('#lMulti').onclick = () => { multi = !multi; picked.clear(); render(); };
};
const _fillLibList = fillLibList;
fillLibList = function () {
  if (ui.libTab === 'scans') {
    $('#lActions').innerHTML = ''; const list = S.scanHistory.map(h => S.products[h.code] || Object.values(S.foods).find(f => f.code === h.code)).filter(Boolean);
    const seen = new Set(), uniq = list.filter(f => !seen.has(f.id) && seen.add(f.id));
    $('#lList').innerHTML = uniq.length ? uniq.map(foodRow).join('') : '<div class="empty"><div class="e">' + I('scan') + '</div>Hier erscheinen deine gescannten Produkte – auch offline verfügbar.</div>';
    bindList(uniq); return decorateMulti();
  }
  _fillLibList(); decorateMulti();
};
const _bindList = bindList;
bindList = function (list) { _bindList(list); decorateMulti(); lastList = list; };
function decorateMulti() {
  const el = $('#lList'); if (!el) return;
  el.querySelectorAll('.food .nsx').forEach(x => x.remove());
  el.querySelectorAll('[data-fid]').forEach(r => { const f = (lastList || []).find(x => x.id === r.dataset.fid); if (f?.ns && !r.querySelector('.nsm')) r.querySelector('.nm')?.insertAdjacentHTML('beforeend', nsMini(f.ns)); });
  if (!multi) { $('#multiBar')?.remove(); return; }
  el.querySelectorAll('[data-fid]').forEach(r => {
    if (r.querySelector('.ck')) return; const id = r.dataset.fid;
    r.insertAdjacentHTML('afterbegin', `<span class="ck ${picked.has(id) ? 'on' : ''}">${I('check')}</span>`);
    r.onclick = e => { e.preventDefault(); e.stopPropagation(); const f = (lastList || []).find(x => x.id === id); if (!f) return; if (picked.has(id)) picked.delete(id); else picked.set(id, f); r.querySelector('.ck').classList.toggle('on', picked.has(id)); multiBar(); };
    const qa = r.querySelector('[data-qa]'); if (qa) qa.style.display = 'none';
  });
  multiBar();
}
function multiBar() {
  let bar = $('#multiBar'); if (!bar) { bar = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'multiBar', className: 'multibar' })); }
  const meal = ui.targetMeal || mealDefault();
  bar.innerHTML = `<span class="grow">${picked.size} ausgewählt</span><select class="input" id="mbMeal" style="width:auto;padding:8px">${MEALS.map(m => `<option value="${m[0]}" ${m[0] === meal ? 'selected' : ''}>${m[1]}</option>`).join('')}</select><button class="btn" id="mbAdd" ${picked.size ? '' : 'disabled'}>Hinzufügen</button>`;
  $('#mbAdd').onclick = () => { const m = $('#mbMeal').value; let k = 0; for (const f of picked.values()) { const g = f.serving?.g || 100; addEntry(f, g, f.serving?.g ? `1 × ${f.serving.label}` : '100 g', m); k += nutr(f, g).kcal; }
    toast(`${picked.size} Lebensmittel (${de(k)} kcal) hinzugefügt`); picked.clear(); multi = false; bar.remove(); ui.targetMeal = null; go('diary'); };
}
const _go = go; go = function (tab, opts) { if (tab !== 'library') { multi = false; picked.clear(); $('#multiBar')?.remove(); } _go(tab, opts); };

// ---------- Scanner: Serienscan, Ton, Verlauf, Torch nur wenn unterstützt ----------
let lastCode = '', lastAt = 0;
onScanned = function (raw) {
  const code0 = String(raw).trim(), m = code0.match(/^\d{6,14}$/) ? code0 : (code0.match(/\d{8,14}/) || [])[0];
  if (m && m === lastCode && Date.now() - lastAt < 2500) return;
  lastCode = m; lastAt = Date.now(); navigator.vibrate?.(60); beep();
  if (S.settings.continuousScan && m) pushScan(m);
  if (S.settings.continuousScan && m) return serialAdd(m);
  closeScanner();
  if (m) handleBarcode(m); else openSheet(`<h2>QR-Code erkannt</h2><p class="mut" style="word-break:break-all">${esc(code0)}</p><p class="small mut">Dieser Code enthält keine Produktnummer.</p>`);
};
function pushScan(m) { S.scanHistory = [{ code: m, t: Date.now() }, ...S.scanHistory.filter(h => h.code !== m)].slice(0, 100); save(); }
const _handleBarcode = handleBarcode;
handleBarcode = function (code) { pushScan(String(code)); return _handleBarcode(code); };
async function serialAdd(code) {
  const st = $('#scanStatus'); st.textContent = `Suche ${code}…`;
  try { const custom = Object.values(S.foods).find(f => f.code === code); const p = custom || (await lookupBarcode(code)).product;
    if (!p) { st.textContent = `${code}: nicht gefunden`; return; }
    const meal = ui.targetMeal || mealDefault(), g = p.serving?.g || 100;
    addEntry(p, g, p.serving?.g ? `1 × ${p.serving.label}` : '100 g', meal);
    const tray = $('#scanTray'); tray.insertAdjacentHTML('afterbegin', `<div class="tray-item">${I('check')}${esc(p.name)} · ${de(nutr(p, g).kcal)} kcal</div>`);
    st.textContent = 'Hinzugefügt – nächsten Barcode scannen';
  } catch (e) { st.textContent = 'Keine Verbindung'; }
}
const _openScanner = openScanner;
openScanner = async function () {
  if (!$('#scanTray')) $('#scanner').insertAdjacentHTML('beforeend', `<div id="scanTray" class="tray"></div><button class="chip scan-mode" id="scanMode"></button>`);
  $('#scanTray').innerHTML = '';
  const upd = () => { $('#scanMode').innerHTML = I('repeat') + `<span>${tr(S.settings.continuousScan ? 'Serienscan: an' : 'Serienscan: aus')}</span>`; $('#scanMode').classList.toggle('on', S.settings.continuousScan); };
  $('#scanMode').onclick = () => { S.settings.continuousScan = !S.settings.continuousScan; save(); upd(); }; upd();
  await _openScanner();
  const t = scanStream?.getVideoTracks()[0], caps = t?.getCapabilities?.() || {};
  $('#scanTorch').style.visibility = caps.torch ? 'visible' : 'hidden';
};
const _closeScanner = closeScanner;
closeScanner = function () { const had = $('#scanTray')?.children.length; _closeScanner(); if (had) { ui.targetMeal = null; go('diary'); } };
$('#scanClose').onclick = () => closeScanner();

// ---------- Progress extras: Check-in, Insights, Körpermaße ----------
const MEAS = [['waist', 'Taille'], ['hip', 'Hüfte'], ['chest', 'Brust'], ['arm', 'Oberarm'], ['thigh', 'Oberschenkel'], ['neck', 'Hals'], ['bf', 'Körperfett %']];
function insights() {
  const days = n => Array.from({ length: n }, (_, i) => addDays(today(), -i));
  const wk = days(7), prev = days(14).slice(7), g = S.goals;
  const stat = arr => { const l = arr.filter(isLogged), t = l.map(dayTotals); const avg = k => t.length ? t.reduce((a, x) => a + x[k], 0) / t.length : 0;
    return { n: l.length, kcal: avg('kcal'), p: avg('p'), adh: t.filter(x => Math.abs(x.kcal - g.kcal) <= g.kcal * 0.1).length, ph: t.filter(x => x.p >= g.p * 0.9).length }; };
  return { cur: stat(wk), prev: stat(prev) };
}
const _renderProgress = renderProgress;
renderProgress = function (v) {
  _renderProgress(v);
  const { cur, prev } = insights(), dk = cur.kcal - prev.kcal, due = checkinDue(), last = S.checkins.at(-1);
  const arrow = x => x > 0 ? '▲' : x < 0 ? '▼' : '';
  const html = `<div class="card"><h3><span>${I('calendar')}Wöchentlicher Check-in</span>${due ? '<span class="badge" style="background:var(--acc);color:#fff">fällig</span>' : ''}</h3>
    <div class="small mut">${last ? `Letzter Check-in: ${fmtDate(last.date)} · Ziel ${de(last.kcal)} kcal` : 'Noch kein Check-in. FitScan passt dein Kalorienziel jede Woche an deinen gemessenen Verbrauch an.'}</div>
    <button class="btn block ${due ? '' : 'ghost'}" id="ciOpen" style="margin-top:10px">${due ? 'Check-in starten' : 'Check-in ansehen'}</button></div>
  <div class="card"><h3><span>${I('bars')}Diese Woche</span><span class="small mut">letzte 7 Tage</span></h3>
    <div class="grid2"><div class="pill"><span class="small mut">Ø Kalorien</span><b>${cur.n ? de(cur.kcal) : '–'}</b><span class="small ${dk > 0 ? '' : 'mut'}">${prev.n && cur.n ? `${arrow(dk)} ${de(Math.abs(dk))} vs. Vorwoche` : ''}</span></div>
    <div class="pill"><span class="small mut">Ø Protein</span><b>${cur.n ? r0(cur.p) + ' g' : '–'}</b><span class="small mut">Ziel ${S.goals.p} g</span></div>
    <div class="pill"><span class="small mut">Im Zielbereich (±10 %)</span><b>${cur.adh}/${cur.n || 0}</b><span class="small mut">Tage</span></div>
    <div class="pill"><span class="small mut">Proteinziel erreicht</span><b>${cur.ph}/${cur.n || 0}</b><span class="small mut">Tage</span></div></div>
    <div class="small mut" style="margin-top:8px">${I('flame')}Serie: ${streak()} Tage · ${cur.n}/7 Tage geloggt</div></div>`;
  v.querySelector('.card.tdee').insertAdjacentHTML('afterend', html);
  $('#ciOpen').onclick = checkinSheet;
  // Körpermaße
  const md = Object.keys(S.measures).sort(), lastM = md.length ? S.measures[md.at(-1)] : {}, firstM = md.length ? S.measures[md[0]] : {};
  v.querySelector('.wlist').insertAdjacentHTML('beforebegin', `<div class="card"><h3><span>${I('ruler')}Körpermaße</span><button class="btn sm" id="mAdd">${I('plus')}Messen</button></h3>
    ${md.length ? `<div class="grid3">${MEAS.filter(m => lastM[m[0]] != null).map(([k, l]) => { const dlt = firstM[k] != null && md.length > 1 ? lastM[k] - firstM[k] : null; return `<div class="pill"><span class="small mut">${l}</span><b>${de(lastM[k], 1)}${k === 'bf' ? ' %' : ' cm'}</b><span class="small mut">${dlt == null ? '' : (dlt > 0 ? '+' : '') + de(dlt, 1)}</span></div>`; }).join('')}</div><div class="small mut" style="margin-top:6px">Zuletzt: ${fmtDate(md.at(-1))} · Veränderung seit ${fmtDate(md[0])}</div>`
    : '<div class="small mut">Taille, Hüfte, Brust & Co. zeigen Fortschritt, den die Waage nicht sieht.</div>'}</div>`);
  $('#mAdd').onclick = () => measureSheet();
  const chips = v.querySelector('[data-cm]').parentElement;
  chips.insertAdjacentHTML('beforeend', `<button class="chip ${ui.chart.metric === 'meas' ? 'on' : ''}" data-cm2="meas">Körpermaße</button><button class="chip ${ui.chart.metric === 'water' ? 'on' : ''}" data-cm2="water">Wasser</button><button class="chip ${ui.chart.metric === 'tdee' ? 'on' : ''}" data-cm2="tdee">Verbrauch</button>`);
  chips.querySelectorAll('[data-cm2]').forEach(b => b.onclick = () => { ui.chart.metric = b.dataset.cm2; render(); });
  if (['meas', 'water', 'tdee'].includes(ui.chart.metric)) drawChart();
};
function measureSheet(d = today()) {
  const cur = S.measures[d] || {}, last = S.measures[Object.keys(S.measures).sort().pop()] || {};
  openSheet(`<h2>${I('ruler')}Körpermaße</h2><label class="f">Datum</label><input class="input" id="msD" type="date" value="${d}" max="${today()}">
  <div class="grid2">${MEAS.map(([k, l]) => `<div><label class="f">${l}${k === 'bf' ? '' : ' (cm)'}</label><input class="input" data-mk="${k}" type="text" inputmode="decimal" autocomplete="off" step="0.1" inputmode="decimal" value="${cur[k] ?? ''}" placeholder="${last[k] ?? ''}"></div>`).join('')}</div>
  <button class="btn block" id="msSave" style="margin-top:14px">Speichern</button>`, sh => {
    $('#msSave').onclick = () => { const o = {}; sh.querySelectorAll('[data-mk]').forEach(i => { const x = parseFloat(String(i.value).replace(',', '.')); if (x > 0) o[i.dataset.mk] = x; });
      if (!Object.keys(o).length) return toast('Bitte mindestens einen Wert eingeben'); S.measures[$('#msD').value] = o; save(); closeSheet(); render(); toast('Gespeichert'); };
  });
}
const _drawChart = drawChart;
drawChart = function () {
  const C = ui.chart; if (!['meas', 'water', 'tdee'].includes(C.metric)) return _drawChart();
  const cv = $('#chart'); if (!cv) return; chartObj?.destroy();
  const end = today(), start = C.range ? addDays(end, -C.range + 1) : ([...Object.keys(S.measures), ...Object.keys(S.water), ...Object.keys(S.entries)].sort()[0] || addDays(end, -29));
  const days = []; for (let x = start; x <= end; x = addDays(x, 1)) days.push(x);
  const txt = css('--mut'), grid = css('--line'), cols = ['#3b82f6', '#22d3a6', '#ffb547', '#ff6b8b', '#06b6d4', '#a3e635', '#f97316'];
  let datasets = [], info = '', y1 = false;
  if (C.metric === 'meas') { datasets = MEAS.map(([k, l], i) => ({ type: 'line', label: tr(l), data: days.map(d => S.measures[d]?.[k] ?? null), borderColor: cols[i], backgroundColor: cols[i], spanGaps: true, tension: .3, pointRadius: 3, yAxisID: k === 'bf' ? 'y1' : 'y', hidden: false })).filter(ds => ds.data.some(x => x != null)); y1 = datasets.some(d => d.yAxisID === 'y1'); info = tr('Körpermaße in cm, Körperfett rechts in %.'); }
  if (C.metric === 'water') { datasets = [{ type: 'bar', label: tr('Wasser (L)'), data: days.map(d => S.water[d] ? S.water[d] / 1000 : null), backgroundColor: '#06b6d4bb', borderRadius: 6 }, { type: 'line', label: tr('Ziel'), data: days.map(() => S.settings.waterGoal / 1000), borderColor: css('--f'), borderDash: [6, 5], pointRadius: 0 }]; }
  if (C.metric === 'tdee') {
    const pts = days.map(d => daysBetween(d, end) % 3 ? null : estimateAt(d));
    datasets = [{ type: 'line', label: tr('Verbrauch (kcal)'), data: pts, borderColor: '#ffb547', backgroundColor: '#ffb54733', fill: true, spanGaps: true, tension: .35, pointRadius: 2 }, { type: 'line', label: tr('Ø Aufnahme 7T'), data: days.map(d => { const l = Array.from({ length: 7 }, (_, i) => addDays(d, -i)).filter(isLogged); return l.length ? Math.round(l.reduce((a, x) => a + dayTotals(x).kcal, 0) / l.length) : null; }), borderColor: css('--acc'), pointRadius: 0, tension: .35, spanGaps: true }];
    info = tr('Geschätzter Verbrauch aus Aufnahme und Trendgewicht (rollierend, 21–28 Tage).');
  }
  $('#cInfo').textContent = info;
  chartObj = new Chart(cv, { data: { labels: days.map(fmtShort), datasets }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
    plugins: { legend: { labels: { color: txt, boxWidth: 12, usePointStyle: true } } },
    scales: { x: { ticks: { color: txt, maxTicksLimit: 7, maxRotation: 0 }, grid: { display: false } }, y: { ticks: { color: txt }, grid: { color: grid }, beginAtZero: C.metric === 'water' }, ...(y1 ? { y1: { position: 'right', ticks: { color: txt }, grid: { display: false } } } : {}) } } });
};
function estimateAt(end) {
  const series = weightSeries(); if (!series.length) return null;
  for (const N of [28, 21]) { const start = addDays(end, -N), tS = trendAt(series, start), tE = trendAt(series, end); if (tS == null || tE == null) continue;
    const ds = []; for (let d = addDays(start, 1); d <= end; d = addDays(d, 1)) if (isLogged(d)) ds.push(dayTotals(d).kcal);
    if (ds.length < N * 0.7) continue; return Math.round((ds.reduce((a, b) => a + b, 0) / ds.length - (tE - tS) * 7700 / N) / 10) * 10; }
  return null;
}

// ---------- Profile extras ----------
const _renderProfile = renderProfile;
renderProfile = function (v) {
  _renderProfile(v);
  v.querySelector('.card:nth-of-type(2)').insertAdjacentHTML('afterend', `<div class="card"><h3><span>${I('settings')}Einstellungen</span></h3>
  <div class="grid2"><div><label class="f">Wasserziel (ml)</label><input class="input" id="sWG" type="text" inputmode="decimal" autocomplete="off" step="100" value="${S.settings.waterGoal}"></div><div><label class="f">Glasgröße (ml)</label><input class="input" id="sGl" type="text" inputmode="decimal" autocomplete="off" step="50" value="${S.settings.glass}"></div></div>
  <label class="row" style="margin-top:12px"><input type="checkbox" id="sBeep" ${S.settings.beep ? 'checked' : ''}> <span>Ton beim Scannen</span></label>
  <label class="row" style="margin-top:8px"><input type="checkbox" id="sCont" ${S.settings.continuousScan ? 'checked' : ''}> <span>Serienscan (Produkte direkt hinzufügen, Kamera bleibt offen)</span></label>
  <button class="btn ghost block" id="sOnb" style="margin-top:12px">${I('compass')}Einrichtung erneut starten</button></div>`);
  const sv = () => { S.settings.waterGoal = Math.min(10000, Math.max(500, num($('#sWG').value, 0, 1e4) || 2500)); S.settings.glass = Math.min(2000, Math.max(50, num($('#sGl').value, 0, 1e4) || 250)); S.settings.beep = $('#sBeep').checked; S.settings.continuousScan = $('#sCont').checked; save(); };
  v.querySelectorAll('#sWG,#sGl,#sBeep,#sCont').forEach(i => i.onchange = () => { sv(); toast('Gespeichert'); });
  $('#sOnb').onclick = () => onboarding(0, S.profile ? { ...S.profile } : null);
  // CSV um Wasser & Maße ergänzen
  $('#exCsvW').onclick = () => { const ws = weightSeries(), ds = [...new Set([...Object.keys(S.weights), ...Object.keys(S.measures), ...Object.keys(S.water)])].sort();
    download(`fitscan-body-${today()}.csv`, csv([['Datum', 'Gewicht (kg)', 'Trend (kg)', 'Wasser (ml)', ...MEAS.map(m => m[1])], ...ds.map(d => [d, S.weights[d] ?? '', S.weights[d] != null ? r1(trendAt(ws, d)) : '', S.water[d] ?? '', ...MEAS.map(m => S.measures[d]?.[m[0]] ?? '')])]), 'text/csv'); };
};

// ---------- Demo-Daten erweitern ----------
const _seedDemo = seedDemo;
seedDemo = function () {
  _seedDemo();
  let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i <= 42; i++) { const d = addDays(today(), -42 + i); S.water[d] = Math.round((1500 + rnd() * 1500) / 250) * 250;
    if (i % 7 === 0) S.measures[d] = { waist: r1(94 - i * 0.07 + (rnd() - .5) * .6), hip: r1(102 - i * 0.04), chest: r1(104 - i * 0.02), arm: r1(36 + (rnd() - .5) * .3), bf: r1(22 - i * 0.05) }; }
  S.settings.planStart = addDays(today(), -42); S.checkins = []; S.settings.onboarded = true; save();
};
window.FitScan.seedDemo = seedDemo; window.FitScan.checkinData = checkinData; window.FitScan.scoreFood = scoreFood; window.FitScan.streak = streak;

// ---------- Start ----------
if (!S.settings.onboarded && !S.profile) onboarding(0); else render();
