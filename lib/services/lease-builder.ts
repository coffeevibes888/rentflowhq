/**
 * Comprehensive Lease Builder Service
 * Generates court-ready residential lease agreements with all required legal sections
 * Auto-populates from property, unit, landlord, and tenant data
 */

export interface LeaseBuilderData {
  // Parties
  landlordLegalName: string;
  landlordCompanyName?: string;
  landlordAddress?: string;
  landlordEmail?: string;
  landlordPhone?: string;
  tenantNames: string[]; // All adult tenants
  tenantEmails: string[];
  
  // Property
  propertyAddress: string;
  unitNumber?: string;
  propertyDescription?: string;
  includedAreas?: string[]; // garage, yard, storage, parking space #
  maxOccupants?: number;
  
  // Lease Term
  leaseStartDate: Date;
  leaseEndDate?: Date; // null = month-to-month
  isMonthToMonth: boolean;
  autoRenewal: boolean;
  renewalNoticeDays: number; // typically 30 or 60
  earlyTerminationFee?: number;
  earlyTerminationNoticeDays?: number;
  
  // Rent & Payment
  monthlyRent: number;
  rentDueDay: number; // 1-28
  gracePeriodDays: number; // typically 3-5
  acceptedPaymentMethods: string[];
  paymentInstructions?: string;
  bouncedCheckFee?: number;
  allowPartialPayments: boolean;

  // Late Fees
  lateFeeAmount?: number;
  lateFeePercent?: number; // alternative to flat amount
  lateFeeStartDay: number; // day after due date when late fee applies
  maxLateFee?: number; // cap per state law
  
  // Security Deposit
  securityDepositAmount: number;
  depositUseCases: string[]; // unpaid rent, damages, cleaning, etc.
  depositReturnDays: number; // typically 14-30 days per state
  depositNotLastMonthRent: boolean;
  
  // Utilities
  tenantPaysUtilities: string[];
  landlordPaysUtilities: string[];
  sharedUtilitiesNote?: string;
  
  // Pet Policy
  petsAllowed: boolean;
  petRestrictions?: string; // breed, size, type limits
  petDeposit?: number;
  petRent?: number;
  petRules?: string;
  
  // Property Rules
  smokingAllowed: boolean;
  smokingAreas?: string;
  quietHoursStart?: string; // "10:00 PM"
  quietHoursEnd?: string; // "8:00 AM"
  parkingRules?: string;
  guestPolicy?: string;
  
  // Maintenance
  tenantMaintenanceResponsibilities?: string[];
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
  
  // Entry & Access
  entryNoticeDays: number; // typically 24-48 hours
  entryReasons?: string[];
  
  // Insurance
  rentersInsuranceRequired: boolean;
  minInsuranceCoverage?: number;
  
  // Move-out
  moveOutNoticeDays: number; // typically 30 or 60
  moveOutCleaningRequirements?: string[];
  
  // Additional Terms
  additionalTerms?: string[];
  hoaRules?: string;
  
  // Disclosures
  leadPaintDisclosure?: boolean; // required for pre-1978 buildings
  bedBugDisclosure?: boolean;
  moldDisclosure?: boolean;
  radonDisclosure?: boolean;
  floodZoneDisclosure?: boolean;
  asbestosDisclosure?: boolean;
  
  // State-specific
  state: string; // for state-specific legal requirements
  
  // Signing date
  signingDate: Date;
}

// Audit trail for legal documentation
export interface LeaseAuditTrail {
  leaseId: string;
  createdAt: Date;
  createdBy: string; // landlord user ID
  propertyId: string;
  unitId: string;
  tenantId?: string;
  version: number;
  events: LeaseAuditEvent[];
}

export interface LeaseAuditEvent {
  timestamp: Date;
  eventType: 'created' | 'modified' | 'sent_for_signature' | 'viewed' | 'signed' | 'countersigned' | 'executed' | 'notice_sent';
  actor: string; // user ID or 'system'
  actorRole: 'landlord' | 'tenant' | 'system';
  actorName?: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  documentHash?: string; // SHA-256 hash of document at this point
}

// State-specific disclosure requirements
export const STATE_DISCLOSURES: Record<string, {
  leadPaint: boolean;
  mold: boolean;
  bedBugs: boolean;
  radon: boolean;
  asbestos: boolean;
  floodZone: boolean;
  sexOffender: boolean;
  smokingPolicy: boolean;
  securityDepositLimit?: number; // multiplier of monthly rent
  depositReturnDays: number;
  lateFeeLimit?: number; // percentage or flat
  notes?: string[];
}> = {
  // States with strict disclosure requirements
  CA: { leadPaint: true, mold: true, bedBugs: true, radon: false, asbestos: true, floodZone: true, sexOffender: true, smokingPolicy: true, securityDepositLimit: 2, depositReturnDays: 21, notes: ['Requires specific CA lease addendum', 'Rent control may apply in some cities'] },
  NY: { leadPaint: true, mold: true, bedBugs: true, radon: false, asbestos: true, floodZone: true, sexOffender: false, smokingPolicy: true, depositReturnDays: 14, notes: ['NYC has additional requirements', 'Rent stabilization may apply'] },
  TX: { leadPaint: true, mold: false, bedBugs: false, radon: false, asbestos: false, floodZone: true, sexOffender: false, smokingPolicy: false, depositReturnDays: 30 },
  FL: { leadPaint: true, mold: false, bedBugs: false, radon: true, asbestos: false, floodZone: true, sexOffender: false, smokingPolicy: false, depositReturnDays: 15, lateFeeLimit: 5 },
  NV: { leadPaint: true, mold: false, bedBugs: false, radon: false, asbestos: false, floodZone: false, sexOffender: false, smokingPolicy: false, depositReturnDays: 30, securityDepositLimit: 3 },
  AZ: { leadPaint: true, mold: false, bedBugs: true, radon: false, asbestos: false, floodZone: false, sexOffender: false, smokingPolicy: false, depositReturnDays: 14, securityDepositLimit: 1.5 },
  CO: { leadPaint: true, mold: false, bedBugs: false, radon: true, asbestos: false, floodZone: false, sexOffender: false, smokingPolicy: false, depositReturnDays: 30 },
  WA: { leadPaint: true, mold: true, bedBugs: false, radon: false, asbestos: false, floodZone: false, sexOffender: true, smokingPolicy: true, depositReturnDays: 21 },
  OR: { leadPaint: true, mold: true, bedBugs: false, radon: false, asbestos: false, floodZone: true, sexOffender: false, smokingPolicy: true, depositReturnDays: 31 },
  IL: { leadPaint: true, mold: false, bedBugs: true, radon: true, asbestos: false, floodZone: false, sexOffender: false, smokingPolicy: false, depositReturnDays: 30 },
  // Default for unlisted states
  DEFAULT: { leadPaint: true, mold: false, bedBugs: false, radon: false, asbestos: false, floodZone: false, sexOffender: false, smokingPolicy: false, depositReturnDays: 30 },
};

