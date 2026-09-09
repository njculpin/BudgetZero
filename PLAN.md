# Game Loopers — Ship Plan

**Assessment date:** 2026-09-09
**Branch:** `main` @ `6f86611`
**Verdict:** Feature-complete in surface area, **not shippable** in the money path.

---

## Executive summary

The breadth of the product is genuinely there: 27 pages, 110 components, 90 API routes,
1,918 lines of schema with real RLS, 191 passing unit tests, and a clean SDK isolation
architecture that is actually being honoured. The build is green.

But the assessment turned up a set of defects concentrated exactly where a marketplace
cannot afford them — **purchase → download → royalty → payout**. Specifically: buyers
cannot download what they paid for (wrong storage bucket), any buyer can download files
they did *not* pay for (missing ownership check), Stripe webhook retries mint duplicate
sales and duplicate royalties, and royalty rows are never marked paid so a creator can
withdraw the same earnings repeatedly.

None of these are large fixes. They are concentrated in ~8 files. The honest read is
**2–3 focused weeks to a safe launch**, not "90–95% complete" as `CLAUDE.md` currently
claims. The gap is not features — it is correctness, legal copy, and dependency hygiene.

### Status at a glance

| Area | State | Note |
|---|---|---|
| Build (`npm run build`) | ✅ Green | 13.5s, Vercel adapter |
| Unit tests | ⚠️ 191 pass / 16 of 26 files fail to load | Env-config bug, not logic |
| Typecheck (`tsc --noEmit`) | ❌ 118 errors | ~40 are real |
| Purchase → download | ❌ Broken | Wrong bucket; embedded products inaccessible |
| Royalties → payout | ❌ Unsafe | Double-payout possible |
| Webhook idempotency | ❌ Absent | Stripe retries duplicate everything |
| Legal pages (ToS/Privacy/License) | ❌ 3-line stubs | Hard blocker for payments |
| Dependency security | ❌ 43 vulns, 5 critical | Incl. Astro RCE + auth bypass |
| CI | ❌ None | No `.github/` |
| Admin tooling | ❌ None | Payouts executable only via raw API POST |

---

## How this was assessed

Every claim below was verified by running the code, not by reading docs.

```
npm install                 # node_modules was stale: @tiptap/*, pdf-lib missing
npm run build               # fails before install, green after
npm run test:run            # 191 passed | 16 of 26 files fail to collect
npx tsc --noEmit            # 118 errors
npm audit                   # 43 vulns (5 critical, 22 high)
```

Plus manual review of the money path, middleware, RLS policies, and storage config.

> **Note:** `npm install` was run during this assessment, so `node_modules` and
> `package-lock.json` may now differ from your last commit. Check `git status`.

---

## What is genuinely done

Credit where it is due — these are solid and need no further work before launch:

- **SDK isolation** is real and enforced. Stripe appears only in `src/lib/payments/`,
  Resend only in `src/lib/email/`. Only one production violation exists
  (`src/lib/realtime/document-content-subscription.ts` imports `@supabase/supabase-js`
  directly); the rest are test files.
- **Schema and RLS.** 6 domain migrations, 38 tables' worth of structure, 96 RLS
  policies, consistent soft-delete convention.
- **Auth.** PKCE cookie flow, `src/middleware.ts` route guarding, session refresh,
  password reset, OAuth callback. Admin role check plus an audit log
  (`src/lib/auth/admin.ts`) — better than most projects at this stage.
- **Type discipline.** Only 11 `any` usages in non-test source across ~180 files.
- **Test intent.** 26 unit test files and 17 Playwright specs already written.
- **Product surface.** Cart, checkout, purchases, documents (TipTap collaborative
  editor), notifications, tags, user profiles, Stripe Connect onboarding, payouts UI.

---

## P0 — Ship blockers

These must all be closed before taking a single real payment.

### 1. Downloads point at a storage bucket that does not exist

`src/pages/api/download.ts:58` and `src/pages/api/products/upload-files.ts:92` both use
bucket `asset-files`. `supabase/migrations/00006_system_domain.sql:390` only creates
`product-files`, `product-images`, and `user-avatars`.

The type `StorageBucket` in `src/lib/storage/uploads.ts:4` still lists the legacy
`asset-files` and `asset-images` names from the pre-December asset model, and no
migration creates a `documents` bucket either.

