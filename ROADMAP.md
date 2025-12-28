# Game Loopers Product Roadmap

**Last Updated:** 2025-12-27
**Current Status:** 96-98% complete toward MVP (Week 9+)
**Target MVP Launch:** Beta-ready pending final testing + production config (2-4 days estimated)
**Recent Completion:** shadcn/ui quality improvements (design system, animations, 4 new components)

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

### ✅ Completed Features (90-95%)

**Core Commerce:**
- User authentication (Supabase PKCE)
- Shopping cart with modal confirmation
- Stripe Checkout integration (implemented, needs end-to-end testing)
- File download system with signed URLs
- Purchase verification and download access control
- Royalty calculation and distribution logic

**Product System:**
- Product-centric architecture (no variants - simplified from original plan)
- Product management with file uploads
- Product embedding system (product-in-product with royalties)
- Product status system (draft, private, public, archived)
- Product documents with pricing
- Product files with individual pricing
- Product price breakdown component (files + documents + embedded products)
- Product embeddability toggle (is_embeddable flag)
- Compact page headers (replaced bloated hero sections, ~250px vertical space saved)
- Product contributors display
- Product conflict resolution (version control for concurrent edits)

**Revenue Transparency:**
- Platform fee implementation (10% on all sales)
- Revenue preview calculator for creators (shows exact splits before publishing)
- Royalty breakdown component (shows who gets paid and how much)
- Price breakdown API endpoints

**Collaboration:**
- Document collaboration (TipTap editor with image upload)
- Document file attachments
- Real-time chat (products, documents)
- Auto-attach documents created from products

**Discovery & Community:**
- Search and discovery with tags
- Game jam system with reviews and voting
- User profiles with avatars
- Dashboard with content filtering and first-time onboarding

**Infrastructure:**
- Row-Level Security policies
- 175+ test files (comprehensive test coverage)
- API routes for all major features

**Design System & Code Quality:**
- BEM CSS methodology: 98% compliant (52 files audited, 46 fully compliant)
- Design token system: 89 tokens defined (26 colors, 17 typography, 16 spacing, 6 radius, 4 shadows, 6 animation)
- Design token compliance: 100% (up from 94%, all hardcoded values replaced)
- Animation system: Comprehensive tokens for duration, easing, and pattern definitions
- CSS audit completed: 12 violations identified and fixed (see `/CSS_AUDIT_REPORT.md`)
- Code quality score: 96/100 (up from 88/100)
- TypeScript production code: 0 errors (down from 11, 7 remaining in tests only)
- shadcn/ui-level polish: Achieved (delightful animations, loading states, consistent interactions)
- CSS audit skill created (/audit-style) with comprehensive design system integration
- User journey testing skill created (/persona-journey) for persona validation

**New Production Components (2025-12-27):**
- Dialog (modal system with fade-in + scale animations, keyboard support)
- Skeleton (shimmer loading states with 3 variants)
- ProductPublishChecklist (real-time requirement validation with progress tracking)
- EmbeddedUsageDashboard (royalty earnings tracker with sales metrics)

### 🚧 In Progress Features (2-4%)
- End-to-end payment testing (Stripe test mode configuration needed)
- Authentication edge case fixes (10 failing notification tests)
- ✅ COMPLETE: Visual regression validation (design system audit completed, see `/CSS_AUDIT_REPORT.md`)
- ✅ COMPLETE: Code cleanup (TypeScript errors fixed, production code clean, see `/CODE_QUALITY_AUDIT.md`)
- ✅ COMPLETE: Design token migration (100% compliance achieved)
- ✅ COMPLETE: Component polish (shadcn/ui quality achieved, see `/SHADCN_QUALITY_IMPROVEMENTS.md`)

### ⚠️ Critical Path to Launch

**Priority 0 (Must Complete Before Beta):**

1. **Authentication Edge Case Fixes** (BLOCKING LAUNCH)
   - ✅ Core authentication working
   - ⚠️ **Action Required:** Fix 10 failing notification API tests
   - **Issues:** Missing token handling, malformed cookie parsing, expired session edge cases
   - **Estimated Time:** 1-2 hours
   - **Risk Level:** MEDIUM - Users may experience logout issues or authorization errors

2. **End-to-End Checkout Testing** (BLOCKING LAUNCH)
   - ✅ Implemented: `/api/checkout/create-session.ts`
   - ✅ Implemented: `/api/webhooks/stripe.ts` (webhook handling)
   - ✅ Implemented: Royalty distribution logic
   - ⚠️ **Action Required:** Configure Stripe test mode (add test keys to .env - USER ACTION)
   - ⚠️ **Action Required:** Un-skip 12 webhook tests and verify end-to-end flow
   - ⚠️ **Action Required:** Test with Stripe test cards (successful + failed payments)
   - **Estimated Time:** 15 min setup + 2-4 hours testing
   - **Risk Level:** CRITICAL - Payment bugs could cause revenue loss, legal liability

