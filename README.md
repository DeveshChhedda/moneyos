# MoneyOS

A private, local-first personal finance app for iPhone and desktop. Track income, expenses, transfers, investments, cards, loans, budgets, goals and net worth. **Your financial data never leaves your device.** There is no backend, no account, no analytics and no ads.

## What's in this folder

| File | Purpose |
|---|---|
| `index.html` | The entire app (HTML, CSS and JavaScript in one file, ~200 KB, no external requests) |
| `manifest.webmanifest` | Makes it installable as an app (name, icons, colours) |
| `sw.js` | Service worker that caches the app so it opens offline |
| `icons/` | Home Screen and app icons |
| `.github/workflows/deploy.yml` | Optional automatic deployment to GitHub Pages |
| `src/` + `build.py` | Readable source files. Only needed if you want to edit the code |
| `package.json` | Convenience script to run a local server |

## 1. Run locally

Any static file server works. The service worker and install prompt need `http://localhost` or `https://`, not `file://`.

```bash
python3 -m http.server 5173
# or
npm start
```

Open http://localhost:5173.

## 2. How data storage works

- Everything is stored in **IndexedDB** in your browser, in separate stores for transactions, accounts, categories, budgets, goals, investments, loans, recurring rules and settings.
- Every record has an `id`, `createdAt` and `updatedAt`. Transactions link to accounts, categories and recurring rules by id.
- All calculations (balances, net worth, ratios, EMI schedules, goal contributions) run in the browser.
- The app asks the browser for **persistent storage** so data is less likely to be cleared automatically.
- Data is tied to the **address and the browser**. The same URL in Safari and the installed Home Screen app on iPhone can have separate storage, so pick one (the Home Screen app is recommended) and stick to it.

## 3. Build

**No build step is required.** `index.html` is already the production build.

If you edit files in `src/`, regenerate `index.html` with:

```bash
python3 build.py   # needs Python 3 and Node.js
```

After uploading a new version, open `sw.js` and bump `VERSION` (e.g. `moneyos-v1.0.1`) so installed copies pick up the update.

## 4. Deploy to GitHub Pages

**Option A: simplest (no Actions)**
1. Create a new repository on GitHub, e.g. `moneyos`. It can be public; it contains no personal data.
2. Upload all files from this folder (drag and drop on the GitHub website works). Include the hidden `.nojekyll` file if you can; it is optional.
3. Go to **Settings → Pages → Build and deployment → Source: Deploy from a branch**, choose `main` and `/ (root)`, and save.
4. After a minute your app is live at `https://<your-username>.github.io/moneyos/`.

**Option B: GitHub Actions**
1. Push this folder (including `.github/workflows/deploy.yml`) to the `main` branch.
2. Go to **Settings → Pages → Source: GitHub Actions**.
3. Every push to `main` redeploys automatically.

## 5. Install on iPhone

1. Open your GitHub Pages URL in **Safari**.
2. Tap **Share → Add to Home Screen → Add**.
3. Open MoneyOS from the Home Screen icon. It runs full screen, works offline, and keeps its own storage.

Why install? Safari may clear website data for sites you haven't opened in a while. Home Screen apps are not subject to that automatic cleanup, so installing is the safest way to keep your data.

## 6. Backup and restore

Because your data only lives on your device, **back up regularly**. If you clear Safari data, delete the Home Screen app, or change phones, un-backed-up data is gone.

- **Backup:** Settings → Backup now. On iPhone this opens the share sheet so you can save the JSON file to Files/iCloud Drive or send it to yourself. You can also copy the backup as text.
- **Restore:** Settings → Restore backup, then pick the JSON file (or paste the copied text). Restoring replaces the data currently on the device.
- **Export:** CSV exports of transactions (Excel-compatible, UTF-8 with BOM so ₹ displays correctly), accounts, investments and monthly reports.
- The dashboard shows when you last backed up and gently reminds you after 14 days.

To move to a new phone: back up on the old one, install on the new one, restore.

## Security

- Optional **PIN lock** (stored as a salted SHA-256 hash, re-locks after a minute in the background).
- Face ID / Touch ID is **not** offered: browsers do not provide a reliable way for a website to use biometrics as an app lock without a server. The PIN keeps casual eyes out; it is not encryption. Your phone's own passcode remains the real protection.
- If you forget the PIN, the only way in is to erase data on this device and restore from a backup.

## Privacy

MoneyOS makes no network requests with your data. There are no analytics, trackers, fonts or scripts loaded from other servers. You can verify this in Safari's Web Inspector or your browser's Network tab.
