'use strict';
/* FitScan i18n: UI wird auf Deutsch gerendert; bei Englisch übersetzt ein DOM-Observer Texte & Attribute. */
const I18N_EN = {
  'Tagebuch':'Diary','Lebensmittel':'Foods','Fortschritt':'Progress','Profil':'Profile','Profil & Daten':'Profile & data','Scannen':'Scan',
  'Heute':'Today','Gestern':'Yesterday','kcal übrig':'kcal left','kcal drüber':'kcal over','Protein':'Protein','Kohlenhydrate':'Carbs','Fett':'Fat',
  'Ballaststoffe':'Fiber','Zucker':'Sugar','Salz':'Salt','Frühstück':'Breakfast','Mittagessen':'Lunch','Abendessen':'Dinner','Snacks':'Snacks',
  '🌅 Frühstück':'🌅 Breakfast','🍽️ Mittagessen':'🍽️ Lunch','🌙 Abendessen':'🌙 Dinner','🍎 Snacks':'🍎 Snacks','Mittag.':'Lunch','Abend.':'Dinner','🍽️ Mittag.':'🍽️ Lunch','🌙 Abend.':'🌙 Dinner',
  '＋ Hinzufügen':'＋ Add','↺ Wie gestern':'↺ Same as yesterday','⚖️ Gewicht':'⚖️ Weight','Eintragen':'Log',
  'Tägliches Wiegen (morgens, nüchtern) macht den Trend am genauesten.':'Weighing daily (mornings, before eating) makes the trend most accurate.',
  'Tipp: Lege im Profil deine Ziele fest, um passende Kalorien- und Makroziele zu bekommen.':'Tip: set your goals in Profile to get matching calorie and macro targets.',
  'Suche':'Search','★ Favoriten':'★ Favorites','Zuletzt':'Recent','Eigene':'Custom','Gerichte':'Recipes','Basis':'Basics','Gericht':'Recipe','Eigenes':'Custom',
  'Lebensmittel, Marke oder Barcode suchen…':'Search food, brand or barcode…','Bibliothek & Eigene':'Library & custom','Open Food Facts':'Open Food Facts',
  'Keine Produkte gefunden.':'No products found.','Schnell hinzufügen':'Quick add','Hinzufügen zu:':'Add to:',
  'Suche in der Basis-Bibliothek, deinen eigenen Lebensmitteln und Millionen Produkten von Open Food Facts – oder scanne einen Barcode.':'Search the basic library, your own foods and millions of Open Food Facts products – or scan a barcode.',
  'Noch keine Favoriten. Tippe beim Lebensmittel auf ☆.':'No favorites yet. Tap ☆ on a food.','Hier erscheinen zuletzt eingetragene Lebensmittel.':'Recently logged foods appear here.',
  '＋ Eigenes Lebensmittel anlegen':'＋ Create custom food','Lege Lebensmittel an, die es nirgends gibt.':'Create foods that aren’t listed anywhere.',
  '＋ Neues Gericht / Rezept':'＋ New recipe','bearbeiten':'edit','Kombiniere mehrere Zutaten zu einem Gericht und trage später eine Portion mit einem Tipp ein.':'Combine several ingredients into a recipe and log a portion later with one tap.',
  'Nährwerte':'Nutrition','pro 100 g':'per 100 g','Energie':'Energy','davon Zucker':'of which sugar','Kohlenh.':'Carbs','Gramm':'Grams','Stück':'Piece','Portion':'Serving',
  'Zum Tagebuch hinzufügen':'Add to diary','Änderung speichern':'Save changes','Eintrag löschen':'Delete entry','Favorit':'Favorite',
  'Daten: Open Food Facts (ODbL) – Angaben können unvollständig sein.':'Data: Open Food Facts (ODbL) – information may be incomplete.',
  'Lebensmittel bearbeiten':'Edit food','Eigenes Lebensmittel':'Custom food','Name':'Name','Marke (optional)':'Brand (optional)','z. B. Omas Apfelkuchen':'e.g. Grandma’s apple pie',
  'Nährwerte pro 100 g':'Nutrition per 100 g','Kalorien (kcal)':'Calories (kcal)','Protein (g)':'Protein (g)','Kohlenhydrate (g)':'Carbs (g)','Fett (g)':'Fat (g)','Zucker (g)':'Sugar (g)',
  'Ballaststoffe (g)':'Fiber (g)','Salz (g)':'Salt (g)','Portionsgröße (g)':'Serving size (g)','Speichern':'Save','Löschen':'Delete',
  'Gericht bearbeiten':'Edit recipe','Neues Gericht':'New recipe','z. B. Protein-Porridge':'e.g. protein porridge','Anzahl Portionen':'Number of servings','Noch keine Zutaten':'No ingredients yet',
  'Zutat suchen (offline-Bibliothek & Eigene)…':'Search ingredient (offline library & custom)…','kcal/Port.':'kcal/serv.','KH':'Carbs','Gericht speichern':'Save recipe',
  'Barcode in den Rahmen halten':'Hold the barcode inside the frame','Kamera wird gestartet…':'Starting camera…','⌨️ Nummer eingeben':'⌨️ Enter number','🖼️ Foto':'🖼️ Photo','Licht':'Torch',
  'Foto wird gelesen…':'Reading photo…','Kein Barcode im Foto gefunden':'No barcode found in photo','QR-Code erkannt':'QR code detected','Dieser Code enthält keine Produktnummer.':'This code contains no product number.',
  'Barcode eingeben':'Enter barcode','Die Ziffern unter dem Strichcode (EAN/UPC, 8–13 Stellen).':'The digits under the barcode (EAN/UPC, 8–13 digits).','Produkt suchen':'Find product',
  'Produkt nicht gefunden':'Product not found','＋ Lebensmittel anlegen':'＋ Create food','Keine Verbindung':'No connection','Erneut versuchen':'Try again','Selbst anlegen':'Create it yourself',
  'Gewicht eintragen':'Log weight','Datum':'Date','Hell/Dunkel':'Light/Dark','Sprache / Language':'Language / Sprache',
  '＋ Wiegen':'＋ Weigh in','Aktuell':'Current','Trendgewicht':'Trend weight','Pro Woche':'Per week','🔥 Echter Energieverbrauch':'🔥 Real energy expenditure','adaptiv':'adaptive',
  'Ziel an echten Verbrauch anpassen':'Adjust goal to real expenditure','Gewicht':'Weight','Kalorien':'Calories','Makros':'Macros','Wochenschnitt':'Weekly avg',
  '7T':'7D','30T':'30D','90T':'90D','1J':'1Y','Alles':'All','Linie':'Line','Balken':'Bars','Keine Glättung':'No smoothing','Trend (EMA)':'Trend (EMA)','7-Tage-Mittel':'7-day average',
  'Letzte Wiegungen':'Recent weigh-ins','Noch keine Einträge':'No entries yet','Waage':'Scale','Ziel':'Goal','Geglättet':'Smoothed','Protein (kcal)':'Protein (kcal)',
  'Kohlenhydrate (kcal)':'Carbs (kcal)','Fett (kcal)':'Fat (kcal)','Ø kcal/Tag':'Avg kcal/day','Ø Trendgewicht (kg)':'Avg trend weight (kg)',
  'Noch keine Gewichtsdaten in diesem Zeitraum.':'No weight data in this period yet.','Keine Einträge in diesem Zeitraum.':'No entries in this period.',
  'Makros als Kalorienanteil pro Tag (Protein/KH × 4, Fett × 9).':'Macros as calories per day (protein/carbs × 4, fat × 9).',
  'Wochendurchschnitt der Kalorien (Balken) und des Trendgewichts (Linie).':'Weekly average calories (bars) and trend weight (line).',
  'Logge mindestens ~2 Wochen lang Essen und wiege dich regelmäßig. Dann berechnet FitScan deinen tatsächlichen Verbrauch aus Aufnahme und Trendgewicht – genauer als jede Formel.':'Log your food for at least ~2 weeks and weigh in regularly. FitScan then calculates your actual expenditure from intake and trend weight – more accurate than any formula.',
  '🎯 Profil & Ziel':'🎯 Profile & goal','Männlich':'Male','Weiblich':'Female','Alter':'Age','Größe (cm)':'Height (cm)','Gewicht (kg)':'Weight (kg)','Aktivität':'Activity',
  'Abnehmen':'Lose','Halten':'Maintain','Aufbauen':'Gain','Tempo:':'Rate:','Ziele berechnen & übernehmen':'Calculate & apply goals','✍️ Tagesziele (manuell)':'✍️ Daily targets (manual)',
  'Ziele speichern':'Save targets','💾 Daten':'💾 Data','⬇️ Backup (JSON)':'⬇️ Backup (JSON)','⬆️ Import':'⬆️ Import','📄 Tagebuch CSV':'📄 Diary CSV','📄 Gewicht CSV':'📄 Weight CSV',
  '🧪 Demo-Daten laden (6 Wochen)':'🧪 Load demo data (6 weeks)','Alle Daten löschen':'Delete all data',
  'Alles bleibt auf diesem Gerät – kein Konto, keine Cloud, keine Paywall. Mach ab und zu ein Backup.':'Everything stays on this device – no account, no cloud, no paywall. Make a backup now and then.',
  'Kaum aktiv (Bürojob, wenig Sport)':'Sedentary (desk job, little exercise)','Leicht aktiv (1–3× Sport/Woche)':'Lightly active (exercise 1–3×/week)','Mäßig aktiv (3–5× Sport/Woche)':'Moderately active (exercise 3–5×/week)',
  'Sehr aktiv (6–7× Sport/Woche)':'Very active (exercise 6–7×/week)','Extrem aktiv (körperliche Arbeit + Sport)':'Extremely active (physical job + exercise)',
  'FitScan · 100 % kostenlos · Unbegrenzt scannen ❤️':'FitScan · 100% free · Unlimited scans ❤️','Produktdaten von':'Product data from',
  'Gespeichert':'Saved','Gelöscht':'Deleted','Bitte Menge eingeben':'Please enter an amount','Bitte Namen eingeben':'Please enter a name','Mindestens eine Zutat':'At least one ingredient',
  'Gericht gespeichert':'Recipe saved','Gewicht gespeichert':'Weight saved','Bitte gültiges Gewicht':'Please enter a valid weight','Ziele übernommen':'Goals applied','Bitte Werte prüfen':'Please check the values',
  'Backup importiert':'Backup imported','Ungültige Backup-Datei':'Invalid backup file','Demo-Daten geladen':'Demo data loaded','Alle Daten gelöscht':'All data deleted','Ungültiger Code':'Invalid code',
  'Licht nicht unterstützt':'Torch not supported','Aus lokalem Speicher (offline verfügbar)':'From local storage (available offline)','Hinweis: Für dieses Produkt fehlen Nährwerte – bitte prüfen':'Note: nutrition data missing for this product – please check',
  'Gestern nichts bei dieser Mahlzeit eingetragen':'Nothing logged for this meal yesterday','Speicher voll – bitte Backup exportieren':'Storage full – please export a backup',
  'Backup importieren? Aktuelle Daten werden ersetzt.':'Import backup? Current data will be replaced.','Demo-Daten zu deinen Daten hinzufügen?':'Add demo data to your data?',
  'Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden.':'Really delete ALL data? This cannot be undone.','Unbenanntes Produkt':'Unnamed product',
  'Kamera braucht HTTPS':'Camera needs HTTPS','Kamera nicht verfügbar':'Camera not available','Kein Kamerazugriff':'No camera access',
  'Milchprodukte':'Dairy','Obst':'Fruit','Gemüse':'Vegetables','Getreide':'Grains','Beilagen':'Sides','Brot':'Bread','Käse':'Cheese','Fette':'Fats & oils','Eier':'Eggs','Fleisch':'Meat','Wurst':'Cold cuts',
  'Fisch':'Fish','Hülsenfrüchte':'Legumes','Nüsse':'Nuts & seeds','Süßes':'Sweets','Supplemente':'Supplements','Getränke':'Drinks','Saucen':'Sauces','Trockenobst':'Dried fruit',
};
const I18N_RULES = [
  [/^(.+) von (.+) kcal gegessen$/, '$1 of $2 kcal eaten'], [/^✓ (.+) hinzugefügt$/, '✓ $1 added'], [/^(\d+) Einträge kopiert$/, '$1 entries copied'],
  [/^Suche (.+)…$/, 'Looking up $1…'], [/^Neues Ziel: (.+) kcal$/, 'New goal: $1 kcal'], [/^pro Portion \((.+)\)$/, 'per serving ($1)'],
  [/^(.+) Zutaten · (.+) kcal\/Portion$/, '$1 ingredients · $2 kcal/serving'], [/^Portion: (.+)$/, 'Serving: $1'], [/^(.+) × Portion$/, '$1 × serving'],
  [/^ · (.+) Gericht$/, ' · $1 recipe'], [/^(\d[\d.,]*) kg\/Woche$/, '$1 kg/week'],
  [/^geschätzter TDEE \(letzte (\d+) Tage\)$/, 'estimated TDEE (last $1 days)'],
  [/^Ø Aufnahme (.+) kcal · Trend (.+) kg · (\d+) Tage geloggt\. Berechnet aus deiner Aufnahme und der Veränderung des Trendgewichts \(7\.700 kcal ≈ 1 kg\)\.$/, 'Avg intake $1 kcal · trend $2 kg · $3 days logged. Calculated from your intake and the change in trend weight (7,700 kcal ≈ 1 kg).'],
  [/^Trend (.+)$/, 'Trend $1'], [/^Min (.+) · Max (.+) kg · (\d+) Wiegungen$/, 'Min $1 · max $2 kg · $3 weigh-ins'],
  [/^Ø (.+) (kcal|g) an (\d+) geloggten Tagen$/, 'Avg $1 $2 on $3 logged days'], [/^KW (.+)$/, 'Wk $1'],
  [/^Grundumsatz (.+) kcal · Gesamtumsatz ≈ (.+) kcal$/, 'BMR $1 kcal · TDEE ≈ $2 kcal'], [/^→ Ziel $/, '→ Goal '], [/^ · P (.+) g · KH (.+) g · F (.+) g$/, ' · P $1 g · C $2 g · F $3 g'],
  [/^Makros ergeben (.+) kcal \(Ziel (.+) kcal\)$/, 'Macros add up to $1 kcal (goal $2 kcal)'],
  [/^ Produkte offline gespeichert · (\d+) Basis-Lebensmittel · Produktdaten von $/, ' products saved offline · $1 basic foods · product data from '],
  [/^(\d+) Produkte offline gespeichert · (\d+) Basis-Lebensmittel · Produktdaten von $/, '$1 products saved offline · $2 basic foods · product data from '],
  [/^Barcode (.+) wurde bei Open Food Facts nicht gefunden – trage die Werte von der Verpackung ein\. Beim nächsten Scan wird es automatisch erkannt\.$/, 'Barcode $1 was not found on Open Food Facts – enter the values from the package. It will be recognized automatically on the next scan.'],
  [/^Der Barcode $/, 'Barcode '], [/^ ist \(noch\) nicht in Open Food Facts\. Du kannst es selbst anlegen – es wird lokal gespeichert und beim nächsten Scan erkannt\.$/, ' is not (yet) in Open Food Facts. You can create it yourself – it is saved locally and recognized on the next scan.'],
  [/^Open Food Facts ist gerade nicht erreichbar \((.+)\)\. Versuche es gleich nochmal oder lege das Produkt selbst an\.$/, 'Open Food Facts is unreachable right now ($1). Try again shortly or create the product yourself.'],
  [/^Online-Suche gerade nicht erreichbar \((.+)\)\. Lokale Treffer oben funktionieren trotzdem\.$/, 'Online search unavailable right now ($1). Local results above still work.'],
  [/^(.+) – nutze „Nummer eingeben“ oder „Foto“\.$/, m => null], 
  [/^ · (.+) kcal\/100 g$/, ' · $1 kcal/100 g'],
];
let LANG = 'de';
const LOC = () => LANG === 'en' ? 'en-US' : 'de-DE';
function tr(s) {
  if (LANG !== 'en' || s == null) return s;
  const raw = String(s), lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0], core = raw.trim();
  if (!core) return raw;
  if (I18N_EN[core] != null) return lead + I18N_EN[core] + trail;
  const cam = core.match(/^(.+) – nutze „Nummer eingeben“ oder „Foto“\.$/); if (cam) return lead + tr(cam[1]) + ' – use “Enter number” or “Photo”.' + trail;
  for (const [re, rep] of I18N_RULES) { if (typeof rep === 'string' && re.test(raw)) return raw.replace(re, rep); if (typeof rep === 'string' && re.test(core)) return lead + core.replace(re, rep) + trail; }
  // Fallback: Kategorien & Portionseinheiten wortweise (Lebensmittelnamen werden nie übersetzt)
  let out = raw.replace(/^(\s*)([A-Za-zÄÖÜäöüß]+)( · )/, (m, a, w, b) => w === 'Gerichte' ? a + 'Dishes' + b : I18N_EN[w] ? a + I18N_EN[w] + b : m);
  out = out.replace(/\b(\d+(?:[.,]\d+)?) (Scheibe|Portion|Stück|Glas|Tasse|Dose|EL|TL|Handvoll|Becher|Riegel|Kugel|Flasche|Messlöffel|Packung|Schale|Teller|Stange|Zehe|Filet|Wurst|Würstchen|Brötchen|Ei|Eiweiß|Eigelb|Keks|Waffel|Stäbchen)\b( roh)?/g,
    (m, n, u, r) => n + ' ' + ({Scheibe:'slice',Portion:'serving',Stück:'piece',Glas:'glass',Tasse:'cup',Dose:'can',EL:'tbsp',TL:'tsp',Handvoll:'handful',Becher:'tub',Riegel:'bar',Kugel:'scoop',Flasche:'bottle',Messlöffel:'scoop',Packung:'pack',Schale:'bowl',Teller:'plate',Stange:'stalk',Zehe:'clove',Filet:'fillet',Wurst:'sausage',Würstchen:'sausage',Brötchen:'roll',Ei:'egg',Eiweiß:'egg white',Eigelb:'egg yolk',Keks:'cookie',Waffel:'waffle',Stäbchen:'stick'})[u] + (r ? ' raw' : ''));
  return out.replace(/\bca\. /g, 'approx. ').replace(/ · K (\d)/, ' · C $1');
}
const SKIP = el => el && el.closest && el.closest('.nm, .prodhead h2, script, style, [data-notr]');
function trNode(n) {
  if (n.nodeType === 3) { if (SKIP(n.parentElement)) return; if (n._de == null || (n.nodeValue !== n._en)) n._de = n.nodeValue; const v = tr(n._de); n._en = v; if (n.nodeValue !== v) n.nodeValue = v; return; }
  if (n.nodeType !== 1 || SKIP(n)) return;
  for (const a of ['placeholder', 'title', 'aria-label']) if (n.hasAttribute(a)) { const k = '_de_' + a; if (n[k] == null || n.getAttribute(a) !== n['_en_' + a]) n[k] = n.getAttribute(a); const v = tr(n[k]); n['_en_' + a] = v; if (n.getAttribute(a) !== v) n.setAttribute(a, v); }
  for (const c of n.childNodes) trNode(c);
}
let i18nObs = null;
function applyLang(lang) {
  LANG = lang; document.documentElement.lang = lang;
  trNode(document.body);
  if (!i18nObs) { i18nObs = new MutationObserver(ms => { i18nObs.disconnect(); for (const m of ms) { if (m.type === 'characterData') trNode(m.target); else m.addedNodes.forEach(trNode); } observe(); }); }
  const observe = () => i18nObs.observe(document.body, { childList: true, subtree: true, characterData: true });
  i18nObs.disconnect(); observe();
}
