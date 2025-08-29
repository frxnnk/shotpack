# Stripe Integration TODO

This document outlines the planned Stripe integration for Banana Backdrops.

## Overview

Implement Stripe Checkout for paid image packs:
- **Free Tier**: 5 images per day (current implementation)  
- **Paid Pack**: 50 images for $9.99

## Implementation Plan

### 1. Environment Variables

Add to `.env`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Dependencies

Add to `package.json`:
```json
{
  "stripe": "^14.0.0",
  "@stripe/stripe-js": "^2.0.0"
}
```

### 3. Database Schema

Add user credits tracking (consider using a simple KV store or database):
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR,
  credits INT DEFAULT 5,
  last_free_reset DATE,
  created_at TIMESTAMP
);

CREATE TABLE purchases (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR,
  stripe_payment_intent_id VARCHAR,
  credits_purchased INT,
  amount_cents INT,
  status VARCHAR,
  created_at TIMESTAMP
);
```

### 4. API Routes to Add

#### `/api/checkout/create-session`
```typescript
// Create Stripe Checkout session for credit purchase
POST /api/checkout/create-session
Body: { userEmail: string }
Response: { sessionUrl: string }
```

#### `/api/webhooks/stripe`
```typescript
// Handle Stripe webhook events
POST /api/webhooks/stripe
// Process payment_intent.succeeded, add credits to user
```

#### `/api/user/credits`
```typescript
// Get user credit balance
GET /api/user/credits?email=user@example.com
Response: { credits: number, lastReset: string }
```

### 5. Frontend Updates

#### Credit Display Component
```tsx
// Show user's remaining credits
<div className="credit-counter">
  Credits remaining: {userCredits}
  {userCredits === 0 && <BuyCreditsButton />}
</div>
```

#### Purchase Flow
1. User hits credit limit
2. Show "Buy Credits" modal with Stripe Checkout
3. Redirect to Stripe Checkout
4. Handle success/cancel redirects
5. Update UI with new credit balance

### 6. Credit System Logic

#### Free Tier Rules
- 5 free credits per day (resets at midnight UTC)
- Track by email address (no signup required)
- Show warning when credits are low

#### Purchase Flow
- Stripe Checkout for $9.99 → 50 credits
- Credits don't expire
- Credits stack (can buy multiple packs)

#### Credit Deduction
- Deduct 1 credit when job starts (in `/api/jobs/create`)
- If job fails, refund the credit
- Show credit balance on result page

### 7. Error Handling

- Handle failed payments gracefully
- Prevent double-spending on webhook replays
- Show clear error messages for insufficient credits

### 8. Testing

#### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

#### Test Scenarios
- [ ] Purchase credits successfully
- [ ] Handle payment failure
- [ ] Webhook processing
- [ ] Credit deduction/refund
- [ ] Daily free reset

### 9. Security Considerations

- Validate all webhook signatures
- Use idempotency keys for credit operations
- Rate limit credit check endpoints
- Encrypt user data in storage

### 10. Deployment Notes

- Set up Stripe webhook endpoint in dashboard
- Configure webhook events: `payment_intent.succeeded`
- Use Stripe CLI for local webhook testing
- Monitor webhook delivery in Stripe dashboard

## Priority Order

1. Basic credit tracking system
2. Stripe Checkout integration  
3. Webhook handling for successful payments
4. Frontend credit display and purchase flow
5. Free tier reset logic
6. Error handling and edge cases

## Estimated Timeline

- **Phase 1** (Credit System): 1-2 days
- **Phase 2** (Stripe Integration): 2-3 days  
- **Phase 3** (UI/UX): 1-2 days
- **Phase 4** (Testing): 1 day

**Total**: ~1 week of development