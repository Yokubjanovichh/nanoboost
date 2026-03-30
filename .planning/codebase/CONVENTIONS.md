# Conventions & Patterns

## CSS Conventions

### Naming: BEM-like
- Block: `.service-card`, `.cart-widget`, `.faq-item`, `.testimonial`
- Element: `.service-card__img`, `.cart-widget__panel`, `.faq-item__trigger`
- Modifier: `.service-card--custom`, `.dropdown__subitem--active`, `.dropdown__subitem--unavailable`
- State classes: `.is-open`, `.is-active`, `.is-dragging`, `.is-focused`, `.has-game`, `.has-platform`

### CSS Custom Properties
- Layout: `--container-max`, `--container-max-xl`, `--hero-shell-height`
- Spacing: `--gap-header-main`, `--gap-main-footer`
- Component: `--border-size`, `--speed`, `--g1`, `--g2`, `--g3` (animated borders)
- Utility: `--nb-scrollbar-w`, `--t-gap`

### Responsive Strategy
- Mobile-first base, enhanced for larger screens
- Breakpoints: 480px, 767px, 980px, 1600px
- Landscape adaptation: `(orientation: landscape) and (max-height: 500px)`
- Fluid values via `clamp()` throughout

### Page Scoping
- Body class: `.page--service`, `.page--checkout`, etc.
- Page-specific CSS overrides via body class prefix

## JavaScript Conventions

### Global Namespace
- Functions prefixed with `NB_` or `nb`: `NB_addToCart()`, `nbGetCart()`, `nbSaveCart()`
- Config objects prefixed with `NB_`: `NB_SERVICE_CONFIG`, `NB_GTA5_SERVICES`, `NB_API_URL`
- No module system (no `import`/`export`)

### DOM Patterns
- `document.querySelector()` / `querySelectorAll()` for DOM access
- Event listeners via `addEventListener()`
- HTML generation via template literals and `innerHTML`
- CSS class toggling via `classList.add()` / `.remove()` / `.toggle()`

### Data Patterns
- Service config as flat object keyed by slug: `NB_SERVICE_CONFIG["cash-ps"]`
- Cart items as array in localStorage: `[{ key, name, option, price, qty, image }]`
- Form data as JSON POST body: `{ type, email, discord, ... }`

### Error Handling
- `try/catch` around fetch calls
- User-facing error via `alert()` or modal
- No global error handler or logging service

### Initialization Pattern
- `DOMContentLoaded` event listener wrapping page init
- Shared.js self-initializes on load
- Page-specific JS expects DOM elements to exist

## HTML Conventions
- **Minified**: All HTML files are single-line (not human-readable in source)
- Semantic elements: `<header>`, `<main>`, `<footer>`, `<section>`, `<nav>`
- SVG inline for icons (chevrons, stars, logos)
- Data attributes: `data-game`, `data-platform`, `data-slug`
- Accessibility: `aria-expanded`, `aria-selected`, `aria-disabled`, `aria-label`, `role` attributes

## SEO Conventions
- JSON-LD structured data (Organization schema) in `index.html`
- OpenGraph meta tags (`og:title`, `og:description`, `og:image`, `og:url`)
- Canonical URLs in `<link rel="canonical">`
- `sitemap.xml` with all pages and dynamic service URLs
- Meta descriptions per page

## Git / Version Control
- No `.gitignore` detected
- No branch strategy visible
- `.planning/` directory for GSD workflow
