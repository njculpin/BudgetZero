# Game Loopers — Ship Plan

**Last updated:** 2026-09-09
**Branch:** `fix/ship-blockers-money-path` (7 commits ahead of `main`)

This file tracks **only what is still outstanding**. Completed items are deleted
rather than checked off — if it is not written here, it is done or it was never in
scope. Git history is the record of what changed.

---

## Current state

| Check | Result |
|---|---|
| `npm run build` | ✅ green (Astro 7.3.2) |
| `astro check` | ✅ **0 errors** across 313 files |
| `npm run test:run` | ✅ **338 passing**, 0 failing |
| `npm audit` | ⚠️ 3 high, **0 critical** |
| Integration tests (7 files) | ⛔ **never executed** — see Verification gap |
| Purchase → download | ✅ repaired, unverified against a live DB |
| Royalties → payout | ✅ repaired, unverified against a live DB |
| Legal pages | ❌ still 3-line stubs |
| CI | ✅ `.github/workflows/ci.yml` |

The money path defects that made this unshippable are fixed in code. What stands
between here and launch is now: **verification**, **legal**, and a short list of
operational gaps.

---

## ⛔ Verification gap — read this first

**The 7 integration test files have not run in this session.** They require Docker
and a local Supabase, and Docker was not running on this machine. They are exactly
the tests that cover the code that changed most:

```
src/lib/data-access/__tests__/{cart,payouts,products,royalties,users}.test.ts
src/pages/api/__tests__/checkout-flow.test.ts
src/pages/api/webhooks/__tests__/stripe.test.ts
```

Every money-path fix — bucket rename, entitlement resolution, webhook idempotency,
payout reservation — is verified only by typecheck, unit tests, and reading. None
of it has touched a real Postgres.

**Do this before anything else:**

```bash
# start Docker Desktop, then:
npm run supabase:start
npm run supabase:reset     # applies 00007, 00008 and 00010
npm run test:run
```

Migrations `00007_storage_buckets_and_policies.sql`,
`00008_payout_reservation.sql` and `00010_rate_limits.sql` have **never been
applied anywhere**. The payout work depends entirely on `request_payout` / `settle_payout` / `release_payout`
existing and behaving as written. Treat a clean run of `payouts.test.ts` as the
gate on the payout rewrite.

---

## P0 — Ship blockers

### 1. Legal pages are empty

`src/components/documents/TermsOfService.md`, `PrivacyPolicy.md`, and
`StandardLicense.md` are **3 lines each — a heading and a date.**

Stripe requires published terms and a refund policy. GDPR/CCPA require a real
privacy policy. The Standard License is load-bearing for the business model: it
defines what rights a buyer gets and what an embedder may do with someone else's
component. Shipping royalty splits without it is the largest non-technical risk
here.

This needs a lawyer, not a developer. It has the longest lead time of anything
remaining — **start it now**, in parallel with everything else.

### 2. End-to-end proof of the money path

Once the local stack is up, the fixes need one honest end-to-end run, not just
green unit tests:

- [ ] Fresh `supabase db reset` → sign up → create product → upload file → buy →
      download. On a **clean** environment, so the bucket fix is actually proven.
- [ ] Buy a bundle containing an embedded component; download the **child**
      product's files. This is the case that was broken and is the core
      differentiator.
- [ ] Replay a `checkout.session.completed` webhook with the same event id and
      assert exactly one sale and one royalty set.
- [ ] Send an invalid webhook signature with `MOCK_STRIPE` unset and assert it is
      rejected.
- [ ] Request a payout, execute it, then attempt a second payout for the same
      earnings and assert refusal.
- [ ] Fail a transfer and assert the reserved royalties return to available
      balance.

The e2e suite runs `npm run dev` via `playwright.config.ts`, so it never exercises
real Stripe signature verification. Consider a separate config that runs a
production build for the webhook cases.

---

## P1 — Before or immediately after launch

### 3. Account deletion is unimplemented

