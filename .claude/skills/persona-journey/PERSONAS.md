# Game Loopers User Personas

This document defines all user personas for Game Loopers, their goals, pain points, and key user journeys.

## Current Personas (MVP - Digital + Physical Services Marketplace)

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

### 5. Printer (3D Printing Service Provider)
**Status:** CRITICAL - MVP Launch

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

**Key Features:**
- Product creation with product_type='print_service'
- Service listing page (reuses product page structure):
  - Printer specs (build volume, resolution, materials)
  - Pricing tiers by size and material
  - Portfolio of past prints (photos uploaded as product images)
  - Shipping zones and estimated times (in description)
  - Ratings and reviews (same as product reviews)
- Order notifications with customer shipping address
- Direct messaging with customers (existing chat system)
- Payments handled through existing Stripe integration

**User Flow:**
```
1. Printer creates account (same as any creator)
2. Create service "product"
   - Product type: 'print_service'
   - Set pricing: Small ($8), Medium ($15), Large ($25)
   - Add portfolio photos (existing product images)
   - Description: Materials offered (PLA, PETG, Resin), shipping zones
3. Customer finds print service → adds to cart
4. Checkout collects shipping address (new field for service products)
5. Payment processes (existing Stripe integration)
6. Printer receives order notification email with:
   - STL file(s) ordered
   - Customer shipping address
   - Order details
7. Printer downloads files, prints, ships directly to customer
8. Customer can message printer through existing chat
9. Customer leaves review (existing review system)
```

**Revenue Model:**
- Customer pays: $20 (for medium size resin print)
- Platform fee (10%): $2
- Printer receives: $18
- Printer costs (material + time + shipping): ~$12
- Printer profit: $6

**Success Metrics:**
- Service products listed (target: 5-10 printers at launch)
- Orders fulfilled per month (per printer)
- Average rating (target: 4.5+ stars)
- Repeat customer rate
- Revenue per month

**Technical Requirements (Minimal):**
- Add `product_type` field to products table: 'digital' | 'print_service' | 'paint_service'
- Add `shipping_address` JSONB field to sales table
- Collect shipping address at checkout when cart contains service products
- Include shipping address in order notification emails
- Reuse existing: products, sales, reviews, chat, file uploads

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

**Key Features:**
- Product creation with product_type='paint_service'
- Service listing page (reuses product page structure):
  - Painting quality tiers (tabletop $8/mini, display $20/mini, competition $40/mini)
  - Portfolio gallery of painted minis (product images)
  - Color scheme examples in description
  - Turnaround times (in description)
  - Ratings and reviews (same as product reviews)
- Order notifications with customer shipping address + preferences
- Direct messaging for color coordination (existing chat system)
- File upload for customer reference photos (existing file attachment system)

**User Flow:**
```
1. Painter creates account (same as any creator)
2. Create service "product"
   - Product type: 'paint_service'
   - Set pricing tiers: Tabletop ($8), Display ($20), Competition ($40)
   - Upload portfolio photos (existing product images)
   - Description: Quality levels explained, turnaround times, color schemes offered
3. Customer finds paint service → adds to cart
4. Checkout collects shipping address + optional reference photos/notes
5. Payment processes (existing Stripe integration)
6. Painter receives order notification email with:
   - Miniature details
   - Customer preferences (color scheme, quality tier)
   - Shipping address
   - Reference photos if provided
7. Painter paints mini, ships directly to customer
8. Customer can message painter through existing chat (WIP photos, questions)
9. Customer leaves review with photos (existing review system)
```

**Revenue Model (Example: Tabletop Quality):**
- Customer pays: $15 (for tabletop quality paint job)
- Platform fee (10%): $1.50
- Painter receives: $13.50
- Painter costs (paint, time + shipping): ~$5
- Painter profit: $8.50

**Success Metrics:**
- Service products listed (target: 3-5 painters at launch)
- Paint jobs completed per month (per painter)
- Average rating (target: 4.7+ stars)
- Repeat customer rate
- Revenue per month

**Technical Requirements (Minimal):**
- Same as Printer (product_type='paint_service', shipping_address field)
- Optional: Customer notes field at checkout for color preferences
- Optional: File upload at checkout for reference photos
- Reuse existing: products, sales, reviews, chat, messaging

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

### Physical Services (Current - MVP)

| Creator Type | Creates | Consumers | Earns From |
|-------------|---------|-----------|------------|
| 3D Modeler | Embeddable STL Products | Designers + Consumers + Printers | Product sales + print royalties (optional) |
| Printer | Physical Minis | Consumers | Print service fees |
| Painter | Painted Minis | Consumers | Paint service fees |
| Consumer | Reviews | N/A | N/A |

