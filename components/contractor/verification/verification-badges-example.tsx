/**
 * Example usage of VerificationBadges component
 * 
 * This file demonstrates how to use the VerificationBadges component
 * in different contexts (profile, search results, cards)
 */

'use client';

import { VerificationBadges } from './verification-badges';

// Example 1: In a contractor profile page
export function ContractorProfileExample() {
  const contractor = {
    licenseVerifiedAt: new Date('2024-01-15'),
    licenseExpiresAt: new Date('2025-12-31'),
    insuranceCertificateUrl: 'https://example.com/cert.pdf',
    insuranceProvider: 'State Farm',
    backgroundCheckDate: new Date('2024-01-10'),
    backgroundCheckExpires: new Date('2025-01-10'),
    identityVerifiedAt: new Date('2024-01-05'),
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">John's Plumbing Services</h2>
      <VerificationBadges
        licenseVerifiedAt={contractor.licenseVerifiedAt}
        licenseExpiresAt={contractor.licenseExpiresAt}
        insuranceCertificateUrl={contractor.insuranceCertificateUrl}
        insuranceProvider={contractor.insuranceProvider}
        backgroundCheckDate={contractor.backgroundCheckDate}
        backgroundCheckExpires={contractor.backgroundCheckExpires}
        identityVerifiedAt={contractor.identityVerifiedAt}
        size="lg"
        showLabels={true}
      />
    </div>
  );
}

// Example 2: In search results (compact)
export function SearchResultCardExample() {
  const contractor = {
    licenseVerifiedAt: new Date('2024-01-15'),
    licenseExpiresAt: new Date('2025-12-31'),
    insuranceCertificateUrl: 'https://example.com/cert.pdf',
    insuranceProvider: 'State Farm',
    backgroundCheckDate: null, // Not completed
    backgroundCheckExpires: null,
    identityVerifiedAt: new Date('2024-01-05'),
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Jane's Electrical</h3>
        <VerificationBadges
          licenseVerifiedAt={contractor.licenseVerifiedAt}
          licenseExpiresAt={contractor.licenseExpiresAt}
          insuranceCertificateUrl={contractor.insuranceCertificateUrl}
          insuranceProvider={contractor.insuranceProvider}
          backgroundCheckDate={contractor.backgroundCheckDate}
          backgroundCheckExpires={contractor.backgroundCheckExpires}
          identityVerifiedAt={contractor.identityVerifiedAt}
          size="sm"
          showLabels={false}
        />
      </div>
    </div>
  );
}

// Example 3: In a contractor card (medium size)
export function ContractorCardExample() {
  const contractor = {
    licenseVerifiedAt: new Date('2024-01-15'),
    licenseExpiresAt: new Date('2025-12-31'),
    insuranceCertificateUrl: null, // Not uploaded
    insuranceProvider: null,
    backgroundCheckDate: new Date('2024-01-10'),
    backgroundCheckExpires: new Date('2025-01-10'),
    identityVerifiedAt: new Date('2024-01-05'),
  };

  return (
    <div className="border rounded-lg p-6 space-y-3">
      <h3 className="text-lg font-semibold">Bob's HVAC Services</h3>
      <p className="text-sm text-gray-600">Heating & Cooling Specialist</p>
      <VerificationBadges
        licenseVerifiedAt={contractor.licenseVerifiedAt}
        licenseExpiresAt={contractor.licenseExpiresAt}
        insuranceCertificateUrl={contractor.insuranceCertificateUrl}
        insuranceProvider={contractor.insuranceProvider}
        backgroundCheckDate={contractor.backgroundCheckDate}
        backgroundCheckExpires={contractor.backgroundCheckExpires}
        identityVerifiedAt={contractor.identityVerifiedAt}
        size="md"
        showLabels={true}
      />
    </div>
  );
}

// Example 4: No badges (nothing verified)
export function NoVerificationExample() {
  return (
    <div className="border rounded-lg p-6 space-y-3">
      <h3 className="text-lg font-semibold">New Contractor</h3>
      <p className="text-sm text-gray-600">Just joined the platform</p>
      <VerificationBadges
        licenseVerifiedAt={null}
        licenseExpiresAt={null}
        insuranceCertificateUrl={null}
        insuranceProvider={null}
        backgroundCheckDate={null}
        backgroundCheckExpires={null}
        identityVerifiedAt={null}
        size="md"
        showLabels={true}
      />
      <p className="text-xs text-gray-500">No verifications yet</p>
    </div>
  );
}
