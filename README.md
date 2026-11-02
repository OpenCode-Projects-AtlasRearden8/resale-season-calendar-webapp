# Resale Season Calendar

A fully offline, single-file web app for planning the **buy-low and sell-high seasons** of reselling. Instead of hour-by-hour auction timing (that's the separate **ebay-auction-timing-webapp**), this one works at the month level: when should I buy patio furniture, and when should I sell it?

No servers, no scraping, no accounts, no network calls. Open one HTML file and it works — even from `file://` with Wi-Fi off.

## What it does

- **Month-by-month category cards** for twelve classic resale categories: school supplies, holiday decor, patio & outdoor, tax-season gear, Halloween costumes, fitness equipment, Valentine's candy & gifts, TVs & electronics, winter gear, garden seeds & tools, luggage, and toys & board games.
- **Buy-window vs. sell-window bars** — a 12-month bar on every card showing where the buying window, the selling window, and any overlap months sit for each category, with the current month outlined.
- **Reason chips** on every card: why the buy window is cheap (post-season clearance, end-of-summer floor models) and why the sell window pays (back-to-school rush, New Year's resolutions).
- **Prep-deadline nudges twelve weeks ahead** — every category has a prep deadline (photos, listings, cleaning, pricing) before its sell window starts, and the app surfaces a nudge card once you are within twelve weeks of it, plus a red "prep overdue" state if the deadline slips past.
- **Per-category profit notes you enter yourself** — type what you actually netted and any lessons learned; everything saves automatically.
- **Storage-tags column** — each card lists storage tags (attic, flat bin, moth control, heavy — two-person lift) so inventory does not eat your house. The printable sheet has a dedicated storage column.
- **Printable year sheet** — one click produces a clean year-at-a-glance table (buy window, sell window, prep deadline, storage tags, your profit note) with print styles already tuned.
- **CSV import of personal results** — import a spreadsheet of your own results (`category,profit,note`); rows are matched to categories, validated, and merged into your saved notes. A matching export button hands the data back out.

All personal data lives in your browser's `localStorage`. Nothing leaves your machine, and nothing is fetched from anywhere.

## How to run it

1. Download or clone this folder.
2. Double-click **`index.html`** (or open it in any modern browser). That's the whole app.
- Works offline from `file://` in Chrome, Edge, Firefox, and Safari.
- Optional: run `python3 -m http.server` in the folder and visit `http://localhost:8000` if you prefer a localhost URL.

## Tests

Window logic (phase mapping, year-wrapping windows, prep deadlines, 12-week nudge boundaries, CSV parsing) is tested directly against the script embedded in `index.html`, so tests run against exactly what the browser runs:

```sh
npm test        # runs node tests/window-logic.test.js — no dependencies to install
```

## CSV format for imports

The importer expects a header row and accepts the columns `category` (required, matched case-insensitively to category names), plus optional `profit` and `note`:

```csv
category,profit,note
Patio Furniture,340,"Bought 4 chairs at clearance, sold in May"
Luggage,,"Sales tax receipts kept in nesting suitcase"
```

Rows with no category, or nothing in both optional columns, are reported and skipped — the rest still imports.

## Privacy

- No network requests. No analytics. No cookies.
- Your profit notes, import history, and settings live only in this browser's `localStorage`.
- "Clear my data" wipes them in one confirmed click.

## About

Built by **Asdale Dynamics, LLC** — Dylan Asdale's company for beginner-friendly AI education, books, and practical local-first tools (see [dylanasdale.github.io](https://dylanasdale.github.io) and *The Massive AI Manual*).

This app deliberately stays at **month-level seasonal planning**; for hour-level eBay auction end-time tactics, use the companion **ebay-auction-timing-webapp**.

Licensed under the MIT License — see [`LICENSE`](LICENSE).
