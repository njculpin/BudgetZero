# Game Loopers — Ship Plan

**Last updated:** 2026-09-10

This file tracks **only what is still outstanding**. Completed items are deleted
rather than checked off — if it is not written here, it is done or it was never in
scope. Git history is the record of what changed.

This is the single launch list. The persona-journey audit that used to live in
`REPORT.md` has been folded in here.

---

## Current state

Every row below was re-run on 2026-09-10 against the working tree and a live
local Supabase.

| Check                                  | Result                                                     |
| -------------------------------------- | ---------------------------------------------------------- |
| `npm run check`                        | ✅ **0 errors**, 0 warnings across 215 files, all packages |
| `npm run check:boundaries`             | ✅ `web → api → core`, no Astro below `web`                |
| `npm run lint`                         | ✅ 0 errors (167 warnings, all `any` in `api` tests)       |
| `npm run format:check`                 | ✅ clean                                                   |
| `npm run build`                        | ✅ Vercel output produced                                  |
| `npm run test:run`                     | ✅ **729 tests, 63 files**, integration included, live DB  |
| `npm audit`                            | ⚠️ 3 high, **0 critical** — all one transitive chain       |
| Migrations 00001–00014 (00009 dropped) | ✅ applied, verified against a live database               |
| Purchase → download → royalty → payout | ✅ repaired, covered by tests                              |
| Prices shown to buyers                 | ✅ subtotal / fee / total disclosed everywhere             |
| Buyer journey, sign-up → download      | ✅ completes end to end (`/JOURNEYS.md`)                   |
| Creator journey, sign-up → paid        | ❌ **`/payouts` is not linked from anywhere**              |
| "Where Your Work Is Used" dashboard    | ❌ **always empty — queries a column that does not exist** |
| Notifications                          | ❌ nothing in the codebase ever writes one                 |
| Printer / Painter journeys             | 🚫 stop at step 2 of 9 — no `product_type` in any UI       |
| Legal pages                            | ❌ still 11-line stubs                                     |
| Document PDFs                          | ❌ sold, never generated                                   |
| e2e suite                              | ❌ still deleted                                           |

`/JOURNEYS.md` traces all six personas step by step against real routes,
controllers and live schema. The P0 items below are what that trace turned up.

### What closed since 2026-09-09

The three pricing blockers are gone. `products.price_cents` was deleted from the
`Product` type (2630ebd); the product page now passes
`priceBreakdown.totalPrice` to `AddToCartButton`, so the button renders; the cart
shows **Subtotal / Platform fee (10%) / Total** as three distinct lines; and
`index`, `products/index`, `tags/[tag]` and `ProductContentViewer` all read from
`getProductPriceBreakdown`. A document-only product no longer displays as "Free".

The composability refactor (e763105 → 264ba72) closed several P1/P2 items at
once: **no page contains a raw `<div>`**, `pages/` holds no `.css`, there are no
`<style>` blocks and no `className` props anywhere, the `/payouts` page is down
to 71 lines with no `innerHTML`, and **no `.astro` page calls `setSession()`** —
all 17 authenticated pages go through `page-auth`. Migration 00014 added a
royalty hold period, surfaced in the payouts UI.

---

## Work order

Everything below, sequenced. Stages are ordered by dependency: **stage 5 cannot be
walked by hand until stages 1–4 are done**, because until then half the journey has
no link to click and two of its steps fail silently.

Items marked **DECIDE** change what the rest of the stage contains. They are not
blocking — a recommendation is given for each — but they are the owner's call.

Detail for every item is in the numbered sections below and in `/JOURNEYS.md`.

### Stage 1 — Make the app walkable · ~3 h · _blocks stage 5_

Nothing else can be verified by hand while the creator's half of the app has no
links. All of these are in `packages/web`.

- [ ] Render `ProductCreateForm` on `/create` — it is built and tested
      (`product-create-form.test.tsx`) and rendered nowhere. Keep the workflow copy
      beneath it. → `pages/create.astro`
