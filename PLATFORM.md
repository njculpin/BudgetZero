# Workshop Platform Strategy & Roadmap

## Platform Vision

Workshop is a social collaborative tabletop game publishing platform that enables creators (designers, 3D modelers, illustrators, editors) to:

1. **Showcase capabilities** - Upload and display original work with usage terms
2. **Collaborate across disciplines** - Discover and request to use others' work in projects
3. **Build attribution chains** - Transparent royalty tracking for all referenced content
4. **Monetize collaborative work** - Automatic revenue distribution based on contributions
5. **Leverage network effects** - Higher collaboration = higher project value

## Core Value Proposition

**For Creators:**
- Frictionless collaboration across disciplines
- Automatic attribution and royalty tracking
- Revenue sharing without contracts or negotiations
- Discovery through social proof (Victory Points, reviews, connections)
- Portfolio showcase for hiring opportunities

**For Buyers:**
- High-quality collaborative content with clear licensing
- Support multiple creators with single purchase
- Playtest reviews and community validation
- Transparent pricing with multiple tiers

## Current State (MVP Complete)

### Implemented Features

**Creator Workflow:**
- User authentication and profiles
- Project creation (game, model, illustration types)
- Document editor (TipTap rich text for rulebooks)
- Asset upload (3D models, illustrations) with royalty settings
- Asset reference requests (request to use others' content)
- Collaboration approval dashboard with notifications
- Project tagging and categorization
- Pricing tier management (multiple price points per project)
- Co-ownership and publication approvals

**Social & Gamification:**
- Victory Points system (earn VP for playtest reviews, review votes)
- Playtest review system with ratings (1-5 stars)
- Review voting (upvote/downvote) affects author VP
- In-app notifications for collaboration events
- Request comments for negotiation

**Marketplace:**
- Published projects browsing
- Search and filtering (by name, description)
- Basic sorting (newest, oldest)
- Project detail pages with pricing tiers
- Shopping cart with localStorage persistence
- Waitlist page for soft launch validation

### Technical Stack
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript 5 (strict)
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Real-time)
- **UI:** Tailwind CSS v4, ShadCN/UI, Radix UI
- **Editor:** TipTap for document editing
- **Build:** Turbopack

### Database Schema
- `profiles` - User accounts and metadata
- `projects` - Container for all project types (game/model/illustration)
- `documents` - Rulebooks stored as JSONB (TipTap format)
- `assets` - 3D models and illustrations with royalty settings
- `project_asset_references` - Cross-project attribution requests
- `project_document_references` - Cross-project document references
- `project_collaborators` - Co-owners on projects
- `pricing_tiers` - Multiple pricing options per project
- `project_publication_approvals` - Co-owner consent for publishing
- `playtest_reviews` - Reviews with ratings, playtime, VP tracking
- `review_votes` - Upvote/downvote on reviews
- `user_victory_points` - VP balance and lifetime earnings
- `victory_points_transactions` - VP transaction log
- `notifications` - In-app notification system
- `request_comments` - Comments on collaboration requests

### Known Gaps & Limitations

**Critical Gaps:**
- No payment processing (Stripe not integrated)
- No digital delivery system for purchased content
- No purchase history or order management
- No revenue dashboard for creators
- No creator analytics (views, collaborations, earnings)

**Search & Discovery:**
- No tag-based filtering
- No price range filtering
- No creator search
- No "similar projects" recommendations
- Sort by price/rating not functional

**Collaboration Friction:**
- No direct messaging between creators
- No collaboration templates or contracts
- No version control for shared assets
- No approval workflow visualization

**Monetization:**
- No revenue split calculator preview before purchase
- No payout system for creators
- No transaction fees configured
- No refund policy or handling

## Strategic Framework

### Core User Journey
```
1. Creator Signup → Profile setup with capabilities
2. Capability Definition → Upload assets/documents with royalty %
3. Project Creation → Combine own + referenced content
4. Collaboration → Request asset usage, negotiate terms
5. Marketplace Success → Publish with pricing tiers
6. Revenue Distribution → Automatic splits on purchase
```

### Key Metrics to Track
1. **Creator Acquisition:** New creators per week by discipline
2. **Project Creation Rate:** Projects created per creator
3. **Collaboration Rate:** % of projects with cross-references
4. **Marketplace Conversion:** Browse → Add to Cart → Purchase
5. **Revenue per Creator:** Average earnings per creator
6. **Network Density:** Creator-to-creator connections
7. **VP Engagement:** Active reviewers, review quality

