/**
 * License Verification Service
 * 
 * Handles contractor license verification through state licensing board APIs.
 * Supports CA, TX, FL, NY with extensible architecture for additional states.
 * 
 * Requirements: 1.1, 1.5
 * - 1.1: Query state licensing database API to validate license
 * - 1.5: Re-verify licenses automatically every 30 days
 */

import { prisma } from '@/db/prisma';

// Types
export interface LicenseResult {
  isValid: boolean;
  expirationDate: Date | null;
  licenseType: string;
  holderName: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked' | 'not_found';
  verifiedAt: Date;
  rawResponse?: Record<string, unknown>;
}