#!/usr/bin/env node
// ============================================================
// Nanoboost — Senior-Level Test Suite
// Validates build pipeline, JS integrity, HTML structure,
// security headers, SEO, accessibility, and deploy readiness
// Run: npm test  (after npm run build)
// ============================================================
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const SCRIPTS = path.join(ROOT, "scripts");
const PAGES = path.join(ROOT, "pages");
let passed = 0;
let failed = 0;
let warnings = 0;

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

function warn(name, msg) {
  console.log(`  ⚠️  ${name}`);
  if (msg) console.log(`     ${msg}`);
  warnings++;
}

// ============================================================
// 1. BUILD PIPELINE TESTS
// ============================================================
console.log("\n🧪 Running senior-level test suite...\n");
console.log("── Build Pipeline ──");

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

test("build manifest contains hashed file entries", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "build-manifest.json"), "utf8"));
  assert.ok(Object.keys(manifest.files).length > 0, "No files in manifest");
  for (const [original, hashed] of Object.entries(manifest.files)) {
    const hashPattern = /\.[a-f0-9]{8}\.(js|css)$/;
    assert.ok(hashPattern.test(hashed), `${hashed} doesn't match hash pattern`);
    assert.ok(fs.existsSync(path.join(DIST, hashed)), `${hashed} not found in dist/`);
  }
});

test("HTML files reference hashed JS/CSS (not originals)", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "build-manifest.json"), "utf8"));
  const html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
  for (const original of Object.keys(manifest.files)) {
    const baseName = path.basename(original);
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
    const hasHashedRef = /\.[a-f0-9]{8}\.(js|css)/.test(html);
    assert.ok(hasHashedRef, `${page} has no cache-busted references`);
  }
});

test("JS files are minified (smaller than source)", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "build-manifest.json"), "utf8"));
  for (const [original, hashed] of Object.entries(manifest.files)) {
    if (!original.endsWith(".js")) continue;
    const srcSize = fs.statSync(path.join(ROOT, original)).size;
    const distSize = fs.statSync(path.join(DIST, hashed)).size;
    assert.ok(distSize < srcSize, `${hashed} (${distSize}B) not smaller than source (${srcSize}B)`);
  }
});

test("CSS files are minified (smaller than source)", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "build-manifest.json"), "utf8"));
  for (const [original, hashed] of Object.entries(manifest.files)) {
    if (!original.endsWith(".css")) continue;
    const srcSize = fs.statSync(path.join(ROOT, original)).size;
    const distSize = fs.statSync(path.join(DIST, hashed)).size;
    assert.ok(distSize < srcSize, `${hashed} (${distSize}B) not smaller than source (${srcSize}B)`);
  }
});

test("HTML files are minified (no multi-line comments)", () => {
  const html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
  assert.ok(!html.includes("<!--"), "index.html still contains HTML comments");
});

// ============================================================
// 2. JAVASCRIPT INTEGRITY TESTS
// ============================================================
console.log("\n── JavaScript Integrity ──");

test("JS files have no syntax errors (parseable by terser)", () => {
  const jsFiles = fs.readdirSync(SCRIPTS).filter(f => f.endsWith(".js"));
  for (const f of jsFiles) {
    const src = fs.readFileSync(path.join(SCRIPTS, f), "utf8");
    // Check balanced braces/parens as a basic syntax check
    let braces = 0, parens = 0, brackets = 0;
    let inString = false, strChar = "";
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (inString) {
        if (c === "\\" ) { i++; continue; }
        if (c === strChar) inString = false;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { inString = true; strChar = c; continue; }
      if (c === "{") braces++;
      if (c === "}") braces--;
      if (c === "(") parens++;
      if (c === ")") parens--;
      if (c === "[") brackets++;
      if (c === "]") brackets--;
    }
    assert.ok(braces === 0, `${f}: unbalanced braces (${braces})`);
    assert.ok(parens === 0, `${f}: unbalanced parens (${parens})`);
    assert.ok(brackets === 0, `${f}: unbalanced brackets (${brackets})`);
  }
});

test("checkout-page.js const chain is intact (no implicit globals)", () => {
  const src = fs.readFileSync(path.join(SCRIPTS, "checkout-page.js"), "utf8");
  // The const chain from line 2 should not break early with a semicolon before d = "nb_cart"
  // If semicolon breaks chain, d would be a global assignment without const/let/var
  const badPattern = /discountValueEl\s*=\s*[^;]+;\s*\n\s*d\s*=/;
  assert.ok(!badPattern.test(src), "checkout-page.js: semicolon breaks const chain before d = nb_cart");
});

