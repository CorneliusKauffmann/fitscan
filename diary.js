'use strict';
/* FitScan – diary: day summary, meals, water, weight, fasting, quick add, weekly check-in. */
const dayLabel = d => d === today() ? t('Heute') : d === addDays(today(), -1) ? t('Gestern') : d === addDays(today(), 1) ? t('Morgen') : fmtDate(d);
const MACROS = [['p', 'Protein'], ['c', 'Kohlenhydrate'], ['f', 'Fett']];
const entryLabel = e => e.quick ? t('Schnelleintrag') : tFood(e.label || r0(e.g) + ' g');

function renderDiary(v) {
  const d = ui.date, tt = dayTotals(d), g = S.goals, rest = g.kcal - tt.kcal, es = S.entries[d] || [], st = streak();
  $('#pageTitle').textContent = [today(), addDays(today(), -1), addDays(today(), 1)].includes(d) ? dayLabel(d) : t('Tagebuch');
  $('#pageSub').textContent = fmtLong(d);
  if (d !== today()) topAction(t('Heute'), () => { ui.date = today(); render(); });

  const mon = addDays(d, -((new Date(d + 'T12:00:00').getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  let html = `<nav class="week"><button class="wk-nav" id="wkPrev" aria-label="${t('Vorherige Woche')}">${I('chevL')}</button>
    ${week.map(x => `<button class="wd${x === d ? ' on' : ''}${x === today() ? ' today' : ''}" data-day="${x}"><span class="wd-l">${new Date(x + 'T12:00:00').toLocaleDateString(LOC(), { weekday: 'narrow' })}</span><span class="wd-n">${+x.slice(8)}</span><i class="${isLogged(x) ? 'on' : ''}"></i></button>`).join('')}
    <button class="wk-nav" id="wkNext" aria-label="${t('Nächste Woche')}">${I('chevR')}</button></nav>`;

  if (!S.profile) html += `<button class="card banner" id="setupBanner"><span class="banner-ic">${I('target')}</span><span class="grow"><b>${t('Ziele festlegen')}</b><span class="sub">${t('Persönliche Kalorien- und Makroziele in einer Minute')}</span></span>${I('chevR', 'chev')}</button>`;
  else if (d === today() && checkinDue()) html += `<button class="card banner" id="ciBanner"><span class="banner-ic">${I('calendar')}</span><span class="grow"><b>${t('Wöchentlicher Check-in')}</b><span class="sub">${t('Ziele an deinen echten Verbrauch anpassen')}</span></span>${I('chevR', 'chev')}</button>`;

  const mrow = (k, l) => { const over = tt[k] > g[k] * 1.05;
    return `<div class="mrow"><div class="lbl"><span>${t(l)}</span><span class="val${over ? ' over' : ''}"><b>${r0(tt[k])}</b> / ${g[k]} g</span></div><div class="bar"><i style="width:${Math.min(100, g[k] ? tt[k] / g[k] * 100 : 0)}%;background:var(--${k})"></i></div></div>`; };
  html += `<section class="card summary" id="sum" role="button" tabindex="0">
    <div class="sum-top"><div class="ring">${ring(tt.kcal, g.kcal, 140, 13)}<div class="center"><span class="big">${de(Math.abs(rest))}</span><span class="sub">${rest >= 0 ? t('kcal übrig') : t('kcal drüber')}</span></div></div>
    <div class="macros">${MACROS.map(([k, l]) => mrow(k, l)).join('')}</div></div>
    <div class="sum-foot"><span>${t('{a} von {b} kcal', { a: de(tt.kcal), b: de(g.kcal) })}</span>${st ? `<span class="streak" title="${t('Tage in Folge geloggt')}">${I('flame')}${st}</span>` : ''}<span class="grow"></span><span class="link">${t('Details')}${I('chevR')}</span></div></section>`;

  if (!es.length && isLogged(addDays(d, -1))) html += `<button class="btn secondary block" id="copyDay">${I('undo')}${t('Ganzen Tag von gestern kopieren')}</button>`;

  for (const [id, name] of MEALS) {
    const me = es.filter(e => e.meal === id), kc = me.reduce((a, e) => a + nutr(e.food, e.g).kcal, 0);
    const canCopy = !me.length && (S.entries[addDays(d, -1)] || []).some(e => e.meal === id);
    html += `<section class="card meal"><header class="card-h"><h3>${t(name)}</h3><span class="card-v">${me.length ? de(kc) + ' kcal' : ''}</span></header>
      ${me.length ? `<div class="list">${me.map(entryRow).join('')}</div>` : ''}
      <footer class="meal-f"><button class="link-btn" data-add="${id}">${I('plus')}${t('Hinzufügen')}</button>${canCopy ? `<button class="link-btn quiet" data-copy="${id}">${t('Wie gestern')}</button>` : ''}<span class="grow"></span>
      <button class="icon-plain" data-quick="${id}" aria-label="${t('Schnelleintrag')}" title="${t('Schnelleintrag')}">${I('zap')}</button><button class="icon-plain" data-mscan="${id}" aria-label="${t('Scannen')}" title="${t('Scannen')}">${I('scan')}</button></footer></section>`;
  }

  if (S.settings.showWater) html += waterCard(d);
  const w = S.weights[d], lastW = Object.keys(S.weights).filter(x => x < d).sort().pop();
  html += `<button class="card row-card" id="dWeight"><span class="row-ic">${I('scale')}</span><span class="grow"><span class="nm">${t('Gewicht')}</span><span class="sub">${w ? fmtDate(d) : lastW ? t('Zuletzt {w} kg', { w: de(S.weights[lastW], 1) }) : t('Morgens nüchtern wiegen')}</span></span><span class="row-val${w ? '' : ' acc'}">${w ? de(w, 1) + ' kg' : t('Eintragen')}</span>${I('chevR', 'chev')}</button>`;
  if (S.settings.showFasting || S.fast) html += `<section class="card" id="fastCard">${fastHtml()}</section>`;
  v.innerHTML = html;

  $('#wkPrev').onclick = () => { ui.date = addDays(d, -7); render(); };
  $('#wkNext').onclick = () => { ui.date = addDays(d, 7); render(); };
  $$('[data-day]', v).forEach(b => b.onclick = () => { ui.date = b.dataset.day; render(); });
  if ($('#setupBanner')) $('#setupBanner').onclick = () => onboarding(1);
  if ($('#ciBanner')) $('#ciBanner').onclick = checkinSheet;
  $('#sum').onclick = () => dayDetailSheet(d);
  $('#sum').onkeydown = e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), dayDetailSheet(d));
  if ($('#copyDay')) $('#copyDay').onclick = () => copyEntries(S.entries[addDays(d, -1)], d);
  $$('[data-add]', v).forEach(b => b.onclick = () => go('library', { targetMeal: b.dataset.add, query: '' }));
  $$('[data-copy]', v).forEach(b => b.onclick = () => copyEntries((S.entries[addDays(d, -1)] || []).filter(e => e.meal === b.dataset.copy), d));
  $$('[data-quick]', v).forEach(b => b.onclick = () => quickAddSheet(b.dataset.quick));
  $$('[data-mscan]', v).forEach(b => b.onclick = () => { ui.targetMeal = b.dataset.mscan; openScanner(); });
  $$('[data-eid]', v).forEach(el => el.onclick = () => { const e = es.find(x => x.id === el.dataset.eid); if (!e) return; e.quick ? quickAddSheet(e.meal, e) : foodSheet(e.food, { entry: e, date: d }); });
  $('#dWeight').onclick = () => weightSheet(d);
  if (S.settings.showWater) bindWater(d);
  if ($('#fastCard')) bindFast();
}
function entryRow(e) {
  const n = nutr(e.food, e.g);
  return `<div class="row-item entry" data-eid="${e.id}">${foodIcon(e.food)}<div class="grow"><div class="nm">${esc(e.food.name)}</div><div class="sub">${esc(entryLabel(e))} · P ${r0(n.p)} · ${t('K')} ${r0(n.c)} · F ${r0(n.f)}</div></div><div class="kcal">${de(n.kcal)}</div></div>`;
}
function copyEntries(src, to) {
  if (!src?.length) return;
  const copies = src.map(e => ({ ...e, id: uid() })); (S.entries[to] ||= []).push(...copies); save(); rerender();
  undoable(t('{n} Einträge kopiert', { n: copies.length }), () => { const ids = new Set(copies.map(c => c.id)); S.entries[to] = S.entries[to].filter(x => !ids.has(x.id)); save(); rerender(); });
}
function deleteEntry(date, e) {
  const arr = S.entries[date] || [], i = arr.indexOf(e); if (i < 0) return;
  arr.splice(i, 1); save(); closeSheet(); rerender();
  undoable(t('Eintrag gelöscht'), () => { (S.entries[date] ||= []).splice(i, 0, e); save(); rerender(); });
}

// ---------- Water ----------
function waterCard(d) {
  const ml = S.water[d] || 0, goal = S.settings.waterGoal, gl = S.settings.glass, n = Math.min(30, Math.max(1, Math.ceil(goal / gl))), filled = Math.round(ml / gl);
  return `<section class="card water"><header class="card-h"><h3>${t('Wasser')}</h3><span class="card-v">${de(ml / 1000, 2)} / ${de(goal / 1000, 1)} L</span></header>
    <div class="water-row"><button class="round-btn" id="wMinus" aria-label="− ${gl} ml">${I('minus')}</button>
    <div class="segs">${Array.from({ length: n }, (_, i) => `<button class="${i < filled ? 'on' : ''}" data-gi="${i}" aria-label="${t('Glas')} ${i + 1}"></button>`).join('')}</div>
    <button class="round-btn fill" id="wPlus" aria-label="+ ${gl} ml">${I('plus')}</button></div></section>`;
}
function bindWater(d) {
  const ml = S.water[d] || 0, goal = S.settings.waterGoal, gl = S.settings.glass, filled = Math.round(ml / gl);
  const set = x => { S.water[d] = Math.max(0, x); save(); rerender(); if (S.water[d] >= goal && ml < goal) toast(t('Wasserziel erreicht!')); };
  $('#wPlus').onclick = () => set(ml + gl); $('#wMinus').onclick = () => set(ml - gl);
  $$('[data-gi]').forEach(b => b.onclick = () => { const i = +b.dataset.gi; set(i === filled - 1 ? i * gl : (i + 1) * gl); });
}

// ---------- Fasting ----------
function fastHtml() {
  const f = S.fast, tgt = S.settings.fastTarget, el = f ? (Date.now() - f.start) / 36e5 : 0, left = Math.max(0, Math.ceil((tgt - el) * 60));
  const head = `<header class="card-h"><h3>${t('Intervallfasten')}</h3><select class="mini-select" id="fTgt" aria-label="${t('Fastenziel')}">${[12, 14, 16, 18, 20, 24].map(h => `<option value="${h}" ${h === tgt ? 'selected' : ''}>${h}:${24 - h}</option>`).join('')}</select></header>`;
  if (!f) return `${head}<div class="fast-row"><span class="grow sub">${S.fastLog.length ? t('Letztes Fasten: {h} h', { h: de(S.fastLog.at(-1).h, 1) }) : t('Starte nach deiner letzten Mahlzeit.')}</span><button class="btn sm" id="fStart">${t('Starten')}</button></div>`;
  return `${head}<div class="fast-row"><div class="ring">${ring(el, tgt, 52, 6)}</div><div class="grow"><div class="fast-time">${Math.floor(el)}:${String(Math.floor(el % 1 * 60)).padStart(2, '0')} h</div>
    <div class="sub">${el >= tgt ? t('Ziel erreicht') : t('Noch {h} h {m} min', { h: Math.floor(left / 60), m: left % 60 })} · ${t('seit {t}', { t: new Date(f.start).toLocaleTimeString(LOC(), { hour: '2-digit', minute: '2-digit' }) })}</div></div>
    <button class="btn sm secondary" id="fStop">${t('Beenden')}</button></div>`;
}
function bindFast() {
  $('#fTgt').onchange = e => { S.settings.fastTarget = +e.target.value; save(); refreshFast(); };
  if ($('#fStart')) $('#fStart').onclick = () => { S.fast = { start: Date.now() }; save(); refreshFast(); toast(t('Fasten gestartet')); };
  if ($('#fStop')) $('#fStop').onclick = () => { const f = S.fast; S.fastLog.push({ start: f.start, end: Date.now(), h: (Date.now() - f.start) / 36e5 }); S.fast = null; save(); refreshFast(); toast(t('Fasten beendet · {h} h', { h: de(S.fastLog.at(-1).h, 1) })); };
}
function refreshFast() { const c = $('#fastCard'); if (!c) return; c.innerHTML = fastHtml(); bindFast(); }
setInterval(() => { if (ui.tab === 'diary' && S.fast) refreshFast(); }, 30000);

// ---------- Quick add ----------
function quickAddSheet(meal, entry = null) {
  meal = entry?.meal || meal || ui.targetMeal || mealDefault();
  const n = entry?.food.n || {}, date = ui.date;
  openSheet(`${sheetHead(t(entry ? 'Schnelleintrag bearbeiten' : 'Schnelleintrag'), t('Nur Kalorien oder Makros – z. B. im Restaurant.'))}
    <div class="form">${field('qaN', t('Bezeichnung'), entry?.food.name || '', { ph: t('Schnelleintrag'), mode: 'text' })}
    <div class="grid2">${field('qaK', t('Kalorien'), inputNum(n.kcal), { unit: 'kcal' })}${field('qaP', t('Protein'), inputNum(n.p), { unit: 'g' })}${field('qaC', t('Kohlenhydrate'), inputNum(n.c), { unit: 'g' })}${field('qaF', t('Fett'), inputNum(n.f), { unit: 'g' })}</div>
    <p class="hint" id="qaHint"></p>${mealSeg(meal, 'qaM')}
    <button class="btn block" id="qaSave">${t(entry ? 'Speichern' : 'Hinzufügen')}</button>${entry ? `<button class="btn plain danger-text block" id="qaDel">${t('Eintrag löschen')}</button>` : ''}</div>`, sh => {
    const v = id => num($('#' + id).value, 0, id === 'qaK' ? 20000 : 2000);
    const hint = () => { const k = v('qaP') * 4 + v('qaC') * 4 + v('qaF') * 9; $('#qaHint').textContent = k && !v('qaK') ? t('≈ {k} kcal aus Makros', { k: de(k) }) : ''; };
    $$('#qaK,#qaP,#qaC,#qaF', sh).forEach(i => i.oninput = hint);
    bindSeg(sh, 'qaM', m => meal = m);
    if (!entry) setTimeout(() => $('#qaK')?.focus(), 250);
    $('#qaSave').onclick = () => {
      const p = v('qaP'), c = v('qaC'), f = v('qaF'), kcal = v('qaK') || Math.round(p * 4 + c * 4 + f * 9);
      if (!kcal) return toast(t('Bitte Kalorien oder Makros eingeben'));
      const food = { id: entry?.food.id || 'quick:' + uid(), name: $('#qaN').value.trim() || t('Schnelleintrag'), cat: '', src: 'quick', n: { kcal, p, c, f, fib: 0, sug: 0, salt: 0 } };
      if (entry) { Object.assign(entry, { food, meal }); save(); closeSheet(); rerender(); return toast(t('Gespeichert')); }
      const e = addEntry(food, 100, 'Schnelleintrag', meal, date, { quick: true });
      closeSheet(); ui.targetMeal = null; go('diary');
      undoable(t('{k} kcal hinzugefügt', { k: de(kcal) }), () => deleteSilently(date, e));
    };
    if (entry) $('#qaDel').onclick = () => deleteEntry(date, entry);
  });
}
function deleteSilently(date, e) { S.entries[date] = (S.entries[date] || []).filter(x => x !== e); save(); rerender(); }

// ---------- Weight ----------
function weightSheet(d = today()) {
  if (d > today()) d = today();
  const cur = S.weights[d], prev = Object.keys(S.weights).filter(x => x <= d).sort().pop(), start = cur ?? S.weights[prev] ?? S.profile?.weight ?? 75;
  openSheet(`${sheetHead(t('Gewicht'), fmtLong(d))}
    <div class="stepper"><button class="round-btn" id="wM" aria-label="−0,1">${I('minus')}</button><label class="stepper-val"><input id="wVal" type="text" inputmode="decimal" autocomplete="off" value="${inputNum(start)}"><span>kg</span></label><button class="round-btn" id="wP" aria-label="+0,1">${I('plus')}</button></div>
    <label class="field"><span>${t('Datum')}</span><span class="field-in"><input id="wDate" type="date" value="${d}" max="${today()}"></span></label>
    <button class="btn block" id="wSave">${t('Speichern')}</button>${cur ? `<button class="btn plain danger-text block" id="wDel">${t('Eintrag löschen')}</button>` : ''}`, () => {
    const vi = $('#wVal'), step = x => vi.value = inputNum(Math.max(20, num(vi.value, 0, 400) + x));
    $('#wM').onclick = () => step(-0.1); $('#wP').onclick = () => step(0.1);
    vi.onkeydown = e => e.key === 'Enter' && $('#wSave').click();
    $('#wSave').onclick = () => {
      const w = num(vi.value, 0, 1e4), date = $('#wDate').value || d; if (!(w > 20 && w < 400)) return toast(t('Bitte gültiges Gewicht'));
      S.weights[date] = r1(w);
      if (S.profile && date >= Object.keys(S.weights).sort().at(-1)) S.profile.weight = r1(w);
      save(); closeSheet(); rerender(); toast(t('Gewicht gespeichert'));
    };
    if (cur) $('#wDel').onclick = () => { delete S.weights[d]; save(); closeSheet(); rerender(); undoable(t('Eintrag gelöscht'), () => { S.weights[d] = cur; save(); rerender(); }); };
  });
}

// ---------- Weekly check-in ----------
function checkinSheet() {
  const c = checkinData(); if (!c) return onboarding(1);
  const diff = c.kcal - c.old.kcal;
  openSheet(`${sheetHead(t('Wöchentlicher Check-in'), c.source === 'data' ? t('Berechnet aus {n} geloggten Tagen und deinem Trendgewicht der letzten {d} Tage.', { n: c.est.logged, d: c.est.N }) : t('Noch zu wenig Daten – Schätzung per Formel. Logge weiter Essen und Gewicht, dann wird es genauer.'))}
    <div class="card compare"><div><span class="sub">${t('Bisher')}</span><b>${de(c.old.kcal)}</b></div><span class="mut">${I('arrowR')}</span><div><span class="sub">${t('Neu')}</span><b class="acc">${de(c.kcal)}</b></div></div>
    <p class="hint center">${diff === 0 ? t('Keine Änderung nötig') : t('{d} kcal pro Tag', { d: signed(diff) })} · P ${c.macros.p} g · ${t('K')} ${c.macros.c} g · F ${c.macros.f} g</p>
    <div class="card"><div class="grid2">${stat(t('Verbrauch'), de(c.tdee), 'kcal')}${stat(t('Trend pro Woche'), c.rate == null ? '–' : signed(c.rate, 2), c.rate == null ? '' : 'kg')}</div></div>
    <div class="stack"><button class="btn block" id="ciOk">${t('Neue Ziele übernehmen')}</button><button class="btn block secondary" id="ciKeep">${t('Ziele beibehalten')}</button></div>
    ${S.checkins.length ? `<div class="sec"><h4>${t('Letzte Check-ins')}</h4></div><div class="card list">${S.checkins.slice(-5).reverse().map(x => `<div class="row-item"><span class="grow">${fmtDate(x.date)}</span><span class="sub">${t('Verbrauch')} ${de(x.tdee)}</span><b class="row-val">${de(x.kcal)} kcal</b></div>`).join('')}</div>` : ''}`, () => {
    const rec = accepted => { S.checkins.push({ date: today(), tdee: c.tdee, kcal: accepted ? c.kcal : c.old.kcal, src: c.source }); save(); };
    $('#ciOk').onclick = () => { S.goals = { ...c.macros, manual: false }; rec(true); closeSheet(); rerender(); toast(t('Ziele aktualisiert')); };
    $('#ciKeep').onclick = () => { rec(false); closeSheet(); rerender(); };
  });
}

// ---------- Day details ----------
function dayDetailSheet(d) {
  const tt = dayTotals(d), mic = {}, cover = {}, es = S.entries[d] || [], g = S.goals;
  for (const e of es) { const m = e.food.micro; if (!m) continue; for (const k in m) { mic[k] = (mic[k] || 0) + m[k] * e.g / 100; cover[k] = (cover[k] || 0) + 1; } }
  const kc = { p: tt.p * 4, c: tt.c * 4, f: tt.f * 9 }, tot = kc.p + kc.c + kc.f || 1;
  const row = (l, v, goal) => `<div class="row-item"><span class="grow">${l}</span><span class="row-val"><b>${v}</b>${goal ? `<span class="sub"> / ${goal}</span>` : ''}</span></div>`;
  openSheet(`${sheetHead(t('Tagesdetails'), fmtLong(d))}
    <div class="sec"><h4>${t('Makroverteilung')}</h4><span>${t('Anteil an Kalorien')}</span></div>
    <div class="card"><div class="macrobar">${MACROS.map(([k]) => `<i style="width:${kc[k] / tot * 100}%;background:var(--${k})"></i>`).join('')}</div>
    <div class="legend">${MACROS.map(([k, l]) => `<span><i class="dot" style="background:var(--${k})"></i>${t(l)} <b>${r0(kc[k] / tot * 100)} %</b></span>`).join('')}</div></div>
    <div class="sec"><h4>${t('Nährwerte')}</h4></div>
    <div class="card list">${row(t('Energie'), de(tt.kcal) + ' kcal', de(g.kcal) + ' kcal')}${row(t('Protein'), r0(tt.p) + ' g', g.p + ' g')}${row(t('Kohlenhydrate'), r0(tt.c) + ' g', g.c + ' g')}${row(t('davon Zucker'), r0(tt.sug) + ' g', '< 50 g')}${row(t('Fett'), r0(tt.f) + ' g', g.f + ' g')}${row(t('Ballaststoffe'), r0(tt.fib) + ' g', '≥ 30 g')}${row(t('Salz'), de(tt.salt, 1) + ' g', '< 6 g')}</div>
    <div class="sec"><h4>${t('Mikronährstoffe')}</h4></div>
    ${Object.keys(mic).length ? `<div class="card list">${MICROS.filter(m => mic[m[0]]).map(([k, l, u, f]) => `<div class="row-item"><span class="grow">${t(l)}</span><span class="sub">${t('{a} von {b} Einträgen', { a: cover[k], b: es.length })}</span><b class="row-val">${de(mic[k] * f, u === 'g' ? 1 : 0)} ${u}</b></div>`).join('')}</div>
      <p class="hint">${t('Nur aus Produkten mit Angaben von Open Food Facts.')}</p>` : `<p class="hint">${t('Keine Mikronährstoff-Daten für diesen Tag. Gescannte Produkte liefern oft Werte wie Natrium, Calcium oder Vitamine.')}</p>`}`);
}