export function getStateDisclosures(state: string) {
  return STATE_DISCLOSURES[state.toUpperCase()] || STATE_DISCLOSURES.DEFAULT;
}

// Legal disclaimer that must appear on all generated leases
export const LEGAL_DISCLAIMER = `
IMPORTANT LEGAL NOTICE

This lease agreement was generated using PropertyFlow HQ's Lease Builder tool. By using this document, you acknowledge and agree to the following:

1. NOT LEGAL ADVICE: PropertyFlow HQ is a property management software platform, NOT a law firm. This document is provided as a tool to assist landlords and does not constitute legal advice.

2. NO ATTORNEY-CLIENT RELATIONSHIP: Use of this lease builder does not create an attorney-client relationship between you and PropertyFlow HQ or any of its affiliates.

3. LANDLORD RESPONSIBILITY: The landlord is solely responsible for ensuring this lease complies with all applicable federal, state, and local laws, including but not limited to fair housing laws, landlord-tenant regulations, and disclosure requirements.

4. REVIEW RECOMMENDED: We strongly recommend having this lease reviewed by a licensed attorney in your jurisdiction before use, especially for properties in states with complex landlord-tenant laws (such as California, New York, or New Jersey).

5. STATE-SPECIFIC REQUIREMENTS: While this lease builder attempts to include state-aware provisions, laws vary significantly by state and locality. Some jurisdictions may require additional disclosures, addenda, or specific language not included in this template.

6. NO WARRANTY: This document is provided "as is" without warranty of any kind. PropertyFlow HQ makes no guarantees regarding the enforceability of any provision in this lease.

7. UPDATES: Landlord-tenant laws change frequently. This template may not reflect the most recent legal requirements in your area.

By proceeding with this lease, you confirm that you have read, understood, and agree to these terms.
`;

// Default values for common fields
export const LEASE_DEFAULTS = {
  gracePeriodDays: 5,
  lateFeeStartDay: 6,
  depositReturnDays: 30,
  entryNoticeDays: 24,
  moveOutNoticeDays: 30,
  renewalNoticeDays: 30,
  acceptedPaymentMethods: ['Online Payment Portal', 'Check', 'Money Order'],
  tenantPaysUtilities: ['Electric', 'Gas', 'Internet', 'Cable'],
  landlordPaysUtilities: ['Water', 'Sewer', 'Trash'],
  depositUseCases: [
    'Unpaid rent or late fees',
    'Repair of damages beyond normal wear and tear',
    'Cleaning costs to restore premises to move-in condition',
    'Replacement of unreturned keys or access devices',
    'Any other amounts owed under this lease',
  ],
  tenantMaintenanceResponsibilities: [
    'Keep premises clean and sanitary',
    'Dispose of garbage properly',
    'Replace light bulbs and batteries',
    'Report maintenance issues promptly',
    'Prevent mold growth through proper ventilation',
  ],
  entryReasons: [
    'Repairs and maintenance',
    'Inspections',
    'Showing to prospective tenants or buyers',
    'Emergency situations',
  ],
  moveOutCleaningRequirements: [
    'All rooms swept and mopped/vacuumed',
    'Kitchen appliances cleaned inside and out',
    'Bathrooms cleaned and sanitized',
    'All personal belongings removed',
    'All trash removed from premises',
    'Walls free of holes and marks',
    'Windows cleaned',
  ],
};

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Get ordinal suffix for day of month
 */
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Generate the comprehensive lease HTML document
 */