- [ ] Point the user-menu create button at `/create` — it currently links to
      `/products/new`, which 404s. → `navigation-user-menu.tsx:166`
- [ ] Decide what happens to the one-click blank-product `FormSubmitButton` on
      `/products` once `/create` has a real form. → `pages/products/index.astro:89,213`
- [ ] Add **Payouts** and **Documents** to `userMenuLinks`. → `navigation.astro:56-63`
- [ ] Add the same two to the mobile `authedLinks`. → `navigation.astro:65-72`
- [ ] Add **Admin → Payouts** when `users.role === 'admin'`. The nav does not
      currently read the role; `verifyAdmin` is in `@gameloopers/core/auth/admin`.
- [ ] `/connect/dashboard` → use `POST /connect/create-account-link`, which exists
      and is routed. → `payout-shortcuts.astro:11`
- [ ] `/settings/notifications` → `/settings`, where the form actually lives.
      → `notification-center.tsx:322`
- [ ] `/downloads` → `/purchases`. → `download.ts:16`
- [ ] Grep the tree for any remaining `href` that does not resolve to a route.

### Stage 2 — Make the silent failures loud · ~4 h · _blocks stage 5_

- [ ] Delete `cover_image_url` from `Product`. → `products.types.ts:21`
- [ ] `getEmbeddedUsageForUser`: join `product_images` instead of selecting the
      phantom column, and update the `JoinedProduct` type with it.
      → `data-access/products.ts:1361` and `:1389`
- [ ] Source the Stripe line-item image from `product_images` too.
      → `create-session.ts:73`
- [ ] `embedding_royalty_cents` → `number`. It is `NOT NULL DEFAULT 0` in 00013 and
      has no business being optional. → `products.types.ts:22`
- [ ] `file_count`: confirm it is a computed join field, then either document that
      at the declaration or move it off `Product`. → `products.types.ts:23`
- [ ] **Add a check that fails CI when a core type names a column no migration
      creates.** Four phantom fields have now shipped, all of them optional, all
      invisible to `astro check`. This is the only item here that prevents a fifth.
- [ ] **DECIDE:** notifications — write them, or remove the bell.
      _Recommendation: write them._ The webhook already holds every fact needed.
- [ ] Add `createNotification` to `data-access/notifications.ts`, which today
      exports only read, mark and delete.
- [ ] Call it from the webhook on sale, on royalty accrual, and on payout
      completion. → `webhooks/stripe.ts:225-278`
- [ ] Either set `products.needs_attention` somewhere, or delete the conflict flow
      that reads it. → `notifications.ts:284`, `products/by-id/resolve-conflict.ts`

### Stage 3 — Stop selling what cannot be delivered · ~1 h or ~2 d

- [ ] **DECIDE:** implement document PDF generation, or remove documents from the
      purchasable set. _Recommendation: remove for v1._ Selling an undeliverable
      good is a chargeback and a Stripe compliance problem; generation is a
      Puppeteer dependency on a serverless runtime and is not a one-day job.
- [ ] _If removing:_ exclude documents from `getProductPriceBreakdown`, disable
      `POST /products/update-document-price`, and hide document pricing in
      `ProductContentManager`.
- [ ] _If implementing:_ `generate-document-pdfs.ts:63` and `products.ts:1232`.

### Stage 4 — Account deletion, then the legal pages · ~1 d + review

Deletion comes first: the Privacy Policy has to describe it accurately.

- [ ] **DECIDE:** what happens on deletion to published products, to buyers'
      download entitlements, and to unpaid royalties.
- [ ] Implement deletion — data-access, controller, and a `/settings` control.
- [ ] Terms of Service. → `pages/terms.astro`
- [ ] Privacy Policy, describing the deletion behaviour above. → `pages/privacy.astro`
- [ ] Standard License — what a buyer may do with a downloaded file, and what a
      creator grants by marking a product embeddable. → `pages/licenses/standard.astro`
- [ ] Refund policy — a Stripe requirement.
- [ ] Reviewed by someone qualified.