`/api/users/delete-user.ts` was an empty file and has been deleted. GDPR requires
this. Needs a real soft-delete cascade across users, products, documents, and a
decision about what happens to sales and royalty records the platform must retain
for accounting.

### 4. PDF generation is stubbed

`src/lib/data-access/products.ts` and
`src/pages/api/products/generate-document-pdfs.ts` are both
`TODO: Implement actual PDF generation`. `pdf-lib` is installed but unused.
Decide: build it, or cut document-PDF delivery from v1 and say so in the UI.

### 5. Three high-severity advisories with no upstream fix

`npm audit` reports 3 high, 0 critical. All three are one ReDoS in
`path-to-regexp`, reached transitively through `@vercel/routing-utils` inside
`@astrojs/vercel`. No adapter release fixes it — npm's suggested "fix" is a
downgrade to `@astrojs/vercel` 8.0.4, which would **reintroduce the
`x-astro-path` authentication bypass**. Do not take that suggestion. Recheck
after each adapter release.

---

## P2 — Quality and hygiene

- **Multi-currency and non-US Connect** are hardcoded TODOs
  (`checkout/create-session.ts`, `connect/create-account.ts`). Fine for v1 — just
  be explicit that launch is US-only, USD-only.
- **Credits** are cut from v1 but `users.credits_balance` remains in the schema.
  If credits return, they need a top-up flow first (they could previously only be
  earned, never bought, which is why the feature was inert) and a decision about
  whether credit-funded royalties may be withdrawn as real money.

---

## Documentation drift

The docs still describe a system that does not exist. This is what made the
project read as more finished than it was.

- **`ROADMAP.md` does not exist**, though `CLAUDE.md` references it four times as
  the source of truth for phasing and status.
- **`CLAUDE.md` cites `/src/pages/dashboard.astro`** as the reference session
  implementation. There is no dashboard page.
- **Routes documented but absent:** `/feed`, `/login`, `/dashboard`,
  `/users/[handle]/feed`, `/products/[handle]/feed`, `/tags/[handle]/feed`.
- **Actual routes are `[user]` / `[product]` / `[document]`**, not `[handle]`.
- **`README.md` documents `/src/components/islands/`** — that directory does not
  exist; components are organised by domain.
- **`CLAUDE.md` claims "~90-95% complete toward MVP"** — revise against this file.
- **`supabase/migrations/README.md`** describes the consolidation but predates
  migrations 00007, 00008 and 00010.
- `CLAUDE.md` still lists Astro 5.15.1 and describes a `PaymentMethodSelector` /
  credits flow that no longer exists.

---

## Launch checklist

- [ ] Local Supabase up; all 26 test files pass, including the 7 integration files
- [ ] Fresh `supabase db reset` → sign up → create → upload → buy → download
- [ ] Embedded child product files download for the buyer
- [ ] Webhook replayed twice produces exactly one sale and one royalty set
- [ ] Webhook rejects an invalid signature outside mock mode
- [ ] A second payout for already-paid earnings is refused
- [ ] A failed transfer returns reserved royalties to available balance
- [ ] A non-owner cannot delete another user's product image or avatar
- [ ] ToS, Privacy Policy, and Standard License published and lawyer-reviewed
- [ ] Refund policy published (Stripe requirement)
- [ ] Account deletion implemented and tested
- [ ] `PUBLIC_SENTRY_DSN` set and `@sentry/astro` installed, or a deliberate
      decision to run on console logs only
- [ ] `PUBLIC_SITE_URL` set in Vercel; receipt emails link to the production domain
- [ ] `MOCK_STRIPE` unset in every deployed environment
- [ ] `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`, `RESEND_API_KEY` set in Vercel
- [ ] An admin account exists (`users.role = 'admin'`) to work the payout queue

---

## The short version

The code between "customer pays" and "creator gets paid" is now correct, and CI
keeps it that way. Nothing on that path has been proven against a real database
yet, and that is the next thing to do.

The two long poles are unchanged: **the legal documents** and **end-to-end
verification on a live stack**.