export function generateLeaseHtml(data: LeaseBuilderData): string {
  const tenantList = data.tenantNames.join(', ');
  const leaseEndText = data.isMonthToMonth 
    ? 'Month-to-Month (continuing until terminated by either party with proper notice)'
    : formatDate(data.leaseEndDate!);
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Residential Lease Agreement</title>
  <style>
    @page { margin: 0.75in; size: letter; }
    body { 
      font-family: 'Times New Roman', Times, serif; 
      font-size: 11pt; 
      line-height: 1.6; 
      color: #000; 
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
    }
    h1 { 
      text-align: center; 
      font-size: 16pt; 
      margin-bottom: 24pt;
      text-transform: uppercase;
      font-weight: bold;
      border-bottom: 2px solid #000;
      padding-bottom: 12pt;
    }
    h2 { 
      font-size: 12pt; 
      margin-top: 18pt; 
      margin-bottom: 8pt;
      text-transform: uppercase;
      font-weight: bold;
      border-bottom: 1px solid #333;
      padding-bottom: 4pt;
    }
    h3 {
      font-size: 11pt;
      margin-top: 12pt;
      margin-bottom: 6pt;
      font-weight: bold;
    }
    .section { margin-bottom: 12pt; }
    .field { font-weight: bold; text-decoration: underline; }
    .checkbox { 
      display: inline-block; 
      width: 12px; 
      height: 12px; 
      border: 1px solid #000; 
      margin-right: 6px; 
      vertical-align: middle;
      text-align: center;
      line-height: 10px;
      font-size: 10px;
    }
    .checkbox.checked::after { content: '✓'; }
    .list { margin-left: 20pt; margin-top: 6pt; }
    .list li { margin-bottom: 4pt; }
    .signature-section { 
      margin-top: 36pt; 
      page-break-inside: avoid; 
    }
    .signature-block { 
      display: inline-block; 
      min-width: 250px; 
      border-bottom: 1px solid #000; 
      min-height: 40px;
      margin-bottom: 4pt;
    }
    .sig-row { 
      margin-top: 24pt; 
      display: flex; 
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 20px;
    }
    .sig-group { flex: 1; min-width: 280px; }
    .sig-label { font-weight: bold; margin-bottom: 4pt; }
    .date-line { 
      border-bottom: 1px solid #000; 
      width: 150px; 
      display: inline-block; 
    }
    .initials-line {
      border-bottom: 1px solid #000;
      width: 60px;
      display: inline-block;
      text-align: center;
    }
    .initials-row {
      margin-top: 8pt;
      font-size: 10pt;
      color: #333;
    }
    .page-break { page-break-before: always; }
    .legal-notice {
      background: #f5f5f5;
      border: 1px solid #ccc;
      padding: 12pt;
      margin: 12pt 0;
      font-size: 10pt;
    }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    td, th { border: 1px solid #000; padding: 6pt; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Residential Lease Agreement</h1>

  <div class="section">
    <p>THIS RESIDENTIAL LEASE AGREEMENT ("Agreement" or "Lease") is entered into on 
    <span class="field">${formatDate(data.signingDate)}</span>, by and between:</p>
  </div>

  <!-- SECTION 1: PARTIES & PROPERTY -->
  <h2>1. Parties & Property</h2>
  <div class="section">
    <p><strong>LANDLORD:</strong></p>
    <p>Name: <span class="field">${data.landlordLegalName}</span></p>
    ${data.landlordCompanyName ? `<p>Company: <span class="field">${data.landlordCompanyName}</span></p>` : ''}
    ${data.landlordAddress ? `<p>Address: <span class="field">${data.landlordAddress}</span></p>` : ''}
    ${data.landlordEmail ? `<p>Email: <span class="field">${data.landlordEmail}</span></p>` : ''}
    ${data.landlordPhone ? `<p>Phone: <span class="field">${data.landlordPhone}</span></p>` : ''}
    
    <p style="margin-top: 12pt;"><strong>TENANT(S):</strong></p>
    ${data.tenantNames.map((name, i) => `
      <p>Name: <span class="field">${name}</span>${data.tenantEmails[i] ? ` | Email: <span class="field">${data.tenantEmails[i]}</span>` : ''}</p>
    `).join('')}
    
    <p style="margin-top: 12pt;"><strong>PREMISES:</strong></p>
    <p>Address: <span class="field">${data.propertyAddress}</span></p>
    ${data.unitNumber ? `<p>Unit: <span class="field">${data.unitNumber}</span></p>` : ''}
    ${data.propertyDescription ? `<p>Description: ${data.propertyDescription}</p>` : ''}
    
    ${data.includedAreas && data.includedAreas.length > 0 ? `
    <p><strong>Included Areas:</strong> ${data.includedAreas.join(', ')}</p>
    ` : ''}
    
    <p style="margin-top: 8pt;"><strong>OCCUPANCY:</strong> Only the Tenant(s) named above and their minor children may reside at the Premises. 
    ${data.maxOccupants ? `Maximum occupancy: <span class="field">${data.maxOccupants}</span> persons.` : ''}
    Any additional occupants require prior written consent from Landlord.</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 2: LEASE TERM -->
  <h2>2. Lease Term</h2>
  <div class="section">
    <p><strong>Start Date:</strong> <span class="field">${formatDate(data.leaseStartDate)}</span></p>
    <p><strong>End Date:</strong> <span class="field">${leaseEndText}</span></p>
    
    ${data.isMonthToMonth ? `
    <p>This is a month-to-month tenancy. Either party may terminate this Agreement by providing 
    <span class="field">${data.moveOutNoticeDays}</span> days written notice prior to the end of any rental period.</p>
    ` : `
    <p><strong>Renewal:</strong> ${data.autoRenewal 
      ? `This Lease will automatically renew on a month-to-month basis unless either party provides 
         <span class="field">${data.renewalNoticeDays}</span> days written notice prior to the end date.`
      : `This Lease will NOT automatically renew. A new agreement must be signed for continued tenancy.`
    }</p>
    `}
    
    ${data.earlyTerminationFee ? `
    <p><strong>Early Termination:</strong> Tenant may terminate this Lease early by providing 
    <span class="field">${data.earlyTerminationNoticeDays || 60}</span> days written notice and paying an early termination fee of 
    <span class="field">${formatCurrency(data.earlyTerminationFee)}</span>. Tenant remains responsible for rent until the Premises 
    is re-rented or the notice period expires, whichever comes first.</p>
    ` : `
    <p><strong>Early Termination:</strong> Tenant may not terminate this Lease early without Landlord's written consent. 
    Tenant remains liable for all rent due through the end of the Lease term.</p>
    `}
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 3: RENT & PAYMENT -->
  <h2>3. Rent & Payment Terms</h2>
  <div class="section">
    <table>
      <tr>
        <th>Monthly Rent</th>
        <td><span class="field">${formatCurrency(data.monthlyRent)}</span></td>
      </tr>
      <tr>
        <th>Due Date</th>
        <td>The <span class="field">${getOrdinal(data.rentDueDay)}</span> day of each month</td>
      </tr>
      <tr>
        <th>Grace Period</th>
        <td><span class="field">${data.gracePeriodDays}</span> days (rent received by the ${getOrdinal(data.rentDueDay + data.gracePeriodDays)} is not considered late)</td>
      </tr>
      <tr>
        <th>Accepted Payment Methods</th>
        <td>${data.acceptedPaymentMethods.join(', ')}</td>
      </tr>
    </table>
    
    ${data.paymentInstructions ? `<p><strong>Payment Instructions:</strong> ${data.paymentInstructions}</p>` : ''}
    
    ${data.bouncedCheckFee ? `
    <p><strong>Returned Payment Fee:</strong> A fee of <span class="field">${formatCurrency(data.bouncedCheckFee)}</span> 
    will be charged for any returned or bounced payment.</p>
    ` : ''}
    
    <p><strong>Partial Payments:</strong> ${data.allowPartialPayments 
      ? 'Partial payments may be accepted at Landlord\'s discretion. Acceptance of partial payment does not waive Landlord\'s right to collect the remaining balance or pursue legal remedies.'
      : 'Partial payments will NOT be accepted. Full payment of all amounts due is required.'
    }</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 4: LATE FEES -->
  <h2>4. Late Fees & Nonpayment</h2>
  <div class="section">
    ${data.lateFeeAmount || data.lateFeePercent ? `
    <p><strong>Late Fee:</strong> If rent is not received by the end of the grace period, a late fee of 
    <span class="field">${data.lateFeeAmount ? formatCurrency(data.lateFeeAmount) : `${data.lateFeePercent}% of monthly rent`}</span> 
    will be assessed beginning on the <span class="field">${getOrdinal(data.lateFeeStartDay)}</span> day after the due date.</p>
    ${data.maxLateFee ? `<p>Maximum late fee per month: <span class="field">${formatCurrency(data.maxLateFee)}</span> (per applicable state law).</p>` : ''}
    ` : `
    <p><strong>Late Fee:</strong> No late fee will be charged, however Landlord reserves all legal remedies for nonpayment.</p>
    `}
    
    <p><strong>Nonpayment Process:</strong> If rent remains unpaid after the grace period, Landlord may:</p>
    <ul class="list">
      <li>Serve a Pay or Quit notice as required by ${data.state} law</li>
      <li>Report delinquency to credit bureaus</li>
      <li>Initiate eviction proceedings after proper notice period</li>
      <li>Pursue collection of all amounts owed including court costs and attorney fees where permitted by law</li>
    </ul>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 5: SECURITY DEPOSIT -->
  <h2>5. Security Deposit</h2>
  <div class="section">
    <p><strong>Deposit Amount:</strong> <span class="field">${formatCurrency(data.securityDepositAmount)}</span></p>
    
    <p><strong>Permitted Uses:</strong> The security deposit may be used by Landlord for:</p>
    <ul class="list">
      ${data.depositUseCases.map(use => `<li>${use}</li>`).join('')}
    </ul>
    
    <p><strong>Return of Deposit:</strong> Within <span class="field">${data.depositReturnDays}</span> days after Tenant 
    vacates the Premises and returns all keys, Landlord will return the deposit minus any lawful deductions, along with 
    an itemized statement of any deductions.</p>
    
    ${data.depositNotLastMonthRent ? `
    <div class="legal-notice">
      <strong>IMPORTANT:</strong> The security deposit is NOT to be used as last month's rent. Tenant must pay the 
      final month's rent in full. Any attempt to use the security deposit as rent is a violation of this Agreement.
    </div>
    ` : ''}
    
    <p><strong>Inspection:</strong> Tenant has the right to request a move-out inspection to identify any issues that 
    may result in deductions from the security deposit.</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 6: UTILITIES -->
  <h2>6. Utilities & Services</h2>
  <div class="section">
    <table>
      <tr>
        <th>Tenant Pays</th>
        <th>Landlord Pays</th>
      </tr>
      <tr>
        <td>${data.tenantPaysUtilities.length > 0 ? data.tenantPaysUtilities.join(', ') : 'None'}</td>
        <td>${data.landlordPaysUtilities.length > 0 ? data.landlordPaysUtilities.join(', ') : 'None'}</td>
      </tr>
    </table>
    
    ${data.sharedUtilitiesNote ? `<p><strong>Shared Utilities:</strong> ${data.sharedUtilitiesNote}</p>` : ''}
    
    <p>Tenant is responsible for setting up utility accounts in Tenant's name prior to move-in for all Tenant-paid utilities. 
    Tenant must maintain these accounts throughout the tenancy and ensure final bills are paid upon move-out.</p>
    
    <p>Landlord is not responsible for any interruption of utility services due to circumstances beyond Landlord's control.</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 7: USE OF PROPERTY -->
  <h2>7. Use of the Property</h2>
  <div class="section">
    <p>The Premises shall be used <strong>exclusively for residential purposes</strong>. Tenant shall not:</p>
    <ul class="list">
      <li>Conduct any business or commercial activity on the Premises without prior written consent</li>
      <li>Use the Premises for any illegal purpose or activity</li>
      <li>Create a nuisance or disturb the peace and quiet of neighbors</li>
      <li>Exceed the maximum occupancy limits</li>
      <li>Allow any person not named on this Lease to reside at the Premises for more than 14 consecutive days without written consent</li>
    </ul>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 8: PROHIBITED ACTIVITIES -->
  <h2>8. Prohibited Activities</h2>
  <div class="section">
    <p>The following activities are strictly prohibited on the Premises:</p>
    <ul class="list">
      <li>Possession, use, manufacture, or distribution of illegal drugs or controlled substances</li>
      <li>Any illegal activity of any kind</li>
      <li>Possession of firearms or weapons in violation of applicable laws</li>
      <li>Storage of hazardous, flammable, or explosive materials</li>
      <li>Open flames, fireworks, or fire hazards (except normal cooking)</li>
      <li>Harassment, threats, or intimidation of neighbors or other tenants</li>
      <li>Excessive noise or disturbances</li>
      <li>Vandalism or destruction of property</li>
    </ul>
    
    <p><strong>Smoking/Vaping:</strong> 
    ${data.smokingAllowed 
      ? `Smoking and vaping are permitted only in the following designated areas: <span class="field">${data.smokingAreas || 'outdoor areas only'}</span>. Smoking inside the unit is prohibited.`
      : 'Smoking and vaping are <strong>strictly prohibited</strong> anywhere on the Premises, including inside the unit, on balconies, patios, and common areas.'
    }</p>
    
    <p>Violation of any prohibited activity may result in immediate termination of this Lease and eviction.</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 9: MAINTENANCE & REPAIRS -->
  <h2>9. Maintenance & Repairs</h2>
  <div class="section">
    <h3>Tenant Responsibilities:</h3>
    <ul class="list">
      ${(data.tenantMaintenanceResponsibilities || LEASE_DEFAULTS.tenantMaintenanceResponsibilities).map(r => `<li>${r}</li>`).join('')}
    </ul>
    
    <h3>Landlord Responsibilities:</h3>
    <ul class="list">
      <li>Maintain the Premises in a habitable condition</li>
      <li>Make necessary repairs to structural elements, plumbing, heating, and electrical systems</li>
      <li>Comply with all applicable building and housing codes</li>
      <li>Maintain common areas in a safe and clean condition</li>
    </ul>
    
    <h3>Repair Requests:</h3>
    <p>Tenant must report all maintenance issues promptly through the designated maintenance request system or by contacting:</p>
    ${data.emergencyContactPhone ? `<p>Phone: <span class="field">${data.emergencyContactPhone}</span></p>` : ''}
    ${data.emergencyContactEmail ? `<p>Email: <span class="field">${data.emergencyContactEmail}</span></p>` : ''}
    
    <p><strong>Emergency Repairs:</strong> In case of emergency (fire, flood, gas leak, no heat in winter, etc.), 
    Tenant should call emergency services (911) first, then contact Landlord immediately.</p>
    
    <p><strong>Tenant-Caused Damage:</strong> Tenant is responsible for the cost of repairs for any damage caused by 
    Tenant, Tenant's guests, or Tenant's negligence, beyond normal wear and tear.</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 10: ALTERATIONS -->
  <h2>10. Alterations & Improvements</h2>
  <div class="section">
    <p>Tenant shall not make any alterations, additions, or improvements to the Premises without prior written consent 
    from Landlord. This includes but is not limited to:</p>
    <ul class="list">
      <li>Painting walls or ceilings</li>
      <li>Installing shelving, hooks, or wall-mounted items</li>
      <li>Changing locks or adding security devices</li>
      <li>Installing satellite dishes or antennas</li>
      <li>Making any structural changes</li>
      <li>Installing or removing appliances</li>
    </ul>
    
    <p>Any approved alterations become the property of Landlord upon installation unless otherwise agreed in writing. 
    Landlord may require Tenant to restore the Premises to its original condition at move-out.</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 11: ENTRY & ACCESS -->
  <h2>11. Entry & Access</h2>
  <div class="section">
    <p><strong>Notice Required:</strong> Landlord will provide at least <span class="field">${data.entryNoticeDays}</span> hours 
    advance notice before entering the Premises, except in cases of emergency.</p>
    
    <p><strong>Reasons for Entry:</strong></p>
    <ul class="list">
      ${(data.entryReasons || LEASE_DEFAULTS.entryReasons).map(r => `<li>${r}</li>`).join('')}
    </ul>
    
    <p><strong>Emergency Entry:</strong> Landlord may enter without notice in case of emergency, including but not limited to 
    fire, flood, gas leak, or when Landlord reasonably believes entry is necessary to prevent damage to the Premises or 
    protect the health and safety of occupants.</p>
    
    <p>Tenant agrees to provide reasonable access during normal business hours for scheduled entries.</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 12: PETS -->
  <h2>12. Pet Policy</h2>
  <div class="section">
    ${data.petsAllowed ? `
    <p><span class="checkbox checked"></span> Pets ARE allowed at the Premises, subject to the following terms:</p>
    
    ${data.petRestrictions ? `<p><strong>Restrictions:</strong> ${data.petRestrictions}</p>` : ''}
    
    <table>
      ${data.petDeposit ? `<tr><th>Pet Deposit</th><td>${formatCurrency(data.petDeposit)} (refundable)</td></tr>` : ''}
      ${data.petRent ? `<tr><th>Monthly Pet Rent</th><td>${formatCurrency(data.petRent)} per pet</td></tr>` : ''}
    </table>
    
    <p><strong>Pet Rules:</strong></p>
    <ul class="list">
      <li>Tenant is responsible for all damage caused by pets</li>
      <li>Pets must be properly licensed and vaccinated as required by law</li>
      <li>Pets must be kept under control at all times</li>
      <li>Tenant must clean up after pets immediately</li>
      <li>Pets may not create a nuisance through excessive noise or aggressive behavior</li>
      ${data.petRules ? `<li>${data.petRules}</li>` : ''}
    </ul>
    
    <p>Landlord reserves the right to require removal of any pet that causes damage, creates a nuisance, or violates these rules.</p>
    ` : `
    <p><span class="checkbox"></span> Pets are <strong>NOT allowed</strong> at the Premises.</p>
    <p>This includes but is not limited to dogs, cats, birds, reptiles, rodents, and fish tanks over 10 gallons. 
    Service animals and emotional support animals with proper documentation are exempt from this policy.</p>
    `}
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 13: NOISE & BEHAVIOR -->
  <h2>13. Noise & Behavior</h2>
  <div class="section">
    ${data.quietHoursStart && data.quietHoursEnd ? `
    <p><strong>Quiet Hours:</strong> <span class="field">${data.quietHoursStart}</span> to <span class="field">${data.quietHoursEnd}</span></p>
    <p>During quiet hours, Tenant must keep noise to a minimum and avoid activities that may disturb neighbors.</p>
    ` : ''}
    
    <p>At all times, Tenant shall:</p>
    <ul class="list">
      <li>Conduct themselves in a manner that does not disturb the peace and quiet of neighbors</li>
      <li>Not engage in loud parties, music, or gatherings that create excessive noise</li>
      <li>Ensure guests comply with all noise and behavior rules</li>
      <li>Not engage in harassment, threats, or intimidating behavior toward neighbors or other tenants</li>
      <li>Comply with all local noise ordinances</li>
    </ul>
    
    <p>Repeated noise complaints may result in lease termination.</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 14: SAFETY & HEALTH -->
  <h2>14. Safety & Health Rules</h2>
  <div class="section">
    <p>Tenant agrees to:</p>
    <ul class="list">
      <li>Not tamper with, disable, or remove smoke detectors, carbon monoxide detectors, or fire extinguishers</li>
      <li>Replace batteries in smoke and CO detectors as needed and notify Landlord of any malfunctions</li>
      <li>Keep all exits and pathways clear of obstructions</li>
      <li>Properly dispose of all garbage and recyclables</li>
      <li>Not store hazardous materials on the Premises</li>
      <li>Maintain proper ventilation to prevent mold growth</li>
      <li>Comply with all health and fire codes</li>
      <li>Report any safety hazards to Landlord immediately</li>
    </ul>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 15: INSURANCE -->
  <h2>15. Insurance</h2>
  <div class="section">
    ${data.rentersInsuranceRequired ? `
    <p><strong>Renter's Insurance REQUIRED:</strong> Tenant must obtain and maintain renter's insurance throughout the 
    term of this Lease with minimum coverage of <span class="field">${data.minInsuranceCoverage ? formatCurrency(data.minInsuranceCoverage) : '$100,000'}</span> 
    in liability coverage.</p>
    
    <p>Tenant must provide proof of insurance to Landlord:</p>
    <ul class="list">
      <li>Prior to move-in</li>
      <li>Upon each policy renewal</li>
      <li>Upon Landlord's request</li>
    </ul>
    
    <p>Failure to maintain required insurance is a violation of this Lease.</p>
    ` : `
    <p><strong>Renter's Insurance Recommended:</strong> While not required, Landlord strongly recommends that Tenant 
    obtain renter's insurance to protect personal belongings and provide liability coverage.</p>
    `}
    
    <div class="legal-notice">
      <strong>NOTICE:</strong> Landlord's insurance does NOT cover Tenant's personal property or liability. 
      Landlord is not responsible for loss or damage to Tenant's belongings due to theft, fire, water damage, 
      or any other cause.
    </div>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 16: SUBLETTING -->
  <h2>16. Subletting & Assignment</h2>
  <div class="section">
    <p>Tenant shall NOT sublet the Premises or assign this Lease without prior written consent from Landlord.</p>
    
    <p>This includes:</p>
    <ul class="list">
      <li>Renting out rooms to non-approved occupants</li>
      <li>Listing the Premises on short-term rental platforms (Airbnb, VRBO, etc.)</li>
      <li>Allowing anyone not named on this Lease to reside at the Premises</li>
      <li>Transferring this Lease to another party</li>
    </ul>
    
    <p>If Landlord consents to a sublet or assignment, the original Tenant remains fully responsible for all 
    obligations under this Lease.</p>
    
    <p>Unauthorized subletting is grounds for immediate lease termination.</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 17: DEFAULT & VIOLATIONS -->
  <h2>17. Default & Violations</h2>
  <div class="section">
    <p><strong>Lease Violations:</strong> The following constitute violations of this Lease:</p>
    <ul class="list">
      <li>Failure to pay rent or other charges when due</li>
      <li>Violation of any term or condition of this Lease</li>
      <li>Damage to the Premises beyond normal wear and tear</li>
      <li>Illegal activity on the Premises</li>
      <li>Disturbance of neighbors or other tenants</li>
      <li>Unauthorized occupants or pets</li>
      <li>Failure to maintain required insurance (if applicable)</li>
    </ul>
    
    <p><strong>Notice and Cure:</strong> For curable violations, Landlord will provide written notice specifying the 
    violation and a reasonable time to cure (as required by ${data.state} law). If the violation is not cured within 
    the specified time, Landlord may proceed with termination and eviction.</p>
    
    <p><strong>Repeated Violations:</strong> Repeated violations of the same or similar nature may result in lease 
    termination without opportunity to cure.</p>
    
    <p><strong>Immediate Termination:</strong> Certain violations (illegal activity, violence, serious property damage) 
    may result in immediate termination without opportunity to cure, as permitted by law.</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 18: MOVE-OUT -->
  <h2>18. Move-Out Terms</h2>
  <div class="section">
    <p><strong>Notice Required:</strong> Tenant must provide <span class="field">${data.moveOutNoticeDays}</span> days 
    written notice before vacating the Premises.</p>
    
    <p><strong>Move-Out Condition:</strong> Upon vacating, Tenant must:</p>
    <ul class="list">
      ${(data.moveOutCleaningRequirements || LEASE_DEFAULTS.moveOutCleaningRequirements).map(r => `<li>${r}</li>`).join('')}
      <li>Return all keys, access cards, and remote controls</li>
      <li>Provide forwarding address for security deposit return</li>
    </ul>
    
    <p><strong>Final Walkthrough:</strong> Tenant may request a final walkthrough inspection with Landlord to identify 
    any issues that may result in deductions from the security deposit.</p>
    
    <p><strong>Holdover:</strong> If Tenant remains in possession after the Lease term without Landlord's consent, 
    Tenant shall pay holdover rent at 150% of the monthly rent rate, and Landlord may pursue eviction.</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- SECTION 19: LEGAL CLAUSES -->
  <h2>19. Legal & Administrative Clauses</h2>
  <div class="section">
    <p><strong>Governing Law:</strong> This Agreement shall be governed by and construed in accordance with the laws 
    of the State of <span class="field">${data.state}</span>.</p>
    
    <p><strong>Severability:</strong> If any provision of this Lease is found to be invalid or unenforceable, the 
    remaining provisions shall continue in full force and effect.</p>
    
    <p><strong>Waiver:</strong> Landlord's failure to enforce any provision of this Lease shall not constitute a 
    waiver of Landlord's right to enforce that provision in the future.</p>
    
    <p><strong>Entire Agreement:</strong> This Lease, together with any addenda and attachments, constitutes the 
    entire agreement between the parties. No oral agreements or representations shall be binding.</p>
    
    <p><strong>Amendments:</strong> This Lease may only be modified by a written amendment signed by both parties.</p>
    
    <p><strong>Notices:</strong> All notices required under this Lease shall be in writing and delivered by:</p>
    <ul class="list">
      <li>Personal delivery</li>
      <li>Certified mail, return receipt requested</li>
      <li>Email to the addresses provided in this Lease</li>
    </ul>
    
    <p><strong>Joint and Several Liability:</strong> If there is more than one Tenant, all Tenants are jointly and 
    severally liable for all obligations under this Lease.</p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- ADDITIONAL TERMS -->
  ${data.parkingRules || data.guestPolicy || data.hoaRules || (data.additionalTerms && data.additionalTerms.length > 0) ? `
  <h2>20. Additional Terms</h2>
  <div class="section">
    ${data.parkingRules ? `<p><strong>Parking:</strong> ${data.parkingRules}</p>` : ''}
    ${data.guestPolicy ? `<p><strong>Guest Policy:</strong> ${data.guestPolicy}</p>` : ''}
    ${data.hoaRules ? `<p><strong>HOA Rules:</strong> ${data.hoaRules}</p>` : ''}
    ${data.additionalTerms && data.additionalTerms.length > 0 ? `
    <p><strong>Additional Terms:</strong></p>
    <ul class="list">
      ${data.additionalTerms.map(term => `<li>${term}</li>`).join('')}
    </ul>
    ` : ''}
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>
  ` : ''}

  <!-- DISCLOSURES -->
  ${data.leadPaintDisclosure || data.bedBugDisclosure || data.moldDisclosure ? `
  <div class="page-break"></div>
  <h2>Required Disclosures</h2>
  <div class="section">
    ${data.leadPaintDisclosure ? `
    <div class="legal-notice">
      <strong>LEAD-BASED PAINT DISCLOSURE (Pre-1978 Housing)</strong><br/>
      Housing built before 1978 may contain lead-based paint. Lead from paint, paint chips, and dust can pose 
      health hazards if not managed properly. Lead exposure is especially harmful to young children and pregnant women.
      <br/><br/>
      Landlord has provided Tenant with the EPA pamphlet "Protect Your Family From Lead in Your Home" and has 
      disclosed any known lead-based paint hazards.
      <br/><br/>
      <span class="checkbox${data.leadPaintDisclosure ? ' checked' : ''}"></span> Landlord has no knowledge of lead-based paint hazards
      <br/>
      <span class="checkbox"></span> Landlord has knowledge of the following lead-based paint hazards: _______________
    </div>
    ` : ''}
    
    ${data.bedBugDisclosure ? `
    <div class="legal-notice">
      <strong>BED BUG DISCLOSURE</strong><br/>
      Landlord has no knowledge of any bed bug infestation at the Premises within the past year. Tenant agrees to 
      report any signs of bed bugs immediately and to cooperate with any treatment procedures.
    </div>
    ` : ''}
    
    ${data.moldDisclosure ? `
    <div class="legal-notice">
      <strong>MOLD DISCLOSURE</strong><br/>
      Landlord has no knowledge of mold at the Premises. Tenant agrees to maintain proper ventilation, report any 
      water leaks or moisture problems immediately, and take reasonable steps to prevent mold growth.
    </div>
    ` : ''}
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>
  ` : ''}

  <!-- SIGNATURE PAGE -->
  <div class="page-break"></div>
  <h2>Signatures</h2>
  <div class="signature-section">
    <p>By signing below, the parties acknowledge that they have read, understand, and agree to all terms and 
    conditions of this Residential Lease Agreement.</p>
    
    <div class="sig-row">
      <div class="sig-group">
        <p class="sig-label">LANDLORD:</p>
        <p>${data.landlordLegalName}</p>
        <div class="signature-block"></div>
        <p>Signature</p>
        <p style="margin-top: 12pt;">Date: <span class="date-line"></span></p>
      </div>
    </div>
    
    ${data.tenantNames.map((name, index) => `
    <div class="sig-row">
      <div class="sig-group">
        <p class="sig-label">TENANT ${data.tenantNames.length > 1 ? index + 1 : ''}:</p>
        <p>${name}</p>
        <div class="signature-block"></div>
        <p>Signature</p>
        <p style="margin-top: 12pt;">Date: <span class="date-line"></span></p>
      </div>
    </div>
    `).join('')}
  </div>

  <!-- STATE-SPECIFIC REQUIRED DISCLOSURES -->
  ${generateStateDisclosures(data.state, data)}

  <!-- LANDLORD CONTACT INFORMATION -->
  <div class="page-break"></div>
  <h2>Landlord Contact Information</h2>
  <div class="section">
    <p>For all matters related to this lease, including maintenance requests, rent payments, and notices, contact:</p>
    <table>
      <tr><th>Landlord/Property Manager</th><td>${data.landlordLegalName}${data.landlordCompanyName ? ` (${data.landlordCompanyName})` : ''}</td></tr>
      ${data.landlordAddress ? `<tr><th>Address</th><td>${data.landlordAddress}</td></tr>` : ''}
      ${data.landlordPhone ? `<tr><th>Phone</th><td>${data.landlordPhone}</td></tr>` : ''}
      ${data.landlordEmail ? `<tr><th>Email</th><td>${data.landlordEmail}</td></tr>` : ''}
      ${data.emergencyContactPhone ? `<tr><th>Emergency Contact</th><td>${data.emergencyContactPhone}</td></tr>` : ''}
    </table>
  </div>

  <!-- TENANT RIGHTS NOTICE -->
  <h2>Tenant Rights Notice</h2>
  <div class="section">
    <div class="legal-notice">
      <strong>KNOW YOUR RIGHTS AS A TENANT</strong><br/><br/>
      As a tenant in ${data.state}, you have certain rights protected by law, including but not limited to:
      <ul style="margin-top: 8pt;">
        <li>The right to a habitable dwelling</li>
        <li>The right to privacy and proper notice before landlord entry</li>
        <li>The right to have your security deposit returned (minus lawful deductions) within the time required by law</li>
        <li>The right to be free from discrimination based on race, color, religion, sex, national origin, familial status, or disability</li>
        <li>The right to proper notice before eviction proceedings</li>
        <li>The right to request repairs for conditions affecting health and safety</li>
      </ul>
      <p style="margin-top: 8pt;">For more information about tenant rights in ${data.state}, contact your local housing authority or tenant rights organization.</p>
    </div>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- LEGAL DISCLAIMER -->
  <div class="page-break"></div>
  <h2>Legal Notice & Disclaimer</h2>
  <div class="section">
    <div class="legal-notice" style="font-size: 9pt;">
      <strong>IMPORTANT LEGAL NOTICE</strong><br/><br/>
      
      This lease agreement was generated using PropertyFlow HQ's Lease Builder tool. By using this document, all parties acknowledge and agree to the following:<br/><br/>
      
      <strong>1. NOT LEGAL ADVICE:</strong> PropertyFlow HQ is a property management software platform, NOT a law firm. This document is provided as a tool to assist landlords and does not constitute legal advice.<br/><br/>
      
      <strong>2. NO ATTORNEY-CLIENT RELATIONSHIP:</strong> Use of this lease builder does not create an attorney-client relationship between any party and PropertyFlow HQ or any of its affiliates.<br/><br/>
      
      <strong>3. LANDLORD RESPONSIBILITY:</strong> The landlord is solely responsible for ensuring this lease complies with all applicable federal, state, and local laws, including but not limited to fair housing laws, landlord-tenant regulations, and disclosure requirements.<br/><br/>
      
      <strong>4. REVIEW RECOMMENDED:</strong> We strongly recommend having this lease reviewed by a licensed attorney in your jurisdiction before use.<br/><br/>
      
      <strong>5. STATE-SPECIFIC REQUIREMENTS:</strong> While this lease builder includes state-aware provisions for ${data.state}, laws vary significantly by locality. Additional disclosures or specific language may be required in your area.<br/><br/>
      
      <strong>6. NO WARRANTY:</strong> This document is provided "as is" without warranty of any kind. PropertyFlow HQ makes no guarantees regarding the enforceability of any provision in this lease.
    </div>
    
    <p style="margin-top: 12pt;"><strong>By signing this lease, all parties confirm they have read and understood this legal notice.</strong></p>
    
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
  </div>

  <!-- DOCUMENT FOOTER -->
  <div style="margin-top: 48pt; text-align: center; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 12pt;">
    <p><strong>PropertyFlow HQ - State-Aware Lease Builder</strong></p>
    <p>Designed to align with landlord-tenant law • Used by landlords nationwide</p>
    <p>Document ID: ${Date.now().toString(36).toUpperCase()} | Generated: ${formatDate(new Date())} | State: ${data.state}</p>
    <p style="margin-top: 8pt; font-size: 8pt;">This is not a guarantee of legal validity. Consult with a licensed attorney for legal advice.</p>
  </div>

</body>
</html>`;
}

/**
 * Generate state-specific disclosure sections
 */
function generateStateDisclosures(state: string, data: LeaseBuilderData): string {
  const disclosures = getStateDisclosures(state);
  const sections: string[] = [];
  
  sections.push('<div class="page-break"></div>');
  sections.push('<h2>Required Disclosures for ' + state + '</h2>');
  sections.push('<div class="section">');
  sections.push('<p>The following disclosures are required by ' + state + ' law:</p>');
  
  // Lead-based paint (federal requirement for pre-1978)
  if (disclosures.leadPaint || data.leadPaintDisclosure) {
    sections.push(`
    <div class="legal-notice">
      <strong>LEAD-BASED PAINT DISCLOSURE (Required for Pre-1978 Housing)</strong><br/><br/>
      Housing built before 1978 may contain lead-based paint. Lead from paint, paint chips, and dust can pose 
      health hazards if not managed properly. Lead exposure is especially harmful to young children and pregnant women.
      <br/><br/>
      <strong>Landlord's Disclosure:</strong><br/>
      <span class="checkbox"></span> Landlord has no knowledge of lead-based paint and/or lead-based paint hazards in the housing.<br/>
      <span class="checkbox"></span> Landlord has knowledge of lead-based paint and/or lead-based paint hazards: _______________________
      <br/><br/>
      <strong>Records and Reports:</strong><br/>
      <span class="checkbox"></span> Landlord has no reports or records pertaining to lead-based paint.<br/>
      <span class="checkbox"></span> Landlord has provided the following records: _______________________
      <br/><br/>
      <strong>Tenant Acknowledgment:</strong><br/>
      <span class="checkbox"></span> Tenant has received the EPA pamphlet "Protect Your Family From Lead in Your Home."<br/>
      <span class="checkbox"></span> Tenant has received all available records and reports.
    </div>
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
    `);
  }
  
  // Mold disclosure
  if (disclosures.mold || data.moldDisclosure) {
    sections.push(`
    <div class="legal-notice" style="margin-top: 16pt;">
      <strong>MOLD DISCLOSURE</strong><br/><br/>
      Landlord discloses the following regarding mold at the premises:<br/>
      <span class="checkbox"></span> Landlord has no knowledge of mold or mold-producing conditions at the premises.<br/>
      <span class="checkbox"></span> Landlord has knowledge of the following mold conditions: _______________________
      <br/><br/>
      <strong>Tenant Responsibilities:</strong> Tenant agrees to maintain proper ventilation, promptly report any water leaks 
      or moisture problems, and take reasonable steps to prevent mold growth. Tenant will immediately notify Landlord of any 
      visible mold or musty odors.
    </div>
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
    `);
  }
  
  // Bed bug disclosure
  if (disclosures.bedBugs || data.bedBugDisclosure) {
    sections.push(`
    <div class="legal-notice" style="margin-top: 16pt;">
      <strong>BED BUG DISCLOSURE</strong><br/><br/>
      <span class="checkbox"></span> Landlord has no knowledge of any bed bug infestation at the premises within the past year.<br/>
      <span class="checkbox"></span> The premises has had a bed bug infestation within the past year. Details: _______________________
      <br/><br/>
      <strong>Tenant Responsibilities:</strong> Tenant agrees to report any signs of bed bugs immediately and to cooperate 
      fully with any inspection and treatment procedures. Tenant will not introduce used furniture or mattresses without 
      proper inspection.
    </div>
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
    `);
  }
  
  // Radon disclosure
  if (disclosures.radon || data.radonDisclosure) {
    sections.push(`
    <div class="legal-notice" style="margin-top: 16pt;">
      <strong>RADON DISCLOSURE</strong><br/><br/>
      Radon is a naturally occurring radioactive gas that can accumulate in buildings and may cause health problems. 
      The EPA recommends testing for radon and taking action if levels exceed 4 pCi/L.<br/><br/>
      <span class="checkbox"></span> Landlord has no knowledge of radon levels at the premises.<br/>
      <span class="checkbox"></span> Radon testing has been conducted. Results: _______________________
    </div>
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
    `);
  }
  
  // Flood zone disclosure
  if (disclosures.floodZone || data.floodZoneDisclosure) {
    sections.push(`
    <div class="legal-notice" style="margin-top: 16pt;">
      <strong>FLOOD ZONE DISCLOSURE</strong><br/><br/>
      <span class="checkbox"></span> The premises is NOT located in a designated flood zone.<br/>
      <span class="checkbox"></span> The premises IS located in a designated flood zone. Tenant is advised to obtain flood insurance.
    </div>
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
      <strong style="margin-left: 20pt;">Landlord Initials:</strong> <span class="initials-line"></span>
    </div>
    `);
  }
  
  // Sex offender registry notice
  if (disclosures.sexOffender) {
    sections.push(`
    <div class="legal-notice" style="margin-top: 16pt;">
      <strong>SEX OFFENDER REGISTRY NOTICE</strong><br/><br/>
      Pursuant to ${state} law, information about registered sex offenders may be obtained from local law enforcement 
      or by visiting the state's sex offender registry website. Landlord makes no representations regarding the presence 
      of registered sex offenders in the area.
    </div>
    <div class="initials-row">
      <strong>Tenant Initials:</strong> <span class="initials-line"></span>
    </div>
    `);
  }
  
  // State-specific notes
  if (disclosures.notes && disclosures.notes.length > 0) {
    const notesList = disclosures.notes.map(note => '<li>' + note + '</li>').join('');
    sections.push(`
    <div class="legal-notice" style="margin-top: 16pt;">
      <strong>ADDITIONAL ${state} REQUIREMENTS</strong><br/><br/>
      <ul>
        ${notesList}
      </ul>
    </div>
    `);
  }
  
  sections.push('</div>');
  
  return sections.join('\n');
}


/**
 * Build lease data from property, unit, landlord, and tenant records
 */
export function buildLeaseDataFromRecords(params: {
  landlord: {
    name: string;
    companyName?: string | null;
    companyAddress?: string | null;
    companyEmail?: string | null;
    companyPhone?: string | null;
    securityDepositMonths: number;
    petDepositEnabled?: boolean;
    petDepositAmount?: number | null;
    petRentEnabled?: boolean;
    petRentAmount?: number | null;
    cleaningFeeEnabled?: boolean;
    cleaningFeeAmount?: number | null;
  };
  property: {
    name: string;
    address: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    amenities?: string[];
  };
  unit: {
    name: string;
    type: string;
    rentAmount: number;
  };
  tenant: {
    name: string;
    email: string;
  };
  leaseTerms: {
    startDate: Date;
    endDate?: Date | null;
    isMonthToMonth?: boolean;
    billingDayOfMonth: number;
  };
  customizations?: Partial<LeaseBuilderData>;
}): LeaseBuilderData {
  const { landlord, property, unit, tenant, leaseTerms, customizations = {} } = params;
  
  const propertyAddress = [
    property.address.street,
    property.address.city,
    property.address.state,
    property.address.zipCode,
  ].filter(Boolean).join(', ');

  const securityDeposit = unit.rentAmount * landlord.securityDepositMonths;
  
  return {
    // Parties
    landlordLegalName: landlord.name,
    landlordCompanyName: landlord.companyName || undefined,
    landlordAddress: landlord.companyAddress || undefined,
    landlordEmail: landlord.companyEmail || undefined,
    landlordPhone: landlord.companyPhone || undefined,
    tenantNames: [tenant.name],
    tenantEmails: [tenant.email],
    
    // Property
    propertyAddress,
    unitNumber: unit.name,
    propertyDescription: `${unit.type} unit`,
    includedAreas: property.amenities?.filter(a => 
      ['garage', 'parking', 'storage', 'yard', 'patio', 'balcony'].some(k => a.toLowerCase().includes(k))
    ),
    
    // Lease Term
    leaseStartDate: leaseTerms.startDate,
    leaseEndDate: leaseTerms.endDate || undefined,
    isMonthToMonth: leaseTerms.isMonthToMonth || !leaseTerms.endDate,
    autoRenewal: true,
    renewalNoticeDays: LEASE_DEFAULTS.renewalNoticeDays,
    
    // Rent & Payment
    monthlyRent: unit.rentAmount,
    rentDueDay: leaseTerms.billingDayOfMonth,
    gracePeriodDays: LEASE_DEFAULTS.gracePeriodDays,
    acceptedPaymentMethods: LEASE_DEFAULTS.acceptedPaymentMethods,
    allowPartialPayments: false,
    
    // Late Fees
    lateFeePercent: 5,
    lateFeeStartDay: LEASE_DEFAULTS.lateFeeStartDay,
    
    // Security Deposit
    securityDepositAmount: securityDeposit,
    depositUseCases: LEASE_DEFAULTS.depositUseCases,
    depositReturnDays: LEASE_DEFAULTS.depositReturnDays,
    depositNotLastMonthRent: true,
    
    // Utilities
    tenantPaysUtilities: LEASE_DEFAULTS.tenantPaysUtilities,
    landlordPaysUtilities: LEASE_DEFAULTS.landlordPaysUtilities,
    
    // Pet Policy
    petsAllowed: landlord.petDepositEnabled || landlord.petRentEnabled || false,
    petDeposit: landlord.petDepositEnabled ? (landlord.petDepositAmount || 0) : undefined,
    petRent: landlord.petRentEnabled ? (landlord.petRentAmount || 0) : undefined,
    
    // Property Rules
    smokingAllowed: false,
    
    // Entry & Access
    entryNoticeDays: LEASE_DEFAULTS.entryNoticeDays,
    entryReasons: LEASE_DEFAULTS.entryReasons,
    
    // Insurance
    rentersInsuranceRequired: false,
    
    // Move-out
    moveOutNoticeDays: LEASE_DEFAULTS.moveOutNoticeDays,
    moveOutCleaningRequirements: LEASE_DEFAULTS.moveOutCleaningRequirements,
    
    // State
    state: property.address.state || 'NV',
    
    // Signing date
    signingDate: new Date(),
    
    // Apply any customizations
    ...customizations,
  };
}