### Stage 5 — Walk the money path by hand, on a fresh database · ~half a day

This is the acceptance gate for stages 1–4. Full list in **§6** below.

- [ ] `supabase db reset` → sign up → create → upload → publish → buy → download
- [ ] Buy a bundle; download the **child** product's file as the buyer
- [ ] Child creator's royalty appears, is held, matures
- [ ] Child creator's **"Where Your Work Is Used"** panel lists the parent
- [ ] Creator reaches `/payouts` **by clicking**, requests, and is paid
- [ ] Replayed webhook → exactly one sale and one royalty set
- [ ] Invalid signature with `MOCK_STRIPE` unset → rejected
- [ ] Second payout for the same earnings → refused
- [ ] Failed transfer → reserved royalties return to available
- [ ] Refund → royalties reversed

### Stage 6 — Turn that walkthrough into an e2e suite · ~1 d

- [ ] `npm i -D @playwright/test && npx playwright init`
- [ ] Write stage 5 as specs, starting with the purchase path
- [ ] Add it to `.github/workflows/ci.yml`
- [ ] No conditional guards. A spec that cannot fail is worse than no spec.

### Stage 7 — Correctness and accessibility · ~half a day

- [ ] `--ring-offset` — the `box-shadow` is invalid, so **focus is invisible** on
      the purchases list. Do this one first. → `purchases-list.css:42,95`
- [ ] Declare the other six undeclared tokens, or replace them with tokens that
      exist. Full table in **§ CSS tokens that do not exist**.
- [ ] Delete the nine hand-rolled `formatPrice` copies; import `formatMoney`, which
      already takes `zeroAs`. → **§8**
- [ ] Batch the price breakdown so a 24-card grid stops costing ~96 queries.
      → **§9**

### Stage 8 — Hygiene · ~half a day

- [ ] **Strip the changelog comments.** ~50 passages across ~30 files narrate what
      the code used to do rather than what it does. Detail and the rule in
      **§ Comments that narrate the repo's history**. Do this pass _before_ the
      other items in this stage — several of them touch the same files.
- [ ] Delete the duplicate `@keyframes fadeIn`. → `modal.css:164`
- [ ] Namespace or relocate the generic keyframes declared outside `global.css`
- [ ] Move the two `min-width: 768px` to `48.0625rem`; settle on two or three
      breakpoints and put them in `global.css`
- [ ] **DECIDE:** finish the dark theme or delete it. _Recommendation: delete for
      v1_ — the palette is correct but nothing applies `.dark`, and a correct dead
      block rots quietly.
- [ ] Remove the 167 `any` types, all in `packages/api` tests
- [ ] Remove the three unused `redirect` bindings. → `settings`, `sign-in`, `sign-up`
- [ ] Move the two inline `<svg>` into `assets/svgs`. → `empty-state.astro`,
      `notification-card.astro`
- [ ] `uploadFile` returns a public URL for private buckets. → `uploads.ts:74`
- [ ] Migrate `core`'s 23 direct `import.meta.env` reads to `readEnv()`
- [ ] The two `TODO: Move to data access layer` controllers

### Stage 9 — Reconcile the documentation · ~2 h

Four documents currently disagree with the code and with each other.

- [ ] **PERSONAS.md** — remove jams, chat, variants and assets, all of which it
      cites as current and none of which exist. Settle the Printer/Painter status
      against stage 10. Its three pending `ALTER TABLE`s already ran.
- [ ] **CLAUDE.md** — `/payouts` no longer uses `innerHTML`, no page contains a
      raw `<div>`, and `npm run check` covers 215 files, not 237. Its skill paths
      (`/.claude/skills/...`) point at directories that do not exist.
- [ ] **CLAUDE.md — add the comment rule.** A comment says what the code does or
      what it guarantees, never what it used to do; git holds the history. Without
      this the stage 8 comment pass gets redone in six months, because the file
      that sets the house style is itself written in the voice being removed.
