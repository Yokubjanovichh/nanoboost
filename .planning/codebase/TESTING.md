# Testing & Quality

## Test Framework

- **None detected** — no test files, no test runner, no test dependencies

## Quality Tools

- **No linter** (ESLint, Stylelint, etc.)
- **No formatter** (Prettier, etc.)
- **No type checker** (TypeScript, JSDoc types, etc.)
- **No CI/CD pipeline** detected

## Current Validation

- Client-side form validation in `checkout-page.js`:
  - Email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - Required fields: email, Discord username, payment method, agreement checkbox
- Contact form validation in `contact-page.js`:
  - Required: name, email, message
  - Optional: preferred contact method

## Accessibility

- ARIA attributes used: `aria-expanded`, `aria-selected`, `aria-disabled`, `aria-label`, `role`
- Keyboard navigation: Not comprehensively implemented
- `prefers-reduced-motion` media query in `shared.css`
- `-webkit-user-select: none` on `*` selector (may hinder text selection)

## Performance Optimizations Present

- `content-visibility: auto` on footer
- `font-display: swap` for custom fonts
- WebP image format throughout
- `preconnect` for Google Fonts
- CSS `will-change` used sparingly (slider)
- Skeleton loading states (shimmer animation)

## Recommendations for Future

- Add basic smoke tests for form validation logic
- Implement a linter (ESLint) for JavaScript code quality
- Consider adding `.gitignore` for `.planning/` and any future build artifacts
- Client-side validation should be duplicated server-side (partially done in Apps Script)
