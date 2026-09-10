# Game Loopers — Ship Plan

**Last updated:** 2026-09-09

This file tracks **only what is still outstanding**. Completed items are deleted
rather than checked off — if it is not written here, it is done or it was never in
scope. Git history is the record of what changed.

This is the single launch list. The persona-journey audit that used to live in
`REPORT.md` has been folded in here; its still-open findings appear below with
their original numbering noted, and the ones that were fixed are simply gone.

---

## Current state

| Check                                  | Result                                               |
| -------------------------------------- | ---------------------------------------------------- |
| `npm run check`                        | ✅ **0 errors** across 237 files, all three packages |
| `npm run check:boundaries`             | ✅ `web → api → core`, no Astro below `web`          |
| `npm run test:run`                     | ✅ **400 unit tests**, 9 integration suites          |
| `npm audit`                            | ⚠️ 3 high, **0 critical**                            |
| Migrations 00001–00013                 | ✅ applied and verified against a live database      |
| Purchase → download → royalty → payout | ✅ repaired, covered by tests                        |
| Prices shown to buyers                 | ❌ **10% below what Stripe charges**                 |
| Legal pages                            | ❌ still 11-line stubs                               |
| e2e suite                              | ❌ deleted — it tested routes that do not exist      |

The money path works. What stands between here and launch is that **the buyer is
shown the wrong price**, the legal documents are empty, and none of it has been
walked through end to end by a human on a fresh database.

---

## P0 — Ship blockers

### 1. Displayed prices are 10% below what Stripe charges

`getProductPriceBreakdown` returns `totalPrice = subtotal + platformFee`, and
checkout charges `totalPrice`. The fee is **added on top**, not deducted. But the
UI never shows it:

- `cart.astro:125-131` prints Subtotal and Total as the **same number**, with no
  fee line. The buyer then gets charged 10% more at Stripe.
- `products/index.astro` computes card prices without the fee, and omits documents
  entirely — so a document-only product displays as **"Free"** in the grid.
- `ProductContentViewer.tsx` labels the bare item sum "Total".

For the persona whose stated pain is _"doesn't know where the money goes"_, an
undisclosed 10% appearing at the payment step is the worst available failure mode,
and it is a Stripe compliance risk.