- [ ] **supabase/migrations/README.md** — stops at 00010; document 00011–00014.
- [ ] **README.md** — deduplicate against CLAUDE.md; they have drifted once already.

### Stage 10 — Scope decisions · owner

- [ ] **DECIDE:** six tables have no code at all — `wishlists`, `product_reviews`,
      `user_reviews`, `user_follows`, `product_collaborators`, `activity_feed`.
      Build or drop, one by one. _Recommendation: drop all six for v1_ and add them
      back with the feature. `licenses` is referenced once, from `llms.txt.ts`.
- [ ] **DECIDE:** Printer and Painter. PERSONAS.md says MVP; CLAUDE.md says Month
      7+; the code says step 2 of 9. _Recommendation: correct PERSONAS.md._
      Building them needs a `product_type` selector, a services filter, shipping
      address and notes at checkout, a provider notification email, and a chat
      system that does not exist.
- [ ] **DECIDE:** document collaboration. `document_collaborators` already sets
      `can_invite: true` on the owner and no endpoint honours it, so "collaborative
      documents" is single-player. Build the invite flow or change the copy on
      `/create` and `/documents`.
- [ ] Confirm launch is US-only and USD-only; the TODOs in `create-session.ts:69`
      and `connect/create-account.ts` are fine, but say so publicly.
- [ ] `users.credits_balance` — leave dormant or drop.

### Stage 11 — Deploy gate

- [ ] `SUPABASE_JWT_SECRET` set wherever the provider signs with a shared secret
- [ ] `PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`, `RESEND_API_KEY`
- [ ] `MOCK_STRIPE` unset in every deployed environment
- [ ] `PUBLIC_SENTRY_DSN` set, or a deliberate decision to launch without it
- [ ] An admin account exists (`users.role = 'admin'`) to work the payout queue
- [ ] Re-check `npm audit`; document the `@astrojs/vercel` decision if still unfixed

---

## P0 — Ship blockers

### 1. `products.cover_image_url` is a phantom field, and it breaks a headline feature

`Product` declares `cover_image_url?: string | null`
(`products.types.ts:21`). **No migration creates that column.** Confirmed against
the live database:

```
GET /rest/v1/products?select=id,cover_image_url
{"code":"42703","message":"column products.cover_image_url does not exist"}
```

Two consumers select it straight from `products`:

- **`getEmbeddedUsageForUser` (`products.ts:1361`)** names it inside a PostgREST
  join. PostgREST rejects the _whole query_ with 42703, the function logs and
  `return []` (`products.ts:1373-1376`), and so **`/settings` renders "No Embedded
  Products Yet 📦" for every creator, forever** — including one whose components
  are embedded in a dozen products and who has earned royalties from all of them.
  This is the illustrator's and 3D modeller's entire reason to be on the platform,
  and it has never once returned a row.
- **`create-session.ts:73`** passes `product.cover_image_url` to Stripe as the
  line-item image. It is always `undefined`, so checkout shows no product image.
  Silent and cosmetic, but it is the payment page.

`products/index.astro:57` already derives the correct value —
`images[0]?.file_url` from `product_images`. That is the real source.

**Fix:** delete `cover_image_url` from the `Product` type; have both consumers
join `product_images` the way the listing page does. ~1–2 h.

This is the **fourth** phantom field found here (`products.price_cents`,
`users.full_name`, `products.embedding_royalty_cents`, now
`products.cover_image_url`). All four were declared **optional**, which is exactly
why `astro check` reports 0 errors while the feature is dead. The three optionals
still on core types — `cover_image_url`, `embedding_royalty_cents`, `file_count` —
should each be checked against a migration and then made non-optional or removed.
`embedding_royalty_cents` is `NOT NULL DEFAULT 0` in 00013 and should not be
`?: number | null` in the type at all.

### 2. No creator can reach the page where they get paid

`/payouts` renders a balance, a payout request form and a history. It works. **No
link to it exists anywhere in the application** — not in the navigation, not in
the user menu, not on `/settings`, whose "Payouts & Bank Account" card only runs
Connect onboarding. `/admin/payouts` is unlinked too, so the admin working the
queue must know the URL.

