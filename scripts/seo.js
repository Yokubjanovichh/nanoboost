// Per-page SEO template engine. Two entry points:
//   applyGameSEO(game, faqs)    — game.html?game={slug}
//   applyServiceSEO(service)    — pages/services.html?service={slug}
//
// Both swap title / description / canonical / OG / Twitter and re-emit
// the structured-data blocks Googlebot actually rewards (VideoGame +
// FAQPage on game pages, Product/AggregateOffer on service pages).
// Calls are idempotent: each <script id="seo-..."> is replaced on every
// re-run, so dropdown swaps and SPA-style game changes never duplicate
// or stack JSON-LD nodes.

(function () {
  "use strict";

  const SITE_ORIGIN = "https://nanoboost.io";
  const DEFAULT_OG_IMAGE = SITE_ORIGIN + "/assets/icons/logo-text.webp";

  // Pretty platform names so VideoGame.gamePlatform matches what search
  // engines fan out into platform-based queries (e.g. "PlayStation 5").
  const PLATFORM_LABEL = {
    ps: "PlayStation 5",
    ps5: "PlayStation 5",
    ps4: "PlayStation 4",
    "ps4/ps5": "PlayStation 4, PlayStation 5",
    xbox: "Xbox Series X|S, Xbox One",
    "xbox-one": "Xbox One",
    "xbox-series": "Xbox Series X|S",
    pc: "PC",
  };

  // Loose normalizer for SERVICE_CONFIG.platform strings ("PS4/PS5",
  // "Xbox One/Series", "PC") that came back from the backend already.
  function prettyPlatformLabel(raw) {
    if (!raw) return "";
    const s = String(raw).trim();
    const lower = s.toLowerCase();
    if (PLATFORM_LABEL[lower]) return PLATFORM_LABEL[lower];
    if (/ps5|ps4|playstation/.test(lower)) return "PlayStation";
    if (/xbox/.test(lower)) return "Xbox";
    if (/^pc$/.test(lower) || /windows/.test(lower)) return "PC";
    return s;
  }

  function uniqJoin(arr, sep) {
    return Array.from(new Set(arr.filter(Boolean))).join(sep);
  }

  function setMeta(selector, attr, value) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.setAttribute(attr, value);
  }

  function setLink(rel, href) {
    let el = document.querySelector('link[rel="' + rel + '"]');
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  }

  function setTitle(title) {
    document.title = title;
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[name="twitter:title"]', "content", title);
  }

  function setDescription(desc) {
    setMeta('meta[name="description"]', "content", desc);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[name="twitter:description"]', "content", desc);
  }

  function setKeywords(keywords) {
    setMeta('meta[name="keywords"]', "content", keywords);
  }

  function setCanonical(url) {
    setLink("canonical", url);
    setMeta('meta[property="og:url"]', "content", url);
  }

  // Replace an existing <script id="..."> JSON-LD block or append a new
  // one. Idempotent so re-runs on dropdown switches don't stack nodes.
  function setJsonLd(id, data) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    if (!data) return;
    const node = document.createElement("script");
    node.type = "application/ld+json";
    node.id = id;
    node.textContent = JSON.stringify(data);
    document.head.appendChild(node);
  }

  // Strip the mini-markdown the public FAQ uses so FAQPage.acceptedAnswer
  // ends up as plain text Google can index (bold/links/etc. become noise
  // in rich results).
  function stripMarkdown(src) {
    return String(src || "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Derive Schema.org gamePlatform from a SERVICE_CONFIG.platform string
  // (admin-curated) or a list of service-platform values we've already
  // seen on the page. Returns an array so VideoGame.gamePlatform stays a
  // proper list.
  function platformsArrayFor(game) {
    if (!game) return [];
    if (Array.isArray(game.platforms) && game.platforms.length) {
      return game.platforms.map(prettyPlatformLabel);
    }
    if (typeof game.platforms === "string" && game.platforms) {
      return game.platforms
        .split(/[,/]/)
        .map((p) => prettyPlatformLabel(p.trim()))
        .filter(Boolean);
    }
    // Fall back to the canonical list — most titles support all three.
    return ["PlayStation 5, PlayStation 4", "Xbox Series X|S, Xbox One", "PC"];
  }

  // ---------------- Game page ---------------------------------------

  // game shape: { slug, name, platforms?, categories?, description?, heroImage? }
  // faqs shape: [{ question, answer }] — pass null/[] to drop FAQPage schema.
  function applyGameSEO(game, faqs) {
    if (!game || !game.name || !game.slug) return;

    const platforms = platformsArrayFor(game);
    const platformsCsv = uniqJoin(platforms, ", ");
    const categoriesCsv = Array.isArray(game.categories) && game.categories.length
      ? game.categories.join(", ")
      : "Cash, levels, items";

    const title =
      game.name +
      " Boosting Service" +
      (platformsCsv ? " — " + platformsCsv : "") +
      " | Nanoboost";

    const description =
      "Professional " +
      game.name +
      " boosting service." +
      (platformsCsv ? " Available on " + platformsCsv + "." : "") +
      " " +
      categoriesCsv +
      ". Fast delivery and safe methods. 24/7 support.";

    const keywords = uniqJoin(
      [
        game.name + " boost",
        "buy " + game.name,
        game.name + " boosting service",
        platformsCsv ? platformsCsv + " " + game.name : "",
        "professional " + game.name + " boosters",
        "Nanoboost " + game.name,
      ],
      ", ",
    );

    const canonical =
      SITE_ORIGIN + "/pages/game.html?game=" + encodeURIComponent(game.slug);

    setTitle(title);
    setDescription(description);
    setKeywords(keywords);
    setCanonical(canonical);

    setJsonLd("seo-videogame", {
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: game.name,
      url: canonical,
      image: game.heroImage || DEFAULT_OG_IMAGE,
      description:
        game.description ||
        "Professional " + game.name + " boosting service by Nanoboost.",
      gamePlatform: platforms,
    });

    // FAQPage requires at least one entry per Google's rich-result rules.
    // Skip the schema entirely on empty lists rather than emitting an
    // invalid block that triggers a Search Console warning.
    if (Array.isArray(faqs) && faqs.length > 0) {
      setJsonLd("seo-faqpage", {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(function (f) {
          return {
            "@type": "Question",
            name: String(f.question || ""),
            acceptedAnswer: {
              "@type": "Answer",
              text: stripMarkdown(f.answer),
            },
          };
        }),
      });
    } else {
      setJsonLd("seo-faqpage", null);
    }
  }

  // ---------------- Service page ------------------------------------

  // service shape: SERVICE_CONFIG entry returned by adaptService(), with
  // titleHtml / gameName / gameSlug / platform / optionsRaw / etc.
  function applyServiceSEO(service) {
    if (!service || !service.slug || !service.gameName) return;

    const platformPretty = prettyPlatformLabel(service.platform || "");
    const cleanTitle = String(service.titleHtml || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const title =
      cleanTitle +
      " for " +
      service.gameName +
      (platformPretty ? " — " + platformPretty : "") +
      " | Nanoboost";

    const shortDescription =
      (Array.isArray(service.description) && service.description[0]) ||
      "Fast delivery and safe methods.";

    const description =
      cleanTitle +
      " for " +
      service.gameName +
      (platformPretty ? " on " + platformPretty + ". " : ". ") +
      shortDescription +
      " Secure checkout.";

    const keywords = uniqJoin(
      [
        cleanTitle,
        service.gameName + " " + platformPretty + " boost",
        "buy " + cleanTitle,
        service.gameName + " boost service",
        "Nanoboost",
      ],
      ", ",
    );

    const canonical =
      SITE_ORIGIN + "/pages/services.html?service=" + encodeURIComponent(service.slug);

    setTitle(title);
    setDescription(description);
    setKeywords(keywords);
    setCanonical(canonical);

    // Aggregate the option price range so AggregateOffer reflects every
    // tier the dropdown exposes. Backend ships price_usd / price_eur on
    // each option and we surface the USD range in the schema.
    const prices = (Array.isArray(service.optionsRaw) ? service.optionsRaw : [])
      .map(function (o) {
        return Number(o && o.price_usd);
      })
      .filter(function (n) {
        return Number.isFinite(n) && n > 0;
      });
    const lowPrice = prices.length ? Math.min.apply(null, prices) : null;
    const highPrice = prices.length ? Math.max.apply(null, prices) : null;

    setJsonLd("seo-product", {
      "@context": "https://schema.org",
      "@type": "Product",
      name: cleanTitle,
      image: service.imageSrcDesktop || DEFAULT_OG_IMAGE,
      description: description,
      brand: { "@type": "Brand", name: "Nanoboost" },
      category: service.gameName,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: lowPrice != null ? lowPrice.toFixed(2) : "0.00",
        highPrice: highPrice != null ? highPrice.toFixed(2) : "0.00",
        offerCount: prices.length,
        availability: "https://schema.org/InStock",
        url: canonical,
      },
    });
  }

  window.NB_SEO = {
    applyGameSEO: applyGameSEO,
    applyServiceSEO: applyServiceSEO,
    prettyPlatformLabel: prettyPlatformLabel,
    stripMarkdown: stripMarkdown,
  };
})();
