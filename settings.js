'use strict';
/* FitScan – profile & settings, onboarding, data import/export, startup. */
const goalName = g => t(GOALS.find(x => x[0] === g)?.[1] || '');
const actName = a => t(ACT.find(x => x[0] === +a)?.[1] || '');
const profileSummary = p => [t(p.sex === 'm' ? 'Männlich' : 'Weiblich'), t('{n} Jahre', { n: p.age }), `${p.height} cm`, goalName(p.goal)].join(' · ');
const switchRow = (id, title, on, sub = '') => `<label class="row-item"><span class="grow"><span class="nm">${title}</span>${sub ? `<span class="sub">${sub}</span>` : ''}</span><input type="checkbox" class="switch" id="${id}" ${on ? 'checked' : ''}></label>`;
const inputRow = (id, title, val, unit) => `<label class="row-item"><span class="grow nm">${title}</span><span class="inline-in"><input id="${id}" type="text" inputmode="numeric" autocomplete="off" value="${val}"><em>${unit}</em></span></label>`;

function renderProfile(v) {
  const p = S.profile, g = S.goals, st = S.settings, lc = S.checkins.at(-1);
  v.innerHTML = `
  <section class="card plan-card"><span class="sub">${t('Dein Tagesziel')}</span><div class="plan-k"><b>${de(g.kcal)}</b> kcal</div>
    <div class="legend">${MACROS.map(([k, l]) => `<span><i class="dot" style="background:var(--${k})"></i>${t(l)} <b>${g[k]} g</b></span>`).join('')}</div>
    ${p ? `<span class="sub">${goalName(p.goal)}${p.goal !== 'maintain' ? ' · ' + t('{r} kg pro Woche', { r: de(p.rate, 2) }) : ''}${g.manual ? ' · ' + t('manuell angepasst') : ''}</span>` : ''}</section>

  <div class="sec"><h4>${t('Ziele')}</h4></div>
  <div class="card list">${navRow('pProfile', 'user', t('Profil & Ziel'), p ? profileSummary(p) : t('Noch nicht eingerichtet'))}
    ${navRow('pGoals', 'target', t('Tagesziele anpassen'), t('Kalorien und Makros manuell festlegen'))}
    ${navRow('pCheckin', 'calendar', t('Wöchentlicher Check-in'), checkinDue() ? t('Fällig') : lc ? t('Zuletzt {d}', { d: fmtDate(lc.date) }) : t('Ziel an echten Verbrauch anpassen'))}</div>

  <div class="sec"><h4>${t('Tagebuch')}</h4></div>
  <div class="card list">${switchRow('sWater', t('Wasser-Tracker'), st.showWater)}${inputRow('sWG', t('Wasserziel'), st.waterGoal, 'ml')}${inputRow('sGl', t('Glasgröße'), st.glass, 'ml')}
    ${switchRow('sFast', t('Intervallfasten'), st.showFasting, t('Fasten-Timer im Tagebuch anzeigen'))}</div>

  <div class="sec"><h4>${t('Scanner')}</h4></div>
  <div class="card list">${switchRow('sBeep', t('Ton beim Scannen'), st.beep)}${switchRow('sCont', t('Serienscan'), st.continuousScan, t('Produkte direkt hinzufügen, Kamera bleibt offen'))}</div>

  <div class="sec"><h4>${t('Darstellung')}</h4></div>
  <div class="card list"><div class="row-item"><span class="grow nm">${t('Design')}</span>${seg('sTheme', [['light', t('Hell')], ['dark', t('Dunkel')], ['system', t('Auto')]], st.theme, 'sm')}</div>
    <div class="row-item"><span class="grow nm">${t('Sprache')}</span>${seg('sLang', [['de', 'Deutsch'], ['en', 'English']], LANG, 'sm')}</div></div>

  <div class="sec"><h4>${t('Daten')}</h4></div>
  <div class="card list">${navRow('exJson', 'download', t('Backup exportieren'), t('Alle Daten als JSON-Datei'))}
    <label class="row-item nav"><span class="row-ic">${I('upload')}</span><span class="grow"><span class="nm">${t('Backup importieren')}</span><span class="sub">${t('Ersetzt die aktuellen Daten')}</span></span>${I('chevR', 'chev')}<input type="file" id="imJson" accept=".json,application/json" hidden></label>
    ${navRow('exCsv', 'file', t('Tagebuch als CSV'))}${navRow('exCsvW', 'file', t('Körperdaten als CSV'), t('Gewicht, Wasser und Maße'))}
    ${navRow('demo', 'flask', t('Demo-Daten laden'), t('Sechs Wochen Beispieldaten'))}${navRow('sOnb', 'compass', t('Einrichtung erneut starten'))}</div>
  <div class="card list"><button class="row-item danger-row" id="wipe">${t('Alle Daten löschen')}</button></div>
  <p class="foot">${t('Alles bleibt auf diesem Gerät – kein Konto, keine Cloud, keine Paywall.')}<br>${t('{p} Produkte offline · {b} Basis-Lebensmittel', { p: Object.keys(S.products).length, b: BASE_FOODS.length })} · <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a></p>`;

  $('#pProfile').onclick = () => S.profile ? profileSheet() : onboarding(1);
  $('#pGoals').onclick = goalsSheet;
  $('#pCheckin').onclick = checkinSheet;
  const sv = () => {
    st.showWater = $('#sWater').checked; st.showFasting = $('#sFast').checked; st.beep = $('#sBeep').checked; st.continuousScan = $('#sCont').checked;
    st.waterGoal = Math.min(10000, Math.max(500, num($('#sWG').value, 0, 1e4) || 2500)); st.glass = Math.min(2000, Math.max(50, num($('#sGl').value, 0, 1e4) || 250));
    $('#sWG').value = st.waterGoal; $('#sGl').value = st.glass; save();
  };
  $$('#sWater,#sFast,#sBeep,#sCont,#sWG,#sGl', v).forEach(i => i.onchange = sv);
  bindSeg(v, 'sTheme', th => { st.theme = th; save(); applyTheme(); });
  bindSeg(v, 'sLang', l => { setLang(l); save(); rerender(); });
  $('#exJson').onclick = () => download(`fitscan-backup-${today()}.json`, JSON.stringify({ app: 'fitscan', version: 3, exported: new Date().toISOString(), data: S }, null, 1), 'application/json');
  $('#exCsv').onclick = () => {
    const rows = [['Datum', 'Mahlzeit', 'Lebensmittel', 'Marke', 'Menge (g)', 'kcal', 'Protein (g)', 'Kohlenhydrate (g)', 'Fett (g)', 'Zucker (g)', 'Ballaststoffe (g)', 'Salz (g)'].map(x => t(x))];
    for (const d of Object.keys(S.entries).sort()) for (const e of S.entries[d]) { const n = nutr(e.food, e.g); rows.push([d, mealName(e.meal), e.food.name, e.food.brand, r1(e.g), r0(n.kcal), r1(n.p), r1(n.c), r1(n.f), r1(n.sug), r1(n.fib), r1(n.salt)]); }
    download(`fitscan-diary-${today()}.csv`, csv(rows), 'text/csv');
  };
  $('#exCsvW').onclick = () => {
    const ws = weightSeries(), ds = [...new Set([...Object.keys(S.weights), ...Object.keys(S.measures), ...Object.keys(S.water)])].sort();
    download(`fitscan-body-${today()}.csv`, csv([[t('Datum'), t('Gewicht (kg)'), t('Trend (kg)'), t('Wasser (ml)'), ...MEAS.map(m => `${t(m[1])} (${measUnit(m[0])})`)],
      ...ds.map(d => [d, S.weights[d] ?? '', S.weights[d] != null ? r1(trendAt(ws, d)) : '', S.water[d] ?? '', ...MEAS.map(m => S.measures[d]?.[m[0]] ?? '')])]), 'text/csv');
  };
  $('#imJson').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    let data; try { const j = JSON.parse(await f.text()); data = j.data || j; if (!data.entries || !data.goals) throw 0; } catch { return toast(t('Ungültige Backup-Datei')); }
    if (!await confirmSheet({ title: t('Backup importieren?'), text: t('Deine aktuellen Daten werden durch das Backup ersetzt.'), ok: t('Importieren') })) return;
    const keepLang = S.settings.lang; S = sanitize(data); S.settings.lang ||= keepLang; save(); setLang(S.settings.lang || LANG); applyTheme(); rerender(); toast(t('Backup importiert'));
  };
  $('#demo').onclick = async () => {
    if (Object.keys(S.entries).length && !await confirmSheet({ title: t('Demo-Daten laden?'), text: t('Die letzten sechs Wochen im Tagebuch werden mit Beispieldaten überschrieben.'), ok: t('Laden') })) return;
    seedDemo(); toast(t('Demo-Daten geladen')); go('progress');
  };
  $('#sOnb').onclick = () => onboarding(0, S.profile ? { ...S.profile } : null);
  $('#wipe').onclick = async () => {
    if (!await confirmSheet({ title: t('Alle Daten löschen?'), text: t('Tagebuch, Gewicht, eigene Lebensmittel und Einstellungen werden von diesem Gerät entfernt. Das kann nicht rückgängig gemacht werden.'), ok: t('Alle Daten löschen'), danger: true })) return;
    const { theme, lang } = S.settings; S = sanitize({}); Object.assign(S.settings, { theme, lang }); save(); ui.date = today(); render(); toast(t('Alle Daten gelöscht'));
  };
}

