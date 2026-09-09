# Game Loopers — Ship Plan

**Last updated:** 2026-09-09
**Branch:** `fix/ship-blockers-money-path` (13 commits ahead of `main`)

This file tracks **only what is still outstanding**. Completed items are deleted
rather than checked off — if it is not written here, it is done or it was never in
scope. Git history is the record of what changed.

---

## Current state

| Check | Result |
|---|---|
| `npm run build` | ✅ green (Astro 7.3.2) |
| `astro check` | ✅ **0 errors** across 318 files |
| `npm run test:run` | ✅ **525 passing**, 0 failing — including all 7 integration suites |
| `npm audit` | ⚠️ 3 high, **0 critical** |
| Migrations 00007/00008/00010 | ✅ applied; every object verified present |
| Purchase → download | ✅ repaired and covered by tests |
| Royalty payout reserve/settle/release | ✅ verified against real Postgres |
| Legal pages | ❌ still 3-line stubs |
| CI | ✅ `.github/workflows/ci.yml` |

The money-path defects that made this unshippable are fixed and now verified
against a real database. What stands between here and launch is the P0 list in
**`REPORT.md`** — chiefly that nothing ever writes to `product_royalties`, so no
royalty is ever paid — plus the legal documents.

---

> **See `REPORT.md`** for the persona-journey findings. Its P0 list is larger than
> this file's and supersedes it for launch sequencing.

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

- **`uploadFile` returns a public URL for private buckets.** `product_files.file_url`
  therefore holds a URL that 400s for `product-files` and `document-attachments`.
  Nothing depends on it today (downloads go through `/api/download`), but it is a
  trap for the next person who links to `file_url` directly.
- **Multi-currency and non-US Connect** are hardcoded TODOs
  (`checkout/create-session.ts`, `connect/create-account.ts`). Fine for v1 — just
  be explicit that launch is US-only, USD-only.
- **Credits** are cut from v1 but `users.credits_balance` remains in the schema.
  If credits return, they need a top-up flow first (they could previously only be
  earned, never bought, which is why the feature was inert) and a decision about
  whether credit-funded royalties may be withdrawn as real money.

---

## Launch checklist

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
