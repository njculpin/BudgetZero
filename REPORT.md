# Game Loopers — User Journey Verification Report

**Generated:** 2026-09-09
**Scope:** MVP personas — Game Designer, 3D Modeler, Illustrator, Consumer
**Branch:** `fix/ship-blockers-money-path`
**Phase:** Pre-launch verification

---

## Executive Summary

The marketplace cannot currently complete a single end-to-end transaction, and the
feature that differentiates it from DriveThruRPG and itch.io — royalty sharing on
embedded components — **has never worked and cannot work**, because nothing in the
application ever creates a royalty record.

This is not a UX-polish report. Five defects sit on the critical path, each
independently sufficient to block launch:

| # | Defect | Consequence |
|---|---|---|
| 1 | `product_royalties` has no write path | **No royalty is ever paid to anyone.** |
| 2 | `products.price_cents` does not exist in the database | **The Add to Cart button never renders.** |
| 3 | Cart reads the same phantom field | Every line item displays **"FREE"**, then charges full price. |
| 4 | Displayed price excludes the 10% fee that checkout adds | Buyer sees $20.00, is charged $22.00. |
| 5 | Priced documents are charged for but `pdf_url` is never set | Buyer pays for a rulebook that silently never appears. |

Underneath them is a consistent pattern worth naming: **the platform's distinctive
features are built but not connected.** `ProductRoyaltyBreakdown`,
`ProductPublishChecklist`, `ProductComponentSearchModal` and `ProductContributors`
are all complete, correct, and render on zero pages — or render into an empty
array. The scaffolding of a differentiated marketplace exists; the wiring does not.

The prognosis is better than that sounds. These are connection problems, not design
problems. The components are written. The schema supports the model. Most fixes
below are measured in hours.

**Verification status:** every P0 in this report was independently confirmed by
reading the source, not accepted from an agent. Where an agent's claim did not
survive checking, it is corrected and marked.

---

## Methodology

- **Agents:** the skill specifies `project-product-manager` and `ux-flow-designer`.
  Neither is registered in this session (only `code-quality-guardian` and
  `database-architect` from `.claude/agents/` are), so three `general-purpose`
  agents were seeded with those role definitions — one strategic review, one for
  the three creator personas, one for the consumer.
- **Personas:** 4 MVP personas from `PERSONAS.md`. Printer and Painter excluded —
  see *Strategy conflict* below.
- **Flows analysed:** 12 across creation, embedding, revenue, discovery, purchase,
  download and attribution.
- **Standards:** WCAG 2.1 AA, BEM, `DESIGN_SYSTEM.md` tokens, `CLAUDE.md`
  architecture rules.
- **Every P0 was re-verified by hand.** Agent findings are treated as leads, not
  conclusions.

---

## P0 — Blocks launch

### 1. No royalty is ever paid to anyone

`product_royalties` is the table every royalty feature reads. **Nothing in the
application ever writes to it.**

- `createProductRoyalty` is defined twice — `products.ts:991` and
  `royalties.ts:50` — with **zero production callers** (tests only).
- Embedding writes only a `product_components` row
  (`api/products/embed-product.ts:141-149`). No royalty record.
- `createRoyaltyTransactionsForProduct` therefore returns `[]` immediately
  (`royalties.ts:203-207`), even though the Stripe webhook correctly calls it for
  the parent product and every component (`webhooks/stripe.ts:192-209`).

Everything downstream is a no-op:

| Surface | Shows today |
|---|---|
| Contributors card on the product page | Never renders (`products.ts:692-694` returns `[]`) |
| `RevenuePreview` before publishing | Owner at 100%, always |
| `EmbeddedUsageDashboard` earnings | `$0.00`, always |
| `/payouts` available balance | `$0.00`, always |

**This corrects an earlier claim of mine.** I previously reported that the webhook
"bailed out before creating royalties" and that fixing it restored creator
earnings. The webhook fix was real and necessary, but it repaired the plumbing
above a dry well. With `product_royalties` empty, zero royalty transactions are
created regardless. The 3D Modeler and Illustrator value proposition — passive
income — does not exist in code.

**Fix:** write a `product_royalties` row inside the embed transaction, sourced from
the child product's configured rate. ~4–6 h. This single change unblocks
contributors, revenue preview, earnings and payouts together.

