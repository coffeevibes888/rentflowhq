/**
 * Integration Tests for Feature Gates
 * 
 * Tests feature access control across different subscription tiers.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/db/prisma';
import { canAccessFeature, getFeatureLimit } from '@/lib/services/contractor-feature-gate';
import { CONTRACTOR_TIERS } from '@/lib/config/contractor-subscription-tiers';

describe('Feature Gates Integration', () => {
  let starterContractorId: string;
  let proContractorId: string;
  let enterpriseContractorId: string;
  
  beforeEach(async () => {
    // Create test contractors with different tiers
    const starter = await prisma.contractorProfile.create({
      data: {
        userId: 'starter-user-' + Date.now(),
        businessName: 'Starter Contractor',
        email: `starter-${Date.now()}@example.com`,
        subscriptionTier: 'starter',
        subscriptionStatus: 'active',
      },
    });
    starterContractorId = starter.id;
    
    const pro = await prisma.contractorProfile.create({
      data: {
        userId: 'pro-user-' + Date.now(),
        businessName: 'Pro Contractor',
        email: `pro-${Date.now()}@example.com`,
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
      },
    });
    proContractorId = pro.id;
    
    const enterprise = await prisma.contractorProfile.create({
      data: {
        userId: 'enterprise-user-' + Date.now(),
        businessName: 'Enterprise Contractor',
        email: `enterprise-${Date.now()}@example.com`,
        subscriptionTier: 'enterprise',
        subscriptionStatus: 'active',
      },
    });
    enterpriseContractorId = enterprise.id;
  });
  
  afterEach(async () => {
    // Cleanup
    await prisma.contractorProfile.deleteMany({
      where: {
        id: {
          in: [starterContractorId, proContractorId, enterpriseContractorId],
        },
      },
    });
  });

  describe('Basic Features (All Tiers)', () => {
    it('should allow all tiers to access basic features', async () => {
      const features = ['jobs', 'invoices', 'customers', 'estimates', 'expenses'];
      
      for (const feature of features) {
        const starterAccess = await canAccessFeature(starterContractorId, feature);
        const proAccess = await canAccessFeature(proContractorId, feature);
        const enterpriseAccess = await canAccessFeature(enterpriseContractorId, feature);
        
        expect(starterAccess.allowed).toBe(true);
        expect(proAccess.allowed).toBe(true);
        expect(enterpriseAccess.allowed).toBe(true);
      }
    });
  });

  describe('Pro Features', () => {
    it('should block starter tier from Pro features', async () => {
      const proFeatures = [
        'teamManagement',
        'crm',
        'leadManagement',
        'inventory',
        'equipment',
        'marketing',
      ];
      
      for (const feature of proFeatures) {
        const access = await canAccessFeature(starterContractorId, feature);
        expect(access.allowed).toBe(false);
        expect(access.tier).toBe('starter');
      }
    });
    
    it('should allow Pro tier to access Pro features', async () => {
      const proFeatures = [
        'teamManagement',
        'crm',
        'leadManagement',
        'inventory',
        'equipment',
        'marketing',
      ];
      
      for (const feature of proFeatures) {
        const access = await canAccessFeature(proContractorId, feature);
        expect(access.allowed).toBe(true);
      }
    });
    
    it('should allow Enterprise tier to access Pro features', async () => {
      const proFeatures = [
        'teamManagement',
        'crm',
        'leadManagement',
        'inventory',
        'equipment',
        'marketing',
      ];
      
      for (const feature of proFeatures) {
        const access = await canAccessFeature(enterpriseContractorId, feature);
        expect(access.allowed).toBe(true);
      }
    });
  });

  describe('Enterprise Features', () => {
    it('should block starter and pro tiers from Enterprise features', async () => {
      const enterpriseFeatures = ['advancedAnalytics', 'apiAccess', 'whiteLabel'];
      
      for (const feature of enterpriseFeatures) {
        const starterAccess = await canAccessFeature(starterContractorId, feature);
        const proAccess = await canAccessFeature(proContractorId, feature);
        
        expect(starterAccess.allowed).toBe(false);
        expect(proAccess.allowed).toBe(false);
      }
    });
    
    it('should allow Enterprise tier to access Enterprise features', async () => {
      const enterpriseFeatures = ['advancedAnalytics', 'apiAccess', 'whiteLabel'];
      
      for (const feature of enterpriseFeatures) {
        const access = await canAccessFeature(enterpriseContractorId, feature);
        expect(access.allowed).toBe(true);
      }
    });
  });

  describe('Feature Limits by Tier', () => {
    it('should return correct limits for starter tier', () => {
      const limits = {
        activeJobs: getFeatureLimit('starter', 'activeJobs'),
        invoicesPerMonth: getFeatureLimit('starter', 'invoicesPerMonth'),
        customers: getFeatureLimit('starter', 'customers'),
      };
      
      expect(limits.activeJobs).toBe(15);
      expect(limits.invoicesPerMonth).toBe(20);
      expect(limits.customers).toBe(50);
    });
    
    it('should return correct limits for pro tier', () => {
      const limits = {
        activeJobs: getFeatureLimit('pro', 'activeJobs'),
        invoicesPerMonth: getFeatureLimit('pro', 'invoicesPerMonth'),
        customers: getFeatureLimit('pro', 'customers'),
        teamMembers: getFeatureLimit('pro', 'teamMembers'),
        inventoryItems: getFeatureLimit('pro', 'inventoryItems'),
      };
      
      expect(limits.activeJobs).toBe(50);
      expect(limits.invoicesPerMonth).toBe(50);
      expect(limits.customers).toBe(200);
      expect(limits.teamMembers).toBe(6);
      expect(limits.inventoryItems).toBe(200);
    });
    
    it('should return unlimited for enterprise tier', () => {
      const limits = {
        activeJobs: getFeatureLimit('enterprise', 'activeJobs'),
        invoicesPerMonth: getFeatureLimit('enterprise', 'invoicesPerMonth'),
        customers: getFeatureLimit('enterprise', 'customers'),
        teamMembers: getFeatureLimit('enterprise', 'teamMembers'),
      };
      
      expect(limits.activeJobs).toBe(999999);
      expect(limits.invoicesPerMonth).toBe(999999);
      expect(limits.customers).toBe(999999);
      expect(limits.teamMembers).toBe(999999);
    });
  });

  describe('Subscription Status', () => {
    it('should block access for inactive subscription', async () => {
      // Set subscription to inactive
      await prisma.contractorProfile.update({
        where: { id: proContractorId },
        data: { subscriptionStatus: 'inactive' },
      });
      
      const access = await canAccessFeature(proContractorId, 'crm');
      expect(access.allowed).toBe(false);
    });
    
    it('should block access for canceled subscription', async () => {
      // Set subscription to canceled
      await prisma.contractorProfile.update({
        where: { id: proContractorId },
        data: { subscriptionStatus: 'canceled' },
      });
      
      const access = await canAccessFeature(proContractorId, 'crm');
      expect(access.allowed).toBe(false);
    });
    
    it('should allow access for trialing subscription', async () => {
      // Set subscription to trialing
      await prisma.contractorProfile.update({
        where: { id: proContractorId },
        data: { subscriptionStatus: 'trialing' },
      });
      
      const access = await canAccessFeature(proContractorId, 'crm');
      expect(access.allowed).toBe(true);
    });
  });

  describe('Tier Configuration', () => {
    it('should have valid tier configuration', () => {
      expect(CONTRACTOR_TIERS.starter).toBeDefined();
      expect(CONTRACTOR_TIERS.pro).toBeDefined();
      expect(CONTRACTOR_TIERS.enterprise).toBeDefined();
    });
    
    it('should have all required limits defined', () => {
      const requiredLimits = [
        'activeJobs',
        'invoicesPerMonth',
        'customers',
        'teamMembers',
      ];
      
      for (const tier of ['starter', 'pro', 'enterprise'] as const) {
        for (const limit of requiredLimits) {
          expect(CONTRACTOR_TIERS[tier].limits[limit]).toBeDefined();
        }
      }
    });
    
    it('should have all required features defined', () => {
      const requiredFeatures = [
        'jobs',
        'invoices',
        'customers',
        'teamManagement',
        'crm',
      ];
      
      for (const tier of ['starter', 'pro', 'enterprise'] as const) {
        for (const feature of requiredFeatures) {
          expect(CONTRACTOR_TIERS[tier].features[feature]).toBeDefined();
        }
      }
    });
  });

  describe('Feature Access Reasons', () => {
    it('should provide reason when feature is locked', async () => {
      const access = await canAccessFeature(starterContractorId, 'crm');
      
      expect(access.allowed).toBe(false);
      expect(access.reason).toBeDefined();
      expect(access.reason).toContain('requires');
    });
    
    it('should not provide reason when feature is allowed', async () => {
      const access = await canAccessFeature(proContractorId, 'crm');
      
      expect(access.allowed).toBe(true);
      expect(access.reason).toBeUndefined();
    });
  });

  describe('Upgrade Paths', () => {
    it('should show correct upgrade path from starter to pro', async () => {
      const access = await canAccessFeature(starterContractorId, 'crm');
      
      expect(access.allowed).toBe(false);
      expect(access.tier).toBe('starter');
      // CRM requires pro tier
    });
    
    it('should show correct upgrade path from pro to enterprise', async () => {
      const access = await canAccessFeature(proContractorId, 'advancedAnalytics');
      
      expect(access.allowed).toBe(false);
      expect(access.tier).toBe('pro');
      // Advanced analytics requires enterprise tier
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid contractor ID', async () => {
      const access = await canAccessFeature('invalid-id', 'crm');
      expect(access.allowed).toBe(false);
    });
    
    it('should handle invalid feature name', async () => {
      const access = await canAccessFeature(proContractorId, 'nonexistent-feature');
      expect(access.allowed).toBe(false);
    });
    
    it('should handle null subscription tier', async () => {
      await prisma.contractorProfile.update({
        where: { id: proContractorId },
        data: { subscriptionTier: null },
      });
      
      const access = await canAccessFeature(proContractorId, 'crm');
      expect(access.allowed).toBe(false);
    });
  });
});
