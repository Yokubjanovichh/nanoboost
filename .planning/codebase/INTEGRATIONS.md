# External Integrations

## 1. Google Apps Script (Backend API)
- **Type**: REST API (POST)
- **Endpoint**: Defined in `NB_API_URL` (`scripts/services-data.js`)
- **URL**: `https://script.google.com/macros/s/AKfycby183PefSS1xEQgyM5O86VxXqKpIYJcnqFxjaIyeSMUxgSlSbJsqRdXH6ND_i0Dn7vKWg/exec`
- **Handles**:
  - `type: "checkout"` — Order submission (email, Discord, payment method, cart items, agreement)
  - `type: "contact"` — Contact form (name, email, preferred contact method, message)
- **Response**: `{ success: true/false, orderNumber: "NB-YYYYMMDD-NNNN" }`
- **File**: `google-apps-script.js` (server-side), `scripts/checkout-page.js` + `scripts/contact-page.js` (client-side)

## 2. Google Sheets (Data Storage)
- **Sheet ID**: `1GPQ-cFvYYP5e08UG03wgO9D5iM6G4cuSJj297VzT2ww`
- **Sheets**:
  - `Orders` — Order number, timestamp, email, Discord, payment method, cart items, total, agreement
  - `Contacts` — Timestamp, name, email, preferred contact, message
- **Access**: Via `SpreadsheetApp` in Google Apps Script

## 3. Telegram Bot API (Notifications)
- **Bot Token**: Stored in `google-apps-script.js` as `TG_BOT_TOKEN`
- **Chat ID**: `-5264505515` (group chat)
- **Usage**: Sends formatted markdown notifications for new orders and contact messages
- **Endpoint**: `https://api.telegram.org/bot{TOKEN}/sendMessage`
- **Format**: Markdown with order details, customer info, cart items

## 4. Email (Notifications)
- **Recipient**: `support@nanoboost.io` (defined as `NOTIFY_EMAIL`)
- **Sender**: Google Apps Script `MailApp.sendEmail()`
- **Templates**: HTML emails for orders and contact messages

## 5. Google Fonts CDN
- **Font**: Poppins (weights: 300-800)
- **URL**: `https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap`
- **Loaded**: Via `<link>` in HTML `<head>` with `preconnect`

## 6. localStorage (Client-side Storage)
- **Key**: `nb_cart`
- **Format**: JSON array of cart item objects `{ key, name, option, price, qty, image }`
- **Used by**: `scripts/shared.js` (cart system), `scripts/checkout-page.js` (checkout display)
- **Operations**: `nbGetCart()`, `nbSaveCart()`, `NB_addToCart()`

## Data Flow
```
User → Browser (static HTML/CSS/JS)
  ├→ localStorage (cart data)
  └→ fetch POST → Google Apps Script
                    ├→ Google Sheets (log)
                    ├→ Telegram Bot (notify)
                    └→ Email (notify)
```