## Recommended Priorities (Next 3-5 Features)

### Priority 1: Complete Purchase Flow (CRITICAL - Revenue Enabler)
**Rationale:** Without payments, we cannot validate marketplace hypothesis or generate revenue. This is the #1 blocker to launch.

**Tasks:**
- Stripe integration for checkout
- Digital delivery system (download links for assets/documents)
- Purchase confirmation emails
- Order history page for buyers
- Revenue split calculation on checkout
- Basic transaction logging

**Impact:**
- Enables first revenue
- Validates willingness to pay
- Unblocks creator payout system
- Measures conversion rates

**Effort:** Large (1-2 weeks)
**Risk:** Medium (Stripe API complexity, revenue split logic)
**Dependencies:** None - can start immediately
**Success Metrics:** First transaction completed, revenue split calculated correctly

---

### Priority 2: Creator Revenue Dashboard (HIGH - Creator Retention)
**Rationale:** Creators need visibility into earnings to stay engaged. Shows transparency and builds trust. Enables validation of revenue-sharing model.

**Tasks:**
- Revenue dashboard showing pending/completed earnings
- Breakdown by project and collaboration
- Transaction history with filters
- Payout threshold and request system
- Stripe Connect integration for creator payouts
- Tax documentation (1099 preparation)

**Impact:**
- Increases creator retention
- Validates revenue model fairness
- Enables word-of-mouth growth
- Provides payout transparency

**Effort:** Large (1-2 weeks)
**Risk:** Medium (Stripe Connect complexity, tax compliance)
**Dependencies:** Priority 1 (purchase flow) must be complete
**Success Metrics:** Creators can view earnings breakdown, request first payout

---

### Priority 3: Enhanced Search & Discovery (MEDIUM - Buyer Friction)
**Rationale:** Current search is basic. Buyers need better filtering to find relevant content quickly. Reduces browse-to-purchase friction.

**Tasks:**
- Tag-based filtering (multi-select)
- Price range slider
- Creator name search
- Functional sort by price/rating
- Save searches functionality
- Recent searches history
- "Trending" projects algorithm

**Impact:**
- Reduces time to find relevant projects
- Increases browse-to-cart conversion
- Surfaces high-quality collaborative projects
- Improves buyer satisfaction

**Effort:** Medium (3-5 days)
**Risk:** Low (frontend-heavy, straightforward implementation)
**Dependencies:** None - can parallelize with Priority 1
**Success Metrics:** Reduced average time to first cart addition, increased search usage

---

### Priority 4: Project Analytics for Creators (MEDIUM - Creator Value)
**Rationale:** Creators need data to optimize pricing, understand demand, and measure success. Increases platform stickiness.

**Tasks:**
- Project view counts and unique visitors
- Cart additions (conversion funnel)
- Collaboration request stats (sent/received/approved)
- Review sentiment analysis
- Revenue trends over time
- Comparison to similar projects
- Export analytics data

**Impact:**
- Empowers creators with actionable data
- Increases pricing optimization
- Shows platform value beyond revenue
- Enables creator success stories

**Effort:** Medium (3-5 days)
**Risk:** Low (mostly read queries, visualization)
**Dependencies:** Priority 1 for revenue metrics
**Success Metrics:** 80% of creators view analytics weekly, pricing adjustments based on data

---

### Priority 5: Collaboration Templates & Workflow (MEDIUM - Collaboration Friction)
**Rationale:** Current collaboration is ad-hoc. Templates reduce friction, speed up approvals, and increase collaboration rate (core differentiator).

**Tasks:**
- Pre-defined collaboration templates (royalty splits, usage terms)
- Bulk approval for similar requests
- Collaboration request preview (see how it looks in project)
- Approval workflow visualization (pending/approved/rejected)
- Collaboration analytics (most-referenced creators)
- "Suggested collaborators" based on project type
- Quick-accept for trusted collaborators

**Impact:**
- Increases collaboration rate (key metric)
- Reduces time from request to approval
- Builds trust through templates
- Accelerates network effects

**Effort:** Medium (5-7 days)
**Risk:** Low (UX-focused, backend exists)
**Dependencies:** None - can parallelize
**Success Metrics:** 30% increase in approval rate, 50% reduction in time-to-approval