Three more links in the same area are dead routes:

| Link                      | Where                                                          |
| ------------------------- | -------------------------------------------------------------- |
| `/products/new`           | `navigation-user-menu.tsx:166` — **the create-product button** |
| `/connect/dashboard`      | `payout-shortcuts.astro:11`                                    |
| `/settings/notifications` | `notification-center.tsx:322`                                  |
| `/downloads`              | `download.ts:16`, where an unauthenticated download is sent    |

`/create` — the route CLAUDE.md calls "product creation" — is a marketing page
with no form, linked from nowhere. The form that actually creates a product lives
on `/products` (`products/index.astro:89`). `ProductCreateForm` exists as a
component and is never rendered.

**Fix:** add Payouts and Documents to the user menu, point the create button at
the real form, delete or redirect the four dead links. ~2 h, and it is the
difference between a creator being paid and not.

### 3. Nothing in the codebase ever writes a notification

`/notifications`, the bell and its unread badge, `notification_settings`, and the
`needs_attention` conflict flow all read from `notifications`. Verified three
ways: `data-access/notifications.ts` exports only read/mark/delete — there is no
`createNotification`; no migration contains an `INSERT INTO notifications`; and
the live database has no trigger that writes one. `products.needs_attention` is
likewise only ever read (`notifications.ts:284`).

A creator is never told that their product sold, that a royalty accrued, or that a
payout completed. The fulfilment webhook already has every fact needed to say so
(`webhooks/stripe.ts:225-278`) and says nothing.

**Fix:** a `createNotification` in the data-access layer, called from the webhook
for sale, royalty and payout events. Or delete the feature — but the bell is in
the navigation on every page, so shipping it inert is the worse option.

### 4. Buyers are charged for documents that are never delivered

`generate-document-pdfs.ts:63` and `products.ts:1232` are both
`// TODO: Implement actual PDF generation`. Documents are priced, added to carts,
and paid for; no file is ever produced.

**Fix:** either implement generation or remove documents from the purchasable set
before launch. Selling something undeliverable is not a bug to defer.

### 5. Legal pages are empty

`terms.astro`, `privacy.astro` and `licenses/standard.astro` are **11 lines each**.
A marketplace that takes payments and issues licences cannot launch without them,
and Stripe requires a published refund policy.

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Standard License — what a buyer may do with a downloaded file, and what a
      creator grants when they mark a product embeddable
- [ ] Refund policy
- [ ] Reviewed by someone qualified

### 6. End-to-end proof of the money path

Every part is covered by automated tests — including 8 integration suites that
now genuinely run against Postgres — but the whole has never been walked through
by a human against a fresh database.

- [ ] Fresh `supabase db reset` → sign up → create product → upload file → buy →
      download
- [ ] Buy a bundle containing an embedded component; download the **child**
      product's file as the buyer
- [ ] Confirm the child creator's royalty appears, is held, and matures after the
      hold window (00014)
- [ ] Confirm the child creator's **"Where Your Work Is Used"** panel lists the
      parent product and its earnings — blocked on #1
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

Required by the privacy policy that does not exist yet. Nothing outside test
fixtures references a delete path. Needs a decision about what happens to a
deleted user's published products, their buyers' download entitlements, and
unpaid royalties.

### 8. Nine islands hand-roll their own price formatter, and they disagree

`formatMoney` (`core/utils/money.ts`) uses `Intl.NumberFormat`. The Astro side
imports it. **Nine SolidJS islands** instead define a local
`` formatPrice = (cents) => `$${(cents / 100).toFixed(2)}` ``, which has no
thousands separator and no currency handling.

The two renderings sit side by side in the cart: a $1,234.56 line item shows as
**"$1234.56"** in `cart-item-row`, and the order summary two columns over shows
**"$1,234.56"**. Zero renders three different ways depending on the component —
`'FREE'` (cart-item-row), `'Free'` (cart-item-breakdown), `'$0.00'`
(add-to-cart-button, product-content-viewer).