### 2. The Add to Cart button never renders

The `products` table has **no `price_cents` column**
(`00004_products_domain.sql:8-25`). A product's price is the sum of its files,
documents and components, computed by `getProductPriceBreakdown`.

But `types/products.types.ts:22` declares `price_cents?: number | null` on the
`Product` interface. Because it is **optional**, TypeScript never complains. At
runtime it is always `undefined`, and `AddToCartButton.canPurchase()` requires
`props.priceCents != null` (`AddToCartButton.tsx:23-30`).

Result: on the public product page, every `<Show>` in `AddToCartButton` is false.
No price, no button, no explanation — an empty card. The only surviving purchase
path is a secondary button inside "What's Included", which renders only if the
product has content.

**Note on my own contribution to this.** During the Astro 7 upgrade I hit a type
error here and widened the prop to `number | null | undefined`, changing `!== null`
to `!= null`. That silenced the compiler correctly and masked a live product bug.
The correct response would have been to ask why the field was undefined. A phantom
optional field is precisely what `astro check` cannot catch — worth remembering
given how much weight "0 errors" has been carrying in this project's status
reporting.

**Fix:** delete `price_cents` from the `Product` type; have the product page call
`getProductPriceBreakdown` and pass `totalPrice`. ~1–2 h. Also fixes #3.

### 3. Every cart line item says "FREE"

`CartItemRow.unitPrice()` reads `props.item.product?.price_cents`
(`CartItemRow.tsx:119-122`) — the same phantom field → `0` → `formatPrice(0)`
returns `"FREE"` (`:113-117`). Meanwhile the order summary two columns over shows
the true total.

The correct value is already in scope: `cart.astro:66` sets `item.price_cents`
from the real breakdown. The component reads `item.product.price_cents` instead of
`item.price_cents`.

**Fix:** one-word change. 15 min. Highest-abandonment moment in the funnel and a
chargeback generator until then.

### 4. Displayed prices are 10% below what Stripe charges

`getProductPriceBreakdown` returns `totalPrice = subtotal + platformFee`
(`products.ts:1237-1238`), and checkout charges `totalPrice`
(`create-session.ts:91`). The fee is **added on top**, not deducted. But:

- `ProductContentViewer.tsx:59-61` labels the bare item sum **"Total"**.
- `cart.astro:131-135` labels subtotal as both "Subtotal" **and** "Total", no fee line.
- `products/index.astro:68-70` computes card prices without the fee — and omits
  documents entirely, so document-only products display **"Free"** in the grid.
- `RevenuePreview.tsx:130-132` captions it "Platform fees deducted at checkout" —
  factually backwards.

For the persona whose stated pain is *"doesn't know where the money goes,"* an
undisclosed 10% appearing at the payment step is the worst available failure mode,
and a Stripe compliance risk.

**Fix:** one function as the single source of price truth; show
subtotal / fee / total explicitly. ~3–4 h.

### 5. Post-purchase download links are dead

`checkout/success.astro:252-258` and `purchases/[purchase].astro:156-161` link
`file.file_url` directly. `product-files` is a private bucket whose only SELECT
grant is the service role. The working path is `POST /api/download`, used correctly
by `PurchaseCard.tsx:164-169`.

This compounds a latent trap already noted in `PLAN.md`: `uploadFile` returns a
public URL even for private buckets, so `product_files.file_url` holds a URL that
will always 403.

**Fix:** route all download links through `/api/download`; extract the form into
one shared component so it cannot drift again. ~2–3 h.

### 6. Embedding is broken end to end

Three independent contract mismatches between `AddContentModal` and the API:

| Modal sends / reads | API expects / returns | File |
|---|---|---|
| `{ productId, childProductId }` | `{ parentProductId, childProductId, inheritedPriceCents }` | `AddContentModal.tsx:237` vs `embed-product.ts:6-10` |
| `data.embeddedProduct` | `{ success, component }` | `:246` vs `embed-product.ts:163` |
| `product.total_price` | `total_price_cents` | `:559` vs `search-embeddable.ts:128` |

Zod rejects the request → 400 → generic "Failed to embed product". Search results
meanwhile render **`$NaN`**. This is the collaboration story, and it does not run.