If the hosted project happens to have `asset-files` created by hand, this works in prod
today but **any fresh environment (`supabase db reset`, a new staging project, CI) is
broken**. Either way, schema and code disagree.

**Fix:** pick `product-files`, update the code and the `StorageBucket` union, write a
migration creating any missing buckets, and reconcile existing objects in the hosted
project. Verify with a full `supabase db reset` + upload + download round trip.

### 2. Any buyer can download files they never purchased

`src/pages/api/download.ts:43` checks that the user purchased `product_id`, then at
`:58` serves whatever `file_id` was posted — **it never verifies the file belongs to
that product.** Buy one $1 product, then post its `product_id` alongside any other
product's `file_id` and receive a signed URL.

**Fix:** after `getProductFileById(fileId)`, assert `file.product_id === productId`
(and re-derive `productId` from the file rather than trusting the form). Also reduce the
24-hour signed URL TTL at `:60` — that link is shareable for a full day.

### 3. Buyers cannot download embedded child products

The whole product-in-product differentiator is broken on delivery. The webhook creates
`sale_item_asset` rows for embedded components
(`src/pages/api/webhooks/stripe.ts:170`), but `hasUserPurchasedProduct`
(`src/lib/data-access/sales.ts:276`) only queries `sale_items.product_id` — which never
contains child products. A buyer pays for the bundle and is refused the components.

**Fix:** have the purchase check consult `sale_item_assets` (or resolve components
through `product_components`). This needs a dedicated e2e test.

### 4. Stripe webhook has no idempotency guard

`checkout.session.completed` in `src/pages/api/webhooks/stripe.ts:50` creates a Sale,
SaleItems, and royalty transactions with no check for prior processing. Stripe retries
on any non-2xx — and the handler deliberately rethrows at `:206` to *force* retries.
A single retry produces a duplicate sale and a duplicate set of royalty obligations.

`getSaleByStripeChargeId` is already imported at `:3` and used in the refund branch —
it is simply not used as a guard here.

**Fix:** look up the sale by `payment_intent` first and return 200 early if it exists.
Better: wrap sale + items + royalties in a single Postgres function so partial failure
cannot leave half a sale behind. Add a unique constraint on `sales.stripe_charge_id`.

### 5. Royalties are never marked paid — creators can withdraw twice

This is the most expensive bug in the codebase.

- Royalty rows are created with `status: 'ready_to_pay'`
  (`src/lib/data-access/royalties.ts:418` and `:492`) — immediately payable, with no
  clearing period against the refund window.
- `getAvailablePayoutBalance` (`src/lib/data-access/payouts.ts:170`) sums every
  `ready_to_pay` row.
- **No production code anywhere transitions a `sale_royalty_transactions` row to
  `paid`.** Only tests reference that state.

So after a successful payout the same rows remain `ready_to_pay` and can be withdrawn
again, indefinitely.

Compounding it:
- `src/pages/api/payouts/request-payout.ts:110` picks which transactions a payout covers
  by dividing the requested amount by the *average* transaction value — a guess that
  does not sum to the amount paid.
- `src/lib/data-access/payouts.ts:38` writes `amountCents / length` into an integer
  cents column, producing floats.
- Two concurrent payout requests both pass the balance check; nothing reserves the rows.

**Fix:** treat this as one unit of work. Select an exact transaction set that sums to
the requested amount, mark those rows `reserved` atomically within the request, and
flip them to `paid` inside `payouts/execute.ts` on transfer success (rolling back to
`ready_to_pay` on failure). Add a clearing period before `ready_to_pay`.

### 6. `MOCK_STRIPE` activates on `MODE === 'development'`

`src/lib/payments/client.ts:13`, `checkout.ts:14`, and `webhooks/stripe.ts:10` all
enable mock mode whenever the build mode is `development`. In mock mode the webhook
**skips signature verification entirely** (`stripe.ts:36` passes `'mock_signature'`),
turning `/api/webhooks/stripe` into an unauthenticated endpoint that mints sales and
royalties for anyone who can POST to it.

If a preview deploy, a misconfigured `NODE_ENV`, or a Vercel preview branch ever runs
in development mode, that is remote free-money. The e2e suite also runs `npm run dev`
(`playwright.config.ts` `webServer`), so **no test ever exercises real signature
verification.**

