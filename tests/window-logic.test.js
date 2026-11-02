/* Tests for the resale-season window logic in index.html.
 * Run with:  node tests/window-logic.test.js   (or: npm test)
 * The script block is extracted from index.html so the tested code
 * is exactly what the browser runs.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var assert = require("assert");

var html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
var match = html.match(/\/\* APP-SCRIPT-START \*\/([\s\S]*?)\/\* APP-SCRIPT-END \*\//);
assert.ok(match, "index.html must contain APP-SCRIPT-START/END markers");
var mod = { exports: {} };
var maybeModule = new Function("module", "exports", match[1]);
try {
  maybeModule(mod, mod.exports);
} catch (err) {
  console.error("FATAL: app script failed to parse/evaluate: " + err.message);
  process.exit(1);
}
var lib = mod.exports;
assert.ok(lib && lib.CATEGORIES.length >= 10, "lib export failed");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("  ok - " + name);
  } catch (err) {
    failed += 1;
    console.error("  FAIL - " + name);
    console.error("    " + (err && err.message ? err.message : err));
  }
}

function date(s) {
  return new Date(s + "T00:00:00");
}

console.log("window logic");

test("inWindow handles plain ranges", function () {
  var win = { start: 7, end: 9 };
  assert.ok(lib.inWindow(win, 7));
  assert.ok(lib.inWindow(win, 9));
  assert.ok(!lib.inWindow(win, 6));
  assert.ok(!lib.inWindow(win, 10));
});

test("inWindow wraps year-end ranges", function () {
  var win = { start: 12, end: 1 };
  assert.ok(lib.inWindow(win, 12));
  assert.ok(lib.inWindow(win, 1));
  assert.ok(!lib.inWindow(win, 6));
});

test("phaseFor returns buy / sell / both / off correctly", function () {
  var cat = lib.CATEGORIES.find(function (c) { return c.slug === "tax-season-gear"; });
  assert.strictEqual(lib.phaseFor(cat, 6), "buy");
  assert.strictEqual(lib.phaseFor(cat, 2), "sell");
  assert.strictEqual(lib.phaseFor(cat, 9), "off");
});

test("phaseFor detects overlap months as 'both'", function () {
  var cat = {
    slug: "x", name: "X",
    buy: { start: 5, end: 8 },
    sell: { start: 7, end: 9 },
    prepWeeks: 4, reasonsBuy: [], reasonsSell: [], storage: []
  };
  assert.strictEqual(lib.phaseFor(cat, 7), "both");
  assert.strictEqual(lib.phaseFor(cat, 5), "buy");
  assert.strictEqual(lib.phaseFor(cat, 9), "sell");
  assert.strictEqual(lib.phaseFor(cat, 12), "off");
});

test("holiday-decor wraps: buy Dec–Jan, sell Oct–Dec", function () {
  var cat = lib.CATEGORIES.find(function (c) { return c.slug === "holiday-decor"; });
  assert.strictEqual(lib.phaseFor(cat, 11), "sell");
  assert.strictEqual(lib.phaseFor(cat, 1), "buy");
  assert.strictEqual(lib.phaseFor(cat, 12), "both");
  assert.strictEqual(lib.phaseFor(cat, 7), "off");
});

test("every defined category phaseFor is never undefined", function () {
  lib.CATEGORIES.forEach(function (cat) {
    for (var m = 1; m <= 12; m++) {
      var p = lib.phaseFor(cat, m);
      assert.ok(["buy", "sell", "both", "off"].indexOf(p) !== -1,
        cat.slug + " month " + m + " -> " + p);
    }
  });
});

console.log("prep deadlines and nudges");

test("prepDeadlineFor = sell start minus prepWeeks", function () {
  var cat = lib.CATEGORIES.find(function (c) { return c.slug === "school-supplies"; });
  var today = date("2026-02-10");
  var expected = lib.addDays(new Date(2026, 6, 15), -7 * cat.prepWeeks);
  assert.strictEqual(lib.prepDeadlineFor(cat, today).getTime(), expected.getTime());
});

test("sellStartFor wraps to next year when the start passed", function () {
  var cat = lib.CATEGORIES.find(function (c) { return c.slug === "school-supplies"; });
  var today = date("2026-11-02");
  var ss = lib.sellStartFor(cat, today);
  assert.strictEqual(ss.getFullYear(), 2027);
  assert.strictEqual(ss.getMonth(), 6);
});

test("nudge shows inside the 12-week heads-up window", function () {
  var cat = lib.CATEGORIES.find(function (c) { return c.slug === "tax-season-gear"; });
  var st = lib.nudgeStatusFor(cat, date("2026-11-02"));
  assert.ok(st.nudging);
  assert.ok(!st.overdue);
  assert.ok(st.weeksLeft > 0 && st.weeksLeft <= 12);
});

test("nudge boundary: exactly 12 weeks out still nudges", function () {
  var cat = { slug: "x", name: "X", buy: { start: 4, end: 5 }, sell: { start: 7, end: 8 }, prepWeeks: 4, reasonsBuy: [], reasonsSell: [], storage: [] };
  var st = lib.nudgeStatusFor(cat, date("2026-03-25"));
  assert.ok(st.nudging, JSON.stringify(st));
  assert.strictEqual(Math.round(st.weeksLeft * 100) / 100, 12);
});

test("nudge boundary: 13 weeks out is silent", function () {
  var cat = { slug: "x", name: "X", buy: { start: 4, end: 5 }, sell: { start: 7, end: 8 }, prepWeeks: 4, reasonsBuy: [], reasonsSell: [], storage: [] };
  var st = lib.nudgeStatusFor(cat, date("2026-03-18"));
  assert.ok(!st.nudging && !st.overdue, JSON.stringify(st));
});

test("mid-sell window shows overdue or silent state, never a future nudge", function () {
  var cat = lib.CATEGORIES.find(function (c) { return c.slug === "holiday-decor"; });
  var st = lib.nudgeStatusFor(cat, date("2026-11-20"));
  assert.ok(!st.nudging, JSON.stringify(st));
});

test("weeksUntil counts cleanly across months", function () {
  assert.strictEqual(lib.weeksUntil(date("2026-03-01"), date("2026-02-01")), 4);
});

console.log("CSV parsing");

test("parseCSV keeps quoted commas and doubled quotes intact", function () {
  var out = lib.parseCSV('"sold, as listed","say ""hi""",plain');
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0][0], "sold, as listed");
  assert.strictEqual(out[0][1], 'say "hi"');
  assert.strictEqual(out[0][2], "plain");
});

test("parseCSV handles CRLF line endings", function () {
  var out = lib.parseCSV("a,b\r\nc,d\r\n");
  assert.strictEqual(out.length, 2);
  assert.deepStrictEqual(out[0], ["a", "b"]);
  assert.deepStrictEqual(out[1], ["c", "d"]);
});

test("parseResultsCSV requires a category header", function () {
  var out = lib.parseResultsCSV("foo,bar\n1,2\n");
  assert.strictEqual(out.rows.length, 0);
  assert.ok(out.errors[0].indexOf("category") !== -1);
});

test("parseResultsCSV imports profit and note rows", function () {
  var out = lib.parseResultsCSV("category,profit,note\nPatio Furniture,340,\"Bought 4 chairs at clearance\"\n");
  assert.strictEqual(out.rows.length, 1);
  assert.strictEqual(out.rows[0].category, "patio-furniture");
  assert.strictEqual(out.rows[0].profit, "340");
  assert.strictEqual(out.rows[0].note, "Bought 4 chairs at clearance");
  assert.strictEqual(out.rows[0].kind, "both");
  assert.strictEqual(out.errors.length, 0);
});

test("parseResultsCSV slugifies category names", function () {
  var out = lib.parseResultsCSV("category\nHoliday-Decor!,\n");
  assert.ok(out.errors.length >= 1);
  assert.strictEqual(out.rows.length, 0);
  var out2 = lib.parseResultsCSV("category,note\n  Holiday-Decor! ,nice bins\n");
  assert.strictEqual(out2.rows.length, 1);
  assert.strictEqual(out2.rows[0].category, "holiday-decor");
  assert.strictEqual(out2.rows[0].note, "nice bins");
});

test("parseResultsCSV skips empty category cells without crashing", function () {
  var out = lib.parseResultsCSV("category,note\n,blank row\nWake word,toys sold\n");
  assert.strictEqual(out.rows.length, 1);
  assert.strictEqual(out.rows[0].category, "wake-word");
});

test("parseResultsCSV reports rows with no usable data", function () {
  var out = lib.parseResultsCSV("category,profit,note\nPatio Furniture,,\n");
  assert.strictEqual(out.rows.length, 0);
  assert.strictEqual(out.errors.length, 1);
  assert.ok(out.errors[0].indexOf("Patio Furniture") !== -1);
});

test("parseResultsCSV tolerates trailing newline / empty file", function () {
  assert.deepStrictEqual(lib.parseResultsCSV("").errors.length, 1);
  assert.strictEqual(lib.parseResultsCSV("category,profit\n").rows.length, 0);
});

console.log("data hygiene");

test("all categories have required fields and storage tags", function () {
  lib.CATEGORIES.forEach(function (cat) {
    [cat.slug, cat.name, cat.buy, cat.sell].forEach(function (v) {
      assert.ok(v !== undefined && v !== "", cat.name + " missing field");
    });
    assert.ok(cat.prepWeeks >= 1 && cat.prepWeeks <= 52, cat.name + " prepWeeks out of range");
    assert.ok(cat.storage.length >= 1, cat.name + " has no storage tags");
    assert.ok(cat.reasonsBuy.length >= 1 && cat.reasonsSell.length >= 1,
      cat.name + " missing reason chips");
    [cat.buy.start, cat.buy.end, cat.sell.start, cat.sell.end].forEach(function (m) {
      assert.ok(m >= 1 && m <= 12, cat.name + " month out of range");
    });
  });
});

test("slugs are unique", function () {
  var seen = {};
  lib.CATEGORIES.forEach(function (cat) {
    assert.ok(!seen[cat.slug], "duplicate slug " + cat.slug);
    seen[cat.slug] = true;
  });
});

test("app script does not reference remote resources (offline / file://)", function () {
  var m = html.match(/(?:src|href)\s*=\s*["']https?:\/\//gi);
  assert.ok(!m, "external resource found: " + (m || []).join(", "));
});

console.log("");
if (failed > 0) {
  console.error(failed + " test(s) failed, " + passed + " passed.");
  process.exit(1);
}
console.log("All " + passed + " tests passed.");