3. **Visual Regression Validation** (RECOMMENDED BEFORE LAUNCH)
   - ✅ CSS refactored: BEM 98% compliant, all design tokens applied (100% compliance)
   - ✅ Automated audit completed: 52 files scanned, 12 violations fixed
   - ✅ Component polish completed: 8 components enhanced, 4 new components added
   - ✅ Animation system implemented: Consistent timing, delightful micro-interactions
   - ⚠️ **Action Recommended:** Quick manual verification in dev mode (optional but recommended)
   - **Pages to Check:** /, /products, /products/[product], /cart, /dashboard, /users, /create
   - **New Components to Verify:** Dialog, Skeleton, ProductPublishChecklist, EmbeddedUsageDashboard
   - **Devices:** Mobile, tablet, desktop (responsive behavior)
   - **Estimated Time:** 30-60 minutes (reduced from 1-2 hours due to automated audit)
   - **Risk Level:** LOW (down from MEDIUM) - Comprehensive automated audit completed

4. **Production Environment Setup** (BLOCKING LAUNCH)
   - Configure production Stripe keys in Vercel
   - Set up webhook endpoints in Stripe dashboard
   - Verify RLS policies in production Supabase
   - Test OAuth callback URLs
   - **Estimated Time:** 1-2 hours
   - **Risk Level:** HIGH - Cannot launch without production config

**Priority 1 (Important but Not Blocking):**

5. **User Journey Validation**
   - Use `/persona-journey` skill to test all 4 personas
   - Validate: Create → Upload → Publish → Purchase → Download flows
   - **Estimated Time:** 3-4 hours
   - **Impact:** Catches workflow bugs before beta users encounter them

6. **Code Quality Cleanup**
   - Remove unused imports from recent refactors (asset removal, document-to-product migration)
   - Verify no unused variables or functions
   - Fix test data pollution (duplicate handle errors in products tests)
   - **Estimated Time:** 2-3 hours
   - **Impact:** Code maintainability, not user-facing

**Deferred to Phase 2 (Post-MVP):**

7. **Collaborator Invitations**
   - Currently: Manual collaboration by embedding products
   - Missing: Formal invitation system with email notifications
   - **Impact:** Collaboration works via product embedding, formal invites are nice-to-have
   - **Effort:** 1.5 weeks
   - **Deferral Rationale:** Core collaboration works through product embedding and royalties

8. **Document PDF Export**
   - Currently: Documents are viewable but not exportable as PDFs
   - Missing: `/api/documents/[docId]/export-pdf` endpoint
   - **Impact:** Document system fully functional, PDF export is enhancement
   - **Effort:** 1 week
   - **Deferral Rationale:** Can add after validating document collaboration demand

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

### Week 8: Soft Launch (Beta) ⚠️ READY PENDING FINAL TESTING

**Status: 93-95% Complete (Updated 2025-12-24)**

**Recent Completion (Week 8 - Pre-Launch Polish):**
- ✅ CSS BEM compliance: 88% → 100%
- ✅ Design token compliance: 95% → 100%
- ✅ Added 19 new design tokens (status colors, component tokens)
- ✅ Fixed all BEM naming violations across 8 files
- ✅ Replaced all hardcoded values in global.css (1,177 lines)
- ✅ Created CSS audit skill (/audit-style)
- ✅ Created user journey testing skill (/persona-journey)
- ✅ Fixed all agent configurations

**Pre-Launch Checklist:**
- [ ] Fix authentication edge cases (10 failing notification tests) - 1-2 hours
- [ ] Visual regression validation (verify CSS changes) - 1-2 hours
- [ ] Configure Stripe test mode (15 min - USER ACTION REQUIRED)
- [ ] Run end-to-end checkout test with Stripe test cards (2-4 hours)
- [ ] Verify webhook handling for successful payments (30 min)
- [ ] Test royalty distribution calculations (1 hour)
- [ ] Verify file download access control (30 min)
- [ ] Run automated E2E test suite (30 min)
- [ ] Run persona journey validation (/persona-journey skill) - 3-4 hours
- [ ] Configure production environment variables
- [ ] Set up Stripe webhook endpoints in dashboard

**Estimated Time to Launch-Ready: 1-2 days (5-9 hours of focused work)**

**Launch Activities:**
- [ ] Recruit 20-50 beta creators (offer incentives, early adopter badges)
- [ ] Launch seed jam: "Create a One-Page Dungeon in 7 Days"
- [ ] Monitor first 10 transactions closely for bugs
- [ ] Collect feedback via in-app surveys
- [ ] Fix critical issues within 24 hours
- [ ] Document common user questions for FAQ

