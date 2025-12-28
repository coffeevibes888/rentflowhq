interface PayNearMeOptions {
  tenantId: string;
  amount: number;
  propertyId: string;
  description: string;
  tenantInfo: {
    name: string;
    email: string;
    phone: string;
  };
  unitInfo: {
    unitNumber: string;
    propertyName: string;
  };
}

interface PayNearMeResponse {
  success: boolean;
  paymentId: string;
  barcodeUrl: string;
  barcodeData: string;
  referenceId: string;
  expiresAt: string;
  locations: Array<{
    name: string;
    address: string;
    distance: string;
  }>;
}

export class PayNearMeService {
  
  private static readonly API_BASE = 'https://api.paynearme.com/v1';
  private static readonly API_KEY = process.env.PAYNEARME_API_KEY;
  private static readonly CLIENT_ID = process.env.PAYNEARME_CLIENT_ID;

  // Generate cash payment barcode through PayNearMe
  static async generateCashPayment(options: PayNearMeOptions): Promise<PayNearMeResponse> {
    
    // In production, this would call PayNearMe API
    // For now, we'll simulate the response
    
    const referenceId = `PNM${Date.now()}${options.tenantId.slice(-4)}`;
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const barcodeData = {
      company: 'PropertyFlowHQ',
      referenceId,
      amount: options.amount.toFixed(2),
      tenantName: options.tenantInfo.name,
      unit: options.unitInfo.unitNumber,
      property: options.unitInfo.propertyName,
      description: options.description,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    // Simulate API call
    const response: PayNearMeResponse = {
      success: true,
      paymentId,
      barcodeUrl: `https://barcode.paynearme.com/${referenceId}`,
      barcodeData: btoa(JSON.stringify(barcodeData)),
      referenceId,
      expiresAt: barcodeData.expiresAt,
      locations: [
        {
          name: 'Walmart',
          address: '1235 S Las Vegas Blvd, Las Vegas, NV 89104',
          distance: '0.5 mi'
        },
        {
          name: '7-Eleven',
          address: '4567 E Tropicana Ave, Las Vegas, NV 89121',
          distance: '1.2 mi'
        },
        {
          name: 'CVS Pharmacy',
          address: '7890 W Flamingo Rd, Las Vegas, NV 89147',
          distance: '2.1 mi'
        }
      ]
    };

    return response;
  }

  // Check payment status
  static async checkPaymentStatus(referenceId: string) {
    // In production, call PayNearMe API
    // For now, return mock data
    return {
      referenceId,
      status: 'pending', // pending, completed, expired, failed
      amount: 1200,
      fee: 0.88,
      createdAt: new Date().toISOString(),
      processedAt: null,
      confirmationNumber: null
    };
  }

  // Process payment confirmation (webhook from PayNearMe)
  static async processPaymentConfirmation(webhookData: any) {
    // Handle PayNearMe webhook
    const { referenceId, status, confirmationNumber, processedAt } = webhookData;
    
    // Update your database
    console.log('Payment confirmed:', { referenceId, status, confirmationNumber, processedAt });
    
    // Send notification to tenant
    await this.sendTenantNotification(referenceId, status);
    
    return { success: true };
  }

  // Send notification to tenant
  private static async sendTenantNotification(referenceId: string, status: string) {
    // Use your NotificationService
    console.log(`Payment ${status} notification sent for ${referenceId}`);
  }

  // Get nearby payment locations
  static async getNearbyLocations(zipCode: string = '89101') {
    // In production, call PayNearMe locations API
    return [
      {
        id: 'walmart_1',
        name: 'Walmart',
        address: '1235 S Las Vegas Blvd, Las Vegas, NV 89104',
        city: 'Las Vegas',
        state: 'NV',
        zipCode: '89104',
        distance: '0.5 mi',
        hours: '6 AM - 11 PM',
        phone: '(702) 736-0711',
        services: ['Cash Payments', 'Money Services']
      },
      {
        id: 'seveneleven_1',
        name: '7-Eleven',
        address: '4567 E Tropicana Ave, Las Vegas, NV 89121',
        city: 'Las Vegas',
        state: 'NV',
        zipCode: '89121',
        distance: '1.2 mi',
        hours: '24 Hours',
        phone: '(702) 451-8711',
        services: ['Cash Payments', 'ATM']
      },
      {
        id: 'cvs_1',
        name: 'CVS Pharmacy',
        address: '7890 W Flamingo Rd, Las Vegas, NV 89147',
        city: 'Las Vegas',
        state: 'NV',
        zipCode: '89147',
        distance: '2.1 mi',
        hours: '8 AM - 10 PM',
        phone: '(702) 248-4111',
        services: ['Cash Payments', 'Photo', 'Pharmacy']
      }
    ];
  }

  // Generate printable payment slip
  static generatePaymentSlip(paymentData: PayNearMeResponse) {
    const slipHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Property Flow HQ - Cash Payment Slip</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .barcode { text-align: center; margin: 20px 0; font-family: monospace; font-size: 18px; background: #f5f5f5; padding: 10px; }
          .info { margin: 10px 0; }
          .instructions { background: #f0f0f0; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Property Flow HQ</h2>
          <h3>Cash Payment Slip</h3>
        </div>
        
        <div class="info">
          <strong>Reference ID:</strong> ${paymentData.referenceId}<br>
          <strong>Amount:</strong> $${JSON.parse(atob(paymentData.barcodeData)).amount}<br>
          <strong>Service Fee:</strong> $0.88<br>
          <strong>Total Due:</strong> $${(parseFloat(JSON.parse(atob(paymentData.barcodeData)).amount) + 0.88).toFixed(2)}<br>
          <strong>Expires:</strong> ${new Date(paymentData.expiresAt).toLocaleDateString()}
        </div>
        
        <div class="barcode">
          ${paymentData.barcodeData}
        </div>
        
        <div class="instructions">
          <h4>Instructions:</h4>
          <ol>
            <li>Take this slip to any participating location</li>
            <li>Present the barcode to the cashier</li>
            <li>Pay with cash + service fee</li>
            <li>Keep your receipt for records</li>
            <li>Payment processes within 24 hours</li>
          </ol>
        </div>
        
        <div class="info">
          <strong>Nearby Locations:</strong><br>
          ${paymentData.locations.map(loc => `${loc.name} - ${loc.address} (${loc.distance})`).join('<br>')}
        </div>
        
        <div class="footer">
          Questions? Call (702) 555-0123<br>
          www.propertyflowhq.com
        </div>
      </body>
      </html>
    `;
    
    return slipHtml;
  }
}
