#!/usr/bin/env node
// ============================================================
// Nanoboost — Build Verification Tests
// Validates that the build pipeline produces correct output
// Run: npm test  (after npm run build)
// ============================================================
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const DIST = path.join(__dirname, "dist");
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${e.message}`);
    failed++;
  }
}

console.log("\n🧪 Running build verification tests...\n");

// --- Existence Tests ---
test("dist/ directory exists", () => {
  assert.ok(fs.existsSync(DIST), "dist/ not found — run npm run build first");
});

test("build-manifest.json exists", () => {
  assert.ok(fs.existsSync(path.join(DIST, "build-manifest.json")));
});

test("index.html exists in dist/", () => {
  assert.ok(fs.existsSync(path.join(DIST, "index.html")));
});

test("404.html exists in dist/", () => {
  assert.ok(fs.existsSync(path.join(DIST, "404.html")));
});

test("assets/ directory copied", () => {
  assert.ok(fs.existsSync(path.join(DIST, "assets")));
});

test("static files copied (manifest.json, robots.txt, sitemap.xml)", () => {
  for (const f of ["manifest.json", "robots.txt", "sitemap.xml"]) {
    assert.ok(fs.existsSync(path.join(DIST, f)), `${f} missing in dist/`);
  }
});

// --- Cache-Busting Tests ---
test("build manifest contains hashed file entries", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "build-manifest.json"), "utf8"));
  assert.ok(Object.keys(manifest.files).length > 0, "No files in manifest");

  for (const [original, hashed] of Object.entries(manifest.files)) {
    // Hashed name should contain an 8-char hash segment
    const hashPattern = /\.[a-f0-9]{8}\.(js|css)$/;
    assert.ok(hashPattern.test(hashed), `${hashed} doesn't match hash pattern`);

    // Hashed file should exist
    assert.ok(fs.existsSync(path.join(DIST, hashed)), `${hashed} not found in dist/`);
  }
});

test("HTML files reference hashed JS/CSS (not originals)", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "build-manifest.json"), "utf8"));
  const html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

  // Should NOT contain unhashed references
  for (const original of Object.keys(manifest.files)) {
    const baseName = path.basename(original);
    // Check for exact unhashed references like shared.js or shared.css
    const unhashed = new RegExp(`(src|href)=["'][^"']*${baseName.replace(/\./g, "\\.")}["']`);
    assert.ok(!unhashed.test(html), `index.html still references unhashed ${baseName}`);
  }
});

test("pages/ HTML files also have hashed references", () => {
  const pagesDir = path.join(DIST, "pages");
  if (!fs.existsSync(pagesDir)) return;

  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "build-manifest.json"), "utf8"));
  const pages = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".html"));
  assert.ok(pages.length > 0, "No HTML pages found");

  for (const page of pages) {
    const html = fs.readFileSync(path.join(pagesDir, page), "utf8");
    // Check at least one hashed reference exists
    const hasHashedRef = /\.[a-f0-9]{8}\.(js|css)/.test(html);
    assert.ok(hasHashedRef, `${page} has no cache-busted references`);
  }
});

// --- Minification Tests ---
test("JS files are minified (smaller than source)", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "build-manifest.json"), "utf8"));
  for (const [original, hashed] of Object.entries(manifest.files)) {
    if (!original.endsWith(".js")) continue;
    const srcSize = fs.statSync(path.join(__dirname, original)).size;
    const distSize = fs.statSync(path.join(DIST, hashed)).size;
    assert.ok(distSize < srcSize, `${hashed} (${distSize}B) not smaller than source (${srcSize}B)`);
  }
});

test("CSS files are minified (smaller than source)", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "build-manifest.json"), "utf8"));
  for (const [original, hashed] of Object.entries(manifest.files)) {
    if (!original.endsWith(".css")) continue;
    const srcSize = fs.statSync(path.join(__dirname, original)).size;
    const distSize = fs.statSync(path.join(DIST, hashed)).size;
    assert.ok(distSize < srcSize, `${hashed} (${distSize}B) not smaller than source (${srcSize}B)`);
  }
});

test("HTML files are minified (no multi-line comments)", () => {
  const html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
  assert.ok(!html.includes("<!--"), "index.html still contains HTML comments");
});

// --- Summary ---
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