**Fix:** gate mock mode on an explicit `MOCK_STRIPE=true` only, and hard-fail at boot
if `MOCK_STRIPE` is set while `PROD` is true.

### 7. Legal pages are empty

`src/components/documents/TermsOfService.md`, `PrivacyPolicy.md`, and
`StandardLicense.md` are **3 lines each — a heading and a date.**

Stripe requires published terms and a refund policy. GDPR/CCPA require a real privacy
policy. And the Standard License is load-bearing for the entire business model: it is
what defines the rights a buyer gets and what an embedder may do with someone else's
component. Shipping royalty splits without a license document is the largest
non-technical risk here.

This needs a lawyer, not a developer — **start it now**, in parallel with the code work,
because it has the longest lead time of anything on this list.

(Minor: `src/pages/licenses/standard.astro:6` has the page title "Privacy - Game Loopers".)

### 8. Astro has a critical RCE and an auth-bypass advisory

Installed: `astro@5.16.5`. `npm audit` reports 43 vulnerabilities (5 critical, 22 high),
including:

- **Astro — RCE via AVIF image optimization** (GHSA-26w7-cxv4-gfx2)
- **`@astrojs/vercel` — unauthenticated path override via `x-astro-path`**
  (GHSA-mr6q-rp88-fx84) — this directly defeats `src/middleware.ts` route protection
- Astro — authorization bypass from missing path-segment boundary check (GHSA-376h-93r7-7g6f)
- Seven distinct XSS advisories in Astro
- `tar` and `seroval` criticals

The fix is `astro@7.x` and `@astrojs/vercel@11.x` — both semver-major. This is a real
migration, so schedule it deliberately rather than discovering it the week of launch.

---

## P1 — Fix before or immediately after launch

### 9. Credits and Stripe are two divergent revenue implementations

`src/pages/api/checkout/credits-checkout.ts` reimplements the entire revenue split
independently of the Stripe path: it computes the 10% fee inline at `:190`, mutates
`credits_balance` directly, and **never creates royalty transactions or
`sale_item_asset` rows.** The Stripe path does the opposite.

Consequences: the two paths will drift; credits purchases produce no royalty audit
trail; and credit balance updates are read-modify-write (`:124`, `:202`, `:217`) — two
concurrent checkouts both read the same balance, so credits can be double-spent.

Also: **there is no way to buy credits.** Balances can only be earned and spent.

**Fix:** route both payment methods through one shared sale-fulfilment function; make
balance changes atomic in SQL (`balance = balance - $1` with a guard), not in JS.

### 10. Test suite cannot load 16 of 26 files

`vitest.config.ts:5` loads `dotenv.config({ path: '.env' })` — **a file that does not
exist.** The repo has `.env.local` and `.env.test`. Every test touching
`src/lib/data-access/client.ts` then dies with `supabaseKey is required.`

The 191 tests that do run all pass; roughly 60% of the suite has simply never been
running. Fix the env path first — the real coverage picture is unknown until then.

### 11. 118 TypeScript errors

`npx tsc --noEmit` fails. Roughly a third are `.astro` import resolution (tsc cannot
resolve those — install `@astrojs/check` and use `astro check` as the real gate). But
the rest are genuine, and two are on the money path:

- `src/pages/api/webhooks/stripe.ts:163,185` pass `saleItemAssetId` to
  `createRoyaltyTransactionsForProduct`, which does not accept it — **the royalty rows
  are silently missing their link to the granted asset.**
- `src/pages/api/notifications/*` call `setSession()` with 2 args (expects 0) and read
  `.user` off a session response that does not expose it — the notifications API is
  likely broken at runtime.
- `src/pages/api/users/complete-onboarding.ts:33` — `session.user` possibly null.
- `src/pages/api/products/[productId]/index.ts:35` — `full_name` is not on `User`.

**Fix:** install `@astrojs/check`, get to zero, then wire it into CI as a merge gate.

### 12. Storage RLS lets any user delete anyone's images

`supabase/migrations/00006_system_domain.sql:430-438` and `:449-459` create policies
named "Users can update/delete **own** product images / avatars" whose `USING` clause
only checks `bucket_id`. There is no ownership predicate. Any authenticated user can
overwrite or delete every product image and every avatar on the platform.

