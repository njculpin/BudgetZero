# Game Loopers Product Roadmap

**Last Updated:** 2025-12-11
**Current Status:** 75-80% complete toward MVP (Week 7/8)
**Target MVP Launch:** Payment integration and downloads remain

---

## Strategic Vision

**Mission:** Create the fairest marketplace for tabletop game creators with transparent royalties and end-to-end creation tools.

**Unique Value Props:**
1. **Transparent Royalty Network** - See exactly who gets paid and how much
2. **Collaborative Product Assembly** - Embed products from multiple creators with automated revenue splits
3. **Integrated Creation Pipeline** - Documents → Products (with files & embedded components) → (Future: Physical fulfillment)

**Competitive Positioning:**
- vs. DriveThruRPG: Modern, creator-first, transparent royalties
- vs. itch.io: Better royalty splits, tabletop-focused, collaborative tools
- vs. Gumroad: Product embedding network effects, community features (jams)

---

## Current State Analysis

### ✅ Completed Features (60%)
- User authentication (Supabase PKCE)
- Product management with file uploads and embedding
- Product creation with variants
- Royalty configuration and splits
- Document collaboration (TipTap editor)
- Real-time chat (products, documents)
- Game jam system with reviews
- Row-Level Security policies
- Dashboard with content filtering
- User profiles with avatars
- Add to cart / buy button functionality with modal confirmation
- Product documents with pricing support
- Product contributors display
- Private product status (4-state system: draft, private, unlisted, public)
- Shopping cart data access layer
- Product price breakdown (files + documents + embedded products)

### 🚧 In Progress Features (15%)
- Inline pricing for file uploads (currently separate edit step)
- ProductDocumentsForm reactive updates (replace page reloads)
- Code cleanup (remove unused imports, variables, functions)

### ❌ Blocking Issues (25% - PREVENTS LAUNCH)

**Priority 0 (Critical - Blocks All Commerce):**
1. **Payment Processing** - No Stripe Checkout implementation
   - Missing: `/api/checkout/create-session`
   - Missing: `/api/webhooks/stripe` (payment success handler)
   - Missing: Royalty payout distribution in `/src/lib/payments/payouts.ts`
   - **Impact:** Cannot sell products or pay creators
   - **Effort:** 2-3 weeks

2. **Product File Download System** - Purchased product files can't be downloaded
   - Missing: Signed URL generation from Supabase Storage
   - Missing: `/api/purchases/[saleId]/download/[fileId]` endpoint
   - Missing: Purchase verification logic
   - **Impact:** Buyers can't access files they paid for
   - **Effort:** 1 week

**Priority 1 (High - Critical for Launch):**
3. **Search & Discovery** - No way to find products
   - Missing: Tag-based filtering UI (`/products?tag=fantasy`)
   - Missing: Full-text search
   - Missing: Trending tags widget
   - **Impact:** Users bounce due to poor discoverability
   - **Effort:** 1.5 weeks

4. **Collaborator Invitations** - Can't invite contributors
   - Missing: Invitation UI and flow
   - Missing: Email notifications
   - Missing: Accept/decline workflow
   - **Impact:** Collaboration features half-implemented
   - **Effort:** 1.5 weeks (defer to post-MVP)

5. **Document PDF Export** - Can't export documents as PDF files
   - Missing: `/api/documents/[docId]/export-pdf` using pdf-lib
   - Missing: Auto-product creation with PDF file from document
   - **Impact:** Unique feature is non-functional
   - **Effort:** 1 week (defer to post-MVP)

---

## Phase 1: MVP Launch (Weeks 1-8)

**Goal:** Launch functional digital marketplace with core commerce features

### Week 1-3: Payment Processing ✅ COMPLETE
**Features:**
- [x] Stripe Checkout session creation
- [x] Webhook handler for `checkout.session.completed`
- [x] Create `sales` and `sale_items` records on successful payment
- [x] Generate download access records for purchased product files
- [x] Email purchase confirmation (integrate Resend)
- [x] Product file download endpoint with signed URLs
- [x] Royalty calculation and distribution

