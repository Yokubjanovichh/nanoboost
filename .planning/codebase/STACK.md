# Technology Stack

## Languages

| Language          | Usage                                | Version / Notes                             |
| ----------------- | ------------------------------------ | ------------------------------------------- |
| HTML5             | Pages (`index.html`, `pages/*.html`) | Semantic markup, minified single-line       |
| CSS3              | Styles (`style.css`, `styles/*.css`) | Custom properties, `clamp()`, Grid, Flexbox |
| JavaScript (ES6+) | Scripts (`scripts/*.js`)             | Vanilla JS, no transpiler, no modules       |

## Runtime & Build

- **No Node.js / npm** — no `package.json`, no build pipeline
- **No bundler** — raw files served directly (Webpack, Vite, etc. absent)
- **No transpiler** — no Babel, TypeScript, or PostCSS
- **No minification tool** — HTML is manually minified (single-line), CSS/JS are not minified

## Frameworks & Libraries

- **None** — pure vanilla HTML/CSS/JS, no React/Vue/Angular/jQuery

## Fonts

| Font       | Source                                  | Weights                                              |
| ---------- | --------------------------------------- | ---------------------------------------------------- |
| LEMON MILK | Custom `.woff` files in `assets/fonts/` | 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold) |
| Poppins    | Google Fonts CDN                        | 300, 400, 500, 600, 700, 800                         |

## Image Format

- All images in **WebP** format (`assets/images/*.webp`)
- Icons: `logo.png`, `main-logo.svg`, `logo-text.webp` in `assets/icons/`
- Total: 20 images, 3 icon files

## CSS Features Used

- CSS Custom Properties (`--container-max`, `--hero-shell-height`, etc.)
- `clamp()` for fluid typography and spacing
- CSS Grid & Flexbox layouts
- `backdrop-filter: blur()` for glassmorphism
- CSS Masks (`-webkit-mask`, `mask-composite`) for gradient borders
- `@keyframes` animations (shimmer, shine, border glow, flow)
- `content-visibility: auto` for rendering optimization
- `prefers-reduced-motion` media query support
- Responsive breakpoints: 480px, 767px, 931px, 980px, 1600px
- Landscape orientation queries: `(max-height: 500px)`

## JavaScript Features Used

- `localStorage` for cart persistence
- `fetch()` API for form submissions
- `history.pushState()` for URL state management
- `IntersectionObserver` for animated borders
- Touch events (`touchstart`, `touchmove`, `touchend`) for mobile slider
- `requestAnimationFrame` for smooth animations
- Event delegation patterns
- Template literals for HTML generation
- Destructuring, arrow functions, `const`/`let`

## Backend

- **Google Apps Script** deployed as Web App
- Endpoint: `https://script.google.com/macros/s/AKfycby...exec`
- Handles: order processing, contact form submissions

## Hosting

- Static site at `nanoboost.io`
- No server-side rendering
- SEO: `sitemap.xml`, `robots.txt`, JSON-LD structured data, OpenGraph meta tags
