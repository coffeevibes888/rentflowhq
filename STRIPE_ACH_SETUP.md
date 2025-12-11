# Stripe ACH Direct Debit Implementation Guide

## ✅ What's Been Implemented

### 1. **ACH Payment Collection** (5-7 business days)
- **Cost**: 0.8% capped at $5 per transaction
- **Timeline**: 5-7 business days for funds to clear
- **Location**: `app/api/rent/checkout/route.ts`

#### Changes Made:
```typescript
// Enabled both ACH and card payments
payment_method_types: ['us_bank_account', 'card']
```

### 2. **Webhook Handlers for ACH Events**
- **Location**: `app/api/webhooks/stripe/route.ts`

#### New Events Handled:
- `payment_intent.processing` - ACH payment initiated (5-7 days pending)
- `payment_intent.payment_failed` - ACH payment failed/bounced
- `charge.succeeded` - Payment completed (works for both ACH and cards)

### 3. **Instant Payout Option** (Minutes)
- **Cost**: 1.5% fee (capped at $10)
- **Timeline**: Within minutes to debit card
- **Location**: `app/api/landlord/payouts/cash-out/route.ts`

#### Payout Options:
| Method | Speed | Cost | Destination |
|--------|-------|------|-------------|
| **Standard** | 2-3 business days | FREE | Bank account |
| **Instant** | Minutes | 1.5% (max $10) | Debit card |

### 4. **Enhanced Payout UI**
- **Location**: `components/admin/payout-form.tsx`
- Beautiful card-based UI showing:
  - Fee comparison
  - Net amount after fees
  - Speed indicators
  - Visual distinction between options

### 5. **Payment Status Tracking**
- **Location**: `app/user/profile/rent-receipts/page.tsx`
- Shows payment status with visual indicators:
  - 🔵 **Processing** - ACH clearing (5-7 days)
  - 🟢 **Paid** - Successfully received
  - 🔴 **Failed** - Payment declined
  - 🟡 **Overdue** - Past due date
  - ⚪ **Pending** - Not yet initiated

### 6. **Tenant Payment UI**
- **Location**: `app/user/profile/rent-receipts/rent-stripe-payment.tsx`
- Added fee comparison banner showing:
  - ACH: 0.8% (max $5) • 5-7 days
  - Card: 2.9% + $0.30 • Instant
  - Example: $1,500 rent = $5 with ACH vs. $44.20 with card

### 7. **Database Schema Update**
- **Location**: `prisma/schema.prisma`
- Updated `RentPayment.status` to include `processing` state

---

## 🚀 Next Steps to Enable ACH

### Step 1: Enable ACH in Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings → Payment Methods**
3. Enable **ACH Direct Debit** (US Bank Accounts)
4. Configure ACH settings:
   - Enable micro-deposit verification (recommended)
   - Set up instant verification via Plaid (optional, faster)

### Step 2: Update Stripe Connect Accounts
For landlords to receive instant payouts, they need:
1. **Bank account** (for standard payouts)
2. **Debit card** (for instant payouts)

Update in Stripe Dashboard:
- **Settings → Connect → Account Onboarding**
- Ensure landlords can add both bank accounts and debit cards

### Step 3: Configure Webhooks
Add these webhook events in Stripe Dashboard:
- `payment_intent.processing`
- `payment_intent.payment_failed`
- `charge.succeeded`

Webhook URL: `https://yourdomain.com/api/webhooks/stripe`

### Step 4: Test ACH Payments
Use Stripe test bank accounts:
```
Routing: 110000000
Account: 000123456789
```

Test scenarios:
- ✅ Successful ACH payment
- ❌ Failed ACH payment (use routing: 110000000, account: 000111111116)
- ⏳ Processing state (takes 5-7 days in production, instant in test mode)

### Step 5: Run Database Migration
```bash
npx prisma migrate dev --name add_processing_status
```

This updates the `RentPayment` status field to include `processing`.

---

## 💰 Cost Comparison

### For a $1,500 Rent Payment:

| Method | Fee | Landlord Receives | Timeline |
|--------|-----|-------------------|----------|
| **ACH** | $5.00 (0.8% capped) | $1,495.00 | 5-7 days |
| **Card** | $44.20 (2.9% + $0.30) | $1,455.80 | Instant |

### Landlord Payout Options:

| Method | Fee | Timeline | Requirements |
|--------|-----|----------|--------------|
| **Standard** | FREE | 2-3 business days | Bank account |
| **Instant** | 1.5% (max $10) | Minutes | Debit card |

---

## 📋 Revenue Model

Your platform can monetize through:

1. **Instant Payouts**: 1.5% fee (Stripe charges 1.5%, you can add markup)
2. **Premium Features**: Charge for analytics, reporting, etc.
3. **Transaction Volume**: Negotiate better Stripe rates at scale

### Free Tier (Your Current Model):
- ✅ ACH rent collection (0.8%, max $5 per transaction)
- ✅ Standard payouts (free, 2-3 days)
- ✅ Up to 24 units free

### Revenue Tier:
- 💰 Instant payouts (1.5% fee)
- 💰 Premium analytics
- 💰 White-label branding

---

## 🔒 Security & Compliance

- ✅ PCI-DSS compliant (handled by Stripe)
- ✅ Bank account verification via micro-deposits or Plaid
- ✅ Encrypted data storage
- ✅ ACH mandate collection (handled by Stripe Elements)

---

## 🐛 Troubleshooting

### ACH Payments Not Showing
- Verify `payment_method_types: ['us_bank_account', 'card']` in checkout API
- Check Stripe Dashboard → Payment Methods → ACH is enabled

### Instant Payouts Failing
- Ensure landlord has added a debit card (not just bank account)
- Verify Stripe Connect account is fully onboarded
- Check payout limits (Stripe has daily/weekly limits)

### Processing Status Not Updating
- Verify webhook events are configured
- Check webhook logs in Stripe Dashboard
- Ensure `payment_intent.processing` event is handled

---

## 📞 Support

For questions or issues:
1. Check Stripe docs: https://stripe.com/docs/payments/ach-direct-debit
2. Review webhook logs in Stripe Dashboard
3. Test in Stripe test mode before going live

---

## 🎉 Summary

You now have:
- ✅ ACH Direct Debit enabled (0.8%, max $5, 5-7 days)
- ✅ Instant payouts (1.5%, minutes)
- ✅ Standard payouts (free, 2-3 days)
- ✅ Payment status tracking with visual indicators
- ✅ Fee comparison UI for tenants
- ✅ Beautiful payout selection UI for landlords

**Next**: Enable ACH in Stripe Dashboard and run the database migration!