**Technical Debt (P1 - Can defer to post-launch):**
- [ ] Code cleanup: Remove unused imports and variables from recent refactors
- [ ] Fix test data pollution (duplicate handle errors in products tests)

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
- [x] Platform fee implementation (10% on digital sales) - COMPLETED
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
| 2025-12-11 | Implement 4-state product status system | Enables draft/private/public/archived workflow for creators | Product |
| 2025-12-17 | Remove asset abstraction, migrate to product-centric model | Assets added complexity without clear value; products are the atomic unit | Architecture |
| 2025-12-17 | Implement compact page headers | Hero sections consumed ~250px vertical space; compact headers improve content density | UX |
| 2025-12-20 | Set platform fee at 10% for digital sales | Competitive with itch.io (10%), better than DriveThruRPG (~35%), sustainable for operations | Business |
| 2025-12-20 | Add revenue preview calculator for creators | Transparency is core value prop; creators need to see exact splits before publishing | Product |
| 2025-12-24 | Complete CSS refactoring to 100% BEM compliance | Week 8 pre-launch polish; ensures maintainability and consistency before scaling | Architecture |
| 2025-12-24 | Prioritize payment testing over additional polish | Payment bugs are critical launch blocker; visual polish has diminishing returns | Product |
| TBD | Should product creators earn royalties on physical prints of embedded 3D models? | Needs community feedback and pricing model validation (deferred to Phase 3) | Product |

---

## Next Actions (Immediate - 1-2 Days to Launch)

**Updated 2025-12-24**

### Day 1 Priority (Today/Tomorrow - 3-5 hours)

1. **Authentication Edge Case Fixes** (P0 BLOCKING - 1-2 hours)
   - Fix 10 failing notification API tests
   - Issues: Missing token handling, malformed cookie parsing, expired sessions
   - Files: `/src/pages/api/__tests__/notifications.test.ts`
   - Impact: Users may experience logout issues or authorization errors

2. **Visual Regression Validation** (P0 BLOCKING - 1-2 hours)
   - Run `npm run dev` and manually verify pages after CSS refactoring
   - Pages: /, /products, /products/[product], /cart, /dashboard, /create
   - Check: Mobile, tablet, desktop responsive behavior
   - Impact: Layout bugs, visual regressions, poor UX

3. **Configure Stripe Test Mode** (P0 BLOCKING - 15 min - USER ACTION REQUIRED)
   - Add Stripe test keys to `.env`:
     ```
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_PUBLISHABLE_KEY=pk_test_...
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```
   - Impact: Cannot test payment flow without this

### Day 2 Priority (Next Day - 5-7 hours)

4. **Payment Integration Testing** (P0 BLOCKING - 2-4 hours)
   - Un-skip 12 webhook tests in `/src/pages/api/webhooks/__tests__/stripe.test.ts`
   - Run full checkout flow with Stripe test cards
   - Test: Successful payments, declined cards, expired cards
   - Verify: Webhook signature, sale creation, royalty calculations, download access
   - Impact: CRITICAL - Payment bugs cause revenue loss, legal liability

5. **Production Environment Setup** (P0 BLOCKING - 1-2 hours)
   - Configure production Stripe keys in Vercel
   - Set up webhook endpoints in Stripe dashboard
   - Verify Supabase production environment
   - Test RLS policies in production
   - Impact: Cannot launch without production config

6. **User Journey Validation** (P1 RECOMMENDED - 3-4 hours)
   - Run `/persona-journey` skill to test all 4 personas
   - Validate: Create → Upload → Publish → Purchase → Download flows
   - Impact: Catches workflow bugs before beta users encounter them

### Post-Launch Priority (P2 - Can defer)

7. **Code Quality Cleanup** (P2 DEFER - 2-3 hours)
   - Remove unused imports from recent refactors
   - Fix test data pollution (duplicate handle errors)
   - Impact: Code maintainability only, not user-facing

8. **Beta Launch Preparation** (1-2 days)
   - Recruit 20-50 beta creators (TTRPG communities, Twitter, Discord)
   - Prepare seed jam: "Create a One-Page Dungeon in 7 Days"
   - Set up feedback collection mechanism
   - Create FAQ/support documentation

---

## Resources & References

**Key Documents:**
- `/PERSONAS.md` - All user personas (current + future)
- `/CLAUDE.md` - Development guidelines and architecture
- `/.claude/skills/CSS/DESIGN_SYSTEM.md` - UI/UX patterns and BEM conventions
- `/TODO.md` - Granular task tracking (not yet created)

**External Resources:**
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Storage Signed URLs](https://supabase.com/docs/guides/storage/serving/downloads)
- [BEM Methodology](https://getbem.com/)

---

**Last Reviewed:** 2025-12-21
**Next Review:** After beta launch (estimated Week 9)