// ---------- Profile & goals sheets ----------
function profileForm(p) {
  return `${seg('pSex', [['m', t('Männlich')], ['f', t('Weiblich')]], p.sex)}
    <div class="grid3">${field('pAge', t('Alter'), p.age, { unit: t('J.') })}${field('pH', t('Größe'), p.height, { unit: 'cm' })}${field('pWt', t('Gewicht'), inputNum(p.weight), { unit: 'kg' })}</div>`;
}
const readProfileForm = (root, p) => Object.assign(p, { sex: segVal(root, 'pSex') || p.sex, age: num($('#pAge', root).value, 14, 100) || 30, height: num($('#pH', root).value, 120, 230) || 175, weight: num($('#pWt', root).value, 30, 300) || 75 });
const validProfile = p => p.age > 10 && p.age < 110 && p.height > 100 && p.weight > 30;
function profileSheet() {
  const p = { ...S.profile };
  openSheet(`${sheetHead(t('Profil & Ziel'))}<div class="form">${profileForm(p)}
    <label class="field"><span>${t('Aktivität')}</span><span class="field-in"><select id="pAct">${ACT.map(a => `<option value="${a[0]}" ${+p.activity === a[0] ? 'selected' : ''}>${t(a[1])} – ${t(a[2])}</option>`).join('')}</select></span></label>
    ${seg('pGoal', GOALS.map(([k, l]) => [k, t(l)]), p.goal)}
    <div id="pRateBox"><div class="range-l"><span>${t('Tempo')}</span><b id="pRateL"></b></div><input id="pRate" type="range" min="0.1" max="1" step="0.05" value="${p.rate}"></div>
    <div class="card plan-mini" id="pCalc"></div>
    <button class="btn block" id="pSave">${t('Ziele berechnen & übernehmen')}</button></div>`, sh => {
    const upd = () => { readProfileForm(sh, p); p.activity = +$('#pAct').value; p.goal = segVal(sh, 'pGoal'); p.rate = +$('#pRate').value; const c = computeGoals(p);
      $('#pRateBox').classList.toggle('hidden', p.goal === 'maintain'); $('#pRateL').textContent = t('{r} kg pro Woche', { r: de(p.rate, 2) });
      $('#pCalc').innerHTML = `<div class="plan-k"><b>${de(c.kcal)}</b> kcal</div><div class="legend">${MACROS.map(([k, l]) => `<span><i class="dot" style="background:var(--${k})"></i>${t(l)} <b>${c[k]} g</b></span>`).join('')}</div><span class="sub">${t('Grundumsatz {b} kcal · Gesamtumsatz ≈ {t} kcal', { b: de(c.bmr), t: de(c.tdee) })}</span>`; };
    $$('input,select', sh).forEach(i => i.oninput = upd); bindSeg(sh, 'pSex', upd); bindSeg(sh, 'pGoal', upd); upd();
    $('#pSave').onclick = () => { upd(); if (!validProfile(p)) return toast(t('Bitte Werte prüfen'));
      S.profile = { ...p }; const c = computeGoals(p); S.goals = { kcal: c.kcal, p: c.p, c: c.c, f: c.f, manual: false };
      if (!S.weights[today()]) S.weights[today()] = r1(p.weight); save(); closeSheet(); rerender(); toast(t('Ziele übernommen')); };
  });
}
function goalsSheet() {
  const g = S.goals;
  openSheet(`${sheetHead(t('Tagesziele'), t('Überschreibt die berechneten Ziele bis zum nächsten Check-in.'))}<div class="form">
    <div class="grid2">${field('gK', t('Kalorien'), g.kcal, { unit: 'kcal' })}${field('gP', t('Protein'), g.p, { unit: 'g' })}${field('gC', t('Kohlenhydrate'), g.c, { unit: 'g' })}${field('gF', t('Fett'), g.f, { unit: 'g' })}</div>
    <p class="hint" id="gSum"></p><button class="btn block" id="gSave">${t('Speichern')}</button></div>`, sh => {
    const gs = () => { const k = num($('#gP').value) * 4 + num($('#gC').value) * 4 + num($('#gF').value) * 9, goal = num($('#gK').value);
      $('#gSum').textContent = t('Makros ergeben {a} kcal (Ziel {b} kcal)', { a: de(k), b: de(goal) }); $('#gSum').classList.toggle('warn', Math.abs(k - goal) > goal * 0.05); };
    $$('input', sh).forEach(i => i.oninput = gs); gs();
    $('#gSave').onclick = () => { const k = num($('#gK').value, 0, 10000); if (k < 800) return toast(t('Bitte mindestens 800 kcal'));
      S.goals = { kcal: Math.round(k), p: Math.round(num($('#gP').value, 0, 1000)), c: Math.round(num($('#gC').value, 0, 1500)), f: Math.round(num($('#gF').value, 0, 1000)), manual: true };
      save(); closeSheet(); rerender(); toast(t('Gespeichert')); };
  });
}

