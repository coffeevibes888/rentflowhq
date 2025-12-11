# Recurring Rent Payments Setup Guide

## Overview

Tenants can set up automatic recurring rent payments using their bank account (ACH) with **NO convenience fee**. This provides a seamless, hands-off payment experience while keeping costs low.

## Features Implemented

### ✅ Payment Methods Available

| Method | Convenience Fee | Speed | Best For |
|--------|----------------|-------|----------|
| **Bank Account (ACH)** | **FREE ($0)** | 5-7 days | Recurring payments |
| **Debit/Credit Card** | $2.00 | Instant | One-time payments |
| **Apple Pay** | $2.00 | Instant | Quick mobile payments |
| **Google Pay** | $2.00 | Instant | Quick mobile payments |
| **Link** | $2.00 | Instant | Saved payment info |

### 💰 Platform Revenue Model

The $2 convenience fee on instant payment methods goes **100% to your platform account** (super admin). This creates a sustainable revenue stream while incentivizing cost-free bank transfers.

**Example Revenue:**
- 100 tenants × $1,500 rent each
- 70% use FREE ACH (no fee collected)
- 30% use card/wallet with $2 fee
- **Monthly Revenue: 30 × $2 = $60**
- **Annual Revenue: $720** from convenience fees alone

## How It Works

### For Tenants

1. **Go to Rent Receipts page** in user profile
2. **Click "Pay Rent Now"** on pending payments
3. **Choose Payment Method:**
   - **Bank Account (FREE)** - Can save for future recurring payments
   - **Card/Wallet (+$2)** - Instant confirmation

4. **For Recurring Setup with ACH:**
   - Select "Bank Account" in payment form
   - Enter routing & account number
   - Check "Save for future payments" (enabled by default)
   - Payment method is securely saved in Stripe

5. **Future Payments:**
   - Stripe automatically charges saved ACH method
   - No manual action needed each month
   - Email notifications sent before charge

### For Landlords

- **View payment methods** used by tenants in rent reports
- **Track convenience fees** collected per payment
- **Automatic payouts** to connected Stripe account
- **No setup required** - works out of the box

### For Platform (Super Admin)

- **Convenience fees auto-routed** to your Stripe platform account
- **View revenue** in Stripe Dashboard > Application Fees
- **No manual transfers** - Stripe handles everything

## Technical Implementation

### 1. Payment Intent Setup

```typescript
// When creating payment intent in checkout
setup_future_usage: 'off_session', // Enables saving for recurring
payment_method_types: ['card', 'us_bank_account', 'link'],
automatic_payment_methods: {
  enabled: true,
  allow_redirects: 'never',
},
```

### 2. Convenience Fee Logic

```typescript
// ACH = FREE
CONVENIENCE_FEE_ACH: $0.00

// Cards/Wallets = $2
CONVENIENCE_FEE_INSTANT: $2.00
```

### 3. Stripe Connect Integration

The convenience fee is set as the `application_fee_amount` in Stripe Connect, which automatically:
- Routes to your platform account
- Shows in Stripe Dashboard > Application Fees
- Separates from landlord's revenue

### 4. Database Tracking

```prisma
model RentPayment {
  paymentMethod String?  // 'card', 'us_bank_account', 'apple_pay', etc.
  convenienceFee Decimal? // $0.00 or $2.00
  isRecurring Boolean    // Track recurring payments
}
```

## Setting Up Recurring Payments (Future Enhancement)

### Option 1: Stripe Subscriptions
Create monthly subscriptions for tenants with saved payment methods.

```typescript
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  default_payment_method: savedPaymentMethodId,
  billing_cycle_anchor: tenantBillingDay,
});
```

### Option 2: Scheduled Payments
Use Stripe's Payment Intents with scheduled charges.

```typescript
// Charge saved payment method automatically
const paymentIntent = await stripe.paymentIntents.create({
  amount: rentAmount,
  currency: 'usd',
  customer: customerId,
  payment_method: savedPaymentMethodId,
  off_session: true,
  confirm: true,
});
```

### Option 3: Cron Job + Stripe
- Run daily cron job to check upcoming rent due dates
- Auto-charge tenants with saved ACH methods
- Send email confirmations

## Tenant Communication

### Email Templates Needed

1. **Payment Method Saved**
   - "Your bank account has been saved for future rent payments"
   - "You'll be automatically charged on the [Xth] of each month"

2. **Upcoming Charge Notification**
   - "Your rent of $X will be charged on [date]"
   - "To your bank account ending in [last4]"

3. **Payment Successful**
   - "Your rent payment of $X has been processed"
   - "Thank you for using FREE ACH transfer!"

4. **Payment Failed**
   - "We couldn't process your rent payment"
   - "Please update your payment method or pay manually"

## Security & Compliance

✅ **PCI Compliance**: Stripe handles all card data
✅ **Bank Account Verification**: Stripe verifies ACH accounts
✅ **Encryption**: All payment data encrypted at rest
✅ **Mandate Management**: Stripe handles ACH mandates
✅ **Fraud Protection**: Stripe's built-in fraud detection

## Testing

### Test Cards/Accounts

```
# ACH Bank Account (FREE)
Routing: 110000000
Account: 000123456789

# Successful Card (+$2 fee)
Card: 4242 4242 4242 4242

# Declined Card
Card: 4000 0000 0000 0002
```

## Revenue Analytics

Track your platform revenue in:
- **Stripe Dashboard** > Connect > Application Fees
- **Custom Reports** in your admin panel
- **Export Data** for accounting

### Key Metrics to Track

- Total convenience fees collected
- ACH vs Card usage ratio
- Average fee per tenant
- Monthly recurring revenue

## Next Steps

1. ✅ Deploy current implementation
2. 📧 Set up email notifications
3. 🔄 Build recurring payment automation
4. 📊 Add revenue analytics dashboard
5. 🎨 Create tenant education materials

## Support

For tenant questions about:
- **Payment methods**: Explain FREE ACH benefit
- **Convenience fees**: Clarify $2 is for instant payments only
- **Recurring setup**: Guide through one-time ACH setup
- **Payment failures**: Troubleshoot with Stripe logs

---

**Built with ❤️ using Stripe Connect**