---

## Deferred Priorities (Not Now)

**Direct Messaging:** Build collaboration features first, then add messaging if needed
**Refund System:** Start with clear policies, add automation after launch
**Advanced Analytics:** Start with basics, add sophistication after usage patterns emerge
**Print-on-Demand:** Focus on digital first, physical later
**Creator Verification:** Use Victory Points system first, add verification if abuse occurs
**Project Recommendations:** Need more data before building recommendation engine
**Mobile App:** Validate web first, mobile if user demand exists

## Launch Readiness Checklist

### Must-Have (Blocker to Launch)
- [ ] Payment processing functional (Priority 1)
- [ ] Digital delivery working (Priority 1)
- [ ] Creator revenue dashboard (Priority 2)
- [ ] Purchase confirmation emails
- [ ] Basic support email address
- [ ] Terms of Service + Privacy Policy
- [ ] Refund policy documented
- [ ] Tax compliance research (sales tax, 1099s)

### Should-Have (Launch Soon After)
- [ ] Enhanced search (Priority 3)
- [ ] Project analytics (Priority 4)
- [ ] Collaboration templates (Priority 5)
- [ ] Creator onboarding tutorial
- [ ] Example projects published
- [ ] Social proof (testimonials, case studies)

### Nice-to-Have (Post-Launch)
- Advanced analytics
- Direct messaging
- Print-on-demand integration
- Mobile responsive improvements
- API for third-party integrations

## Success Metrics (First 90 Days)

**Creator Metrics:**
- 50+ creators signed up
- 20+ projects published
- 30% collaboration rate (projects with cross-references)
- 100+ playtest reviews submitted

**Revenue Metrics:**
- 10+ purchases completed
- $500+ total marketplace revenue
- 5+ creators earn their first payout
- Average revenue split: 60/30/10 (creator/collaborators/platform)

**Engagement Metrics:**
- 200+ Victory Points awarded
- 50+ collaboration requests sent
- 80% approval rate on requests
- 30% returning creator rate (monthly)

## Risks & Mitigation

**Risk 1: Low Creator Adoption**
- *Mitigation:* Direct outreach to tabletop creator communities, showcase success stories, seed with high-quality projects

**Risk 2: Payment Complexity**
- *Mitigation:* Start with simple Stripe Checkout, iterate on custom flows, clear documentation for creators

**Risk 3: Revenue Splits Disputed**
- *Mitigation:* Preview splits before purchase, transparent transaction logs, clear terms in collaboration approval

**Risk 4: Poor Collaboration Rate**
- *Mitigation:* Templates for common scenarios, social proof (show successful collaborations), Victory Points incentives

**Risk 5: Low Buyer Demand**
- *Mitigation:* Waitlist validation first, email campaign to waitlist on launch, focus on quality over quantity

## Competitive Differentiation

**vs. DriveThruRPG/Itch.io:**
- Automatic collaboration attribution
- Revenue sharing without contracts
- Cross-discipline discovery

**vs. MyMiniFactory/Thingiverse:**
- Built-in game design tools
- Marketplace for complete projects
- Social proof through Victory Points

**vs. Kickstarter:**
- No funding goal required
- Instant delivery
- Ongoing collaboration network

## Next Steps (Immediate Actions)

1. **Week 1-2:** Implement Priority 1 (Purchase Flow)
   - Set up Stripe account
   - Build checkout flow
   - Implement digital delivery
   - Test end-to-end purchase

2. **Week 3-4:** Implement Priority 2 (Revenue Dashboard)
   - Stripe Connect setup
   - Build earnings dashboard
   - Payout request flow
   - Tax documentation research

3. **Week 5:** Implement Priority 3 (Enhanced Search)
   - Tag filtering
   - Price range slider
   - Sort functionality

4. **Week 6:** Pre-launch preparation
   - Legal review (ToS, Privacy, Refund)
   - Support email setup
   - Onboarding tutorial
   - Example projects

5. **Week 7:** Soft launch to waitlist
   - Email campaign
   - Monitor metrics
   - Gather feedback
   - Fix critical bugs

6. **Week 8+:** Iterate based on feedback
   - Priority 4 & 5 as needed
   - Address user-reported friction
   - Optimize conversion funnel

---

**Last Updated:** 2025-10-03
**Status:** MVP Complete, Ready for Priority 1 Implementation