**Fix:** one function as the single source of price truth; show subtotal, fee and
total explicitly everywhere a price appears. ~3–4 h. _(audit P0 #4)_

### 2. `price_cents` is a phantom field, so Add to Cart never renders

The `products` table has **no `price_cents` column** — a product's price is the sum
of its files, documents and components. But `products.types.ts:22` declares
`price_cents?: number | null` on `Product`. Because it is **optional**, TypeScript
never complains; at runtime it is always `undefined`.

`AddToCartButton.canPurchase()` requires `props.priceCents != null`, so on the
public product page every `<Show>` is false: no price, no button, no explanation.
The only surviving purchase path is a secondary button inside "What's Included",
which renders only if the product has content.

**Fix:** delete `price_cents` from the `Product` type and have the product page
call `getProductPriceBreakdown`. ~1–2 h. Also fixes #3. _(audit P0 #2)_

This is the third phantom field found in this codebase (`products.price_cents`,
`users.full_name`, `products.embedding_royalty_cents`). All three were declared
**optional**, which is precisely why `astro check` reported zero errors while the
feature was dead. Worth remembering given how much weight "0 errors" carries in
this project's status reporting.

### 3. Every cart line item says "FREE"

`CartItemRow.tsx:121` reads `props.item.product?.price_cents` — the phantom field
above — which yields `0`, and `formatPrice(0)` returns `"FREE"`. Meanwhile the
order summary two columns over shows a real total.

The correct value is already in scope: `cart.astro` sets `item.price_cents` from
the real breakdown. The component reads `item.product.price_cents` instead.

**Fix:** one-word change. 15 min. Highest-abandonment moment in the funnel, and a
chargeback generator until then. _(audit P0 #3)_

### 4. Buyers are charged for documents that are never delivered

`generate-document-pdfs.ts:57` is `// TODO: Implement actual PDF generation`.
Documents are priced, added to carts, and paid for; no file is ever produced.

**Fix:** either implement generation or remove documents from the purchasable set
before launch. Selling something undeliverable is not a bug to defer. _(audit P0 #8)_

### 5. Legal pages are empty

`terms.astro`, `privacy.astro` and `licenses/standard.astro` are 11-line stubs. A
marketplace that takes payments and issues licences cannot launch without them,
and Stripe requires a published refund policy.

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Standard License — what a buyer may do with a downloaded file, and what a
      creator grants when they mark a product embeddable
- [ ] Refund policy
- [ ] Reviewed by someone qualified

### 6. End-to-end proof of the money path

Every part is now covered by automated tests, but the whole has never been walked
through by a human against a fresh database.

- [ ] Fresh `supabase db reset` → sign up → create product → upload file → buy →
      download
- [ ] Buy a bundle containing an embedded component; download the **child**
      product's file as the buyer
- [ ] Confirm the child creator's royalty appears, held, and matures after the
      14-day window
- [ ] Replay a `checkout.session.completed` webhook with the same event id and
      assert exactly one sale and one royalty set
- [ ] Send an invalid webhook signature with `MOCK_STRIPE` unset and assert it is
      rejected
- [ ] Request a payout, execute it, then attempt a second payout for the same
      earnings and assert it is refused
- [ ] Fail a transfer and assert the reserved royalties return to available balance
- [ ] Refund a sale and assert the royalties are reversed

---

## P1 — Before or immediately after launch

### 7. Account deletion is unimplemented

Required by the privacy policy that does not exist yet. Needs a decision about
what happens to a deleted user's published products, their buyers' download
entitlements, and unpaid royalties.

### 8. 19 pages still exchange the session on every request

API routes now resolve identity once, at the gateway, by verifying the token
signature locally. **19 `.astro` pages still call `setSession()` directly**, which
is a network round trip to the auth provider per page render.

`resolvePageAuth()` in `packages/web/src/lib/page-auth.ts` already does this the
right way and `admin/payouts.astro` uses it. Converting the rest is mechanical.

### 9. The e2e suite was deleted and needs rewriting

The previous suite targeted `/dashboard`, `/assets`, `/assets/new` and
`/products/new` — none of which exist — and carried 70 conditional guards that let
specs pass without asserting anything. It never ran in CI. A suite that cannot
fail is worse than no suite, so it was removed rather than repaired.

The Playwright config and dependency were removed with it, rather than left
behind pointing at an empty directory. Reinstating them is `npm i -D
@playwright/test && npx playwright init`. The manual checks in P0 #6 are the
right first specs to write.

### 10. Three high-severity advisories with no upstream fix

Transitive `path-to-regexp` ReDoS. No patched version is published. Re-check
before launch; document the decision if still unfixed.

---

## P2 — Quality and hygiene

- **`uploadFile` returns a public URL for private buckets.** `product_files.file_url`
  therefore holds a URL that 400s for `product-files` and `document-attachments`.
  Nothing depends on it today (downloads go through `/api/download`), but it is a
  trap for the next person who links to `file_url` directly.
- **`core` still reads `import.meta.env` directly** in several files, which ties it
  to a Vite consumer. New code uses `readEnv()` from `@gameloopers/core/env`; the
  remaining direct uses must migrate before a non-Vite `packages/workers` can
  import core.
- **`/payouts` modal is unreachable CSS.** The markup is built with `innerHTML`, so
  it never matches Astro's scoped `data-astro-cid-*` selectors — roughly 200 lines
  of styles never apply, and an `onclick="loadData()"` handler is dead.
- **768px double-match.** Four `min-width: 768px` media queries collide with a
  `max-width: 768px` at exactly 768px. Move the four to `48.0625rem`.
- **Dark mode is half-built.** Either finish the `.dark` palette (~20 lines) or
  delete it (−45 lines). Owner's call; leaving it half-done is the worst option.
- **Multi-currency and non-US Connect** are hardcoded TODOs. Fine for v1 — just be
  explicit that launch is US-only, USD-only.
- **Credits** are cut from v1 but `users.credits_balance` remains in the schema. If
  credits return they need a top-up flow first, and a decision about whether
  credit-funded royalties may be withdrawn as real money.
- **README duplicates CLAUDE.md** across its Views, Data Model, APIs and
  Architecture sections. They have already drifted once.

---

## Launch checklist

- [ ] Buyers see the price they will actually be charged, fee shown explicitly
- [ ] Add to Cart renders on the public product page
- [ ] Cart line items show real prices
- [ ] Documents are either deliverable or not for sale
- [ ] Fresh `supabase db reset` → sign up → create → upload → buy → download
- [ ] Embedded child product files download for the buyer
- [ ] Webhook replayed twice produces exactly one sale and one royalty set
- [ ] Webhook rejects an invalid signature outside mock mode
- [ ] A second payout for already-paid earnings is refused
- [ ] A failed transfer returns reserved royalties to available balance
- [ ] A non-owner cannot delete another user's product image or avatar
- [ ] ToS, Privacy Policy, and Standard License published and reviewed
- [ ] Refund policy published (Stripe requirement)
- [ ] Account deletion implemented and tested
- [ ] `SUPABASE_JWT_SECRET` set wherever the auth provider signs with a shared
      secret — a missing key reports `unconfigured`, not "signed out"
- [ ] `PUBLIC_SENTRY_DSN` set and `@sentry/astro` installed, or a deliberate
      decision to launch without error reporting
- [ ] `PUBLIC_SITE_URL` set in Vercel; receipt emails link to the production domain
- [ ] `MOCK_STRIPE` unset in every deployed environment
- [ ] `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`, `RESEND_API_KEY` set in Vercel
- [ ] An admin account exists (`users.role = 'admin'`) to work the payout queue

---

## The short version

The money path is fixed and tested. The remaining launch blockers are all in what
the buyer _sees_: a price that is 10% too low, a missing Add to Cart button, cart
rows that say FREE, documents sold but never delivered, and no legal terms. None
of them are deep — the largest is half a day — but every one of them is on the
path between a visitor and a completed purchase.
