#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { minify: terserMinify } = require("terser");
const CleanCSS = require("clean-css");
const { minify: htmlMinify } = require("html-minifier-terser");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const HASH_LEN = 8;

// --- Helpers ---
function contentHash(buf) {
  return crypto.createHash("md5").update(buf).digest("hex").slice(0, HASH_LEN);
}

function hashedName(file, hash) {
  const ext = path.extname(file);
  const base = path.basename(file, ext);
  return `${base}.${hash}${ext}`;
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDirSync(s, d) : fs.copyFileSync(s, d);
  }
}

// --- Main ---
(async () => {
  const t0 = Date.now();

  // Clean dist/
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // Copy assets
  copyDirSync(path.join(ROOT, "assets"), path.join(DIST, "assets"));

  // Copy static files
  for (const f of ["manifest.json", "robots.txt", "sitemap.xml", "yandex_82d55a47f0d69b4d.html"]) {
    if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
  }

  // fileMap: originalRelPath → hashedFileName (for HTML rewriting)
  const fileMap = {};

  // --- Minify JS ---
  console.log("\n📦 Minifying JavaScript...");
  fs.mkdirSync(path.join(DIST, "scripts"), { recursive: true });
  const jsFiles = fs
    .readdirSync(path.join(ROOT, "scripts"))
    .filter((f) => f.endsWith(".js"));
  for (const f of jsFiles) {
    const src = fs.readFileSync(path.join(ROOT, "scripts", f), "utf8");
    const result = await terserMinify(src, { compress: true, mangle: true });
    if (result.error) throw result.error;
    const minified = Buffer.from(result.code, "utf8");
    const hash = contentHash(minified);
    const hName = hashedName(f, hash);
    fs.writeFileSync(path.join(DIST, "scripts", hName), minified);
    fileMap[`scripts/${f}`] = `scripts/${hName}`;
    console.log(`  ${f} → ${hName}`);
  }

  // --- Minify CSS ---
  console.log("\n🎨 Minifying CSS...");
  fs.mkdirSync(path.join(DIST, "styles"), { recursive: true });
  const cleanCSS = new CleanCSS({ level: 2 });

  // Root style.css
  const rootCssSrc = fs.readFileSync(path.join(ROOT, "style.css"), "utf8");
  const rootCssOut = cleanCSS.minify(rootCssSrc);
  if (rootCssOut.errors.length) throw new Error(rootCssOut.errors.join("\n"));
  const rootCssBuf = Buffer.from(rootCssOut.styles, "utf8");
  const rootCssHash = contentHash(rootCssBuf);
  const rootCssHashed = hashedName("style.css", rootCssHash);
  fs.writeFileSync(path.join(DIST, rootCssHashed), rootCssBuf);
  fileMap["style.css"] = rootCssHashed;
  console.log(`  style.css → ${rootCssHashed}`);

  // styles/*.css
  const cssFiles = fs.readdirSync(path.join(ROOT, "styles")).filter((f) => f.endsWith(".css"));
  for (const f of cssFiles) {
    const src = fs.readFileSync(path.join(ROOT, "styles", f), "utf8");
    const out = cleanCSS.minify(src);
    if (out.errors.length) throw new Error(out.errors.join("\n"));
    const buf = Buffer.from(out.styles, "utf8");
    const hash = contentHash(buf);
    const hName = hashedName(f, hash);
    fs.writeFileSync(path.join(DIST, "styles", hName), buf);
    fileMap[`styles/${f}`] = `styles/${hName}`;
    console.log(`  ${f} → ${hName}`);
  }

  // --- Rewrite HTML references & Minify ---
  console.log("\n📄 Minifying HTML (with cache-busted refs)...");
  fs.mkdirSync(path.join(DIST, "pages"), { recursive: true });

  const htmlOpts = {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
  };

  // Inject runtime API URL via global before bootstrap script reads it.
  const PUBLIC_API_URL =
    process.env.NB_API_URL ||
    "https://nanoboost-api-production.up.railway.app/api/v1";
  // GA4 measurement ID is empty by default so dev/staging stay tracking-free.
  // Production builds: NB_GA4_ID=G-XXXXXXXXXX node build.js
  const GA4_ID = process.env.NB_GA4_ID || "";
  const headSnippet = `<script>window.NB_PUBLIC_API_URL=${JSON.stringify(
    PUBLIC_API_URL,
  )};window.NB_GA4_MEASUREMENT_ID=${JSON.stringify(GA4_ID)};</script>`;

  function rewriteRefs(html) {
    // Replace each original filename with its hashed version
    // Handles all prefix patterns: ./, ../, or no prefix
    for (const [original, hashed] of Object.entries(fileMap)) {
      // Escape dots for regex
      const escaped = original.replace(/\./g, "\\.");
      // Match href="[prefix]original" or src="[prefix]original"
      const re = new RegExp(`((?:href|src)=["'])([./]*)(${escaped})(["'])`, "g");
      html = html.replace(re, `$1$2${hashed}$4`);
    }
    // Inject the runtime globals once per page, right after <head>.
    html = html.replace(/<head[^>]*>/i, (match) => match + headSnippet);
    return html;
  }

  // Root HTML files
  for (const f of fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"))) {
    let content = fs.readFileSync(path.join(ROOT, f), "utf8");
    content = rewriteRefs(content);
    const minified = await htmlMinify(content, htmlOpts);
    fs.writeFileSync(path.join(DIST, f), minified);
    console.log(`  ${f} ✓`);
  }

  // pages/ HTML files
  for (const f of fs.readdirSync(path.join(ROOT, "pages")).filter((f) => f.endsWith(".html"))) {
    let content = fs.readFileSync(path.join(ROOT, "pages", f), "utf8");
    content = rewriteRefs(content);
    const minified = await htmlMinify(content, htmlOpts);
    fs.writeFileSync(path.join(DIST, "pages", f), minified);
    console.log(`  pages/${f} ✓`);
  }

  // --- Write build manifest ---
  const manifest = {
    buildTime: new Date().toISOString(),
    files: fileMap,
  };
  fs.writeFileSync(path.join(DIST, "build-manifest.json"), JSON.stringify(manifest, null, 2));

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ Build complete → dist/ (${elapsed}s)`);
  console.log(`   ${Object.keys(fileMap).length} files cache-busted`);
})();