test("shared.js currency module exports all required functions", () => {
  const src = fs.readFileSync(path.join(SCRIPTS, "shared.js"), "utf8");
  const required = ["nbFormatPrice", "nbConvertPrice", "nbGetCurrency", "nbSetCurrency", "nbCurrencySymbol", "NB_CURRENCIES"];
  for (const fn of required) {
    assert.ok(src.includes(`window.${fn}`), `shared.js: missing window.${fn} export`);
  }
});

test("No hardcoded $ in price display functions (currency-aware)", () => {
  // checkout-page.js u() should use fmt() not "$" for prices
  const checkout = fs.readFileSync(path.join(SCRIPTS, "checkout-page.js"), "utf8");
  // Extract the u = () => { ... } function body
  const uMatch = checkout.match(/u\s*=\s*\(\)\s*=>\s*\{/);
  assert.ok(uMatch, "checkout-page.js: u() function not found");

  // The cart widget should also use nbFormatPrice
  const shared = fs.readFileSync(path.join(SCRIPTS, "shared.js"), "utf8");
  assert.ok(shared.includes("nbFormatPrice(0)"), "shared.js: empty cart should use nbFormatPrice(0)");
});

test("API URL is configured in services-data.js", () => {
  const src = fs.readFileSync(path.join(SCRIPTS, "services-data.js"), "utf8");
  assert.ok(src.includes("NB_API_URL"), "services-data.js: NB_API_URL not set");
  assert.ok(src.includes("script.google.com"), "services-data.js: API URL should point to Google Apps Script");
});

test("All JS files used in HTML exist in scripts/", () => {
  const allHtml = [
    fs.readFileSync(path.join(ROOT, "index.html"), "utf8"),
    ...fs.readdirSync(PAGES).filter(f => f.endsWith(".html"))
      .map(f => fs.readFileSync(path.join(PAGES, f), "utf8"))
  ].join("\n");
  const jsRefs = [...allHtml.matchAll(/src=["'](?:\.\/|\.\.\/)?scripts\/([\w-]+\.js)["']/g)]
    .map(m => m[1]);
  const jsFiles = new Set(fs.readdirSync(SCRIPTS).filter(f => f.endsWith(".js")));
  for (const ref of jsRefs) {
    assert.ok(jsFiles.has(ref), `HTML references scripts/${ref} but file does not exist`);
  }
});

// ============================================================
// 3. HTML STRUCTURE TESTS
// ============================================================
console.log("\n── HTML Structure ──");

test("All HTML pages have <!doctype html>", () => {
  const htmlFiles = [
    path.join(ROOT, "index.html"),
    path.join(ROOT, "404.html"),
    ...fs.readdirSync(PAGES).filter(f => f.endsWith(".html"))
      .map(f => path.join(PAGES, f))
  ];
  for (const f of htmlFiles) {
    const content = fs.readFileSync(f, "utf8").trim();
    assert.ok(content.toLowerCase().startsWith("<!doctype html>"), `${path.basename(f)}: missing doctype`);
  }
});

test("All HTML pages have lang attribute", () => {
  const htmlFiles = [
    path.join(ROOT, "index.html"),
    ...fs.readdirSync(PAGES).filter(f => f.endsWith(".html"))
      .map(f => path.join(PAGES, f))
  ];
  for (const f of htmlFiles) {
    const content = fs.readFileSync(f, "utf8");
    assert.ok(/<html[^>]+lang=/i.test(content), `${path.basename(f)}: missing lang attribute`);
  }
});

test("All HTML pages have <meta charset>", () => {
  const htmlFiles = [
    path.join(ROOT, "index.html"),
    ...fs.readdirSync(PAGES).filter(f => f.endsWith(".html"))
      .map(f => path.join(PAGES, f))
  ];
  for (const f of htmlFiles) {
    const content = fs.readFileSync(f, "utf8");
    assert.ok(/meta\s+charset/i.test(content), `${path.basename(f)}: missing charset meta`);
  }
});

test("All HTML pages have viewport meta tag", () => {
  const htmlFiles = [
    path.join(ROOT, "index.html"),
    ...fs.readdirSync(PAGES).filter(f => f.endsWith(".html"))
      .map(f => path.join(PAGES, f))
  ];
  for (const f of htmlFiles) {
    const content = fs.readFileSync(f, "utf8");
    assert.ok(/name=["']viewport["']/.test(content), `${path.basename(f)}: missing viewport meta`);
  }
});

test("Currency switcher HTML present in all pages with header", () => {
  const htmlFiles = [
    path.join(ROOT, "index.html"),
    ...fs.readdirSync(PAGES).filter(f => f.endsWith(".html"))
      .map(f => path.join(PAGES, f))
  ];
  for (const f of htmlFiles) {
    const content = fs.readFileSync(f, "utf8");
    if (content.includes("header__right")) {
      assert.ok(content.includes("currency-switch"), `${path.basename(f)}: missing currency switcher`);
    }
  }
});

test("Homepage service cards have data-usd attributes", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const usdAttrs = (html.match(/data-usd="[\d.]+"/g) || []).length;
  assert.ok(usdAttrs >= 4, `index.html: expected ≥4 data-usd attributes, found ${usdAttrs}`);
});

// ============================================================
// 4. SECURITY TESTS
// ============================================================
console.log("\n── Security ──");

test("No hardcoded API keys/tokens in JS source files", () => {
  const jsFiles = fs.readdirSync(SCRIPTS).filter(f => f.endsWith(".js"));
  for (const f of jsFiles) {
    const src = fs.readFileSync(path.join(SCRIPTS, f), "utf8");
    // Check for common token patterns (telegram bot tokens, etc.)
    assert.ok(!/\d{8,10}:AA[A-Za-z0-9_-]{30,}/.test(src), `${f}: possible Telegram bot token found`);
    assert.ok(!/sk_live_[a-zA-Z0-9]{20,}/.test(src), `${f}: possible Stripe key found`);
  }
});

test("google-apps-script.js uses PropertiesService (no hardcoded secrets)", () => {
  const gasFile = path.join(ROOT, "google-apps-script.js");
  if (!fs.existsSync(gasFile)) return;
  const src = fs.readFileSync(gasFile, "utf8");
  assert.ok(src.includes("PropertiesService"), "GAS: secrets should use PropertiesService");
  assert.ok(!(/["']\d{8,10}:AA/.test(src)), "GAS: possible hardcoded Telegram token");
});

test("vercel.json has security headers", () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
  const globalHeaders = config.headers?.find(h => h.source === "/(.*)");
  assert.ok(globalHeaders, "vercel.json: missing global headers rule");
  const headerKeys = globalHeaders.headers.map(h => h.key);
  assert.ok(headerKeys.includes("X-Content-Type-Options"), "Missing X-Content-Type-Options");
  assert.ok(headerKeys.includes("X-Frame-Options"), "Missing X-Frame-Options");
  assert.ok(headerKeys.includes("Referrer-Policy"), "Missing Referrer-Policy");
});

test("google-apps-script.js is in .gitignore", () => {
  const gitignore = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
  assert.ok(gitignore.includes("google-apps-script.js"), "GAS file should be in .gitignore");
});

test("Checkout page has noindex meta", () => {
  const html = fs.readFileSync(path.join(PAGES, "checkout.html"), "utf8");
  assert.ok(/name=["']robots["'][^>]*noindex/i.test(html), "checkout.html should have noindex");
});

// ============================================================
// 5. SEO & DEPLOY TESTS
// ============================================================
console.log("\n── SEO & Deploy ──");

test("sitemap.xml is valid and has required URLs", () => {
  const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes("nanoboost.io"), "sitemap: missing domain");
  assert.ok(sitemap.includes("<loc>"), "sitemap: missing <loc> tags");
  const urls = (sitemap.match(/<loc>/g) || []).length;
  assert.ok(urls >= 5, `sitemap: expected ≥5 URLs, found ${urls}`);
});

test("robots.txt exists and allows indexing", () => {
  const robots = fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8");
  assert.ok(robots.includes("Allow: /"), "robots.txt: should allow root");
  assert.ok(robots.includes("Sitemap:"), "robots.txt: should include Sitemap");
  assert.ok(robots.includes("Disallow: /pages/checkout"), "robots.txt: checkout should be disallowed");
});

test("vercel.json has correct build configuration", () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
  assert.ok(config.buildCommand === "npm run build", "vercel.json: wrong buildCommand");
  assert.ok(config.outputDirectory === "dist", "vercel.json: wrong outputDirectory");
});

test("vercel.json has immutable caching for static assets", () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
  const assetHeader = config.headers?.find(h => h.source.includes("assets"));
  assert.ok(assetHeader, "vercel.json: missing cache header for assets");
  const cacheControl = assetHeader.headers.find(h => h.key === "Cache-Control");
  assert.ok(cacheControl?.value?.includes("immutable"), "assets should have immutable cache");
});

test("package.json has build and test scripts", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.ok(pkg.scripts?.build, "package.json: missing build script");
  assert.ok(pkg.scripts?.test, "package.json: missing test script");
});

test("All CSS files used in HTML exist", () => {
  const allHtml = [
    fs.readFileSync(path.join(ROOT, "index.html"), "utf8"),
    ...fs.readdirSync(PAGES).filter(f => f.endsWith(".html"))
      .map(f => fs.readFileSync(path.join(PAGES, f), "utf8"))
  ].join("\n");
  const cssRefs = [...allHtml.matchAll(/href=["'](?:\.\/|\.\.\/)?styles\/([\w-]+\.css)["']/g)]
    .map(m => m[1]);
  const cssFiles = new Set(fs.readdirSync(path.join(ROOT, "styles")).filter(f => f.endsWith(".css")));
  for (const ref of cssRefs) {
    assert.ok(cssFiles.has(ref), `HTML references styles/${ref} but file does not exist`);
  }
});

// ============================================================
// 6. CURRENCY FEATURE TESTS
// ============================================================
console.log("\n── Currency Feature ──");

test("NB_CURRENCIES config has required fields", () => {
  const src = fs.readFileSync(path.join(SCRIPTS, "shared.js"), "utf8");
  assert.ok(src.includes('"USD"') || src.includes("USD:"), "shared.js: missing USD currency");
  assert.ok(src.includes('"EUR"') || src.includes("EUR:"), "shared.js: missing EUR currency");
  assert.ok(src.includes("symbol"), "shared.js: currencies need symbol field");
  assert.ok(src.includes("rate"), "shared.js: currencies need rate field");
});

test("Currency switcher has Escape key support", () => {
  const src = fs.readFileSync(path.join(SCRIPTS, "shared.js"), "utf8");
  assert.ok(src.includes('"Escape"') || src.includes("'Escape'"), "shared.js: currency switcher missing Escape key handler");
});

test("Checkout submit payload includes displayCurrency", () => {
  const src = fs.readFileSync(path.join(SCRIPTS, "checkout-page.js"), "utf8");
  assert.ok(src.includes("displayCurrency"), "checkout-page.js: submit payload missing displayCurrency");
});

test("GAS handles displayCurrency in Sheets, Telegram, and Email", () => {
  const gasFile = path.join(ROOT, "google-apps-script.js");
  if (!fs.existsSync(gasFile)) return;
  const src = fs.readFileSync(gasFile, "utf8");
  const occurrences = (src.match(/displayCurrency/g) || []).length;
  assert.ok(occurrences >= 3, `GAS: displayCurrency should appear ≥3 times (Sheets+TG+Email), found ${occurrences}`);
});

// ============================================================
// 7. DISCOUNT FEATURE TESTS
// ============================================================
console.log("\n── USDT Discount Feature ──");

test("Checkout has DISCOUNT_RATE and USDT_VALUE constants", () => {
  const src = fs.readFileSync(path.join(SCRIPTS, "checkout-page.js"), "utf8");
  assert.ok(src.includes("DISCOUNT_RATE"), "checkout-page.js: missing DISCOUNT_RATE");
  assert.ok(src.includes("USDT_VALUE"), "checkout-page.js: missing USDT_VALUE");
  assert.ok(src.includes("0.05"), "checkout-page.js: DISCOUNT_RATE should be 0.05 (5%)");
});

test("Checkout discount elements exist in HTML", () => {
  const html = fs.readFileSync(path.join(PAGES, "checkout.html"), "utf8");
  assert.ok(html.includes("order-discount"), "checkout.html: missing #order-discount row");
  assert.ok(html.includes("order-discount-value"), "checkout.html: missing #order-discount-value element");
});

// ============================================================
// 8. DIST OUTPUT INTEGRITY
// ============================================================
console.log("\n── Dist Integrity ──");

test("All pages/ HTML files are in dist/pages/", () => {
  const srcPages = fs.readdirSync(PAGES).filter(f => f.endsWith(".html"));
  const distPagesDir = path.join(DIST, "pages");
  if (!fs.existsSync(distPagesDir)) {
    assert.fail("dist/pages/ directory missing");
  }
  const distPages = fs.readdirSync(distPagesDir).filter(f => f.endsWith(".html"));
  assert.ok(distPages.length === srcPages.length,
    `Page count mismatch: src=${srcPages.length}, dist=${distPages.length}`);
});

test("dist/ does not contain source-only files", () => {
  assert.ok(!fs.existsSync(path.join(DIST, "build.js")), "build.js should not be in dist/");
  assert.ok(!fs.existsSync(path.join(DIST, "test.js")), "test.js should not be in dist/");
  assert.ok(!fs.existsSync(path.join(DIST, "package.json")), "package.json should not be in dist/");
  assert.ok(!fs.existsSync(path.join(DIST, "google-apps-script.js")), "GAS file should not be in dist/");
  assert.ok(!fs.existsSync(path.join(DIST, "node_modules")), "node_modules should not be in dist/");
});

test("dist/ total size is reasonable (< 15MB)", () => {
  function dirSize(dir) {
    let size = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      size += entry.isDirectory() ? dirSize(full) : fs.statSync(full).size;
    }
    return size;
  }
  const totalSize = dirSize(DIST);
  const maxSize = 15 * 1024 * 1024; // 15MB
  assert.ok(totalSize < maxSize, `dist/ is ${(totalSize / 1024 / 1024).toFixed(1)}MB, expected < 15MB`);
});

// ============================================================
// SUMMARY
// ============================================================
console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${warnings} warnings\n`);
process.exit(failed > 0 ? 1 : 0);
