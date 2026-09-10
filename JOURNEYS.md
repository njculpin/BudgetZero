# Persona Journey Trace

**Traced:** 2026-09-10 · **Against:** working tree at `264ba72` + live local Supabase

Every step below was checked against real code — a route that exists, a controller
that is wired in `packages/api/src/routes.ts`, a table column confirmed in the
running database. Nothing here is inferred from documentation.

`/PERSONAS.md` defines the six personas. This file records **where each one's
journey actually breaks**.

| Mark | Meaning                                                   |
| ---- | --------------------------------------------------------- |
| ✅   | Works                                                     |
| ⚠️   | Works, but degraded or reachable only by an unmarked path |
| ❌   | Built, wired, and broken at runtime                       |
| 🚫   | Not built — schema and/or docs promise it, no code exists |

---

## Summary

| Persona           | Journey completes? | Breaks at                                                      |
| ----------------- | ------------------ | -------------------------------------------------------------- |
| **Consumer**      | ✅ end to end      | Reviews and wishlist do not exist                              |
| **Game Designer** | ⚠️ then ❌         | Create link 404s; `/payouts` unreachable; collaboration 🚫     |
| **3D Modeler**    | ❌                 | "Where Your Work Is Used" always empty; `/payouts` unreachable |
| **Illustrator**   | ❌                 | Same as 3D Modeler                                             |
| **Printer**       | 🚫                 | Step 2 of 9. No service product type exists in any UI          |
| **Painter**       | 🚫                 | Step 2 of 9. Same                                              |

**The buyer can complete a purchase. No creator can reach the page where they get
paid.** `/payouts` is not linked from anywhere in the application.

---

## Journey 1 — Consumer / Buyer

The only journey that runs from end to end.

| #   | Step                       | Status | Evidence                                                                                         |
| --- | -------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| 1   | Land on `/`                | ✅     | Featured products with fee-inclusive prices (`index.astro:36`)                                   |
| 2   | Browse `/products`         | ✅     | Search, tag filter, sort, pagination (`products/index.astro:34-42`)                              |
| 3   | Discover by tag / creator  | ✅     | `/tags`, `/tags/[tag]`, `/users`, `/users/[user]`                                                |
| 4   | Product detail             | ✅     | Price, Add to Cart, "What's Included" all render                                                 |
| 5   | See who gets paid          | ✅     | `ProductContributors` lists contributors and roles; embedded items show `by {creator}` and price |
| 6   | Wishlist it                | 🚫     | `wishlists` table exists; **zero references in any source file**                                 |
| 7   | Add to cart                | ✅     | `POST /cart/add-to-cart`                                                                         |
| 8   | Review cart                | ✅     | Subtotal / Platform fee (10%) / Total, three distinct lines (`cart.astro:106-112`)               |
| 9   | Checkout                   | ✅     | `POST /checkout/create-session` → Stripe                                                         |
| 10  | Order confirmed            | ✅     | `/checkout/success` resolves the sale by id or payment intent and lists downloads                |
| 11  | Receipt email              | ✅     | `sendPurchaseConfirmation` (`webhooks/stripe.ts:301`)                                            |
| 12  | Order history              | ✅     | `/purchases`, `/purchases/[purchase]`                                                            |
| 13  | Download a file            | ✅     | Entitlement checked against the file's own product, 5-minute signed URL (`download.ts:31-53`)    |
| 14  | Download an embedded child | ✅     | `hasUserPurchasedProduct` walks `product_components`                                             |
| 15  | Leave a review             | 🚫     | `product_reviews` table exists; **zero references in any source file**                           |

**Two dead ends.** `wishlists` and `product_reviews` are tables with triggers and
no code. PERSONAS.md lists reviews as a success metric for four personas and
"Wishlist and cart" as a Consumer key feature.

**One latent trap.** `download.ts:16` redirects an unauthenticated download to
`/sign-in?redirect=/downloads`. **`/downloads` is not a route** — after signing in
the buyer lands on a 404.

