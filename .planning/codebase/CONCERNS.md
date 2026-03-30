# Concerns & Technical Debt

## 🔴 Critical

### 1. Sensitive Credentials in Source Code
- **File**: `google-apps-script.js`
- **Issue**: Telegram Bot Token (`TG_BOT_TOKEN`), Chat ID (`TG_CHAT_ID`), Google Sheet ID (`SHEET_ID`), and notification email are hardcoded
- **Risk**: If this file is committed to a public repository, credentials are exposed
- **Mitigation**: This file runs server-side on Google Apps Script (not served to browser), but should use Script Properties instead of hardcoded values
- **Note**: The file exists in the workspace for reference/deployment but is NOT linked from any HTML page

### 2. No Server-Side Input Validation
- **File**: `google-apps-script.js` `doPost()`
- **Issue**: The `doPost` handler parses JSON and writes directly to Google Sheets with minimal sanitization
- **Risk**: Potential for injection in Telegram markdown messages or sheet data
- **Mitigation**: Add input sanitization and length limits in `doPost()`

## 🟡 Moderate

### 3. HTML Minification Makes Maintenance Difficult
- **All HTML files** are single-line minified
- No source/development version exists — editing requires careful single-line manipulation
- Increases risk of accidental markup breakage
- **Recommendation**: Keep human-readable source files and minify for production

### 4. No Build Pipeline
- No way to automate: CSS minification, JS bundling, image optimization, HTML formatting
- Manual deployment process
- No environment separation (dev/staging/prod)
- **Recommendation**: Consider a simple build tool (even just npm scripts) for production optimization

### 5. Global JavaScript Namespace Pollution
- All functions and objects are on the global scope (`window`)
- `NB_` prefix convention helps avoid collisions but isn't enforced
- **Risk**: Third-party scripts could conflict
- **Recommendation**: Use IIFE or ES modules when browser support allows

### 6. No Error Tracking or Analytics
- No error reporting service (Sentry, etc.)
- No analytics (Google Analytics, etc.)
- Failed API calls show `alert()` — no structured error handling
- **Recommendation**: Add basic error tracking and analytics

## 🟢 Low

### 7. Mixed Image Naming Convention
- `assets/images/` uses both camelCase (`mainBg.webp`) and kebab-case (`custom-service.webp`)
- Not functionally impactful but inconsistent

### 8. No `.gitignore`
- No `.gitignore` file detected
- `.planning/` directory and any future build outputs would be committed
- **Recommendation**: Add `.gitignore` with `.planning/`, `node_modules/`, etc.

### 9. User Selection Disabled Globally
- `* { -webkit-user-select: none; user-select: none; }` in `shared.css`
- Prevents users from selecting text on the entire site
- May cause accessibility issues for some users
- **Recommendation**: Apply selectively instead of globally

### 10. Cart System Has No Server Validation
- Cart is entirely client-side (localStorage)
- Prices are stored client-side and sent to server without verification
- **Risk**: Users could modify prices in localStorage before checkout
- **Mitigation**: Server-side price verification against product catalog

## Architecture Risks
- **Single point of failure**: Google Apps Script handles all backend logic
- **No rate limiting**: Forms can be submitted repeatedly
- **No CAPTCHA**: Contact and checkout forms have no bot protection
- **Dependency on external services**: Telegram, Google Sheets, Google Fonts — all external