Uploads are equally unscoped — no `(storage.foldername(name))[1] = auth.uid()::text`
check on INSERT, so users can write anywhere in the bucket.

### 13. Unprotected and dead API routes

- `src/middleware.ts:7` protects `/api/products`, `/api/payouts`, `/api/connect`,
  `/api/cart` — but **not** `/api/documents`, `/api/tags`, `/api/users`,
  `/api/settings`, `/api/notifications`, `/api/upload`, `/api/checkout`. Several of
  those rely on inline checks; `/api/documents/user-documents.ts` has none.
- It also still lists `/api/assets`, which no longer exists.
- **5 empty API files** ship as routes:
  `api/tags/{create,delete,update}-tag.ts`, `api/users/{create,delete}-user.ts`.
  Nothing references them — delete them. But note that an empty `delete-user.ts` means
  **account deletion is unimplemented**, which GDPR requires.
- `src/pages/api/checkout.ts` (137 lines) is dead — the UI calls
  `/api/checkout/create-session` and `/api/checkout/credits-checkout`.

### 14. No CI

There is no `.github/`. Nothing prevents a broken build, a failing test, or a type error
from reaching `main` — and Vercel auto-deploys `main` on push. Given that `node_modules`
was stale enough locally that the build failed outright, a CI job running
`npm ci && astro check && npm run test:run && npm run build` would have caught it.

### 15. Purchase emails link to ephemeral URLs

`src/pages/api/webhooks/stripe.ts:191` builds the purchase link from `VERCEL_URL`, which
is the per-deployment hostname, not the production domain. Receipt links will rot.
Use an explicit `PUBLIC_SITE_URL`.

### 16. PDF generation is stubbed

`src/lib/data-access/products.ts:1333` and
`src/pages/api/products/generate-document-pdfs.ts:87` are both
`TODO: Implement actual PDF generation`. `pdf-lib` is a dependency but the feature is
not built — yet `credits-checkout.ts:180` calls `ensureProductDocumentPDFs` as part of
fulfilment. Decide: build it, or cut document-PDF delivery from v1 and say so in the UI.

---

## P2 — Quality and hygiene

- **No admin UI.** `payouts/execute.ts` is admin-guarded and audit-logged, but there is
  no page that calls it — payouts can only be executed by hand-crafting a POST. Build a
  minimal `/admin/payouts` before you owe anyone money.
- **No error monitoring.** No Sentry, no structured logging, no analytics. Production
  failures will be invisible.
- **No rate limiting** on any route, including `/api/auth/sign-in` and `/api/upload`.
- **Stale e2e specs.** `e2e/assets-browse.spec.ts` and `e2e/assets-crud.spec.ts` test
  the removed asset model. `e2e/debug-auth.spec.ts` looks like a scratch file.
- **Deprecated aliases** in `src/lib/data-access/royalties.ts` (`getAssetRoyalties`,
  `createAssetRoyalty`, …) and `hasUserPurchasedAsset` in `sales.ts` keep the dead asset
  vocabulary alive. Remove them.
- `src/lib/data-access/products.test.ts` sits outside `__tests__/` unlike every sibling.
- **`env.d.ts` is incomplete** — missing `SUPABASE_SERVICE_ROLE_KEY` and
  `STRIPE_CONNECT_WEBHOOK_SECRET`, which `CLAUDE.md` explicitly requires it to match.
- **Node version drift** — the build warns that local Node 24 is unsupported by Vercel
  (which uses 22). Pin it in `package.json` `engines` and `.nvmrc`.
- Unused variables `productRoyalties` / `embeddedRoyalties` in `webhooks/stripe.ts`
  violate the project's own no-unused rule.
- **Multi-currency and non-US Connect** are hardcoded TODOs
  (`checkout.ts:90`, `connect/create-account.ts:75`). Fine for v1 — just be explicit
  that launch is US-only, USD-only.

---

## Documentation drift

The docs describe a system that no longer matches the code. This matters because it is
what makes the project *feel* 95% done.

- **`ROADMAP.md` does not exist**, though `CLAUDE.md` references it four times as the
  source of truth for phasing and status.
- **`CLAUDE.md` cites `/src/pages/dashboard.astro`** as the reference session
  implementation — there is no dashboard page.
