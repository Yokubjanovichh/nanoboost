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

  // --- Regenerate sitemap.xml from BE catalog ---
  // Pulls /public/games + /public/services so per-game + per-service URLs
  // land in the sitemap without anyone hand-editing the XML. If the BE is
  // unreachable we keep the repo's static fallback so the build never
  // ships a sitemap that's worse than the one we already had.
  await regenerateSitemap(PUBLIC_API_URL).catch((err) => {
    console.warn("⚠️  sitemap regeneration skipped:", err.message);
  });

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

async function regenerateSitemap(apiBase) {
  console.log("\n🗺  Regenerating sitemap.xml...");
  const today = new Date().toISOString().slice(0, 10);
  const SITE = "https://nanoboost.io";
  const xmlEscape = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const fetchJson = async (path) => {
    const res = await fetch(apiBase + path, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("HTTP " + res.status + " " + path);
    return res.json();
  };

  let games = [];
  let services = [];
  try {
    const gResp = await fetchJson("/public/games");
    games = Array.isArray(gResp) ? gResp : gResp.items || [];
    // BE caps page_size at 100; paginate so we still pick up every
    // published service for the sitemap even as the catalog grows.
    let page = 1;
    while (page < 20) {
      const sResp = await fetchJson("/public/services?page_size=100&page=" + page);
      const items = Array.isArray(sResp) ? sResp : sResp.items || [];
      services = services.concat(items);
      const total = (sResp && sResp.total) || services.length;
      if (items.length === 0 || services.length >= total) break;
      page += 1;
    }
    console.log(`   fetched ${games.length} games + ${services.length} services`);
  } catch (err) {
    console.warn("   BE unreachable (" + err.message + ") — keeping static sitemap.xml");
    return;
  }

  const url = (loc, lastmod, changefreq, priority) =>
    `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

  const blocks = [];
  // Static URLs
  blocks.push(url(SITE + "/", today, "weekly", "1.0"));
  blocks.push(url(SITE + "/pages/services.html", today, "weekly", "0.9"));
  blocks.push(url(SITE + "/pages/why-us.html", today, "monthly", "0.7"));
  blocks.push(url(SITE + "/pages/faq.html", today, "monthly", "0.7"));
  blocks.push(url(SITE + "/pages/contact.html", today, "monthly", "0.7"));

  // Per-game URLs
  for (const g of games) {
    if (!g || !g.slug) continue;
    blocks.push(
      url(
        SITE + "/pages/game.html?game=" + encodeURIComponent(g.slug),
        today,
        "daily",
        "0.9",
      ),
    );
  }

  // Per-service URLs
  for (const s of services) {
    if (!s || !s.slug) continue;
    blocks.push(
      url(
        SITE + "/pages/services.html?service=" + encodeURIComponent(s.slug),
        today,
        "weekly",
        "0.8",
      ),
    );
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    blocks.join("\n") +
    "\n</urlset>\n";

  fs.writeFileSync(path.join(DIST, "sitemap.xml"), xml);
  console.log(`   sitemap.xml written (${blocks.length} URLs)`);
}