**Deliverable:** ✅ Users can purchase products and receive confirmation

**Files to Create/Update:**
- Create: `/src/pages/api/checkout/create-session.ts`
- Create: `/src/pages/api/webhooks/stripe.ts`
- Update: `/src/lib/payments/checkout.ts`
- Update: `/src/components/islands/AddToCartButton.tsx`

**Testing Checklist:**
- [ ] Successful payment creates sale record
- [ ] Royalties correctly calculated and stored
- [ ] Purchase confirmation email sent
- [ ] Failed payments handled gracefully
- [ ] Webhook signature verification working

---

### Week 4-5: Product File Downloads & Search ✅ COMPLETE
**Features:**
- [x] Signed download URL generation (24-hour expiry)
- [x] Purchase verification (check user owns sale)
- [x] Download tracking (increment `products.download_count`)
- [x] Tag filtering on `/products` page
- [x] Basic text search (title + description)

**Deliverable:** ✅ Users can download purchased product files and find products

**Note:** Search and tag filtering were already implemented. Download endpoint created in Week 1-3.

**Files to Create/Update:**
- Create: `/src/pages/api/purchases/[saleId]/download/[fileId].ts`
- Update: `/src/pages/products/index.astro` (add tag filters)
- Update: `/src/lib/data-access/products.ts` (search functions)

**Testing Checklist:**
- [ ] Only purchase owners can generate download links
- [ ] Download URLs expire after 24 hours
- [ ] Tag filtering returns correct results
- [ ] Search works across products

---

### Week 6-7: Polish & Bug Fixes ✅ COMPLETE
**Features:**
- [x] Fix ProductReview avatar display
- [x] Unify StatusBadge component (consolidated Badge.astro)
- [x] Extract Avatar component (reusable)
- [x] Create onboarding wizard for first-time creators
- [x] Add "Requirements Checklist" to product editor (ProductStatusRequirements)
- [x] Performance optimization (hydration strategy, image lazy loading)
- [ ] Improve cart "What's Included" breakdown (deferred to post-MVP)

**Deliverable:** ✅ Polished UX ready for beta users

**Progress:** 6/7 tasks complete (86%) - Cart enhancement deferred

**Components Created:**
- ✅ `Avatar.astro` (reusable avatar with fallback)
- ✅ `Badge.astro` (unified status indicator with all variants)
- ✅ `OnboardingWizard.tsx` (first-time creator flow)
- ✅ `ProductStatusRequirements.tsx` (checklist widget)

**Testing Checklist:**
- [ ] All avatars display correctly across site
- [ ] Status badges consistent in styling
- [ ] Onboarding wizard guides new users
- [ ] Product requirements clear to creators

---

### Week 8: Soft Launch (Beta) 🚧 BLOCKED - AWAITING PAYMENT INTEGRATION
**Activities:**
- [ ] Configure Stripe test mode (15 min - USER ACTION REQUIRED)
- [ ] Run manual testing checklist (2-3 hours)
- [ ] Run automated E2E tests (30 min)
- [ ] Recruit 20-50 beta creators (offer incentives)
- [ ] Launch seed jam: "Create a One-Page Dungeon in 7 Days"
- [ ] Monitor transactions for bugs
- [ ] Collect feedback via surveys
- [ ] Fix critical issues
- [ ] Prepare for public launch

**Success Metrics:**
- 20+ creators with public products
- 100+ registered users
- 10+ successful transactions
- $500+ GMV (Gross Merchandise Value)
- <5% error rate on checkout
- 4+ star average creator satisfaction

**Documentation:**
- ✅ BETA_LAUNCH_GUIDE.md - Complete testing checklist
- ✅ E2E tests created (checkout-flow.spec.ts)
- ✅ Unit tests validated (royalties.test.ts)
- ✅ Performance optimizations documented

