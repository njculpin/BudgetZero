# Game Loopers User Personas

This document defines all user personas for Game Loopers, their goals, pain points, and key user journeys.

## Current Personas (MVP - Digital Marketplace)

### 1. Game Designer
**Role:** Creates tabletop game products by combining assets

**Goals:**
- Publish complete game packages (rules, maps, tokens)
- Collaborate with artists and modelers
- Earn revenue from sales
- Build reputation in TTRPG community

**Pain Points:**
- Can't afford to hire artists/modelers upfront
- Existing platforms (DriveThruRPG, itch.io) don't support revenue sharing
- Need easy way to combine digital assets from multiple creators

**Key Features:**
- Product creation with variants
- Asset linking with automatic royalty distribution
- Collaborative documents for game rules
- Jam participation for visibility

**Success Metrics:**
- Products public
- Total sales revenue
- Collaborator count
- Community engagement (reviews, jam entries)

---

### 2. 3D Modeler
**Role:** Creates STL files for miniatures, terrain, and game pieces

**Goals:**
- Sell digital STL file products
- Earn passive income through royalties when others embed their products
- Build portfolio and reputation
- License work for commercial use

**Pain Points:**
- Race to bottom pricing on generic marketplaces
- No recurring revenue (one-time sales only)
- Hard to track commercial usage
- Limited collaboration opportunities

**Key Features:**
- Product creation with STL file uploads
- 4-state status system (draft, private, public, archived)
- Product embeddability (is_embeddable flag for royalty earnings)
- Royalty configuration (earn when product is embedded in other products)
- Portfolio showcase on profile

**Success Metrics:**
- Public products (embeddable and ready for use)
- Total downloads
- Royalty earnings when products are embedded
- Number of products using their embeddable products

---

### 3. Illustrator / Artist
**Role:** Creates 2D art products (character portraits, maps, tokens, card art)

**Goals:**
- License artwork for game products
- Earn royalties on each product sale when work is embedded
- Maintain copyright while allowing commercial use
- Get credited for work

**Pain Points:**
- One-time commission payments (no recurring revenue)
- Artwork used without proper licensing/credit
- Hard to find game designers who need art
- Unclear licensing terms

**Key Features:**
- Product creation with image files (PNG, JPG, PDF)
- Product embeddability for licensing
- Public marketplace visibility
- Transparent royalty splits
- Automatic attribution on product pages

**Success Metrics:**
- Public embeddable products in marketplace
- Products embedding their artwork
- Royalty earnings from embedded products
- Profile views and follows

---

### 4. Consumer / Buyer
**Role:** Purchases complete game products for personal use

**Goals:**
- Find high-quality TTRPG content
- Support creators directly
- Get complete game packages (not piecemeal assets)
- Discover new games through jams

**Pain Points:**
- Existing marketplaces have poor discovery
- Unclear what's included in purchase
- Don't know where money goes (who gets paid?)
- Fragmented purchasing (buy rules, then maps, then tokens separately)

**Key Features:**
- Product marketplace with search/filtering
- Clear "What's Included" breakdown
- Transparent royalty information (see who gets paid)
- Jam browsing for discovery
- Wishlist and cart

**Success Metrics:**
- Products purchased
- Return purchase rate
- Average order value
- Jam participation (reviews)

---

## Future Personas (Phase 3 - Physical Services)

### 5. Printer (3D Printing Service Provider)
**Status:** PLANNED - Defer until post-MVP (Month 7+)

**Role:** Provides 3D printing services to turn digital STL files into physical miniatures/terrain

**Goals:**
- Earn money from printing capacity (own 3D printer farm)
- Access steady stream of print orders
- Build reputation for quality prints
- Offer multiple materials/finishes (PLA, resin, painted)

**Pain Points:**
- Hard to find customers (Etsy is saturated, Shapeways is automated)
- Customers provide unprintable STL files
- Race to bottom on pricing
- Shipping costs eat into profits
- Quality disputes ("this doesn't look like the preview")

**Key Features (Future):**
- Service listing profile with:
  - Printer specs (build volume, resolution, materials)
  - Pricing tiers by size and material
  - Portfolio of past prints (photos)
  - Shipping zones and times
  - Ratings and reviews
- Order management dashboard
- Integrated shipping labels
- Escrow payment (released on customer approval)
- Direct messaging with customers

**User Flow (Future MVP):**
```
1. Printer creates account
2. Complete verification (upload sample print photos)
3. Create service listing
   - Set pricing: Small ($8), Medium ($15), Large ($25)
   - Select materials offered: PLA, PETG, Resin
   - Set shipping zones: US only, or International
4. Customer finds STL asset → clicks "Order Print"
5. Printer receives order notification
6. Printer downloads STL, prints model
7. Printer uploads photo for quality review
8. Customer approves quality
9. Printer ships with tracking number
10. Customer confirms receipt
11. Payment released from escrow
12. Customer leaves review
```

**Revenue Model:**
- Customer pays: $20 (for medium size resin print)
- Platform fee (10%): $2
- Printer receives: $18
- Printer costs (material + time): ~$12
- Printer profit: $6