// ---------- Onboarding ----------
function onboarding(step = 0, d = null) {
  d ||= { sex: 'm', age: 30, height: 178, weight: 80, activity: 1.375, goal: 'lose', rate: 0.5 };
  const el = $('#onb') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'onb', className: 'onb' }));
  const steps = 4, opt = (v, title, sub, on) => `<button class="row-item opt${on ? ' on' : ''}" data-v="${v}"><span class="grow"><span class="nm">${title}</span>${sub ? `<span class="sub">${sub}</span>` : ''}</span><span class="ck${on ? ' on' : ''}">${I('check')}</span></button>`;
  let body = '', next = t('Weiter');
  if (step === 0) { body = `<div class="onb-hero"><img src="icons/icon-192.png" alt=""><h1>FitScan</h1><p class="lead">${t('Kalorien und Makros tracken. Unbegrenzt scannen, ohne Konto – deine Daten bleiben auf deinem Gerät.')}</p>${seg('oLang', [['de', 'Deutsch'], ['en', 'English']], LANG, 'sm')}</div>`; next = t("Los geht's"); }
  if (step === 1) body = `<h1>${t('Was ist dein Ziel?')}</h1><div class="card list">${GOALS.map(([k, l, s]) => opt(k, t(l), t(s), d.goal === k)).join('')}</div>`;
  if (step === 2) body = `<h1>${t('Über dich')}</h1><p class="lead">${t('Für die erste Schätzung deines Verbrauchs. Danach lernt FitScan aus deinen echten Daten.')}</p><div class="form">${profileForm(d)}</div>`;
  if (step === 3) body = `<h1>${t('Wie aktiv bist du?')}</h1><div class="card list">${ACT.map(([k, l, s]) => opt(k, t(l), t(s), +d.activity === k)).join('')}</div>`;
  if (step === 4) { const c = computeGoals(d); next = t('Plan übernehmen');
    body = `<h1>${t('Dein Plan')}</h1><div class="card plan-mini center"><div class="plan-k big"><b id="oK">${de(c.kcal)}</b> kcal</div><span class="sub">${t('pro Tag')}</span><div class="legend center" id="oM"></div></div>
      ${d.goal !== 'maintain' ? `<div class="range-l"><span>${t('Tempo')}</span><b id="oRL"></b></div><input id="oRate" type="range" min="0.1" max="1" step="0.05" value="${d.rate}">` : ''}
      <p class="hint" id="oInfo"></p>`; }
  el.innerHTML = `<div class="onb-top">${step > 0 ? `<button class="icon-plain" id="oB" aria-label="${t('Zurück')}">${I('chevL')}</button>` : '<span></span>'}${step > 0 ? `<div class="progress"><i style="width:${step / steps * 100}%"></i></div>` : '<span class="grow"></span>'}<button class="top-btn" id="oSkip">${t('Überspringen')}</button></div>
    <div class="onb-body">${body}</div><div class="onb-foot"><button class="btn block" id="oN">${next}</button></div>`;
  const q = s => $(s, el);
  const read = () => { if (q('#pAge')) readProfileForm(el, d); };
  const plan = () => { const c = computeGoals(d); q('#oK').textContent = de(c.kcal);
    q('#oM').innerHTML = MACROS.map(([k, l]) => `<span><i class="dot" style="background:var(--${k})"></i>${t(l)} <b>${c[k]} g</b></span>`).join('');
    if (q('#oRL')) q('#oRL').textContent = t('{r} kg pro Woche', { r: de(d.rate, 2) });
    q('#oInfo').textContent = t('Geschätzter Verbrauch ≈ {t} kcal. Der wöchentliche Check-in passt dein Ziel an deinen gemessenen Verbrauch an.', { t: de(c.tdee) }); };
  $$('.opt', el).forEach(b => b.onclick = () => { $$('.opt', el).forEach(x => { x.classList.toggle('on', x === b); x.querySelector('.ck').classList.toggle('on', x === b); }); if (step === 1) d.goal = b.dataset.v; else d.activity = +b.dataset.v; });
  bindSeg(el, 'oLang', l => { setLang(l); save(); render(); onboarding(0, d); });
  bindSeg(el, 'pSex', () => {});
  if (step === 4) { plan(); if (q('#oRate')) q('#oRate').oninput = e => { d.rate = +e.target.value; plan(); }; }
  if (q('#oB')) q('#oB').onclick = () => { read(); onboarding(step - 1, d); };
  q('#oSkip').onclick = () => { S.settings.onboarded = true; save(); el.remove(); render(); };
  q('#oN').onclick = () => {
    read();
    if (step === 2 && !validProfile(d)) return toast(t('Bitte Werte prüfen'));
    if (step < steps) return onboarding(step + 1, d);
    S.profile = { sex: d.sex, age: d.age, height: d.height, weight: d.weight, activity: d.activity, goal: d.goal, rate: d.rate };
    const c = computeGoals(S.profile); S.goals = { kcal: c.kcal, p: c.p, c: c.c, f: c.f, manual: false };
    S.weights[today()] ??= r1(d.weight); S.settings.onboarded = true; S.settings.planStart ||= today(); save();
    el.classList.add('out'); setTimeout(() => el.remove(), 250); go('diary'); toast(t('Plan übernommen – viel Erfolg!'));
  };
}

// ---------- Startup ----------
function setLang(l) { S.settings.lang = l; applyLang(l); }
setLang(S.settings.lang || (/^de\b/i.test(navigator.language || '') ? 'de' : 'en'));
applyTheme();
render();
if (!S.settings.onboarded && !S.profile) onboarding(0);
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.FitScan = { lookupBarcode, searchOFF, dayTotals, estimateTDEE, weightSeries, decodeImageFile, seedDemo, checkinData, scoreFood, streak, get state() { return S; } };