**Example Transaction (Print + Paint - Bundled Services):**
- Consumer finds Printer's service "Medium Resin Print + Tabletop Paint" ($35 bundled)
- Downloads 3D Modeler's STL file "Dragon Mini" ($5 digital) separately
- Sends STL to Printer via order notes/chat
- Total: $40 ($5 digital + $35 service)
- **Revenue split (with 10% platform fee):**
  - 3D Modeler (digital product): $4.50 (after platform fee)
  - Printer+Painter (bundled service): $31.50 (after platform fee)
  - Platform: $4.00 total

**Note:** Customer can purchase STL separately or printer may bundle popular STLs with service. Flexible marketplace model - let creators experiment with what works.

---

## Collaboration Patterns

### Current (Digital)
- **Designer + Modeler:** Designer embeds Modeler's STL product, royalty auto-calculated and paid
- **Designer + Illustrator:** Designer embeds Illustrator's art product, royalty auto-calculated and paid
- **Multi-Product Embedding:** Designer can embed multiple products from different creators, all royalties tracked
- **Designer + Designer:** Co-create product (future feature - formal collaboration invitations)

### Current (Physical Services)
- **Modeler + Printer:** Customer buys Modeler's STL → separately orders print service from Printer → Printer fulfills
- **Printer + Painter:** Printer can offer bundled print+paint service product → Painter handles fulfillment or collaborates
- **Customer Flexibility:** Can mix and match (buy STL from Modeler A, print from Printer B, paint from Painter C)

---

## Persona Prioritization

### Phase 1 (MVP - Now): Digital + Physical Services Marketplace
**Focus Personas:**
1. ✅ Game Designer (primary)
2. ✅ 3D Modeler (primary)
3. ✅ Illustrator (primary)
4. ✅ Consumer (primary)
5. ✅ Printer (beta - invite 5-10 providers)
6. ✅ Painter (beta - invite 3-5 providers)

**Why:**
- Validate core marketplace mechanics with digital products
- Test physical service demand from day 1 with controlled beta group
- Differentiate from competitors (only platform with integrated print/paint services)
- Same technical infrastructure (products, sales, reviews, chat)

**Beta Approach:**
- Manually recruit 5-10 trusted printers + 3-5 painters
- Launch with "Services" tab in marketplace
- Low volume initially, learn operational issues
- Promote as unique differentiator in marketing

---

### Phase 2 (Growth - Months 2-6): Scale All Personas
**Focus:**
- Open printer/painter applications (with portfolio verification)
- Grow digital creators (10+ products per creator)
- Jam organizers (community leaders)
- International expansion (printers/painters in EU, UK, AUS)

**Why:** Scale what works, optimize based on Phase 1 learnings

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

## Implementation for Printer/Painter Personas (MVP)

### Database Changes (Minimal)
```sql
-- Add product_type to existing products table
ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT 'digital';
-- Types: 'digital' | 'print_service' | 'paint_service'

-- Add shipping_address to existing sales table
ALTER TABLE sales ADD COLUMN shipping_address JSONB;
-- Collected at checkout if cart contains service products

-- Add order_notes to existing sales table
ALTER TABLE sales ADD COLUMN order_notes TEXT;
-- Customer can specify color preferences, reference photos, etc.
```

### UI Components (Reuse Existing)
- ✅ Product pages (already exists - just different content for services)
- ✅ Product creation form (already exists - add product_type selector)
- ✅ Cart/Checkout (add shipping address field when cart has services)
- ✅ Purchase history (already exists - shows shipping address for service orders)
- ✅ Reviews (already exists - works same for services)
- ✅ Chat (already exists - for coordinating with service providers)
- ✅ File uploads (already exists - for reference photos, STL files)

**New Components Needed:**
- `ShippingAddressForm.tsx` (checkout step, ~3 hours)
- Service type badge on product cards (1 hour)

### API Changes (Minimal)
- Modify `/api/checkout/*` to collect shipping address when cart contains services
- Modify order notification emails to include shipping address
- No new endpoints needed - reuse existing product/sales APIs

### Operational Requirements (MVP Beta)
- Manual verification of 5-10 printers + 3-5 painters (portfolio review)
- Basic quality guidelines documented in Help/FAQ
- Customer service handled via existing support email
- Disputes handled case-by-case (defer formal policy until volume increases)

**Estimated Build Time: 1 week** (vs 4-6 weeks for full logistics platform)