**Success Metrics:**
- Orders fulfilled per month
- Average rating (target: 4.5+ stars)
- Repeat customer rate
- Revenue per month
- Dispute rate (target: <5%)

**Integration Points:**
- Asset pages show "Available for Print" with printer options
- Printer profiles linked from asset pages
- Order tracking in customer account
- Messaging integrated with existing chat system

**Technical Requirements:**
- `service_listings` table (printer capabilities, pricing)
- `print_orders` table (order details, status, tracking)
- Shipping API integration (EasyPost or ShipStation)
- Escrow payment flow (Stripe supports this)
- Photo upload for quality review
- Rating/review system for services (separate from product reviews)

---

### 6. Painter (Miniature Painting Service Provider)
**Status:** PLANNED - Defer until post-MVP (Month 7+)

**Role:** Provides painting services for printed miniatures

**Goals:**
- Earn money from painting skills
- Access customers who want table-ready minis
- Showcase painting portfolio
- Offer multiple quality tiers (tabletop, display, competition)

**Pain Points:**
- Hard to find customers beyond local game stores
- Time-consuming to quote each job
- Customers have unrealistic expectations for price/quality
- Shipping painted minis (risk of damage)
- Color preferences hard to communicate

**Key Features (Future):**
- Service listing profile with:
  - Painting quality tiers (tabletop $5/mini, display $15/mini, competition $30/mini)
  - Portfolio gallery of painted minis
  - Color scheme templates ("Grimdark", "Bright Fantasy", "Realistic")
  - Turnaround times
  - Ratings and reviews
- Order management dashboard
- Customer color preference uploads
- Escrow payment (released on photo approval)
- Progress photo updates during painting

**User Flow (Future MVP):**
```
1. Painter creates account
2. Complete verification (upload portfolio of 10+ painted minis)
3. Create service listing
   - Set pricing tiers: Tabletop ($8), Display ($20), Competition ($40)
   - Upload portfolio photos (before/after shots)
   - Set turnaround times: 5-7 days per mini
4. Customer orders print → adds paint service at checkout
5. Printer ships unpainted mini to painter (not customer)
6. Painter receives mini + customer color preferences
7. Painter paints mini, uploads WIP photos
8. Painter uploads final photos for approval
9. Customer approves or requests minor changes
10. Painter ships painted mini to customer
11. Payment released from escrow
12. Customer leaves review with photos
```

**Revenue Model (Example: Tabletop Quality):**
- Customer pays: $15 (for tabletop quality paint job)
- Platform fee (10%): $1.50
- Painter receives: $13.50
- Painter costs (paint, time): ~$5
- Painter profit: $8.50

**Success Metrics:**
- Paint jobs completed per month
- Average rating (target: 4.5+ stars)
- Photo approval rate on first submission (target: 90%+)
- Repeat customer rate
- Revenue per month

**Integration Points:**
- Checkout flow: "Want this printed AND painted?"
- Order routing: STL → Printer → Painter → Customer
- Messaging for color preferences
- Portfolio gallery on painter profile
- WIP photo updates visible to customer

**Technical Requirements:**
- `service_listings` table (shared with printers, add `service_type` field)
- `paint_orders` table (includes color preferences, reference photos)
- Multi-stop shipping workflow (printer → painter → customer)
- Photo upload and approval workflow
- Color scheme templates (predefined palettes)
- Tiered pricing by quality level

---

## Persona Interaction Matrix

### Digital Marketplace (Current - MVP)

| Creator Type | Creates | Consumers | Earns From |
|-------------|---------|-----------|------------|
| Game Designer | Products | Buyers | Product sales |
| 3D Modeler | Embeddable STL Products | Designers | Direct sales + royalties when embedded in other products |
| Illustrator | Embeddable Art Products | Designers | Direct sales + royalties when embedded in other products |
| Consumer | Reviews | N/A | N/A |

**Example Transaction:**
- Designer creates product "Fantasy RPG Starter Kit" ($25 total price)
- Embeds 3D Modeler's STL pack product (royalty: $5)
- Embeds Illustrator's character art product (royalty: $3)
- Consumer buys product for $25
- **Revenue split (with 10% platform fee):**
  - Platform fee (10%): $2.50
  - Subtotal after fee: $22.50
  - 3D Modeler royalty: $5.00
  - Illustrator royalty: $3.00
  - Designer (owner share): $14.50 ($22.50 - $5.00 - $3.00)

---

### Physical Services (Future - Phase 3)

| Creator Type | Creates | Consumers | Earns From |
|-------------|---------|-----------|------------|
| 3D Modeler | Embeddable STL Products | Designers + Consumers + Printers | Product sales + print royalties (optional) |
| Printer | Physical Minis | Consumers | Print service fees |
| Painter | Painted Minis | Consumers | Paint service fees |
| Consumer | Reviews | N/A | N/A |

**Example Transaction (Print + Paint):**
- Consumer finds 3D Modeler's STL product "Dragon Mini" ($5 digital)
- Adds print service from Printer ($20)
- Adds paint service from Painter ($15)
- Total: $40
- **Revenue split (with 10% platform fee):**
  - 3D Modeler product sale: $5.00 (digital product purchase)
  - Platform fee on services: $3.50 (10% of $35 in services)
  - Printer: $18.00 (after 10% platform fee)
  - Painter: $13.50 (after 10% platform fee)