**Fix:** delete all nine and import `formatMoney`, which already takes a
`zeroAs` option for exactly this. `core` has no Astro dependency, so an island
can import it. ~1 h.

### 9. The product listing pages issue four queries per card

`products/index.astro:45-61`, `index.astro` and `tags/[tag].astro` each call
`getProductImages` **and** `getProductPriceBreakdown` per product inside a
`Promise.all`. The breakdown itself makes three queries (`product_files`,
`product_documents`, `product_components`). A 24-product grid is therefore ~96
round trips per render, on the marketplace's front door.

**Fix:** a batched breakdown that takes an array of product ids and does three
`.in()` queries total. The single-product function stays for the detail page.

### 10. The e2e suite was deleted and needs rewriting

The previous suite targeted `/dashboard`, `/assets`, `/assets/new` and
`/products/new` — none of which exist — and carried 70 conditional guards that let
specs pass without asserting anything. It never ran in CI. A suite that cannot
fail is worse than no suite, so it was removed rather than repaired.

The Playwright config and dependency were removed with it. Reinstating them is
`npm i -D @playwright/test && npx playwright init`. The manual checks in P0 #6 are
the right first specs to write.

### 11. Three high-severity advisories, one chain, no non-major fix

Transitive `path-to-regexp` ReDoS via `@vercel/routing-utils` via
`@astrojs/vercel@8.0.4`. `npm audit fix` only resolves it by taking a **semver-major**
`@astrojs/vercel`, which is pinned deliberately (ea75fb1). Re-check before launch;
document the decision if still unfixed.

---

## P2 — Quality and hygiene

### CSS tokens that do not exist

Seven custom properties are used with **no fallback** and are never declared. CSS
fails silently, so each is a rule that simply does not apply:

| Token                          | Where it bites                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ring-offset`                | `purchases-list.css:42,95` — the `box-shadow` is invalid, so **focus is invisible** on the purchases list. An accessibility defect, not a cosmetic one. |
| `--opacity-25`, `--opacity-75` | `button.css:57,61`, `loading-button.css:18,22` — the loading spinner never dims                                                                         |
| `--ease-default`               | `product-content-manager.css`, `purchase-card.css` — transitions fall back to `ease`                                                                    |
| `--gap-3xl`                    | `purchase-card.css:125`, `notification-settings-form.css:6` — gap collapses to `normal`                                                                 |
| `--leading-none`               | `purchase-card.css:241`                                                                                                                                 |
| `--spacing-2xs`                | `product-created-modal.css:66`                                                                                                                          |

Declare them in `global.css` or replace them with tokens that exist. This is the
same failure mode as the `--font-family-mono` incident documented in CLAUDE.md.

### `@keyframes fadeIn` is declared twice — again

`modal.css:164` and `global.css:825`. Both bodies happen to be identical today, so
nothing is visibly wrong, which is precisely why it will drift. CLAUDE.md already
records this exact collision from last time. Delete the one in `modal.css`.

More broadly, **22 `@keyframes` are declared outside `global.css`** against a rule
that says they all live there. Most are namespaced (`button-spin`,
`dialog-fade-in`) and safe; the generic ones — `fadeIn`, `dash`, `slideDown`,
`shimmer`, `dropdownSlideIn`, `userMenuSlideIn` — are the collisions waiting to
happen.

### Breakpoints: eleven values, and 768px still double-matches

`navigation.css:51,106` use `min-width: 768px`. Three stylesheets use
`max-width: 768px` and **thirty** use `max-width: 48rem`, which _is_ 768px. At
exactly 768px the desktop navigation and every mobile layout apply together.

There are eleven distinct breakpoint values across the stylesheets (`48rem`,
`768px`, `767px`, `640px`, `600px`, `500px`, `480px`, `40rem`, `400px`, `30rem`,
`48.0625rem`). Pick two or three, put them in `global.css`, and move the
`min-width` pair to `48.0625rem` so the boundary stops overlapping.

### The dark palette is complete but unreachable

`global.css:518` now overrides every surface-dependent token correctly — that work
is done and the contrast ratios are annotated. But **nothing applies the `.dark`
class**: there is no toggle and no `prefers-color-scheme` query. Either wire it up
(~10 lines plus a control) or delete it. Leaving a correct-but-dead 200-line block
is the state most likely to rot unnoticed.

### Comments that narrate the repo's history

Roughly **50 passages across ~30 source files** explain what the code used to do
instead of what it does: 20 hits on "previously", 20 on "used to", plus "no longer",
"had been", "this was". Thirty comment blocks run 12 lines or longer, the biggest
at 29 lines.

```
router.ts:6    Routes used to exist because a file existed at the right path…
router.ts:36   …the same default the middleware's catch-all used to provide.
router.ts:39   Two routes were previously protected *only* by their absence…
```

Densest: `router.ts` (6), `data-access/payouts.ts` (5), `pages/api/[...path].ts`
(4), `env.d.ts` (4), `notification-card.astro` (4), `data-access/products.ts` (4),
`auth/verify-token.ts` (4), `webhooks/stripe.ts` (4), `api/context.ts` (4).

**Git already stores this.** A reader who wants to know why a line changed has
`git log -p` and the commit message; a reader of the file wants to know what it
does now. The historical version is worse on both counts — it is unverifiable
against the code (nothing fails when it goes stale), it grows monotonically, and
it buries the one or two sentences that _are_ load-bearing.

**The rule:** a comment explains what the code does, what it guarantees, or a
constraint that is not visible from the code. It does not describe a previous
implementation, a bug that was fixed, or how many call sites once did it wrong.
Where the old behaviour is genuinely the point — a subtle invariant that exists
only because of a past incident — state the invariant, not the incident:

```ts
// Before: "Entitlement is checked against the product this file actually
// belongs to, never against a product id supplied by the caller — a
// caller-supplied product id lets anyone pair a product they did buy with a
// file from one they did not."