Compounding: embedded products **cannot be removed**. `ContentItem.tsx:221` gates
delete on `editable`, which `index.tsx:108` sets false for embedded items. The
`handleDelete` branch for `"embedded"` is unreachable. Embed the wrong product and
there is no way out.

**Fix:** align the contract (~1–2 h); gate removal on a separate `removable` prop
(~30 min).

### 7. The royalty rate creators set is ignored, and is client-forgeable

`ProductEmbeddableToggle` writes `embedding_royalty_cents` and promises *"You'll
earn $X each time someone purchases a product containing this one"* (`:193-195`).

The only code that reads it is `ProductComponentSearchModal.tsx:49,59` — which has
**zero references anywhere in the repo**.

`embed-product.ts` takes `inheritedPriceCents` from the **client request body**
(`:9,146`), `min(0)`, and never consults the child. So the embedding party sets the
price of someone else's work, and can set it to zero. Against the 3D Modeler's
stated pain — *race-to-bottom pricing* — the platform hands price control to the
buyer of that labour.

**Fix:** derive `inherited_price_cents` server-side from the child product; remove
it from the request schema. ~1–2 h. Security-relevant, not just UX.

### 8. Buyers are charged for documents that are never delivered

`documentPriceTotal` is summed into the subtotal (`products.ts:1197-1206`), and
that subtotal is what Stripe charges (`create-session.ts:91`). Documents are
individually priceable — `api/products/update-document-price.ts` exists for exactly
that.

But `generate-document-pdfs.ts:95-105`, which `update-product.ts:176` fires
automatically on publish, sets `pdf_storage_path` and `pdf_generated_at` and
deliberately **does not set `pdf_url`**. Every delivery surface then filters on
that null field — `checkout/success.astro:105,135` and
`purchases/index.astro:58,83` all do `.filter(doc => doc.pdf_url)`.

The failure is silent and clean: no broken links, the documents simply never
appear. A creator prices a rulebook at $15, the buyer is charged for it, and the
buyer's purchases page shows nothing — with no error, so **neither party learns
anything is wrong.**

This is charging for undelivered goods, not a missing feature. `PLAN.md` had PDF
generation as P1 ("build it, or cut it"); the money side being already wired makes
it P0. For a TTRPG marketplace the rulebook often *is* the product.

**Cheapest correct fix for v1:** exclude documents from `getProductPriceBreakdown`
and hide document pricing in the UI until generation exists. ~2 h.

One relief: the other PDF stub, `ensureProductDocumentPDFs` (`products.ts:1322`),
writes a fabricated `https://placeholder-pdf-url/...` into `pdf_url`. That *would*
have produced live broken links, but it has zero callers. Delete it before someone
wires it up.

### 9. Legal terms are absent at the point of licensing

Already tracked in `PLAN.md`, but the journey work sharpens it: `search-embeddable`
returns no license and no royalty rate, so a designer embedding an illustration
completes a **licensing transaction with no terms shown and no acceptance step**.
The buyer is likewise never told what usage rights they purchased.

For the Illustrator, whose stated pain is *"unclear licensing terms,"* the platform
currently displays fewer terms than a commission email would.

---

## Findings by persona

### Game Designer

**Works well.** Instant-draft creation with no blank-form wall
(`products/index.astro:108` → `create-product.ts:76`) is the right pattern.
Auto-save with debounce and retry-aware errors (`ProductBasicInfoForm.tsx:73-76`).
Publish is a deliberate two-step (`ProductStatusEditor.tsx:62-65`). The unified
content list — files, documents and embedded products in one sorted view with
inline pricing — is genuinely good information architecture: the designer thinks
"what's in my game", not "which table". `Modal.tsx` has a real focus trap, Escape
handling and focus restore — the best accessibility in the codebase.

**Friction beyond the P0s.**
- The primary Create button in the user menu is a **404**
  (`NavigationUserMenu.tsx:164` → `/products/new`, no such route). Hit every session.
- **No publish readiness signal.** `ProductPublishChecklist.tsx` exists — required
  vs recommended, progress meter — and renders nowhere. The publish dialog says
  "Make sure you've completed all requirements" with no requirements shown. A
  product titled `New Product - Sep 9, 2026`, with no description, files or cover,
  publishes without objection.