**Open Question:** Should 3D Modeler also earn royalty on physical prints?
- **Option A:** No royalty (they already earned from digital product sale)
- **Option B:** $1-2 per print (incentivizes creating print-friendly models)
- **Recommendation:** Start with Option A, add Option B if print-optimized models become an issue
- **Note:** This decision deferred to Phase 3 community feedback

---

## Collaboration Patterns

### Current (Digital)
- **Designer + Modeler:** Designer embeds Modeler's STL product, royalty auto-calculated and paid
- **Designer + Illustrator:** Designer embeds Illustrator's art product, royalty auto-calculated and paid
- **Multi-Product Embedding:** Designer can embed multiple products from different creators, all royalties tracked
- **Designer + Designer:** Co-create product (future feature - formal collaboration invitations)

### Future (Physical Services)
- **Modeler + Printer:** Modeler's STL product → Printer fulfills physical orders → Revenue share TBD
- **Printer + Painter:** Bundled service (print + paint) → Sequential fulfillment workflow
- **Designer + Printer + Painter:** Designer's product includes print/paint option → All three earn on transaction

---

## Persona Prioritization

### Phase 1 (MVP - Now): Digital Marketplace
**Focus Personas:**
1. ✅ Game Designer (primary)
2. ✅ 3D Modeler (primary)
3. ✅ Illustrator (primary)
4. ✅ Consumer (primary)

**Why:** Validate core marketplace mechanics, automated royalties, product assembly

---

### Phase 2 (Growth - Months 2-6): Scale Digital
**Focus Personas:**
- Same as Phase 1, but add:
  - 🎯 Power users (creators with 10+ products)
  - 🎯 Jam organizers (community leaders)

**Why:** Achieve product-market fit before adding complexity

---

### Phase 3 (Expansion - Months 7-10): Physical Services MVP
**Add Personas:**
1. 🔜 Printer (invite-only, 10-20 verified providers)
2. 🔜 Painter (invite-only, 5-10 verified providers)

**Why:** Test physical service demand with controlled group

---

### Phase 4 (Scale - Months 11+): Full Physical Marketplace
**Open Personas:**
- ✅ Printer (open applications with verification)
- ✅ Painter (open applications with verification)

**Why:** Scale physical services if Phase 3 validates demand

---

## Success Metrics by Persona

### Game Designer
- Products public: Target 3-5 per active designer
- Average product price: $15-25
- Products embedding community products: 60%+ (collaborative revenue model)
- Jam participation rate: 40% of designers

### 3D Modeler
- Public embeddable products: 70% of total products (not stuck in draft)
- Products embedded in other products: 30% utilization rate
- Average royalty per embedded product: $3-5
- Repeat usage: 2+ products embedding their work

### Illustrator
- Public embeddable products: 80% of total products
- Products embedded in other products: 40% utilization rate
- Average royalty per embedded product: $2-4
- Portfolio engagement: 50+ profile views per month

### Consumer
- Average order value: $20-30
- Repeat purchase rate: 30% within 3 months
- Jam voting participation: 20% of buyers
- Review rate: 15% of purchases

### Printer
- Orders fulfilled: 10+ per month (per printer)
- Average order value: $20-25
- Quality approval rate: 95%+ first submission
- Customer satisfaction: 4.5+ star average

### Painter
- Paint jobs completed: 5+ per month (per painter)
- Average order value: $15-20
- First-submission approval: 90%+
- Customer satisfaction: 4.7+ star average

---

**When adding Printer/Painter personas:**

1. **Database Changes:**
   - Add `service_listings` table
   - Add `service_type` enum: 'printing' | 'painting'
   - Add `print_orders` and `paint_orders` tables
   - Add shipping and tracking fields

2. **UI Components Needed:**
   - `ServiceListingCard.astro` (display printer/painter offerings)
   - `ServiceCheckout.tsx` (custom order flow with file upload)
   - `OrderDashboard.tsx` (printer/painter order management)
   - `OrderStatusTimeline.astro` (customer order tracking)
   - `PortfolioGallery.astro` (showcase past work)

3. **API Endpoints:**
   - `/api/services/create-listing` (printer/painter setup)
   - `/api/services/search` (find printers by location, material, price)
   - `/api/orders/create-print-order` (customer places order)
   - `/api/orders/[orderId]/upload-proof` (quality review photos)
   - `/api/orders/[orderId]/approve` (customer approval)
   - `/api/orders/[orderId]/ship` (tracking number submission)

4. **Third-Party Integrations:**
   - Shipping API (EasyPost or ShipStation) for label generation
   - Address validation (SmartyStreets)
   - Escrow payments (Stripe supports holds)
   - Possibly: Insurance for high-value orders

5. **Operational Requirements:**
   - Service provider verification process (manual review of portfolios)
   - Dispute resolution workflow (customer service team needed)
   - Quality standards documentation ("What is tabletop quality vs display quality?")
   - Shipping damage policy
   - Refund policy for physical goods
