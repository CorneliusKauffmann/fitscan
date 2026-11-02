'use strict';
/* FitScan – progress: weight trend, charts, weekly insights, expenditure, body measurements. */
const MEAS = [['waist', 'Taille'], ['hip', 'Hüfte'], ['chest', 'Brust'], ['arm', 'Oberarm'], ['thigh', 'Oberschenkel'], ['neck', 'Hals'], ['bf', 'Körperfett']];
const measUnit = k => k === 'bf' ? '%' : 'cm';
const METRICS = [['weight', 'Gewicht'], ['kcal', 'Kalorien'], ['macros', 'Makros'], ['protein', 'Protein'], ['weekly', 'Wochenschnitt'], ['tdee', 'Verbrauch'], ['meas', 'Körpermaße'], ['water', 'Wasser']];
const RANGES = [[7, '7T'], [30, '30T'], [90, '90T'], [365, '1J'], [0, 'Alles']];
let chartObj = null;
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

function renderProgress(v) {
  const ws = weightSeries(), last = ws.at(-1), rate = weeklyRate(ws), est = estimateTDEE(), lastW = Object.keys(S.weights).sort().pop();
  const { cur, prev } = insights(), due = checkinDue(), lc = S.checkins.at(-1), dk = cur.kcal - prev.kcal;
  const md = Object.keys(S.measures).sort(), lastM = md.length ? S.measures[md.at(-1)] : {}, firstM = md.length ? S.measures[md[0]] : {};
  topAction(t('Wiegen'), () => weightSheet());
  v.innerHTML = `
  <button class="card banner" id="ciOpen"><span class="banner-ic">${I('calendar')}</span><span class="grow"><b>${t('Wöchentlicher Check-in')}</b>
    <span class="sub">${due ? t('Ziele an deinen echten Verbrauch anpassen') : lc ? t('Zuletzt {d} · {k} kcal', { d: fmtDate(lc.date), k: de(lc.kcal) }) : t('Passt dein Kalorienziel jede Woche an')}</span></span>${due ? `<span class="badge">${t('Fällig')}</span>` : ''}${I('chevR', 'chev')}</button>
  <section class="card"><div class="grid3">${stat(t('Trendgewicht'), last?.t ? de(last.t, 1) : '–', 'kg')}${stat(t('Waage'), lastW ? de(S.weights[lastW], 1) : '–', 'kg')}${stat(t('Pro Woche'), rate == null ? '–' : signed(rate, 2), rate == null ? '' : 'kg')}</div></section>
  <section class="card chart-card">
    <div class="chips" id="cMetric">${METRICS.map(([k, l]) => `<button class="chip${ui.chart.metric === k ? ' on' : ''}" data-cm="${k}">${t(l)}</button>`).join('')}</div>
    ${seg('cRange', RANGES.map(([k, l]) => [k, t(l)]), ui.chart.range, 'sm')}
    <div class="chartbox"><canvas id="chart" role="img"></canvas></div>
    <div class="chart-foot"><p class="hint" id="cInfo"></p><div class="chart-opts" id="cOpts"></div></div></section>

  <div class="sec"><h4>${t('Diese Woche')}</h4><span>${t('{n} von 7 Tagen geloggt', { n: cur.n })}</span></div>
  <section class="card"><div class="grid2 gap">
    ${stat(t('Ø Kalorien'), cur.n ? de(cur.kcal) : '–', cur.n ? 'kcal' : '', prev.n && cur.n ? t('{d} vs. Vorwoche', { d: signed(dk) }) : '')}
    ${stat(t('Ø Protein'), cur.n ? r0(cur.p) : '–', cur.n ? 'g' : '', t('Ziel {g} g', { g: S.goals.p }))}
    ${stat(t('Im Zielbereich'), `${cur.adh}/${cur.n}`, '', t('Tage ±10 % vom Kalorienziel'))}
    ${stat(t('Proteinziel erreicht'), `${cur.ph}/${cur.n}`, '', t('Tage · Serie {s}', { s: streak() }))}</div></section>

  <div class="sec"><h4>${t('Energieverbrauch')}</h4><span>${t('adaptiv')}</span></div>
  <section class="card">${est ? `${stat(t('Geschätzter Verbrauch (letzte {n} Tage)', { n: est.N }), de(est.tdee), 'kcal')}
    <p class="hint">${t('Ø Aufnahme {i} kcal · Trend {c} kg · {n} Tage geloggt. Berechnet aus Aufnahme und Veränderung des Trendgewichts (7.700 kcal ≈ 1 kg).', { i: de(est.avgIn), c: signed(est.change, 2), n: est.logged })}</p>`
    : `<p class="hint flush">${t('Logge etwa zwei Wochen lang Essen und wiege dich regelmäßig. Dann berechnet FitScan deinen tatsächlichen Verbrauch – genauer als jede Formel.')}</p>`}</section>

  <div class="sec"><h4>${t('Körpermaße')}</h4><button class="link-btn" id="mAdd">${I('plus')}${t('Messen')}</button></div>
  <section class="card">${md.length ? `<div class="grid3 gap">${MEAS.filter(([k]) => lastM[k] != null).map(([k, l]) => { const dlt = firstM[k] != null && md.length > 1 ? lastM[k] - firstM[k] : null;
      return stat(t(l), de(lastM[k], 1), measUnit(k), dlt == null ? '' : signed(dlt, 1)); }).join('')}</div><p class="hint">${t('Zuletzt {a} · Veränderung seit {b}', { a: fmtDate(md.at(-1)), b: fmtDate(md[0]) })}</p>`
    : `<p class="hint flush">${t('Taille, Hüfte, Brust & Co. zeigen Fortschritt, den die Waage nicht sieht.')}</p>`}</section>

  <div class="sec"><h4>${t('Wiegungen')}</h4></div>
  <section class="card list">${Object.keys(S.weights).sort().reverse().slice(0, 10).map(d => `<button class="row-item" data-wd="${d}"><span class="grow">${fmtDate(d)}</span><span class="sub">${t('Trend')} ${de(trendAt(ws, d), 1)}</span><b class="row-val">${de(S.weights[d], 1)} kg</b></button>`).join('') || `<p class="hint pad">${t('Noch keine Einträge')}</p>`}</section>`;

  $('#ciOpen').onclick = checkinSheet;
  $('#mAdd').onclick = () => measureSheet();
  $$('[data-cm]', v).forEach(b => b.onclick = () => { ui.chart.metric = b.dataset.cm; $$('[data-cm]', v).forEach(x => x.classList.toggle('on', x === b)); drawChart(); });
  bindSeg(v, 'cRange', r => { ui.chart.range = +r; drawChart(); });
  $$('[data-wd]', v).forEach(el => el.onclick = () => weightSheet(el.dataset.wd));
  drawChart();
}