- `RevenuePreview` never refreshes: its resource is keyed on a constant
  (`:20`), so the split silently goes stale as content changes.
- Document reordering POSTs to `/api/products/reorder-documents`, which does not
  exist (`ProductContentManager/index.tsx:261`). Local state mutates first, so the
  designer sees the new order, an alert, then the old order.
- Editing the title drops `/edit` from the URL (`ProductBasicInfoForm.tsx:58-68`
  mis-parses the path), landing the designer on the public page after refresh.
- Partial upload failures report as success (`AddContentModal.tsx:123` counts
  attempted files, not `data.files.length`).
- `alert()` / `window.confirm()` used as the error and confirmation system, against
  the `ErrorMessage`/`Modal` components used elsewhere.

### 3D Modeler

**Works well.** `EmbeddedUsageDashboard` is exactly the right answer to "track
commercial usage" — per-parent cards with component price, sales count and
earnings, a loading skeleton, an error state, and an empty state that says what to
*do* about it. `/api/products/embedded-usage` was hardened to derive the user from
session rather than a query parameter. The embeddable toggle explains all three
states clearly, including why a private product cannot yet be embedded. `.stl` is a
first-class upload type.

**Friction beyond the P0s.**
- **Earnings will read `$0.00` after every sale** (finding 1). That is worse than
  no dashboard — it reads as "the platform sold my work and didn't pay me."
- **No notification when work is embedded.** The one thing this persona most needs
  to know is pull-only, and buried.
- **`/payouts` is linked from nowhere** — not nav, not footer, not the user menu.
  Reachable only by typing the URL. Its own "Payout Settings" action links to
  `/connect/dashboard`, which does not exist.
- `EmbeddedUsageDashboard` refetches on every reactive tick
  (`createEffect` wrapping a function that sets the signals it reads, `:22-24`).
- Multiple components from the same parent collapse to one card showing only the
  first component's price (`products.ts:1509-1517`), understating value.
- "max 100MB per file" is promised in copy but enforced nowhere, client or server.

### Illustrator

**Works well.** `ProductContributors.astro` is well designed for exactly this
persona: avatar, name, role, "via *child product title*", each linking to
`/users/{handle}`. It is wired into both the public product page and the owner's
edit page with an honest caption.

**And it never renders.** Both call sites gate on
`productContributorsWithRoles.length > 0`, and that array is always empty because
it derives from `product_royalties` (finding 1). **`ProductContributors.astro` is
dead markup on a live page.** For the persona whose top pain is *"work used
without credit,"* the platform currently reproduces that pain exactly.

**Friction beyond the P0s.**
- The only surviving credit is unlinked plain text below the fold — `by {creator}`
  inside "What's Included" (`ProductContentViewer.tsx:53`), while the *designer*
  gets a prominent "Created By" card. And `creator_handle` is hardcoded to `""`
  (`ProductContentManager/index.tsx:55`), so the credit could not link even if
  someone wanted it to.
- **No say and no visibility.** Embedding needs only `is_embeddable` + public. No
  notification, no approval, no review window.
- **No way to revoke.** Turning `is_embeddable` off prevents new embeds; existing
  `product_components` rows are untouched and the child owner has no UI listing
  them. Copyright control is one-way.
- Role inference is guessed from title substrings (`products.ts:735-756`), so
  "Tavern Interior Battlemap" is credited as *Map Designer*, not Illustrator.
- Illustrators cannot set `alt` text on their own images — the product whose value
  *is* the image cannot be described for screen readers.

### Consumer / Buyer

**Works well.** "What's Included" (`ProductContentViewer`) is a real, differentiated
feature: files, documents and embedded components in one list, each priced, with
the child creator named. Most marketplaces do not do this. Embedded-component
entitlement is correctly modelled server-side — `getPurchasedProductIds` expands
purchases into components, and `/api/download` resolves the product from the file
rather than caller input. The purchases list surfaces component files tagged with
their source product. Failed-payment recovery maps eight Stripe error codes to
human copy with a retry flag and support triage details. Cart quantity updates are
optimistic with rollback and an `aria-live` region.

**Friction beyond the P0s.**
- **Removing a cart item leaves the page stuck** — `cart.astro:111-116` passes no
  `onRemove`, so the button stays disabled reading "Removing…" and the row remains.
