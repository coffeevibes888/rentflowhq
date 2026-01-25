/**
 * Integration Tests for Subscription Limits
 * 
 * Tests the complete flow of subscription limit enforcement across
 * different API endpoints and features.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { prisma } from '@/db/prisma';
import { 
  incrementJobCount, 
  incrementInvoiceCount, 
  incrementCustomerCount,
  resetMonthlyCounters,
  getCurrentUsage 
} from '@/lib/services/contractor-usage-tracker';
import { checkLimit } from '@/lib/services/contractor-feature-gate';

describe('Subscription Limits Integration', () => {
  let testContractorId: string;
  
  beforeEach(async () => {
    // Create test contractor with starter tier
    const contractor = await prisma.contractorProfile.create({
      data: {
        userId: 'test-user-' + Date.now(),
        businessName: 'Test Contractor',
        email: `test-${Date.now()}@example.com`,
        subscriptionTier: 'starter',
        subscriptionStatus: 'active',
      },
    });
    testContractorId = contractor.id;
    
    // Create usage tracking record
    await prisma.contractorUsageTracking.create({
      data: {
        contractorId: testContractorId,
        activeJobs: 0,
        totalCustomers: 0,
        invoicesThisMonth: 0,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  });
  
  afterEach(async () => {
    // Cleanup
    await prisma.contractorUsageTracking.deleteMany({
      where: { contractorId: testContractorId },
    });
    await prisma.contractorProfile.delete({
      where: { id: testContractorId },
    });
  });

  describe('Job Creation Limits', () => {
    it('should allow job creation within limits', async () => {
      // Starter tier allows 15 active jobs
      for (let i = 0; i < 10; i++) {
        await incrementJobCount(testContractorId);
      }
      
      const limitCheck = await checkLimit(testContractorId, 'activeJobs');
      expect(limitCheck.allowed).toBe(true);
      expect(limitCheck.current).toBe(10);
      expect(limitCheck.limit).toBe(15);
    });
    
    it('should block job creation at limit', async () => {
      // Create 15 jobs (starter limit)
      for (let i = 0; i < 15; i++) {
        await incrementJobCount(testContractorId);
      }
      
      const limitCheck = await checkLimit(testContractorId, 'activeJobs');
      expect(limitCheck.allowed).toBe(false);
      expect(limitCheck.current).toBe(15);
      expect(limitCheck.limit).toBe(15);
    });
    
    it('should track usage correctly', async () => {
      await incrementJobCount(testContractorId);
      await incrementJobCount(testContractorId);
      await incrementJobCount(testContractorId);
      
      const usage = await getCurrentUsage(testContractorId);
      expect(usage.activeJobs).toBe(3);
    });
  });

  describe('Invoice Creation Limits', () => {
    it('should allow invoice creation within monthly limits', async () => {
      // Starter tier allows 20 invoices per month
      for (let i = 0; i < 15; i++) {
        await incrementInvoiceCount(testContractorId);
      }
      
      const limitCheck = await checkLimit(testContractorId, 'invoicesPerMonth');
      expect(limitCheck.allowed).toBe(true);
      expect(limitCheck.current).toBe(15);
      expect(limitCheck.limit).toBe(20);
    });
    
    it('should block invoice creation at monthly limit', async () => {
      // Create 20 invoices (starter limit)
      for (let i = 0; i < 20; i++) {
        await incrementInvoiceCount(testContractorId);
      }
      
      const limitCheck = await checkLimit(testContractorId, 'invoicesPerMonth');
      expect(limitCheck.allowed).toBe(false);
      expect(limitCheck.current).toBe(20);
      expect(limitCheck.limit).toBe(20);
    });
    
    it('should reset invoice counter monthly', async () => {
      // Create some invoices
      for (let i = 0; i < 10; i++) {
        await incrementInvoiceCount(testContractorId);
      }
      
      // Simulate month passing
      await prisma.contractorUsageTracking.update({
        where: { contractorId: testContractorId },
        data: {
          billingPeriodEnd: new Date(Date.now() - 1000), // Past date
        },
      });
      
      // Reset counters
      await resetMonthlyCounters(testContractorId);
      
      const usage = await getCurrentUsage(testContractorId);
      expect(usage.invoicesThisMonth).toBe(0);
    });
  });

  describe('Customer Creation Limits', () => {
    it('should allow customer creation within limits', async () => {
      // Starter tier allows 50 customers
      for (let i = 0; i < 30; i++) {
        await incrementCustomerCount(testContractorId);
      }
      
      const limitCheck = await checkLimit(testContractorId, 'customers');
      expect(limitCheck.allowed).toBe(true);
      expect(limitCheck.current).toBe(30);
      expect(limitCheck.limit).toBe(50);
    });
    
    it('should block customer creation at limit', async () => {
      // Create 50 customers (starter limit)
      for (let i = 0; i < 50; i++) {
        await incrementCustomerCount(testContractorId);
      }
      
      const limitCheck = await checkLimit(testContractorId, 'customers');
      expect(limitCheck.allowed).toBe(false);
      expect(limitCheck.current).toBe(50);
      expect(limitCheck.limit).toBe(50);
    });
  });

  describe('Tier Upgrades', () => {
    it('should increase limits after upgrade to Pro', async () => {
      // Create jobs up to starter limit
      for (let i = 0; i < 15; i++) {
        await incrementJobCount(testContractorId);
      }
      
      // Upgrade to Pro
      await prisma.contractorProfile.update({
        where: { id: testContractorId },
        data: { subscriptionTier: 'pro' },
      });
      
      // Should now allow more jobs (Pro allows 50)
      const limitCheck = await checkLimit(testContractorId, 'activeJobs');
      expect(limitCheck.allowed).toBe(true);
      expect(limitCheck.current).toBe(15);
      expect(limitCheck.limit).toBe(50);
    });
    
    it('should increase limits after upgrade to Enterprise', async () => {
      // Upgrade to Enterprise
      await prisma.contractorProfile.update({
        where: { id: testContractorId },
        data: { subscriptionTier: 'enterprise' },
      });
      
      // Enterprise has unlimited jobs
      const limitCheck = await checkLimit(testContractorId, 'activeJobs');
      expect(limitCheck.allowed).toBe(true);
      expect(limitCheck.limit).toBe(999999);
    });
  });

  describe('Usage Percentage Calculations', () => {
    it('should calculate usage percentage correctly', async () => {
      // Create 12 jobs (80% of 15)
      for (let i = 0; i < 12; i++) {
        await incrementJobCount(testContractorId);
      }
      
      const limitCheck = await checkLimit(testContractorId, 'activeJobs');
      const percentage = (limitCheck.current / limitCheck.limit) * 100;
      
      expect(percentage).toBe(80);
    });
    
    it('should identify approaching limits (>80%)', async () => {
      // Create 13 jobs (86.67% of 15)
      for (let i = 0; i < 13; i++) {
        await incrementJobCount(testContractorId);
      }
      
      const limitCheck = await checkLimit(testContractorId, 'activeJobs');
      const percentage = (limitCheck.current / limitCheck.limit) * 100;
      
      expect(percentage).toBeGreaterThan(80);
    });
  });

  describe('Multiple Feature Limits', () => {
    it('should track multiple features independently', async () => {
      // Create jobs
      for (let i = 0; i < 10; i++) {
        await incrementJobCount(testContractorId);
      }
      
      // Create invoices
      for (let i = 0; i < 15; i++) {
        await incrementInvoiceCount(testContractorId);
      }
      
      // Create customers
      for (let i = 0; i < 25; i++) {
        await incrementCustomerCount(testContractorId);
      }
      
      const usage = await getCurrentUsage(testContractorId);
      expect(usage.activeJobs).toBe(10);
      expect(usage.invoicesThisMonth).toBe(15);
      expect(usage.totalCustomers).toBe(25);
    });
    
    it('should enforce limits independently', async () => {
      // Max out jobs
      for (let i = 0; i < 15; i++) {
        await incrementJobCount(testContractorId);
      }
      
      // Should still allow invoices
      const invoiceCheck = await checkLimit(testContractorId, 'invoicesPerMonth');
      expect(invoiceCheck.allowed).toBe(true);
      
      // Should block jobs
      const jobCheck = await checkLimit(testContractorId, 'activeJobs');
      expect(jobCheck.allowed).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent increments correctly', async () => {
      // Simulate concurrent job creation
      await Promise.all([
        incrementJobCount(testContractorId),
        incrementJobCount(testContractorId),
        incrementJobCount(testContractorId),
      ]);
      
      const usage = await getCurrentUsage(testContractorId);
      expect(usage.activeJobs).toBe(3);
    });
    
    it('should handle missing usage tracking record', async () => {
      // Delete usage tracking
      await prisma.contractorUsageTracking.delete({
        where: { contractorId: testContractorId },
      });
      
      // Should create new record on first increment
      await incrementJobCount(testContractorId);
      
      const usage = await getCurrentUsage(testContractorId);
      expect(usage).toBeDefined();
      expect(usage.activeJobs).toBe(1);
    });
    
    it('should handle invalid contractor ID gracefully', async () => {
      const limitCheck = await checkLimit('invalid-id', 'activeJobs');
      expect(limitCheck.allowed).toBe(false);
    });
  });
});
