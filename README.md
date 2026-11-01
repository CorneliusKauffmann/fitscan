# FitScan

**Free calorie & macro tracker – unlimited barcode scans, no paywall.**

FitScan is an installable web app (PWA) for tracking calories, macros and body weight. No account, no server, no subscription – all data stays on your device.

👉 **Live:** https://corneliuskauffmann.github.io/fitscan/

| Diary | Barcode scan | Weight trend | Food search |
|---|---|---|---|
| ![](screenshots/diary-en.png) | ![](screenshots/scan-result.png) | ![](screenshots/charts.png) | ![](screenshots/library.png) |

## Features
- **Unlimited barcode scanning** (EAN/UPC/QR) via camera (native `BarcodeDetector`, bundled ZXing fallback), photo or manual entry – product data from [Open Food Facts](https://world.openfoodfacts.org); scanned products are cached for offline use
- **Big food library:** Open Food Facts text search, 330+ built-in basic foods (offline), custom foods, recipes, favorites, recents, "same as yesterday"
- **Diary** with calorie ring and macro bars per day, four meals
- **Goals** from your profile (Mifflin-St Jeor) or set manually
- **Weight tracking** with smoothed trend weight, weekly rate and an **adaptive TDEE estimate** from intake vs. trend change
- **Charts:** weight + trend, calories vs. goal, macros, protein, weekly averages – ranges 7D/30D/90D/1Y/All, line/bar, smoothing
- **Backup** (JSON import/export), CSV export, delete all data
- **German & English UI** (auto-detected, toggle in header), dark & light mode, works offline

## Run locally
Any static server works, e.g. `python3 -m http.server 8000` → http://localhost:8000. Camera scanning requires HTTPS or localhost.

## Deploy
Hosted on GitHub Pages (Settings → Pages → Deploy from branch `main`, folder `/ (root)`). All paths are relative, so it works under `/fitscan/`.

## Credits & license
Product data © Open Food Facts contributors (ODbL). Bundled: Chart.js (MIT), ZXing-js (Apache-2.0). Basic food values are approximations based on public-domain USDA data.
FitScan is released under the MIT License.
