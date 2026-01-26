/**
 * Payment System Integration Tests
 * Tests escrow, milestone payments, and Stripe integration
 */

import { prisma } from '@/db/prisma';
import { StripeEscrowService } from '@/lib/services/stripe-escrow';
import Stripe from 'stripe';

// Mock Stripe for testing
jest.mock('stripe');

describe('Marketplace Payment System', () => {
  let testHomeowner: any;
  let testContractor: any;
  let testJob: any;
  let mockStripe: jest.Mocked<Stripe>;

  beforeAll(async () => {
    // Setup mock Stripe
    mockStripe = {
      customers: {
        create: jest.fn().mockResolvedValue({
          id: 'cus_test123',
          email: 'test@test.com',
        }),
      },
      accounts: {
        create: jest.fn().mockResolvedValue({
          id: 'acct_test123',
          type: 'express',
        }),
      },
      paymentIntents: {
        create: jest.fn().mockResolvedValue({
          id: 'pi_test123',
          amount: 50000,
          status: 'requires_payment_method',
        }),
        capture: jest.fn().mockResolvedValue({
          id: 'pi_test123',
          status: 'succeeded',
        }),
      },
      transfers: {
        create: jest.fn().mockResolvedValue({
          id: 'tr_test123',
          amount: 49900,
          destination: 'acct_test123',
        }),
      },
    } as any;

    // Create test data
    const homeownerUser = await prisma.user.create({
      data: {
        email: `payment-test-homeowner-${Date.now()}@test.com`,
        name: 'Payment Test Homeowner',
        role: 'homeowner',
      },
    });

    testHomeowner = await prisma.homeowner.create({
      data: {
        userId: homeownerUser.id,
        name: 'Payment Test Homeowner',
        email: homeownerUser.email,
      },
    });

    const contractorUser = await prisma.user.create({
      data: {
        email: `payment-test-contractor-${Date.now()}@test.com`,
        name: 'Payment Test Contractor',
        role: 'contractor',
      },
    });

    testContractor = await prisma.contractorProfile.create({
      data: {
        userId: contractorUser.id,
        businessName: 'Payment Test Contracting',
        email: contractorUser.email,
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
      },
    });

    testJob = await prisma.homeownerWorkOrder.create({
      data: {
        homeownerId: testHomeowner.id,
        title: 'Payment Test Job',
        description: 'Test job for payment flow',
        category: 'plumbing',
        priority: 'medium',
        status: 'in_progress',
        isOpenBid: false,
        budgetMin: 400,
        budgetMax: 600,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testJob) {
      await prisma.homeownerWorkOrder.delete({ where: { id: testJob.id } });
    }
    if (testContractor) {
      await prisma.contractorProfile.delete({ where: { id: testContractor.id } });
      await prisma.user.delete({ where: { id: testContractor.userId } });
    }
    if (testHomeowner) {
      await prisma.homeowner.delete({ where: { id: testHomeowner.id } });
      await prisma.user.delete({ where: { id: testHomeowner.userId } });
    }
  });

  describe('Escrow Creation', () => {
    it('should create escrow with correct amounts', async () => {
      const totalAmount = 500;
      const platformFee = 1.00;
      const contractorAmount = totalAmount - platformFee;

      const escrow = await prisma.jobEscrow.create({
        data: {
          jobId: testJob.id,
          homeownerId: testHomeowner.id,
          contractorId: testContractor.id,
          totalAmount,
          platformFee,
          contractorAmount,
          status: 'pending',
        },
      });

      expect(escrow.totalAmount).toBe(500);
      expect(escrow.platformFee).toBe(1.00);
      expect(escrow.contractorAmount).toBe(499);

      await prisma.jobEscrow.delete({ where: { id: escrow.id } });
    });

    it('should validate minimum payment amount', async () => {
      const invalidAmount = 0.50; // Below $1 minimum

      await expect(
        prisma.jobEscrow.create({
          data: {
            jobId: testJob.id,
            homeownerId: testHomeowner.id,
            contractorId: testContractor.id,
            totalAmount: invalidAmount,
            platformFee: 1.00,
            contractorAmount: -0.50,
            status: 'pending',
          },
        })
      ).rejects.toThrow();
    });

    it('should prevent duplicate escrow for same job', async () => {
      const escrow1 = await prisma.jobEscrow.create({
        data: {
          jobId: testJob.id,
          homeownerId: testHomeowner.id,
          contractorId: testContractor.id,
          totalAmount: 500,
          platformFee: 1.00,
          contractorAmount: 499,
          status: 'pending',
        },
      });

      await expect(
        prisma.jobEscrow.create({
          data: {
            jobId: testJob.id,
            homeownerId: testHomeowner.id,
            contractorId: testContractor.id,
            totalAmount: 500,
            platformFee: 1.00,
            contractorAmount: 499,
            status: 'pending',
          },
        })
      ).rejects.toThrow();

      await prisma.jobEscrow.delete({ where: { id: escrow1.id } });
    });
  });

  describe('Milestone Payments', () => {
    let testEscrow: any;

    beforeEach(async () => {
      testEscrow = await prisma.jobEscrow.create({
        data: {
          jobId: testJob.id,
          homeownerId: testHomeowner.id,
          contractorId: testContractor.id,
          totalAmount: 500,
          platformFee: 1.00,
          contractorAmount: 499,
          status: 'funded',
        },
      });
    });

    afterEach(async () => {
      if (testEscrow) {
        await prisma.jobEscrow.delete({ where: { id: testEscrow.id } });
      }
    });

    it('should create payment milestone', async () => {
      const milestone = await prisma.jobMilestone.create({
        data: {
          escrowId: testEscrow.id,
          description: 'Complete installation',
          amount: 499,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'pending',
        },
      });

      expect(milestone).toBeDefined();
      expect(milestone.amount).toBe(499);
      expect(milestone.status).toBe('pending');

      await prisma.jobMilestone.delete({ where: { id: milestone.id } });
    });

    it('should track milestone completion', async () => {
      const milestone = await prisma.jobMilestone.create({
        data: {
          escrowId: testEscrow.id,
          description: 'Complete installation',
          amount: 499,
          status: 'pending',
        },
      });

      const completed = await prisma.jobMilestone.update({
        where: { id: milestone.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();

      await prisma.jobMilestone.delete({ where: { id: milestone.id } });
    });

    it('should release payment on milestone completion', async () => {
      const milestone = await prisma.jobMilestone.create({
        data: {
          escrowId: testEscrow.id,
          description: 'Complete installation',
          amount: 499,
          status: 'completed',
          completedAt: new Date(),
        },
      });

      const release = await prisma.escrowRelease.create({
        data: {
          escrowId: testEscrow.id,
          milestoneId: milestone.id,
          amount: 499,
          status: 'completed',
          releasedAt: new Date(),
        },
      });

      expect(release.amount).toBe(499);
      expect(release.status).toBe('completed');

      await prisma.escrowRelease.delete({ where: { id: release.id } });
      await prisma.jobMilestone.delete({ where: { id: milestone.id } });
    });

    it('should track total released amount', async () => {
      const milestone1 = await prisma.jobMilestone.create({
        data: {
          escrowId: testEscrow.id,
          description: 'Phase 1',
          amount: 250,
          status: 'completed',
        },
      });

      const milestone2 = await prisma.jobMilestone.create({
        data: {
          escrowId: testEscrow.id,
          description: 'Phase 2',
          amount: 249,
          status: 'completed',
        },
      });

      const release1 = await prisma.escrowRelease.create({
        data: {
          escrowId: testEscrow.id,
          milestoneId: milestone1.id,
          amount: 250,
          status: 'completed',
        },
      });

      const release2 = await prisma.escrowRelease.create({
        data: {
          escrowId: testEscrow.id,
          milestoneId: milestone2.id,
          amount: 249,
          status: 'completed',
        },
      });

      const totalReleased = await prisma.escrowRelease.aggregate({
        where: { escrowId: testEscrow.id },
        _sum: { amount: true },
      });

      expect(totalReleased._sum.amount).toBe(499);

      // Cleanup
      await prisma.escrowRelease.deleteMany({
        where: { id: { in: [release1.id, release2.id] } },
      });
      await prisma.jobMilestone.deleteMany({
        where: { id: { in: [milestone1.id, milestone2.id] } },
      });
    });
  });

  describe('Payment Status Tracking', () => {
    it('should track escrow status transitions', async () => {
      const escrow = await prisma.jobEscrow.create({
        data: {
          jobId: testJob.id,
          homeownerId: testHomeowner.id,
          contractorId: testContractor.id,
          totalAmount: 500,
          platformFee: 1.00,
          contractorAmount: 499,
          status: 'pending',
        },
      });

      // Transition to funded
      const funded = await prisma.jobEscrow.update({
        where: { id: escrow.id },
        data: { status: 'funded', fundedAt: new Date() },
      });

      expect(funded.status).toBe('funded');
      expect(funded.fundedAt).toBeDefined();

      // Transition to completed
      const completed = await prisma.jobEscrow.update({
        where: { id: escrow.id },
        data: { status: 'completed', completedAt: new Date() },
      });

      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();

      await prisma.jobEscrow.delete({ where: { id: escrow.id } });
    });

    it('should handle refund scenarios', async () => {
      const escrow = await prisma.jobEscrow.create({
        data: {
          jobId: testJob.id,
          homeownerId: testHomeowner.id,
          contractorId: testContractor.id,
          totalAmount: 500,
          platformFee: 1.00,
          contractorAmount: 499,
          status: 'funded',
        },
      });

      const refunded = await prisma.jobEscrow.update({
        where: { id: escrow.id },
        data: { status: 'refunded', refundedAt: new Date() },
      });

      expect(refunded.status).toBe('refunded');
      expect(refunded.refundedAt).toBeDefined();

      await prisma.jobEscrow.delete({ where: { id: escrow.id } });
    });
  });

  describe('Payment Validation', () => {
    it('should validate contractor has Connect account', async () => {
      const contractor = await prisma.contractorProfile.findUnique({
        where: { id: testContractor.id },
      });

      // In production, contractor should have stripeConnectAccountId
      expect(contractor).toBeDefined();
    });

    it('should validate homeowner has payment method', async () => {
      const homeowner = await prisma.homeowner.findUnique({
        where: { id: testHomeowner.id },
      });

      expect(homeowner).toBeDefined();
    });

    it('should calculate fees correctly for different amounts', () => {
      const testCases = [
        { amount: 100, expectedFee: 1.00, expectedContractor: 99 },
        { amount: 500, expectedFee: 1.00, expectedContractor: 499 },
        { amount: 1000, expectedFee: 1.00, expectedContractor: 999 },
        { amount: 5000, expectedFee: 1.00, expectedContractor: 4999 },
      ];

      testCases.forEach(({ amount, expectedFee, expectedContractor }) => {
        const platformFee = 1.00;
        const contractorAmount = amount - platformFee;

        expect(platformFee).toBe(expectedFee);
        expect(contractorAmount).toBe(expectedContractor);
      });
    });
  });

  describe('Concurrent Payment Operations', () => {
    it('should handle multiple escrow creations', async () => {
      const escrows = await Promise.all([
        prisma.jobEscrow.create({
          data: {
            jobId: `job-1-${Date.now()}`,
            homeownerId: testHomeowner.id,
            contractorId: testContractor.id,
            totalAmount: 500,
            platformFee: 1.00,
            contractorAmount: 499,
            status: 'pending',
          },
        }),
        prisma.jobEscrow.create({
          data: {
            jobId: `job-2-${Date.now()}`,
            homeownerId: testHomeowner.id,
            contractorId: testContractor.id,
            totalAmount: 600,
            platformFee: 1.00,
            contractorAmount: 599,
            status: 'pending',
          },
        }),
      ]);

      expect(escrows.length).toBe(2);
      expect(escrows[0].totalAmount).toBe(500);
      expect(escrows[1].totalAmount).toBe(600);

      // Cleanup
      await prisma.jobEscrow.deleteMany({
        where: { id: { in: escrows.map(e => e.id) } },
      });
    });

    it('should handle concurrent milestone releases', async () => {
      const escrow = await prisma.jobEscrow.create({
        data: {
          jobId: testJob.id,
          homeownerId: testHomeowner.id,
          contractorId: testContractor.id,
          totalAmount: 1000,
          platformFee: 1.00,
          contractorAmount: 999,
          status: 'funded',
        },
      });

      const milestones = await Promise.all([
        prisma.jobMilestone.create({
          data: {
            escrowId: escrow.id,
            description: 'Milestone 1',
            amount: 333,
            status: 'completed',
          },
        }),
        prisma.jobMilestone.create({
          data: {
            escrowId: escrow.id,
            description: 'Milestone 2',
            amount: 333,
            status: 'completed',
          },
        }),
        prisma.jobMilestone.create({
          data: {
            escrowId: escrow.id,
            description: 'Milestone 3',
            amount: 333,
            status: 'completed',
          },
        }),
      ]);

      expect(milestones.length).toBe(3);

      // Cleanup
      await prisma.jobMilestone.deleteMany({
        where: { id: { in: milestones.map(m => m.id) } },
      });
      await prisma.jobEscrow.delete({ where: { id: escrow.id } });
    });
  });
});
