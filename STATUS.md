# STATUS — resale-season-calendar-webapp

Updated: 2026-11-02

## What was built

A zero-dependency, single-file offline web app (`index.html`) implementing the original goal:

- Month-by-month **category cards** for 12 resale categories (school supplies, holiday decor, patio & outdoor, tax-season gear, Halloween costumes, fitness equipment, Valentine's candy & gifts, TVs & electronics, winter gear, garden seeds & tools, luggage, toys & board games).
- **Buy-window vs. sell-window bars** — 12-month bar per card with buy (teal), sell (amber), overlap (purple), and off-season (gray) segments; current month outlined.
- **Reason chips** — grouped "Why buy" / "Why sell" chips per category explaining the economics.
- **Prep-deadline nudges twelve weeks ahead** — per-category prep deadline (N weeks before the next sell-window start), surfaced in a top "nudges" section and on each card, with a red overdue state; prepWeeks ranges 4–8 weeks depending on how long staging takes.
- **Per-category profit notes** — user-entered profit figure plus a free-text lesson/notes field per card, auto-saved to `localStorage` (`rsc.notes.v1`).
- **Storage-tags column/tags** — chips on each card (attic, flat bin, moth control, heavy — two-person lift, etc.) plus a dedicated storage column in the year sheet.
- **Printable year sheet** — always-visible reference table; `@media print` styles hide interactive UI and produce a clean year-at-a-glance sheet (fields become borderless text on paper).
- **CSV import of personal results** — file picker accepting `category,profit,note` CSVs; quoted fields, CRLF, doubled quotes, slug-matching, and per-row validation with skipped-row reporting. A matching **CSV export** button round-trips the data.
- **Month index** — a "Month by month" grid showing what to buy and what to sell each calendar month.
- Everything is `localStorage` only; nothing is scraped, fetched, or synced. Pure HTML/JS/CSS; runs from `file://`; no external requests (asserted by test).

Deliberate scope distinction: this app is **month-level seasonal planning**; the separate ebay-auction-timing-webapp covers hour-level timing. Both READMEs say so.

## How to run

- Open `index.html` in any modern browser (offline, `file://` works).
- Tests: `npm test` (runs `node tests/window-logic.test.js`; Node 14+, no dependencies).

## Verification results

- `npm test` → **All 24 tests passed** (exit 0), covering: plain and year-wrapping windows, phase mapping (buy/sell/both/off), every category × month produces a valid phase, prep-deadline arithmetic, sell-start wrap to next year, nudge boundaries (exactly 12 weeks nudges, 13 weeks silent, mid-sale never re-nudges), `weeksUntil` cross-month math, CSV parsing (quotes, doubled quotes, CRLF, empty file), CSV import validation (missing/blank/unusable rows), and data hygiene (all categories complete, unique slugs, no external `http(s)` resources).
- Fake-DOM smoke run of the embedded script: header renders 4 active/overdue nudge sections (as of 2026-11-02), 12 month-index cells, 12 category cards, 12 printable-sheet rows — no runtime errors.
- Confirmed zero external resource references in the HTML (offline `file://` safe).

## Known gaps

- Category data is opinionated and hand-maintained; windows reflect a typical US retail calendar and can be tuned in `CATEGORIES` at the top of the script.
- Notes are per category, not per year — a new season overwrites last season's profit figure unless you keep it in the note text.
- CSV import matches categories case-insensitively by name but does not fuzzy-match typos; unknown category slugs are imported but appear under no card profile until the slug matches.
- No automated browser-level (DOM) tests committed; smoke rendering was verified manually. The committed suite covers pure window/CSV logic per the original goal's "tests for window logic."
- Print output is tuned for portrait A4/Letter; very long profit notes may wrap tightly in the sheet's note column.

## Repository

- `index.html` — the entire app
- `tests/window-logic.test.js` — test suite (`npm test`)
- `README.md` — usage, CSV format, credit to Asdale Dynamics, LLC
- `LICENSE` — MIT, `Copyright (c) 2026 Asdale Dynamics, LLC`
- `STATUS.md` — this file
