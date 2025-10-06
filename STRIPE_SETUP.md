# Stripe Integration Setup

This document explains how to set up Stripe for the Workshop marketplace.

## Prerequisites

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard

## Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Secret Key (from Stripe Dashboard > Developers > API keys)
STRIPE_SECRET_KEY=sk_test_...

# Stripe Publishable Key (from Stripe Dashboard > Developers > API keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret (created after setting up webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_...

# Your site URL (for production, use your actual domain)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Webhook Setup

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
   - For local testing: Use Stripe CLI or a service like ngrok
4. Select events to listen to:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
5. Copy the "Signing secret" and add it to `STRIPE_WEBHOOK_SECRET`

## Local Testing with Stripe CLI

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret from the output
5. Use test card numbers from: https://stripe.com/docs/testing

## Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`
- Use any future expiry date, any 3-digit CVC, any ZIP code

## Database Migration

Run the orders system migration:

```bash
npx supabase db reset
```

This creates the following tables:
- `orders` - Purchase records
- `order_items` - Individual projects in orders
- `revenue_splits` - Revenue distribution records
- `downloaded_items` - Download tracking

## How It Works

### Purchase Flow

1. User adds items to cart
2. User clicks "Proceed to Checkout"
3. System creates order in database (status: `pending`)
4. System creates Stripe Checkout session
5. User completes payment on Stripe
6. Stripe sends `checkout.session.completed` webhook
7. System updates order status to `completed`
8. System creates notifications for buyer and creators
9. User can download purchased content

### Revenue Distribution

Revenue is split according to:
- **10% Platform Fee** - Deducted automatically
- **Creator** - Gets remainder after platform fee and royalties
- **Collaborators** - Get percentage based on `project_asset_references.royalty_percentage`

Example for $10 purchase:
- Platform: $1.00 (10%)
- If 20% royalty to collaborator: $2.00
- Creator gets: $7.00 (70%)

This is calculated automatically by the `calculate_revenue_splits()` function.

## API Endpoints

### POST /api/checkout
Creates a Stripe Checkout session from cart items.

**Request:**
```json
{
  "items": [
    {
      "projectId": "uuid",
      "projectTitle": "My Game",
      "pricingTierId": "uuid",
      "pricingTierName": "Standard",
      "price": 9.99,
      "coverImageUrl": "https://..."
    }
  ]
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### POST /api/webhooks/stripe
Handles Stripe webhook events (automated by Stripe).

### GET /api/orders
Returns user's order history.

### GET /api/orders/[order_id]
Returns specific order details.

### GET /api/orders/[order_id]/downloads
Returns downloadable files for completed order.

## Security Notes

1. **Never commit `.env.local`** - It's in `.gitignore` by default
2. **Use test keys in development** - Prefix: `sk_test_` and `pk_test_`
3. **Verify webhook signatures** - Already implemented in `/api/webhooks/stripe`
4. **Row Level Security** - Supabase RLS ensures users only see their own orders

## Stripe Connect (Creator Payouts)

Workshop uses **Stripe Connect Express** accounts to pay creators their revenue share.

### How It Works

1. Creator clicks "Connect Bank Account" in `/settings/payouts`
2. System creates Stripe Connect Express account
3. Creator completes onboarding with Stripe (hosted flow)
4. System enables payouts once verification is complete
5. Creators can request manual payouts or set up automatic monthly payouts

### Creator Payout Flow

When a purchase is completed:
1. Order is created with status `completed`
2. `revenue_splits` table records each recipient's share (10% platform fee, remainder split based on collaborations)
3. Revenue splits start with status `processing`
4. Creator can request payout once balance >= $10.00
5. System creates Stripe Transfer to creator's Connect account
6. Revenue splits marked as `paid` and linked to payout request

### Automatic Monthly Payouts

Creators can enable automatic payouts that run on a schedule:

- **Frequency options**: Weekly, Bi-weekly, Monthly
- **Minimum threshold**: Default $10, customizable
- **Day of month**: For monthly payouts (1-28)
- **Processing**: Cron job calls `process_scheduled_payouts()` function

To set up cron job (use a service like GitHub Actions, Vercel Cron, or Supabase Edge Functions):

```sql
-- Call this function daily
SELECT * FROM process_scheduled_payouts();
```

This returns all users who received automatic payouts.

### API Endpoints

**POST /api/stripe/connect/onboard**
Creates Connect account and returns onboarding link.

**GET /api/stripe/connect/account**
Returns user's Connect account status.

**GET /api/earnings**
Returns user's earnings summary:
- Available balance (ready to withdraw)
- Pending earnings (from recent sales)
- Lifetime earnings
- Recent revenue splits
- Payout history

**POST /api/payouts/request**
Requests a manual payout.

```json
{
  "amount": 50.00
}
```

**GET /api/payouts/schedule**
Gets user's automatic payout schedule.

**POST /api/payouts/schedule**
Creates/updates automatic payout schedule.

```json
{
  "enabled": true,
  "frequency": "monthly",
  "minimum_amount": 50.00,
  "day_of_month": 15
}
```

## Production Checklist

Before going live:

- [ ] Replace test Stripe keys with live keys (`sk_live_`, `pk_live_`)
- [ ] Update webhook endpoint to production URL
- [ ] Update `NEXT_PUBLIC_SITE_URL` to production domain
- [ ] Test complete purchase flow in live mode
- [ ] Test Stripe Connect onboarding flow
- [ ] Test manual payout request
- [ ] Set up cron job for automatic payouts
- [ ] Configure email notifications
- [ ] Add refund handling (future)
- [ ] Set up monitoring for failed payments
- [ ] Review Stripe Connect compliance requirements

## Troubleshooting

### Order stuck in "processing"
- Check Stripe Dashboard for payment status
- Verify webhook is receiving events
- Check server logs for webhook errors

### Webhook signature verification failed
- Verify `STRIPE_WEBHOOK_SECRET` matches webhook endpoint
- Check that webhook endpoint URL is correct
- Ensure webhook secret is from the correct endpoint

### Downloads not appearing
- Verify order status is `completed`
- Check that pricing tier includes assets/documents
- Verify asset `file_url` and document `file_url` are set
- Check browser console for API errors

## Support

For issues:
1. Check Stripe Dashboard > Events for webhook delivery
2. Check application logs for errors
3. Contact support@workshop.com