---

## Journey 2 — Game Designer

> _"Publish complete game packages. Collaborate with artists and modelers. Earn revenue."_

| #   | Step                          | Status | Evidence                                                                     |
| --- | ----------------------------- | ------ | ---------------------------------------------------------------------------- |
| 1   | Sign up                       | ✅     | `POST /auth/sign-up`                                                         |
| 2   | Onboarding                    | ✅     | `OnboardingModal` fires from `layout.astro:27` when `!onboarding_completed`  |
| 3   | **Start a product**           | ⚠️     | See "The create-product entry point" below                                   |
| 4   | Upload files                  | ✅     | `POST /products/upload-files`                                                |
| 5   | Attach a document             | ✅     | `POST /products/add-document`                                                |
| 6   | Find embeddable work          | ✅     | `GET /products/search-embeddable`, `GET /products/embeddable`                |
| 7   | Embed a component             | ✅     | `POST /products/embed-product` — royalty inherited at link time              |
| 8   | Price files and documents     | ✅     | `POST /products/update-file-price`, `/update-document-price`                 |
| 9   | Preview the revenue split     | ✅     | `RevenuePreview` inside `ProductContentManager`                              |
| 10  | Publish                       | ✅     | `POST /products/update-product` validates before allowing `public`           |
| 11  | **Invite a co-designer**      | 🚫     | `product_collaborators` table exists; **zero references in any source file** |
| 12  | **Co-write the rulebook**     | ⚠️     | Documents are single-player — see below                                      |
| 13  | Export the rulebook as PDF    | ❌     | `TODO: Implement actual PDF generation` (`generate-document-pdfs.ts:63`)     |
| 14  | **Learn that it sold**        | 🚫     | Nothing writes notifications — see "The notification system has no writer"   |
| 15  | Connect a bank account        | ✅     | `/settings` → "Payouts & Bank Account" → `POST /connect/create-account`      |
| 16  | **See earnings, request pay** | ❌     | `/payouts` exists and works, and **nothing in the app links to it**          |
| 17  | Receive the transfer          | ✅     | `/admin/payouts` executes — also unlinked                                    |

### Collaborative documents are single-player

`document_collaborators` is written in exactly one place: `documents.ts:71-79`,
which inserts the creator's own `owner` row when the document is created. That row
carries `can_invite: true` — and **no endpoint honours it**. There is no invite
controller, no collaborator UI, no accept flow.

The `/create` page advertises _"Write rulebooks and reference cards together in
real-time"_, and `/documents` describes itself as _"collaborate on game design
documents"_. A second person cannot be added to a document.

### The create-product entry point

Three things disagree about how a creator starts a product:

- **`/create`** — the route CLAUDE.md calls "product creation" — is a **marketing
  page**. `WorkflowStep` × 3, `FeatureItem` × 5, a `CtaBanner`, and buttons
  labelled "Go to My Products" that link to `/products`, the public marketplace.
  **It contains no form.** Nothing in the app links to `/create` either.
- **`navigation-user-menu.tsx:166`** — the create button in the signed-in user
  menu — links to **`/products/new`, which is not a route**. It 404s. This is the
  same dead route the deleted e2e suite was testing.
- **`/products/index.astro:89` and `:213`** carry the form that actually posts to
  `/api/products/create-product`. It works. It is on the browse page.

`ProductCreateForm` exists as a component and is never rendered. So does
`OnboardingWizard`, which posts to the same endpoint (`onboarding-wizard.tsx:55`).

---

## Journey 3 — 3D Modeler · Journey 4 — Illustrator

> _"Earn passive income through royalties when others embed their products."_

Steps 1–10 are the Designer's. The paths diverge at the point that is these two
personas' entire reason to be on the platform.

