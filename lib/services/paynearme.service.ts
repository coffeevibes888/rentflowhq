/**
 * PayNearMe Integration Service
 * 
 * PayNearMe enables cash payments at 27,000+ retail locations including:
 * - Walmart
 * - 7-Eleven
 * - CVS
 * - Family Dollar
 * - Casey's
 * - ACE Cash Express
 * 
 * API Documentation: https://developer.paynearme.com/
 * 
 * Flow:
 * 1. Create a payment order via API
 * 2. Receive barcode/payment slip data
 * 3. Tenant takes barcode to retail location
 * 4. Tenant pays cash
 * 5. PayNearMe sends webhook notification
 * 6. We mark rent as paid
 */

const PAYNEARME_API_URL = process.env.PAYNEARME_API_URL || 'https://api.paynearme.com/api/v3';
const PAYNEARME_SITE_ID = process.env.PAYNEARME_SITE_ID;
const PAYNEARME_API_KEY = process.env.PAYNEARME_API_KEY;
const PAYNEARME_SECRET = process.env.PAYNEARME_SECRET;

// PayNearMe charges a fee per transaction (typically $1.99-$3.99)
export const PAYNEARME_FEE = 3.99;

// Barcode expiration in days
export const BARCODE_EXPIRATION_DAYS = 14;

interface PayNearMeOrderRequest {
  site_identifier: string;
  order_identifier: string;
  order_type: 'one_time' | 'recurring';
  amount: number;
  currency: 'USD';
  customer: {
    identifier: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, string>;
  expiration_date?: string;
  callback_url?: string;
}

interface PayNearMeOrderResponse {
  order_identifier: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  barcode: {
    type: 'CODE128' | 'PDF417';
    value: string;
    image_url: string;
  };
  payment_slip_url: string;
  amount: number;
  fee: number;
  total_amount: number;
  expiration_date: string;
  retail_locations_url: string;
}

interface PayNearMeWebhookPayload {
  event_type: 'payment.completed' | 'payment.failed' | 'order.expired';
  order_identifier: string;
  confirmation_number: string;
  amount_paid: number;
  fee_amount: number;
  paid_at: string;
  retail_location: {
    name: string;
    address: string;
  };
  signature: string;
}

/**
 * Check if PayNearMe is configured
 */
export function isPayNearMeConfigured(): boolean {
  return !!(PAYNEARME_SITE_ID && PAYNEARME_API_KEY && PAYNEARME_SECRET);
}

/**
 * Create a PayNearMe payment order
 */
export async function createPayNearMeOrder(params: {
  orderId: string;
  amount: number;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, string>;
  callbackUrl?: string;
}): Promise<{ success: boolean; data?: PayNearMeOrderResponse; error?: string }> {
  if (!isPayNearMeConfigured()) {
    // Return mock data for development/testing
    return createMockPayNearMeOrder(params);
  }

  try {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + BARCODE_EXPIRATION_DAYS);

    const requestBody: PayNearMeOrderRequest = {
      site_identifier: PAYNEARME_SITE_ID!,
      order_identifier: params.orderId,
      order_type: 'one_time',
      amount: params.amount,
      currency: 'USD',
      customer: {
        identifier: params.customerId,
        first_name: params.customerFirstName,
        last_name: params.customerLastName,
        email: params.customerEmail,
        phone: params.customerPhone,
      },
      metadata: params.metadata,
      expiration_date: expirationDate.toISOString(),
      callback_url: params.callbackUrl,
    };

    const response = await fetch(`${PAYNEARME_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYNEARME_API_KEY}`,
        'X-Site-Id': PAYNEARME_SITE_ID!,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('PayNearMe API error:', errorData);
      return {
        success: false,
        error: errorData.message || `PayNearMe API error: ${response.status}`,
      };
    }

    const data = await response.json() as PayNearMeOrderResponse;
    return { success: true, data };
  } catch (error) {
    console.error('PayNearMe request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create PayNearMe order',
    };
  }
}

/**
 * Get PayNearMe order status
 */
export async function getPayNearMeOrderStatus(
  orderId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  if (!isPayNearMeConfigured()) {
    return { success: true, status: 'pending' };
  }

  try {
    const response = await fetch(`${PAYNEARME_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYNEARME_API_KEY}`,
        'X-Site-Id': PAYNEARME_SITE_ID!,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to get order status: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, status: data.status };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get order status',
    };
  }
}

/**
 * Cancel a PayNearMe order
 */
export async function cancelPayNearMeOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isPayNearMeConfigured()) {
    return { success: true };
  }

  try {
    const response = await fetch(`${PAYNEARME_API_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYNEARME_API_KEY}`,
        'X-Site-Id': PAYNEARME_SITE_ID!,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to cancel order: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel order',
    };
  }
}

/**
 * Verify PayNearMe webhook signature
 */
export function verifyPayNearMeWebhook(
  payload: string,
  signature: string
): boolean {
  if (!PAYNEARME_SECRET) return false;

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', PAYNEARME_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Parse PayNearMe webhook payload
 */
export function parsePayNearMeWebhook(body: string): PayNearMeWebhookPayload | null {
  try {
    return JSON.parse(body) as PayNearMeWebhookPayload;
  } catch {
    return null;
  }
}

/**
 * Create mock PayNearMe order for development/testing
 */
function createMockPayNearMeOrder(params: {
  orderId: string;
  amount: number;
  customerFirstName: string;
  customerLastName: string;
}): { success: boolean; data: PayNearMeOrderResponse } {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + BARCODE_EXPIRATION_DAYS);

  // Generate a mock barcode value
  const barcodeValue = `PNM${params.orderId.replace(/-/g, '').substring(0, 12).toUpperCase()}`;

  return {
    success: true,
    data: {
      order_identifier: params.orderId,
      status: 'pending',
      barcode: {
        type: 'CODE128',
        value: barcodeValue,
        image_url: '', // Will be generated client-side
      },
      payment_slip_url: `https://paynearme.com/slip/${params.orderId}`,
      amount: params.amount,
      fee: PAYNEARME_FEE,
      total_amount: params.amount + PAYNEARME_FEE,
      expiration_date: expirationDate.toISOString(),
      retail_locations_url: 'https://paynearme.com/locations',
    },
  };
}

/**
 * Get list of nearby retail locations (for display purposes)
 */
export const PAYNEARME_RETAIL_PARTNERS = [
  { name: 'Walmart', icon: '🏪', count: '4,700+' },
  { name: '7-Eleven', icon: '🏪', count: '9,000+' },
  { name: 'CVS', icon: '💊', count: '8,000+' },
  { name: 'Family Dollar', icon: '💵', count: '8,000+' },
  { name: "Casey's", icon: '⛽', count: '2,400+' },
  { name: 'ACE Cash Express', icon: '💰', count: '950+' },
];
