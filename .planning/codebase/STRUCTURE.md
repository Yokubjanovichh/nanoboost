# Directory Structure

```
nanoboos/                          # Root (workspace)
├── index.html                     # Landing page (minified, single-line)
├── style.css                      # Index page styles
├── google-apps-script.js          # Backend code (Google Apps Script — NOT served)
├── sitemap.xml                    # SEO sitemap (all pages + service URLs)
├── robots.txt                     # Allow all, sitemap reference
│
├── pages/                         # Sub-pages (HTML)
│   ├── gta5.html                  # GTA5 services listing (platform tabs)
│   ├── services.html              # Individual service detail page
│   ├── checkout.html              # Checkout / order form
│   ├── contact.html               # Contact form
│   ├── why-us.html                # Why choose us page
│   ├── faq.html                   # FAQ page
│   ├── terms-of-service.html      # Legal: Terms of Service
│   ├── refund-policy.html         # Legal: Refund Policy
│   └── privacy-policy.html        # Legal: Privacy Policy
│
├── scripts/                       # JavaScript
│   ├── shared.js                  # Core: nav, cart, FAQ, slider, search (~600 lines)
│   ├── services-data.js           # Data: service config, API URL (~400 lines)
│   ├── service-page.js            # Service detail page logic
│   ├── checkout-page.js           # Checkout form logic
│   ├── contact-page.js            # Contact form logic
│   └── gta5-page.js               # GTA5 listing page logic
│
├── styles/                        # CSS
│   ├── shared.css                 # Shared: header, footer, nav, cart widget, sections
│   ├── service-page.css           # Service detail page styles
│   ├── checkout-page.css          # Checkout page styles
│   ├── contact-page.css           # Contact page styles
│   ├── gta5-page.css              # GTA5 page styles
│   ├── faq-page.css               # FAQ page styles
│   ├── why-us-page.css            # Why Us page styles
│   └── privacy-policy.css         # Privacy/legal pages styles
│
├── assets/                        # Static assets
│   ├── fonts/                     # Custom fonts
│   │   ├── LEMONMILK-Light.woff
│   │   ├── LEMONMILK-Regular.woff
│   │   ├── LEMONMILK-Medium.woff
│   │   └── LEMONMILK-Bold.woff
│   │
│   ├── icons/                     # Logo assets
│   │   ├── main-logo.svg          # SVG logo
│   │   ├── logo.png               # PNG logo
│   │   └── logo-text.webp         # Logo text image
│   │
│   └── images/                    # Page images (all .webp)
│       ├── mainBg.webp            # Background image
│       ├── gta5.webp              # GTA5 hero/banner
│       ├── games1-4.webp          # Game cards (desktop)
│       ├── mobgames1-4.webp       # Game cards (mobile)
│       ├── services1-4.webp       # Service card images
│       ├── custom-service.webp    # Custom service card
│       ├── unlock-all.webp        # Unlock All service
│       ├── shield.webp            # Security benefit icon
│       ├── rocket.webp            # Speed benefit icon
│       ├── support.webp           # Support benefit icon
│       └── buttons.webp           # Controllers benefit icon
│
└── .planning/                     # GSD planning directory
    └── codebase/                  # Codebase mapping (this)
```

## File Loading Order (per page)
1. `styles/shared.css` — Shared styles (all pages)
2. `styles/<page>-page.css` — Page-specific styles
3. `style.css` — Index-only styles (only on `index.html`)
4. `scripts/services-data.js` — Data config (pages that need services)
5. `scripts/shared.js` — Core JS (all pages)
6. `scripts/<page>-page.js` — Page-specific JS

## Naming Conventions
- HTML pages: `kebab-case.html`
- CSS files: `<page>-page.css` (matching HTML page name)
- JS files: `<page>-page.js` (matching HTML page name)
- Images: `camelCase.webp` or `kebab-case.webp` (inconsistent)
- Fonts: `UPPERCASE-Weight.woff`