| #   | Step                             | Status | Evidence                                                                             |
| --- | -------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| 11  | Mark the product embeddable      | ✅     | `is_embeddable` via `POST /products/update-product`                                  |
| 12  | Set the embedding royalty        | ✅     | `embedding_royalty_cents`; trigger `trg_sync_product_embedding_royalty` (00013)      |
| 13  | A designer embeds it             | ✅     | `POST /products/embed-product`                                                       |
| 14  | Get credited on the product page | ✅     | `ProductContributors`, and `by {creator_name}` on each embedded item                 |
| 15  | **See where their work is used** | ❌     | **Always empty. See below.**                                                         |
| 16  | A customer buys the parent       | ✅     | Webhook creates royalties for the product _and_ each component (`stripe.ts:263-278`) |
| 17  | Royalty is held, then matures    | ✅     | `available_at` + `trg_set_royalty_available_at` (00014)                              |
| 18  | Balance shows it                 | ✅     | `GET /payouts/get-balance` splits available from pending                             |
| 19  | **Request the payout**           | ❌     | `/payouts` is unreachable — no link anywhere                                         |
| 20  | Build a following                | 🚫     | `user_follows` table exists; **zero references in any source file**                  |

### Step 15: "Where Your Work Is Used" has never returned a row

`getEmbeddedUsageForUser` (`data-access/products.ts:1361`) names
`cover_image_url` on `products` inside its PostgREST join. **That column does not
exist.** Confirmed against the running database:

```
GET /rest/v1/products?select=id,cover_image_url
{"code":"42703","message":"column products.cover_image_url does not exist"}
```

PostgREST rejects the whole query. The function logs and returns `[]`
(`products.ts:1373-1376`). `/settings` therefore renders **"No Embedded Products
Yet 📦"** for every creator on the platform, forever — including one whose art is
embedded in a dozen products and who has earned royalties from all of them.

The royalties are real and correctly accrued. The panel that would show them is
the one thing that has never worked.

`Product.cover_image_url` is declared `?: string | null` — optional, so
`astro check` reports zero errors while the feature is dead. It is the **fourth**
phantom field found in this codebase, after `products.price_cents`,
`users.full_name` and `products.embedding_royalty_cents`. All four were optional.

---

## Journey 5 — Printer · Journey 6 — Painter

> PERSONAS.md: _"Status: CRITICAL - MVP Launch"_ and _"Physical Services (Current - MVP)"_
> CLAUDE.md: _"DEFERRED until Month 7+"_

**CLAUDE.md is correct.** The journey stops at step 2 of 9.

| #   | PERSONAS.md step                         | Status | Evidence                                                                                                                            |
| --- | ---------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Printer creates an account               | ✅     | Same as any creator                                                                                                                 |
| 2   | **Create a `print_service` product**     | 🚫     | **`product_type` appears in zero web or api source files.** No selector.                                                            |
| 3   | Customer finds the service, adds to cart | 🚫     | No service badge, no services tab, no filter                                                                                        |
| 4   | **Checkout collects a shipping address** | 🚫     | Column exists; `createSale` accepts `shippingAddress`; **no caller passes it**                                                      |
| 4b  | Checkout collects order notes            | 🚫     | Same — `order_notes` accepted, never written                                                                                        |
| 5   | Payment processes                        | ✅     | Existing Stripe path would carry it                                                                                                 |
| 6   | **Provider gets an order notification**  | 🚫     | Only one email template exists: `purchase-confirmation.ts`, to the buyer                                                            |
| 7   | Provider downloads, prints, ships        | 🚫     | No fulfilment state on `sales` beyond `status`                                                                                      |
| 8   | **Customer messages the provider**       | 🚫     | **There is no chat table.** PERSONAS.md cites "existing chat system" seven times; the README records it as removed in December 2024 |
| 9   | Customer leaves a review                 | 🚫     | `product_reviews` dead                                                                                                              |

The database is ready — `products.product_type`, `sales.shipping_address` and
`sales.order_notes` all exist and are confirmed in the live schema. **The
application does not know they are there.** `createProduct` (`products.ts:110-117`)
does not set `product_type`; it relies on the column default `'digital'`.