- **Quantity is editable on digital goods**, and there is no "you already own this"
  guard. Buying qty 3 of one PDF charges 3× for one download set.
- **Free products cannot be bought** — checkout throws when `totalPrice === 0`,
  while the grid advertises them as "Free", and the raw internal error is surfaced
  verbatim to the user.
- **Order confirmation has no webhook-race fallback** — if the webhook has not
  landed, the page still says "Order Confirmed!", still clears the cart, still
  claims an email was sent, and shows no downloads.
- `/purchases/[purchase]` has **zero inbound links** and shows *fewer* downloads
  than the list it should expand (no component files, no document PDFs).
- Pagination dead-ends: the entire block is hidden on the last page, including
  "← Previous".
- Sorting and tag filtering are applied **after** pagination, so "Price: low to
  high" sorts one page at a time. Discovery is this persona's stated pain point.
- Product tag chips link to `/tags/{value}`, the weaker of two competing browse
  surfaces — no price, no creator, no sort, no pagination.

---

## Cross-cutting issues

### The e2e suite has never worked

**69 references to `/dashboard` across 13 of 14 spec files.** That route does not
exist; sign-in redirects to `/products` (`api/auth/sign-in.ts:80`). Every test that
signs in and calls `waitForURL('/dashboard')` times out before its assertions.

Compounding:
- **67 conditional guards** across 168 tests, shaped `if (await x.isVisible()) { …assertions… }`.
  When the element is absent the body is skipped and the test passes green.
  `product-edit-workflow.spec.ts:141` asserts nothing if the embeddable toggle is
  missing — which, given the P0s above, it often is.
- **CI does not run e2e**, so none of this is visible.
- No `playwright-report/` or `test-results/` artifacts exist.

168 e2e tests currently provide approximately zero assurance. Two still reference
the removed `/assets` model.

### Orphaned components — the dominant pattern

Complete, working code that no user can reach:

| Component | Note |
|---|---|
| `ProductRoyaltyBreakdown.tsx` | The revenue-split view. The platform's whole pitch. Rendered nowhere. |
| `ProductPublishChecklist.tsx` | Would fix the blind-publish problem. Rendered nowhere. |
| `ProductComponentSearchModal.tsx` | **Zero references anywhere**, not even the barrel. The only reader of `embedding_royalty_cents`. |
| `ProductPriceBreakdown.tsx` | Rendered nowhere. Near-duplicate of the shipped `CartItemBreakdown`. |
| `ProductValueBreakdown.tsx` | Rendered nowhere **and** calls a variants endpoint removed in Dec 2024. Delete. |
| `ProductCreateForm` / `ProductCreatedModal` | Barrel-only. Both have test files exercising unreachable UI. |
| `ProductConflictBanner.tsx` | Barrel-only, despite a live resolve-conflict endpoint. |
| `dashboard/FirstTimeUserOnboarding`, `DashboardContentFilter` | No `/dashboard` page exists. |
| `pages/create.astro` | Linked from nowhere; describes the removed asset and variant model. |
| `pages/payouts/index.astro` | Live route, zero inbound links. |

Broken references: `/products/new`, `/connect/dashboard`,
`/api/products/reorder-documents`, `/api/products/variants/[id]/royalty-total`,
`/api/documents/create-asset`.

### Code quality and dead code

Fixed during this review:
- **5 unused imports** removed — `getProductFiles` (`webhooks/stripe.ts`),
  `RoyaltyType` (`royalties.ts`), `UserTag` (`users.ts`), `createEffect`
  (`useAutoSave.ts`), `unauthorizedResponse` (`mark-all-read.ts`).
- **139 lines of duplicated royalty code deleted** from `products.ts:967-1105`.
  It shadowed `royalties.ts` with a *different* `createProductRoyalty` signature
  (`products.ts` took the royalty type as an argument; `royalties.ts` hard-codes
  `'fixed'`) and had zero production callers. Whoever implements P0-1 would have
  had a coin-flip chance of calling the wrong one. Removing it first makes that
  work unambiguous.
- `hasServiceProducts` in `cart.astro` — left unused when credits checkout was
  removed.

