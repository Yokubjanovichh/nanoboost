# Architecture

## Pattern: Multi-Page Static Site (MPA)
No SPA framework. Each page is a standalone HTML file with shared CSS/JS imports.

## Layers

### 1. Presentation Layer (HTML)
- `index.html` — Landing page (hero, games, services, how-it-works, FAQ, testimonials)
- `pages/*.html` — Sub-pages (9 pages: gta5, services, checkout, contact, why-us, faq, terms, refund, privacy)
- All HTML is **minified to single lines** (hard to read/edit in source)

### 2. Styling Layer (CSS)
- `style.css` — Index page specific styles (hero, games grid)
- `styles/shared.css` — Shared across ALL pages (header, footer, nav, cart widget, FAQ, testimonials, how-it-works, benefits, services grid, animated borders)
- `styles/<page>-page.css` — Page-specific styles (service-page, checkout-page, contact-page, gta5-page, faq-page, why-us-page, privacy-policy)
- **No CSS preprocessor** (no Sass/Less)

### 3. Logic Layer (JavaScript)
- `scripts/shared.js` — Core module loaded on ALL pages:
  - Navigation (burger menu, multi-level dropdown)
  - Cart system (localStorage CRUD, widget render, open/close)
  - FAQ accordion
  - Testimonials drag slider with velocity/momentum
  - Animated border observer
  - Search with typeahead/autocomplete
  - Email copy-to-clipboard
  - Animated placeholder cycling
- `scripts/services-data.js` — Data layer (service definitions, API URL, config)
- `scripts/service-page.js` — Service detail page logic (dynamic rendering, dropdown, add-to-cart)
- `scripts/checkout-page.js` — Checkout form handling (validation, submission)
- `scripts/contact-page.js` — Contact form handling
- `scripts/gta5-page.js` — GTA5 page (platform tabs, card rendering)

### 4. Backend Layer (Google Apps Script)
- `google-apps-script.js` — Server-side code (NOT served to browser)
  - `doPost()` handler for checkout and contact
  - Google Sheets logging
  - Telegram + Email notifications
  - Order number generation

### 5. Data Layer
- `scripts/services-data.js` contains `NB_SERVICE_CONFIG` — central registry of all services
  - 12 GTA5 services across PS/Xbox/PC platforms
  - Each service: slug, title, seoTitle, description, image, options (name/price), whatYouGet sections
- `NB_GTA5_SERVICES` — grouped view by platform for listing pages
- Cart data in `localStorage` (`nb_cart` key)

## Rendering Strategy
- **Static HTML** with **client-side dynamic rendering**
- Service pages use URL query params (`?service=cash-ps`) to dynamically render content from `NB_SERVICE_CONFIG`
- GTA5 page renders service cards from `NB_GTA5_SERVICES` data
- No server-side rendering, no static site generator

## Navigation Architecture
- Multi-level mega-dropdown: Games → Platform → Services
- Mobile: Slide-in drawer with breadcrumb navigation
- URL routing: Simple file-based (`/pages/services.html?service=cash-ps`)
- `history.pushState()` for related service navigation without reload

## State Management
- **Cart**: `localStorage` → read/write via `nbGetCart()` / `nbSaveCart()`
- **UI state**: CSS classes (`is-open`, `is-active`, `is-dragging`, `has-game`, `has-platform`)
- **URL state**: Query parameters for service selection, platform tabs