function chartOptions() {
  const C = ui.chart, el = $('#cOpts'); if (!el) return;
  const sel = (id, opts, val) => `<select class="mini-select" id="${id}">${opts.map(([k, l]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${t(l)}</option>`).join('')}</select>`;
  let html = '';
  if (['weight', 'kcal', 'protein'].includes(C.metric)) html = sel('cType', [['line', 'Linie'], ['bar', 'Balken']], C.type) + sel('cSmooth', [['ema', 'Trend'], ['ma7', '7-Tage-Mittel'], ['none', 'Keine Glättung']], C.smooth);
  if (C.metric === 'meas') { const avail = MEAS.filter(([k]) => Object.values(S.measures).some(m => m[k] != null)); if (avail.length && !avail.some(m => m[0] === C.meas)) C.meas = avail[0][0]; html = avail.length ? sel('cMeas', avail, C.meas) : ''; }
  el.innerHTML = html;
  if ($('#cType')) $('#cType').onchange = e => { C.type = e.target.value; drawChart(); };
  if ($('#cSmooth')) $('#cSmooth').onchange = e => { C.smooth = e.target.value; drawChart(); };
  if ($('#cMeas')) $('#cMeas').onchange = e => { C.meas = e.target.value; drawChart(); };
}
function smoothArr(arr, mode) {
  if (mode === 'ma7') return arr.map((_, i) => avg(arr.slice(Math.max(0, i - 6), i + 1).filter(x => x != null)));
  if (mode === 'ema') { let tr = null; return arr.map(x => { if (x != null) tr = tr == null ? x : tr + 0.15 * (x - tr); return tr; }); }
  return arr;
}
function drawChart() {
  const C = ui.chart, cv = $('#chart'); if (!cv) return; chartObj?.destroy(); chartOptions();
  const all = [...Object.keys(S.weights), ...Object.keys(S.entries).filter(isLogged), ...Object.keys(S.water), ...Object.keys(S.measures)].sort();
  const end = today(); let start = C.range ? addDays(end, -C.range + 1) : (all[0] || addDays(end, -29));
  if (start > end) start = addDays(end, -29);
  const days = []; for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  const col = { mut: css('--mut'), mut2: css('--mut2'), line: css('--line'), ink: css('--txt'), acc: css('--acc'), p: css('--p'), c: css('--c'), f: css('--f'), surf: css('--fill'), bg: css('--bg') };
  const fade = c => { const g = cv.getContext('2d').createLinearGradient(0, 0, 0, 240); g.addColorStop(0, c + '30'); g.addColorStop(1, c + '00'); return g; };
  const goalLine = (val, label = 'Ziel') => ({ type: 'line', label: t(label), data: days.map(() => val), borderColor: col.mut2, borderDash: [4, 4], borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 0 });
  const tot = {}; const totals = d => tot[d] ||= dayTotals(d);
  let datasets = [], labels = days.map(fmtShort), info = '', stacked = false, unit = '', dec = 0;
  if (C.metric === 'weight') {
    const ws = weightSeries(), raw = days.map(d => S.weights[d] ?? null), trend = C.smooth === 'ema' ? days.map(d => trendAt(ws, d)) : smoothArr(raw, C.smooth);
    datasets = [C.type === 'bar' ? { type: 'bar', label: t('Waage'), data: raw, backgroundColor: col.mut2, borderRadius: 4, maxBarThickness: 18 }
      : { type: 'line', label: t('Waage'), data: raw, borderColor: col.mut2, backgroundColor: col.mut2, showLine: false, pointRadius: 3, pointHoverRadius: 5, spanGaps: true }];
    if (C.smooth !== 'none') datasets.push({ type: 'line', label: t(C.smooth === 'ema' ? 'Trendgewicht' : '7-Tage-Mittel'), data: trend, borderColor: col.acc, backgroundColor: fade(col.acc), fill: true, borderWidth: 2, pointRadius: 0, tension: .35, spanGaps: true });
    const vals = raw.filter(x => x != null); unit = 'kg'; dec = 1;
    info = vals.length ? t('Min {a} · Max {b} kg · {n} Wiegungen', { a: de(Math.min(...vals), 1), b: de(Math.max(...vals), 1), n: vals.length }) : t('Noch keine Gewichtsdaten in diesem Zeitraum.');
  } else if (C.metric === 'kcal' || C.metric === 'protein') {
    const k = C.metric === 'kcal' ? 'kcal' : 'p', c = k === 'kcal' ? col.acc : col.p, raw = days.map(d => isLogged(d) ? r0(totals(d)[k]) : null);
    datasets = [{ type: C.type, label: t(k === 'kcal' ? 'Kalorien' : 'Protein'), data: raw, borderColor: c, backgroundColor: C.type === 'bar' ? c : fade(c), fill: C.type === 'line', borderWidth: 2, borderRadius: 4, maxBarThickness: 18, tension: .3, pointRadius: 0, pointHoverRadius: 4, spanGaps: true }, goalLine(S.goals[k])];
    if (C.smooth !== 'none') datasets.push({ type: 'line', label: t('Geglättet'), data: smoothArr(raw, C.smooth), borderColor: col.ink, borderWidth: 1.5, pointRadius: 0, tension: .4, spanGaps: true });
    const vals = raw.filter(x => x != null); unit = k === 'kcal' ? 'kcal' : 'g';
    info = vals.length ? t('Ø {a} {u} an {n} geloggten Tagen', { a: de(avg(vals)), u: unit, n: vals.length }) : t('Keine Einträge in diesem Zeitraum.');
  } else if (C.metric === 'macros') {
    stacked = true; unit = 'kcal';
    const mk = (key, lbl, c, m) => ({ type: 'bar', label: t(lbl), data: days.map(d => isLogged(d) ? r0(totals(d)[key] * m) : null), backgroundColor: c, borderColor: col.surf, borderWidth: { top: 2 }, borderSkipped: false, borderRadius: 3, maxBarThickness: 18, stack: 's' });
    datasets = [mk('p', 'Protein', col.p, 4), mk('c', 'Kohlenhydrate', col.c, 4), mk('f', 'Fett', col.f, 9)];
    info = t('Kalorien aus Makros pro Tag (Protein und Kohlenhydrate × 4, Fett × 9).');
  } else if (C.metric === 'weekly') {
    const weeks = {};
    for (const d of days) { const mon = addDays(d, -((new Date(d + 'T12:00:00').getDay() + 6) % 7)); (weeks[mon] ||= []); if (isLogged(d)) weeks[mon].push(totals(d).kcal); }
    const keys = Object.keys(weeks).sort(); labels = keys.map(k => t('KW {d}', { d: fmtShort(k) })); unit = 'kcal';
    datasets = [{ type: 'bar', label: t('Ø kcal pro Tag'), data: keys.map(k => weeks[k].length ? r0(avg(weeks[k])) : null), backgroundColor: col.acc, borderRadius: 4, maxBarThickness: 32 },
      { ...goalLine(S.goals.kcal), data: keys.map(() => S.goals.kcal) }];
    info = t('Durchschnittliche Kalorien pro Woche im Vergleich zum Ziel.');
  } else if (C.metric === 'tdee') {
    const ws = weightSeries(), step = days.length > 120 ? 7 : 3;
    datasets = [{ type: 'line', label: t('Verbrauch'), data: days.map(d => daysBetween(d, end) % step ? null : estimateTDEE(d, [28, 21], ws)?.tdee ?? null), borderColor: col.acc, backgroundColor: col.acc, borderWidth: 2, spanGaps: true, tension: .35, pointRadius: 0, pointHoverRadius: 4 },
      { type: 'line', label: t('Ø Aufnahme 7 Tage'), data: days.map(d => { const l = Array.from({ length: 7 }, (_, i) => addDays(d, -i)).filter(isLogged); return l.length ? r0(avg(l.map(x => totals(x).kcal))) : null; }), borderColor: col.c, backgroundColor: col.c, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: .35, spanGaps: true }];
    unit = 'kcal'; info = t('Geschätzter Verbrauch aus Aufnahme und Trendgewicht (rollierend, 21–28 Tage).');
  } else if (C.metric === 'meas') {
    const k = C.meas, l = MEAS.find(m => m[0] === k)?.[1] || ''; unit = measUnit(k); dec = 1;
    datasets = [{ type: 'line', label: t(l), data: days.map(d => S.measures[d]?.[k] ?? null), borderColor: col.acc, backgroundColor: col.acc, borderWidth: 2, spanGaps: true, tension: .3, pointRadius: 3.5, pointHoverRadius: 5 }];
    info = Object.keys(S.measures).length ? t('Wähle das Maß unten aus.') : t('Noch keine Körpermaße erfasst.');
  } else if (C.metric === 'water') {
    unit = 'L'; dec = 2;
    datasets = [{ type: 'bar', label: t('Wasser'), data: days.map(d => S.water[d] ? S.water[d] / 1000 : null), backgroundColor: col.acc, borderRadius: 4, maxBarThickness: 18 }, goalLine(S.settings.waterGoal / 1000)];
  }
  $('#cInfo').textContent = info;
  cv.setAttribute('aria-label', t(METRICS.find(m => m[0] === C.metric)[1]) + ' – ' + info);
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily; Chart.defaults.font.size = 11;
  chartObj = new Chart(cv, { data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false, animation: { duration: 300 }, interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: datasets.length > 1, position: 'bottom', align: 'start', labels: { color: col.mut, boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle', padding: 14 } },
      tooltip: { backgroundColor: col.bg, titleColor: col.ink, bodyColor: col.ink, borderColor: col.line, borderWidth: 1, padding: 10, cornerRadius: 10, usePointStyle: true, boxPadding: 4,
        filter: it => it.parsed.y != null, callbacks: { label: c => ` ${c.dataset.label}: ${de(c.parsed.y, dec)} ${unit}` } } },
    scales: { x: { stacked, ticks: { color: col.mut, maxTicksLimit: 6, maxRotation: 0 }, grid: { display: false }, border: { display: false } },
      y: { stacked, ticks: { color: col.mut, maxTicksLimit: 5 }, grid: { color: col.line }, border: { display: false }, beginAtZero: !['weight', 'meas', 'tdee'].includes(C.metric) } } } });
}

function measureSheet(d = today()) {
  const cur = S.measures[d] || {}, last = S.measures[Object.keys(S.measures).sort().pop()] || {};
  openSheet(`${sheetHead(t('Körpermaße'), t('Leere Felder werden ignoriert.'))}
    <div class="form"><label class="field"><span>${t('Datum')}</span><span class="field-in"><input id="msD" type="date" value="${d}" max="${today()}"></span></label>
    <div class="grid2">${MEAS.map(([k, l]) => field('ms_' + k, t(l), inputNum(cur[k]), { unit: measUnit(k), ph: inputNum(last[k]) })).join('')}</div>
    <button class="btn block" id="msSave">${t('Speichern')}</button></div>`, sh => {
    $('#msD').onchange = e => { const c = S.measures[e.target.value] || {}; MEAS.forEach(([k]) => $('#ms_' + k).value = inputNum(c[k])); };
    $('#msSave').onclick = () => {
      const o = {}; MEAS.forEach(([k]) => { const x = num($('#ms_' + k).value, 0, 500); if (x > 0) o[k] = x; });
      if (!Object.keys(o).length) return toast(t('Bitte mindestens einen Wert eingeben'));
      S.measures[$('#msD').value || d] = o; save(); closeSheet(); rerender(); toast(t('Gespeichert'));
    };
  });
}