Still outstanding:
- **14 dead exported functions** across the data-access layer, 11 kept alive only
  by their own unit tests. `updateSaleStatus` (`sales.ts:163`) has no references
  anywhere, tests included. This means the 378-passing-tests figure overstates real
  coverage.
- **11 `any` types** in production. Six are the same problem — untyped Supabase
  joined-row shapes (`products.ts:1162`, `users.ts:218,239`,
  `unembed-product.ts:68`, `embedded-products.ts:78,79`). One shared generated-row
  type fixes all six. Note `data-access/__tests__/` has zero `any`, so the pattern
  is demonstrably fixable.
- **Asset/variant removal was less complete than previously reported.** Schema and
  types are clean, but the orphaned *components* were missed — plus dead
  `ASSET_FILE_TYPES` (`storage/uploads.ts:237`), unreachable `asset_*`/`jam_*`
  notification branches (`NotificationCenter.tsx:131,133,141`) for action types the
  union no longer permits, and `/assets` routes still registered in
  `fuzzy-route-match.ts:46,136` and linked from `404.astro:89-91`.
- `PaymentMethod` is narrowed to `'stripe'` in types but
  `00005_commerce_domain.sql:42` still permits `'credits'` — schema/type drift, not
  a live path.

### Design system drift

`DESIGN_SYSTEM.md:866` defines breakpoints as 480 / 768 / 1024 / 1280px. The code
uses `48rem` (24×), `640px` (11×), `30rem`, `480px`, `768px` and `767px` — mixed
units for the same tier, an off-by-one, and an undocumented 640px tier. Also 35
hardcoded hex colours outside the token file, 6 inline styles, and 15 of 50
component CSS files with no media query.

### Accessibility is a genuine strength

Stated plainly because reviews skew negative. 40 `aria-label`, 10 `aria-live`
regions, 14 `role="status"`, 11 `role="alert"`, 5 `aria-modal` dialogs, 57 focus
styles, and **every `<img>` has alt text**. `Modal.tsx` implements a correct focus
trap with focus restore. This is better than typical for a pre-launch codebase.

The gaps are localised, not systemic: price editing is a `div onClick` with no
keyboard path (`ContentItem.tsx:162`), document rows in `AddContentModal` are
unreachable by keyboard, drag-reorder has no keyboard equivalent, the publish
confirm dialog is a bare div while `Modal.tsx` already solves it, and two search
inputs lack accessible names.

### Strategy conflict — resolve before planning

`PERSONAS.md:125` marks Printer and Painter **"CRITICAL - MVP Launch."**
`CLAUDE.md:331` and this skill's own `SKILL.md` both say deferred.

The code agrees with *deferred*: `product_type` accepts `print_service` and
`paint_service` and `sales.shipping_address` exists, but nothing can create such a
product and checkout never collects an address. It is schema scaffolding.

**This needs your decision — it changes what "launch" means.** This report assumes
deferred.

### Corrected agent claim

The creator-flow agent reported `/api/products/[productId]/royalties` as
*unauthenticated*. That is wrong as of this branch: the middleware `/api` catch-all
requires a session. The real issue is narrower but still valid — there is no
**ownership** check, so any signed-in user can read any product's royalty
recipients (user_id, handle, name, rate). Worth fixing before royalties carry real
values.

---

### One pattern worth naming

The three worst findings in this review are the same shape: **two sides of an
interface disagree and nothing checks.**

- `AddContentModal` sends `productId`; `embed-product` expects `parentProductId`.
- `ProductContentManager` POSTs to `/api/products/reorder-documents`; the route
  does not exist.
- `products/[product]/index.astro` reads `price_cents`; the column does not exist.

Types do not catch these because each side is internally well-typed. Unit tests do
not catch them because they mock the other side. `astro check` reports 0 errors
across all three.

A small set of tests that drive **real HTTP against real routes** would have caught
every one, and would be worth more right now than the remaining unit coverage on
`PLAN.md`'s list.

---

## Prioritised recommendations

### P0 — before launch