// After: "Entitlement is checked against the file's own product_id. Never
// trust a caller-supplied product id here."
```

Keep: the `MOCK_STRIPE` warning, the PostgREST array-narrowing note, the
atomicity notes on the payout functions, the vitest config's explanation of why
`packages/*` is listed explicitly. Each states a live constraint.

**Root cause worth naming: CLAUDE.md is written in this voice and the code is
imitating it.** "Twenty-four call sites used to write…", "There were forty inline
copies", "`fadeIn` was once declared twice", "It previously happened twice per
request". That is defensible in a document explaining why a convention exists —
it is the wrong register for a source file, and nothing currently says so. Stage 9
adds the rule to CLAUDE.md; without that this pass will simply be redone in six
months.

### 167 `any` types, all in `packages/api` tests

Concentrated in twelve files, worst offenders `create-session.test.ts` (37),
`update-product.test.ts` (35), `create-product.test.ts` (21). Lint reports them as
warnings so CI passes. The project rule says no `any`; either satisfy it or stop
claiming it.

### Smaller

- **Three unused `redirect` bindings** — `settings.astro:18`, `sign-in.astro:7`,
  `sign-up.astro:6`. Reported as hints by `astro check`; the rule is "no unused
  variables".
- **Inline `<svg>` in two `.astro` components** — `empty-state.astro` and
  `notification-card.astro`. The rule is never in `.astro`; only `.tsx` islands
  are exempt. `embedded-usage-dashboard.tsx` also uses a `📦` emoji where the icon
  set has a component.
- **`uploadFile` returns a public URL for private buckets** (`uploads.ts:74`), so
  `product_files.file_url` holds a URL that 400s. Nothing depends on it today —
  downloads go through `/api/download` — but it is a trap for the next person who
  links to `file_url` directly.
- **`core` still reads `import.meta.env` directly** — 23 uses across 10 files
  (`auth/client`, `data-access/client`, `email/client`, `monitoring/client`,
  `payments/client`, `payments/mock-mode`, `storage/client`, `storage/uploads`,
  `realtime/document-content-subscription`, `env`). Must migrate to `readEnv()`
  before a non-Vite `packages/workers` can import core.
- **`supabase/migrations/README.md` stops at 00010.** Migrations 00011
  (payout integrity), 00012 (refunds and reversals), 00013 (royalty write path)
  and 00014 (royalty hold period) are undocumented, and its footer still reads
  "Last updated: 2026-09-09 (migrations 00007, 00008, 00010)".
- **CLAUDE.md is stale after the refactor.** It still says `/payouts` builds markup
  with `innerHTML`, that "twenty-five of twenty-seven pages" contain no `<div>`
  (it is now all of them), and cites a 237-file check that now reports 215.
- **Two `TODO: Move to data access layer`** — `documents/update-content.ts`,
  `products/search-embeddable.ts`. Controllers reaching past the layer boundary.
- **Multi-currency and non-US Connect** are hardcoded TODOs
  (`create-session.ts:69` defaults to `'usd'`; `connect/create-account.ts` has
  `TODO: Get from user preferences or IP`). Fine for v1 — just be explicit that
  launch is US-only, USD-only.
- **Credits** are cut from v1 but `users.credits_balance` remains in the schema. If
  credits return they need a top-up flow first, and a decision about whether
  credit-funded royalties may be withdrawn as real money.
- **README duplicates CLAUDE.md** across its Views, Data Model, APIs and
  Architecture sections. They have already drifted once.

---

## Launch checklist

**Work Order** above is what to _do_, in order. This is what to _confirm_ before
shipping — the same ground stated as outcomes, to be signed off against a deployed
build rather than a local one. The overlap is deliberate.

- [ ] "Where Your Work Is Used" lists real parent products and earnings
- [ ] Stripe checkout shows a product image
- [ ] No optional field on a core type without a migration that creates the column
- [ ] A creator can reach `/payouts` by clicking, from a signed-in session
- [ ] An admin can reach `/admin/payouts` by clicking
- [ ] The create-product button leads to the create-product form
- [ ] No link in the application 404s (`/products/new`, `/connect/dashboard`,
      `/settings/notifications`, `/downloads`)
- [ ] A sale, a royalty and a completed payout each produce a notification —
      or the bell is removed from the navigation
- [ ] Documents are either deliverable or not for sale
- [ ] Fresh `supabase db reset` → sign up → create → upload → buy → download
- [ ] Embedded child product files download for the buyer
- [ ] Royalties are held, then mature, then are payable
- [ ] Webhook replayed twice produces exactly one sale and one royalty set
- [ ] Webhook rejects an invalid signature outside mock mode
- [ ] A second payout for already-paid earnings is refused
- [ ] A failed transfer returns reserved royalties to available balance
- [ ] A non-owner cannot delete another user's product image or avatar
- [ ] Focus is visible on every interactive element, purchases list included
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

The buyer-facing pricing blockers are closed — the cart discloses the platform
fee, Add to Cart renders, and line items show real money. **The buyer's journey
now runs end to end.**

The creator's does not. Tracing all six personas (`/JOURNEYS.md`) turned up three
failures that share a shape: the machinery works and the way in is missing.
`/payouts` computes a balance, reserves royalties atomically and requests a
transfer — and **nothing in the application links to it**. `getEmbeddedUsageForUser`
attributes royalties back to the parent product correctly — and selects a column
that does not exist, so it has returned `[]` since the day it was written. The
webhook knows about every sale, royalty and payout — and never writes the
notification the bell in the navigation is waiting for.

None of the three is deep. Together they are the difference between a creator
being paid and a creator watching an empty page.

Beyond that the list is what it was: documents are sold but never generated, the
legal pages are 11-line stubs, and nobody has walked a purchase end to end on a
fresh database. The Printer and Painter personas are not late — they are
unstarted, and PERSONAS.md is the only document that says otherwise.