- **Routes that do not exist** but are documented in `README.md` / `CLAUDE.md`:
  `/feed`, `/login`, `/dashboard`, `/users/[handle]/feed`,
  `/products/[handle]/feed`, `/tags/[handle]/feed`.
- **Actual routes are `[user]` / `[product]` / `[document]`**, not `[handle]`.
- **`README.md:565` documents `/src/components/islands/`** — that directory does not
  exist; components are organised by domain.
- **`CLAUDE.md`'s "~90-95% complete toward MVP"** should be revised in light of the P0
  list.

Fix the docs last, once the code has settled — but do fix them.

---

## Suggested sequencing

### Week 1 — Make the money path correct
Nothing else matters until this is done.

1. Kick off legal drafting for ToS / Privacy / Standard License (longest lead time —
   start day one, in parallel with everything below).
2. Fix `vitest.config.ts` env loading so the full suite runs; see what actually fails.
3. Fix the storage bucket mismatch end to end (P0 #1).
4. Add the `file → product` ownership check to downloads (P0 #2).
5. Make embedded child products downloadable (P0 #3).
6. Add webhook idempotency + a unique constraint on `stripe_charge_id` (P0 #4).
7. Gate `MOCK_STRIPE` on the explicit flag only, and hard-fail in prod (P0 #6).

**Exit criterion:** an e2e test that buys a bundle with an embedded component using a
real Stripe test webhook signature, replays the webhook, and asserts exactly one sale,
one royalty set, and successful downloads of both parent and child files.

### Week 2 — Make payouts safe, then close the gates
8. Rebuild payout reservation: exact transaction selection, atomic reservation,
   `paid` transition on transfer success, clearing period (P0 #5).
9. Unify credits and Stripe fulfilment; make balance mutations atomic (P1 #9).
10. Fix storage RLS ownership predicates (P1 #12).
11. Install `@astrojs/check`, drive type errors to zero (P1 #11).
12. Audit middleware coverage; delete the 5 empty routes and dead `checkout.ts` (P1 #13).
13. Add CI: `npm ci && astro check && npm run test:run && npm run build` (P1 #14).

**Exit criterion:** CI green on `main`, zero type errors, payout double-spend covered
by a test.

### Week 3 — Upgrade, observe, operate
14. Astro 7 + `@astrojs/vercel` 11 migration; re-run `npm audit` to zero criticals (P0 #8).
15. Minimal `/admin/payouts` UI (P2).
16. Sentry or equivalent + rate limiting on auth and upload (P2).
17. Implement account deletion (P1 #13).
18. Decide on PDF generation: build or cut (P1 #16).
19. Land the legal copy.
20. Reconcile `README.md` / `CLAUDE.md`; write the real `ROADMAP.md`.

**Exit criterion:** launch checklist below is fully green.

---

## Launch checklist

Do not take real payments until every line is checked.

- [ ] `npm ci && astro check && npm run test:run && npm run build` green in CI
- [ ] `npm audit` reports zero critical, zero high
- [ ] Full `supabase db reset` → sign up → create product → upload → buy → download
      round trip passes on a **fresh** environment
- [ ] Embedded child product files download successfully for the buyer
- [ ] Stripe webhook replayed twice produces exactly one sale and one royalty set
- [ ] Webhook rejects an invalid signature in production mode
- [ ] Payout executed twice for the same balance is refused the second time
- [ ] Credits and Stripe purchases produce identical royalty records
- [ ] A non-owner cannot delete another user's product image or avatar
- [ ] ToS, Privacy Policy, and Standard License published and lawyer-reviewed
- [ ] Refund policy published (Stripe requirement)
- [ ] Account deletion implemented and tested
- [ ] Error monitoring receiving events from production
- [ ] Rate limiting on `/api/auth/*` and `/api/upload`
- [ ] Admin can execute a payout through a UI
- [ ] `PUBLIC_SITE_URL` set; receipt emails link to the production domain

---

## The short version

The architecture is good and the surface area is large — this is not a project that
needs restarting. What it needs is for someone to go through the seven or eight files
between "customer pays" and "creator gets paid" and make each one correct, then put a
CI gate in front of `main` so they stay correct.

The two things to start *today*, because they are the longest poles: **the legal
documents** and **the Astro 7 upgrade**.