---

## Phase 2: Growth & Validation (Months 2-6)

**Goal:** Achieve product-market fit with digital marketplace

### Month 2: Discovery & Engagement
**Features:**
- [ ] Advanced search with filters (price range, file type, license)
- [ ] Trending products widgets
- [ ] Creator spotlight on homepage
- [ ] Email marketing (new product alerts, jam announcements)
- [ ] Social sharing (Open Graph tags, Twitter cards)

**Success Metrics:**
- 100+ creators
- 1,000+ registered users
- 100+ transactions
- $5,000+ GMV
- 20% repeat purchase rate

---

### Month 3: Collaboration Features
**Features:**
- [ ] Collaborator invitations (product + document)
- [ ] Document PDF export to product files
- [ ] Shared revenue dashboard (see royalty earnings breakdown)
- [ ] User following system
- [ ] Activity feed (show followed creators' new products)

**Success Metrics:**
- 30% of products use multi-creator royalty splits
- 50+ documents exported as PDF files to products
- 200+ creator-to-creator follows
- 15% increase in repeat collaboration

---

### Month 4: Community & Retention
**Features:**
- [ ] Creator profiles with stats (sales, products, ratings)
- [ ] Badge system ("10 Sales", "Early Adopter", "Jam Winner")
- [ ] Product bundles (buy 3 get discount)
- [ ] Wishlist improvements (price drop alerts)
- [ ] Review system enhancements (helpful votes, verified purchase badge)

**Success Metrics:**
- 500+ creators
- 5,000+ registered users
- 300+ transactions
- $15,000+ GMV
- 25% repeat purchase rate
- 30% jam participation rate

---

### Month 5: Monetization & Scale
**Features:**
- [ ] Platform fee implementation (5% on digital sales)
- [ ] Payout distribution automation (Stripe Connect transfers)
- [ ] Discount codes (creator-generated promo codes)
- [ ] Affiliate program (creators earn 10% for referrals)
- [ ] Analytics dashboard (creators see traffic, conversion, earnings)

**Success Metrics:**
- $25,000+ GMV
- 500+ transactions
- 80%+ creator payout success rate
- <3% dispute rate
- Platform profitable or path to profitability clear

---

### Month 6: DECISION POINT - Physical Services

**Evaluate:**
1. **Demand Signal:** Survey digital customers about physical print/paint interest
   - Target: 20%+ express strong interest
2. **Operational Capacity:** Do we have resources for customer support, quality control, disputes?
3. **Recruiter Feasibility:** Can we onboard 10-20 quality printers/painters?

**IF YES → Proceed to Phase 3**
**IF NO → Continue optimizing digital marketplace, revisit in 6 months**

---

## Phase 3: Physical Services MVP (Months 7-10)

**Status:** DEFERRED - Only proceed if Phase 2 validates demand

**Goal:** Test physical printing/painting services with controlled group

### Month 7: Service Listings
**Features:**
- [ ] Printer/painter profile creation
- [ ] Service listing setup (pricing, materials, shipping zones)
- [ ] Portfolio gallery (photos of past work)
- [ ] Verification process (manual review of portfolios)
- [ ] Contact info display (email printers directly, no platform transactions yet)

**Deliverable:** Directory of verified printers/painters

**Files to Create:**
- Create: `/src/pages/services/index.astro` (service marketplace)
- Create: `/src/pages/services/[handle].astro` (service provider profile)
- Create: `/src/components/ServiceListingCard.astro`
- Create: `/src/components/PortfolioGallery.astro`
- Update: `/src/pages/products/[product].astro` (add "Order Print" section)

**Metrics:**
- 10+ verified printers recruited
- 5+ verified painters recruited
- 50+ service listing views per week

---

### Month 8-9: Simple Order Flow
**Features:**
- [ ] "Request Quote" button on service listings
- [ ] Platform messaging for quotes (extend existing chat)
- [ ] Payment through platform (standard Stripe, not escrow yet)
- [ ] Order status tracking (pending → printing → shipped)
- [ ] Shipping notification with tracking number
- [ ] Basic rating/review for services

**Deliverable:** Platform-coordinated print/paint orders

**Files to Create:**
- Create: `/src/pages/api/services/request-quote.ts`
- Create: `/src/pages/api/orders/create-service-order.ts`
- Create: `/src/components/islands/OrderDashboard.tsx`
- Create: `/src/components/islands/OrderStatusTimeline.tsx`
- New tables: `service_listings`, `service_orders`, `order_shipments`

**Metrics:**
- 20+ print orders fulfilled
- 10+ paint orders fulfilled
- $500+ GMV from services
- 4.0+ star average service rating
- <10% dispute rate

---

### Month 10: Data Collection & Iteration
**Activities:**
- [ ] Survey customers: satisfaction with print/paint quality, pricing, shipping times
- [ ] Survey service providers: profitability, platform experience, pain points
- [ ] Analyze data: order volumes, average prices, repeat usage, dispute reasons
- [ ] Decide: Scale to Phase 4 or pivot?

**Decision Criteria for Phase 4:**
- 50+ successful orders with <5% dispute rate
- 80%+ customer satisfaction
- 70%+ service provider satisfaction
- Positive unit economics (platform fees > operational costs)

---

## Phase 4: Scale Physical Services (Months 11+)

**Status:** CONDITIONAL - Only if Phase 3 validates model

**Goal:** Automated fulfillment system for physical products

### Features:
- [ ] Automated pricing (instant quotes based on size/material)
- [ ] Escrow payments (released on customer photo approval)
- [ ] Quality review workflow (printer uploads photos → customer approves → payment releases)
- [ ] Integrated shipping labels (EasyPost or ShipStation API)
- [ ] Multi-stop shipping (printer → painter → customer)
- [ ] Dispute resolution system
- [ ] Insurance options for high-value orders

### Success Metrics:
- 200+ print orders per month
- 100+ paint orders per month
- $10,000+ monthly GMV from services
- 95%+ first-time quality approval rate
- 4.5+ star average service rating

---

## Deferred Features (Post-Phase 4)

**Nice to Have but Not Critical:**
- Mobile app (React Native or Progressive Web App)
- Print-on-demand fulfillment automation (similar to Printful)
- Live print queue viewing (see your order being printed via webcam)
- AI-powered product recommendations
- Virtual tabletop integration (Roll20, Foundry VTT)
- Subscription model (unlimited downloads for monthly fee)
- Gift cards
- Crowdfunding (Kickstarter-style pre-orders)

---

## Risk Mitigation

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Payment processing bugs | Medium | Critical | Comprehensive testing in Stripe test mode, manual review of first 100 transactions |
| Royalty calculation errors | Medium | High | Unit tests for all royalty scenarios, dry-run mode before executing payouts |
| Download link security | Low | High | Time-limited signed URLs (24hr expiry), purchase verification on every request |
| Database performance | Low | Medium | Pagination on all lists, indexes on foreign keys, caching for expensive queries |

### Business Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| No audience at launch | High | Critical | Build email waitlist now, partner with TTRPG influencers, content marketing pre-launch |
| Race to bottom pricing | Medium | Medium | Educate creators on value pricing, showcase successful creators earning fair rates |
| Creator churn | Medium | High | Monthly creator surveys, responsive support, transparent roadmap |
| Physical service quality issues | High (if built) | High | Strict verification process, escrow payments, clear quality standards documentation |

### Competitive Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| DriveThruRPG adds royalty splits | Low | Medium | Move fast to establish network effects before they react |
| itch.io improves TTRPG features | Medium | Medium | Differentiate on transparency and collaboration tools |
| New entrant with more funding | Low | High | Focus on community and creator relationships (defensible moat) |

---

## Success Metrics Dashboard

### Phase 1 (MVP - Month 1)
- [ ] 20 creators with public products
- [ ] 100 registered users
- [ ] 10 successful transactions
- [ ] $500 GMV
- [ ] <5% checkout error rate
- [ ] 4+ star creator satisfaction

### Phase 2 (Growth - Month 6)
- [ ] 500 creators
- [ ] 10,000 registered users
- [ ] 500 transactions
- [ ] $25,000 GMV
- [ ] 30% repeat purchase rate
- [ ] 5% creator churn
- [ ] 40% jam participation

### Phase 3 (Physical MVP - Month 10)
- [ ] 15 verified printers
- [ ] 8 verified painters
- [ ] 50 print orders
- [ ] 20 paint orders
- [ ] $2,000 GMV from services
- [ ] <10% dispute rate
- [ ] 4.0+ star service rating

### Phase 4 (Physical Scale - Month 18)
- [ ] 50+ printers
- [ ] 30+ painters
- [ ] 200 print orders/month
- [ ] 100 paint orders/month
- [ ] $10,000 monthly GMV from services
- [ ] 95% quality approval rate
- [ ] 4.5+ star service rating

---

## Key Decisions Log

| Date | Decision | Rationale | Owner |
|------|----------|-----------|-------|
| 2025-01-27 | Defer physical services (Printer/Painter personas) until Month 7+ | Platform 60% complete, must finish digital MVP first to validate core mechanics | Product |
| 2025-01-27 | Use sequential implementation (digital → physical) instead of parallel | Limited resources, reduce complexity, validate product-market fit first | Product |
| 2025-12-11 | Replace cart toast with modal confirmation | 3-second toast was easy to miss, modal improves conversion confidence | UX |
| 2025-12-11 | Add documents to product price breakdown | Price transparency critical for buyer trust | Product |
| 2025-12-11 | Implement 4-state product status system | Enables draft/private/unlisted/public workflow for creators | Product |
| TBD | Platform fee percentage (recommend 5% digital, 10% services) | Needs competitive analysis and creator surveys | Business |
| TBD | Should STL creators earn royalties on physical prints? | Needs community feedback and pricing model validation | Product |

---

## Next Actions (Immediate - This Week)

1. **Complete UX improvements** (in progress)
   - ✅ Add documents to price breakdown
   - ✅ Replace cart toast with modal confirmation
   - [ ] Add inline pricing to file upload flow
   - [ ] Remove page reloads in ProductDocumentsForm
   - [ ] Update DESIGN_SYSTEM.md with 4-state product status

2. **Start payment processing** (Priority 0 - CRITICAL)
   - Create `/src/pages/api/checkout/create-session.ts`
   - Review Stripe Checkout documentation
   - Set up webhook endpoint in Stripe Dashboard
   - Create `/src/pages/api/webhooks/stripe.ts`
   - Implement royalty distribution logic

3. **Implement file download system** (Priority 0 - CRITICAL)
   - Create signed URL generation from Supabase Storage
   - Create `/src/pages/api/purchases/[saleId]/download/[fileId].ts`
   - Add purchase verification logic
   - Track download counts

4. **Code quality cleanup**
   - Remove unused imports and variables across codebase
   - Ensure TypeScript strict mode compliance
   - Update documentation to reflect current state

---

## Resources & References

**Key Documents:**
- `/PERSONAS.md` - All user personas (current + future)
- `/CLAUDE.md` - Development guidelines and architecture
- `/DESIGN_SYSTEM.md` - UI/UX patterns and BEM conventions
- `/TODO.md` - Granular task tracking (not yet created)

**External Resources:**
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Storage Signed URLs](https://supabase.com/docs/guides/storage/serving/downloads)
- [BEM Methodology](https://getbem.com/)

---

**Last Reviewed:** 2025-12-11
**Next Review:** After payment integration complete or Week 8 (whichever comes first)
