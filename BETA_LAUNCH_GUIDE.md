# Beta Launch Guide

**Target Launch Date:** TBD
**Status:** Pre-Launch Preparation
**Last Updated:** 2025-01-27

---

## 🎯 Beta Launch Goals

**Primary Objectives:**
1. Validate payment processing in real-world scenarios
2. Test complete user journey (sign-up → purchase → download)
3. Identify critical bugs before public launch
4. Gather creator feedback on platform features
5. Achieve first $500 in GMV (Gross Merchandise Value)

**Success Metrics:**
- 20+ creators with published products
- 100+ registered users
- 10+ successful transactions
- $500+ GMV
- <5% checkout error rate
- 4+ star average creator satisfaction

---

## ✅ Pre-Launch Checklist

### 1. Environment Configuration (15 minutes)

#### Stripe API Keys
- [ ] Sign up for Stripe account (if not done)
- [ ] Get test mode API keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
- [ ] Add to `.env`:
  ```env
  STRIPE_SECRET_KEY=sk_test_...
  PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  ```

#### Stripe Webhooks
- [ ] Navigate to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
- [ ] Create webhook endpoint:
  - **URL:** `https://your-domain.vercel.app/api/webhooks/stripe`
  - **Events:**
    - `checkout.session.completed`
    - `charge.refunded`
- [ ] Copy webhook signing secret to `.env`:
  ```env
  STRIPE_WEBHOOK_SECRET=whsec_...
  STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
  ```

#### Supabase Configuration
- [ ] Verify `PUBLIC_SUPABASE_URL` in `.env`
- [ ] Verify `PUBLIC_SUPABASE_ANON_KEY` in `.env`
- [ ] Check database migrations are applied
- [ ] Verify RLS policies are enabled