| # | Fix | Effort |
|---|---|---|
| 1 | Write a `product_royalties` row on embed, from the child's configured rate | 4–6 h |
| 2 | Derive `inherited_price_cents` server-side; drop it from the request schema | 1–2 h |
| 3 | Delete phantom `price_cents` from `Product`; pass `getProductPriceBreakdown().totalPrice` to `AddToCartButton` | 1–2 h |
| 4 | `CartItemRow` → read `item.price_cents` | 15 min |
| 5 | One source of price truth; show subtotal / fee / total everywhere | 3–4 h |
| 6 | Route all downloads through `/api/download`; one shared form component | 2–3 h |
| 7 | Fix the embed request contract (3 field mismatches) | 1–2 h |
| 8 | Show remove action on embedded items (`removable` prop) | 30 min |
| 9 | Render `ProductRoyaltyBreakdown` on the product page and in the cart | 1–2 h |
| 10 | Make contributors derive from `product_components`, so credit renders independently of the royalty fix | 2–3 h |
| 11 | Show license terms + royalty rate in embed search, with acceptance | 4–6 h |
| 12 | Fix `/products/new` 404; add Payouts/Earnings to nav | 1 h |
| 13 | Exclude documents from pricing until PDF generation exists (or build it) | 2 h |
| 14 | Real Terms, Privacy, Refund policy, Standard License | 1 d (mostly legal) |

**Roughly 3–4 engineering days**, plus legal lead time. Items 1–5 alone take the
flow from broken to transactable.

### P1 — before or immediately after launch

Publish checklist rendered and enforced · correct `RevenuePreview` math and
reactivity · webhook-race fallback on the confirmation page · cart remove/update
handlers · digital-goods quantity lock and duplicate-purchase guard · $0 checkout ·
pagination and server-side sort/filter · embed notifications · revoke path ·
ownership check on the royalties endpoint · upload progress and honest partial-
failure reporting · replace `alert`/`confirm` with the design system · fix the
`/edit` URL drop · **repair or delete the e2e suite, and add it to CI**.

### P2 — post-launch

Cart badge · global search · interactive gallery thumbnails · declared contributor
roles instead of substring inference · per-image alt text · breakpoint and colour
token consolidation · dedupe multi-component parents · delete orphaned components
and dead routes · unify the two add-to-cart patterns.

---

## Implementation roadmap

**Week 1 — make it transactable.** P0 items 1–8. Exit criterion: a buyer can find a
product, see an accurate price, buy it, download both parent and component files,
and the creators involved accrue royalties.

**Week 2 — make it trustworthy.** P0 9–13 plus the legal documents. Exit criterion:
the buyer can see who gets paid before purchasing, and what rights they acquire.

**Week 3 — make it verifiable.** Repair the e2e suite against real routes, remove
the conditional guards, wire it into CI. Then the P1 list. Exit criterion: a green
suite that would actually fail if the P0s regressed.

Note that Week 1 depends on the database work in `PLAN.md` — migrations 00007,
00008 and 00010 have never been applied anywhere, and the 7 integration test files
have never run. **That remains the prerequisite for everything here.**

---

## Success metrics

**Pre-launch gates**
- 0 P0 issues outstanding
- A complete purchase → download round trip on a *fresh* `supabase db reset`
- A royalty transaction visibly created by a real sale of an embedding product
- The e2e suite green, with `if (isVisible)` guards removed, running in CI
- Every price shown to a buyer equals the amount Stripe charges
- Terms, Privacy, Refund and Standard License published and reviewed

**Post-launch validation**
- Product publish success rate > 90%
- Checkout completion rate > 75%
- Zero support tickets citing a price discrepancy
- First royalty paid to a non-owner contributor within 30 days
- Time to first sale < 7 days

---

## Appendix — quality assurance checklist

- [x] All 4 MVP personas analysed
- [x] ≥2 primary flows per persona
- [x] Accessibility checked (WCAG 2.1 AA)
- [x] Design system compliance verified
- [x] Business rules validated — royalties, embeddability, pricing
- [x] Cross-persona consistency checked
- [x] Recommendations actionable with file:line
- [x] Priorities and effort assigned
- [x] Success metrics defined
- [x] **Every P0 independently re-verified against source**
- [ ] Product status enforcement (draft/private/public/archived) across cart and
      checkout — the strategic review returned an addendum focused on code quality
      and the document-delivery escalation, and did not report on status
      enforcement, self-embedding guards, or embed cycles. Treat all three as
      **unverified**; they are the first thing to check once a database is running.
