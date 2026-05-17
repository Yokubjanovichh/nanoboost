# GA4 Analytics

The public site fires the standard GA4 ecommerce funnel
(`view_item_list` → `select_item` → `view_item` → `add_to_cart` →
`begin_checkout` → `purchase`) so marketing can see drop-off at every
step.

## Setup

The GA4 Measurement ID is read from `window.NB_GA4_MEASUREMENT_ID`,
which `build.js` writes into every page's `<head>` from the
`NB_GA4_ID` environment variable. Empty by default → tracking is a
silent no-op for dev/staging.

```bash
# Production build (Vercel)
NB_GA4_ID=G-XXXXXXXXXX node build.js
```

Set `NB_GA4_ID` in the Vercel project's Environment Variables
(Production scope). When that's set, the next deploy ships
`window.NB_GA4_MEASUREMENT_ID="G-XXXXXXXXXX"` in every page and
`scripts/analytics.js` injects `gtag.js`.

## Debugging

To mirror every event to the browser console:

```js
window.NB_DEBUG_ANALYTICS = true;
```

Set that in DevTools → Console before navigating, then watch for
`[NB GA4] event_name {…}` lines.

To verify events reach Google in real time, open
**GA4 → Admin → DebugView** with the page open in another tab.
The Chrome "Google Analytics Debugger" extension flips a flag that
makes every request show up there.

## Events fired

| Event              | Where it fires                                       | Notes                                                          |
| ------------------ | ---------------------------------------------------- | -------------------------------------------------------------- |
| `view_item_list`   | `services-bootstrap.js` after Hot grid renders       | `item_list_id: "hot_right_now"`                                |
| `view_item_list`   | `games-bootstrap.js` after Choose-Your-Game renders  | `item_list_id: "choose_your_game"`                             |
| `view_item_list`   | `game-page.js` when a platform tab is rendered       | `item_list_id: "game_<slug>_<platform>"`                       |
| `select_item`      | `game-page.js` on BUY NOW click in the services grid | Captures slug + platform of the chosen card                    |
| `view_item`        | `service-page.js` when the hero swaps in real data   | Uses the default option's USD price                            |
| `add_to_cart`      | `service-page.js` on purchase-form submit            | Variant = currently-selected option label                      |
| `begin_checkout`   | `checkout-page.js` right before `NB_API.createOrder` | `coupon` carries the chosen payment method for funnel analysis |
| `purchase`         | `payment-success.js` when polling sees `paid`        | `transaction_id` = backend order number                        |

All events go through `window.nbTrack(name, params)`, which is a
no-op when `gtag` isn't on the page (missing ID, ad blocker, network
error). Call sites should not wrap it in `try/catch` — the helper
absorbs errors internally so the page never breaks because of
analytics.

## Adding a new event

1. Pick the GA4 event name from
   <https://developers.google.com/analytics/devguides/collection/ga4/reference/events>
2. Fire it through the helper, e.g.
   ```js
   if (typeof window.nbTrack === "function") {
     window.nbTrack("view_promotion", {
       promotion_id: "summer-sale",
       items: [...],
     });
   }
   ```
3. Add a row to the table above and rebuild.

## Manual test plan

With `NB_DEBUG_ANALYTICS=true` and DebugView open, walk the funnel:

1. Open `/` → expect `view_item_list` ×2 (Hot Right Now, Choose Your Game).
2. Click a game card → land on `/pages/game.html?game=…` → expect
   `view_item_list` for the active platform tab.
3. Click BUY NOW on a service card → expect `select_item`, then
   `view_item` on the service detail page.
4. Submit the purchase form → expect `add_to_cart`.
5. Walk to `/pages/checkout.html` and submit the order → expect
   `begin_checkout`.
6. After EcomTrade24 returns success and the polling sees
   `status="paid"`, expect `purchase` with the backend
   `order_number` as `transaction_id`.

Every event must show up in DebugView within a couple of seconds.