PERSONAS.md's "Estimated Build Time: 1 week" is measuring from a starting point
that assumes chat and reviews exist. They do not.

---

## Cross-cutting findings

### Three pages nothing links to

| Page             | What it is                          | Consequence                                      |
| ---------------- | ----------------------------------- | ------------------------------------------------ |
| `/payouts`       | Creator balance and payout request  | **No creator can get paid without typing a URL** |
| `/admin/payouts` | Admin payout queue                  | Admin must know the URL                          |
| `/create`        | The "start creating" marketing page | Orphaned                                         |

`/settings` has a "Payouts & Bank Account" card, but it only runs Connect
onboarding — it does not link to `/payouts`. `/documents` is linked from exactly
one place: a modal inside the product editor (`add-content-modal.tsx:504`).

### Four links that 404

| Link                      | Where                                              |
| ------------------------- | -------------------------------------------------- |
| `/products/new`           | `navigation-user-menu.tsx:166` — the create button |
| `/connect/dashboard`      | `payout-shortcuts.astro:11`                        |
| `/settings/notifications` | `notification-center.tsx:322`                      |
| `/downloads`              | `download.ts:16` post-sign-in redirect             |

### The notification system has no writer

`/notifications`, the bell with its unread badge in the navigation, the
per-type toggles in `notification_settings`, and the "needs attention" conflict
flow all read from `notifications`. **Nothing writes to it.**

Verified three ways: `data-access/notifications.ts` exports only read, mark and
delete functions — there is no `createNotification`; no migration contains an
`INSERT INTO notifications`; and the live database has no trigger on any table
that writes one. `products.needs_attention` is likewise only ever read
(`notifications.ts:284`), never set.

So a creator is never told that their product sold, that a royalty accrued, that a
payout completed, or that a component they depend on changed.

### Six tables with no code

`wishlists`, `product_reviews`, `user_reviews`, `user_follows`,
`product_collaborators`, `activity_feed` — all present in the live schema, all with
`updated_at` triggers, and **zero references across every `.ts`, `.tsx` and
`.astro` file in the repository**. `licenses` is referenced once, from
`llms.txt.ts`.

### Components that are never rendered

`ProductCreateForm`, `OnboardingWizard`, `NotificationCenter`, `Dialog`,
`FileUpload`, `LoadingSpinner`, `NavigationDropdown`, `EditableBreadcrumb`,
`SubscribeForm`, `CreatorFilters`, `DocumentBasicInfoForm`,
`DocumentCreateAssetButton`, `FormActions`, `Input`, `TextArea`, `Breadcrumb`.

Several are the built halves of the journeys above — the product create form and
the notification centre exist as working components with no page rendering them.

---

## PERSONAS.md needs correcting

The document describes a product that is two features ahead of the code in some
places and one architecture behind in others.

**Removed features still cited as current:**

- **Jams** — "Jam participation for visibility", "Jam browsing for discovery",
  "Jam voting participation: 20% of buyers", "Jam organizers". No `jams` table.
- **Chat** — cited seven times as "existing chat system", load-bearing for both
  service personas. No chat table; the README records it as removed.
- **Variants** — "Product creation with variants" under Game Designer. Removed
  in the December 2024 simplification.
- **Assets** — "Creates tabletop game products by combining assets", "Asset
  linking with automatic royalty distribution". The model is product-centric now;
  `/create`'s own copy still says "Create Assets".
- **Reviews / wishlist / follows** — schema only.

**Status contradictions:**

- Printer is `Status: CRITICAL - MVP Launch`; Painter is `PLANNED - Defer until
post-MVP (Month 7+)` — but the interaction matrix and Phase 1 list both mark
  Printer _and_ Painter as shipping in the MVP beta. CLAUDE.md defers both.
  Nothing is built for either.
- The `## Implementation for Printer/Painter (MVP)` section presents its three
  `ALTER TABLE`s as pending work. All three columns already exist.