#### Email Configuration (Resend)
- [ ] Sign up for [Resend](https://resend.com)
- [ ] Get API key
- [ ] Add to `.env`:
  ```env
  RESEND_API_KEY=re_...
  ```
- [ ] Verify sender email domain

---

### 2. Testing Checklist (2-3 hours)

#### Manual Testing - Critical Path

**Test User Setup:**
- [ ] Create test user account
- [ ] Verify email confirmation works
- [ ] Test password reset flow

**Asset Creation:**
- [ ] Create test asset (draft status)
- [ ] Upload test files (PDF, image, STL)
- [ ] Add asset images
- [ ] Publish asset (draft → private → public)
- [ ] Verify asset appears in marketplace

**Product Creation:**
- [ ] Create test product
- [ ] Add product variants
- [ ] Set pricing ($10, $20, $30 variants)
- [ ] Link assets to variants
- [ ] Configure royalty splits
- [ ] Publish product

**Checkout Flow:**
- [ ] Add product to cart
- [ ] View cart - verify pricing breakdown
- [ ] Click "Checkout"
- [ ] Redirects to Stripe Checkout
- [ ] Fill test card: `4242 4242 4242 4242`
- [ ] Expiry: Any future date
- [ ] CVC: Any 3 digits
- [ ] Submit payment
- [ ] Redirects to success page
- [ ] Cart is cleared

**Post-Purchase:**
- [ ] Navigate to purchase history
- [ ] Verify sale record exists
- [ ] Click download button
- [ ] Verify file downloads successfully
- [ ] Check download URL expires (24 hours)

**Database Verification:**
- [ ] Check `sales` table - sale created
- [ ] Check `sale_items` table - items recorded
- [ ] Check `sale_item_assets` table - asset links created
- [ ] Check `sale_royalty_transactions` table - royalties calculated correctly
- [ ] Verify royalty amounts match configured splits

**Email Verification:**
- [ ] Purchase confirmation email received
- [ ] Email contains correct sale details
- [ ] Email contains download link (if applicable)

#### Automated Testing

**Unit Tests:**
```bash
npm run test
```
- [ ] All royalty calculation tests pass
- [ ] All data access tests pass
- [ ] No failing tests

**E2E Tests:**
```bash
npm run test:e2e
```
- [ ] Checkout flow test passes
- [ ] Download security tests pass
- [ ] Cart persistence tests pass
- [ ] Payment decline handling works

#### Error Scenario Testing

**Payment Failures:**
- [ ] Declined card (`4000 0000 0000 0002`)
  - Verify error message shown
  - Verify cart persists
  - Verify no sale created
- [ ] Insufficient funds (`4000 0000 0000 9995`)
  - Same verifications as above

**Edge Cases:**
- [ ] Empty cart checkout (should be disabled)
- [ ] Deleted product in cart
- [ ] Price changes after adding to cart
- [ ] Concurrent purchases (race conditions)
- [ ] Network interruptions during checkout

**Security Testing:**
- [ ] Unauthorized download access (different user's sale)
- [ ] Expired download links (after 24 hours - may need to mock time)
- [ ] SQL injection attempts in search/filters
- [ ] XSS attempts in product descriptions
- [ ] CSRF protection on forms

---

### 3. Performance Validation (30 minutes)

#### Lighthouse Audit
- [ ] Run Lighthouse on key pages:
  - `/` (homepage)
  - `/products` (marketplace)
  - `/products/[handle]` (product detail)
  - `/cart` (checkout flow)
  - `/dashboard` (authenticated)

**Target Scores:**
- Performance: 85+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

#### Load Testing
- [ ] Test with 10 concurrent users
- [ ] Verify no database connection errors
- [ ] Check API response times (< 500ms avg)
- [ ] Monitor Vercel function execution time

---

### 4. Content Preparation (1-2 hours)

#### Seed Content
- [ ] Create 5-10 sample products
- [ ] Add realistic product descriptions
- [ ] Upload high-quality product images
- [ ] Set varied price points ($5-$50)
- [ ] Tag products appropriately

#### Documentation
- [ ] Create "Getting Started" guide for creators
- [ ] Write FAQ page
- [ ] Document royalty split examples
- [ ] Create asset submission guidelines
- [ ] Write community guidelines

#### Marketing Materials
- [ ] Prepare launch announcement email
- [ ] Create social media posts
- [ ] Design beta tester invitation email
- [ ] Prepare creator onboarding email sequence

---

### 5. Beta Tester Recruitment (1 week)

#### Ideal Beta Testers
**Creators (15-20 people):**
- 5-7 Game Designers
- 5-7 3D Modelers
- 3-5 Illustrators/Artists
- Experience with digital marketplaces (DriveThruRPG, itch.io)
- Active in TTRPG community

**Consumers (30-50 people):**
- Active TTRPG players
- Purchase digital content regularly
- Willing to provide feedback

#### Recruitment Channels
- [ ] Post in /r/RPGdesign subreddit
- [ ] Post in /r/tabletopgamedesign
- [ ] Reach out to TTRPG Discord servers
- [ ] Contact indie game designer communities
- [ ] Email personal network

#### Incentives
- [ ] Early adopter badge
- [ ] Reduced platform fees for first 3 months (3% vs 5%)
- [ ] Featured creator spotlight
- [ ] Exclusive access to new features

---

### 6. Monitoring Setup (30 minutes)

#### Error Tracking
- [ ] Set up Sentry or similar (optional)
- [ ] Configure Vercel error logging
- [ ] Set up email alerts for 500 errors
- [ ] Create Slack/Discord webhook for critical errors

#### Analytics
- [ ] Verify Vercel Analytics enabled
- [ ] Set up conversion tracking
- [ ] Track key metrics:
  - Sign-ups per day
  - Products created per day
  - Transactions per day
  - GMV per day
  - Average order value

#### Database Monitoring
- [ ] Set up Supabase usage alerts
- [ ] Monitor database size growth
- [ ] Track slow queries
- [ ] Check connection pool usage

---

### 7. Launch Day Preparation

#### Communication Plan
- [ ] Prepare launch email to beta testers
- [ ] Schedule social media posts
- [ ] Create launch day FAQ
- [ ] Set up support email/channel
- [ ] Assign team members to monitor feedback

#### Support Readiness
- [ ] Document common issues and solutions
- [ ] Prepare canned responses for FAQs
- [ ] Set up support ticket system (or email)
- [ ] Define response time SLA (24 hours for beta)

#### Rollback Plan
- [ ] Document how to disable payments
- [ ] Have backup of database before launch
- [ ] Know how to revert recent deployments
- [ ] Prepare "maintenance mode" message

---

## 🚀 Launch Sequence

### Day 1: Soft Launch (Invite Only)
**Morning:**
- [ ] Deploy to production
- [ ] Verify Stripe webhooks working
- [ ] Run smoke tests on production
- [ ] Send invites to first 10 beta testers

**Afternoon:**
- [ ] Monitor for errors
- [ ] Respond to first feedback
- [ ] Watch for first transactions

**Evening:**
- [ ] Review analytics
- [ ] Document any issues found
- [ ] Plan fixes for critical bugs

### Day 2-3: Expand Beta Group
- [ ] Send invites to remaining beta testers
- [ ] Monitor transaction success rate
- [ ] Collect qualitative feedback
- [ ] Iterate on critical issues

### Day 4-7: Optimize
- [ ] Fix non-critical bugs
- [ ] Improve UX based on feedback
- [ ] Add requested features (if quick)
- [ ] Prepare for public launch

---

## 📊 Beta Metrics Dashboard

### Daily Tracking

**User Metrics:**
- New signups: ___
- Active users (DAU): ___
- Creator vs Consumer ratio: ___

**Commerce Metrics:**
- Products created: ___
- Assets published: ___
- Transactions completed: ___
- Total GMV: $___
- Average order value: $___
- Checkout abandonment rate: ___%

**Technical Metrics:**
- Error rate: ___%
- Average API response time: ___ms
- Stripe webhook success rate: ___%
- Database query time (p95): ___ms

**Engagement Metrics:**
- Products with >0 sales: ___
- Repeat purchases: ___%
- Jam participation: ___
- Reviews submitted: ___

---

## 🐛 Known Issues & Workarounds

### Current Limitations

**Payment Processing:**
- ⚠️ Only test mode enabled (by design)
- ⚠️ No payout automation yet (manual payouts in beta)
- ⚠️ Refunds require manual processing

**Features Not Yet Implemented:**
- Discount codes
- Subscription products
- Bulk pricing
- Affiliate program
- Mobile app

**Beta-Specific Workarounds:**
- Manual creator payouts via PayPal/bank transfer
- Support requests via email only
- Limited to 50 concurrent users

---

## 📝 Feedback Collection

### Creator Survey (End of Beta)
- [ ] How easy was product creation? (1-5)
- [ ] Were royalty splits clear? (1-5)
- [ ] Did you make sales? (Y/N, how many)
- [ ] Would you recommend to other creators? (NPS)
- [ ] Most frustrating experience?
- [ ] Most delightful experience?
- [ ] Top feature request?

### Consumer Survey (End of Beta)
- [ ] How easy was finding products? (1-5)
- [ ] Checkout experience? (1-5)
- [ ] Did downloads work? (Y/N)
- [ ] Would you purchase again? (Y/N)
- [ ] Value for money? (1-5)
- [ ] Top pain point?

---

## 🎓 Post-Beta Actions

### Week After Beta
- [ ] Compile all feedback
- [ ] Prioritize bug fixes
- [ ] Create roadmap for public launch
- [ ] Calculate beta success metrics
- [ ] Thank beta testers
- [ ] Prepare case studies

### Pre-Public Launch
- [ ] Switch Stripe to live mode
- [ ] Implement critical fixes
- [ ] Update pricing (if needed)
- [ ] Finalize terms of service
- [ ] Complete privacy policy
- [ ] Prepare press kit
- [ ] Contact tech press

---

## 📞 Emergency Contacts

**Critical Issues:**
- Platform down: Deploy rollback
- Payment failures: Check Stripe status
- Database issues: Check Supabase dashboard
- Email not sending: Check Resend status

**Escalation Path:**
1. Check error logs
2. Review recent deployments
3. Check third-party service status
4. Roll back if needed
5. Communicate with users

---

## ✅ Beta Success Criteria

**Must Achieve (Minimum):**
- [x] 10+ completed transactions
- [x] 0 critical payment bugs
- [x] <5% error rate
- [x] 15+ creators onboarded

**Good Success:**
- [x] 50+ transactions
- [x] $500+ GMV
- [x] 4+ NPS from creators
- [x] 25+ products published

**Exceptional Success:**
- [x] 100+ transactions
- [x] $1,000+ GMV
- [x] 8+ NPS from creators
- [x] Organic creator referrals
- [x] Press coverage

---

**Ready for Launch When:**
1. ✅ All critical tests pass
2. ✅ Stripe configured correctly
3. ✅ At least 5 seed products live
4. ✅ Support system ready
5. ✅ Monitoring in place
6. ✅ 20+ beta testers committed

---

**Last Updated:** 2025-01-27
**Next Review:** Launch Day
