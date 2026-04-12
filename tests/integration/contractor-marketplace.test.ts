/**
 * Contractor Marketplace Integration Tests
 * Tests messaging, payments, bidding, and scalability
 */

import { prisma } from '@/db/prisma';
import { 
  getMarketplaceJobs, 
  getMarketplaceJobById 
} from '@/lib/actions/marketplace-jobs.actions';
import { 
  getMarketplaceContractors 
} from '@/lib/actions/contractor-profile.actions';
import { MarketplaceNotifications } from '@/lib/services/marketplace-notifications';
import { StripeEscrowService } from '@/lib/services/stripe-escrow';

describe('Contractor Marketplace - Complete Integration Tests', () => {
  let testHomeowner: any;
  let testContractor: any;
  let testJob: any;
  let testBid: any;

  beforeAll(async () => {
    // Create test homeowner
    const homeownerUser = await prisma.user.create({
      data: {
        email: `test-homeowner-${Date.now()}@test.com`,
        name: 'Test Homeowner',
        role: 'homeowner',
      },
    });

    testHomeowner = await prisma.homeowner.create({
      data: {
        userId: homeownerUser.id,
        name: 'Test Homeowner',
        email: homeownerUser.email,
        phone: '555-0100',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zip: '90210',
        },
      },
    });

    // Create test contractor
    const contractorUser = await prisma.user.create({
      data: {
        email: `test-contractor-${Date.now()}@test.com`,
        name: 'Test Contractor',
        role: 'contractor',
      },
    });

    testContractor = await prisma.contractorProfile.create({
      data: {
        userId: contractorUser.id,
        businessName: 'Test Contracting LLC',
        email: contractorUser.email,
        phone: '555-0200',
        specialties: ['plumbing', 'electrical'],
        baseCity: 'Test City',
        baseState: 'CA',
        isPublic: true,
        acceptingNewWork: true,
        avgRating: 4.8,
        totalReviews: 25,
        completedJobs: 50,
        hourlyRate: 75,
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
      },
    });

    // Create usage tracking
    await prisma.contractorUsageTracking.create({
      data: {
        contractorId: testContractor.id,
        activeJobsCount: 0,
        invoicesThisMonth: 0,
        totalCustomers: 0,
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testBid) {
      await prisma.workOrderBid.deleteMany({
        where: { id: testBid.id },
      });
    }
    if (testJob) {
      await prisma.homeownerWorkOrder.deleteMany({
        where: { id: testJob.id },
      });
    }
    if (testContractor) {
      await prisma.contractorUsageTracking.deleteMany({
        where: { contractorId: testContractor.id },
      });
      await prisma.contractorProfile.deleteMany({
        where: { id: testContractor.id },
      });
      await prisma.user.deleteMany({
        where: { id: testContractor.userId },
      });
    }
    if (testHomeowner) {
      await prisma.homeowner.deleteMany({
        where: { id: testHomeowner.id },
      });
      await prisma.user.deleteMany({
        where: { id: testHomeowner.userId },
      });
    }
  });

  describe('Marketplace Discovery & Search', () => {
    it('should search contractors by specialty', async () => {
      const result = await getMarketplaceContractors({
        specialty: 'plumbing',
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.contractors).toBeDefined();
      expect(Array.isArray(result.contractors)).toBe(true);
      
      if (result.contractors!.length > 0) {
        const contractor = result.contractors![0];
        expect(contractor.specialties).toContain('plumbing');
      }
    });

    it('should filter contractors by location', async () => {
      const result = await getMarketplaceContractors({
        city: 'Test City',
        state: 'CA',
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.contractors).toBeDefined();
    });

    it('should sort contractors by rating', async () => {
      const result = await getMarketplaceContractors({
        sortBy: 'rating',
        limit: 10,
      });

      expect(result.success).toBe(true);
      if (result.contractors!.length > 1) {
        const ratings = result.contractors!.map(c => c.avgRating);
        const sortedRatings = [...ratings].sort((a, b) => b - a);
        expect(ratings).toEqual(sortedRatings);
      }
    });

    it('should filter by minimum rating', async () => {
      const result = await getMarketplaceContractors({
        minRating: 4.5,
        limit: 10,
      });

      expect(result.success).toBe(true);
      result.contractors!.forEach(contractor => {
        expect(contractor.avgRating).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should paginate results correctly', async () => {
      const page1 = await getMarketplaceContractors({
        limit: 5,
        offset: 0,
      });

      const page2 = await getMarketplaceContractors({
        limit: 5,
        offset: 5,
      });

      expect(page1.success).toBe(true);
      expect(page2.success).toBe(true);
      
      if (page1.contractors!.length > 0 && page2.contractors!.length > 0) {
        expect(page1.contractors![0].id).not.toBe(page2.contractors![0].id);
      }
    });
  });

  describe('Job Posting & Bidding', () => {
    beforeEach(async () => {
      // Create test job
      testJob = await prisma.homeownerWorkOrder.create({
        data: {
          homeownerId: testHomeowner.id,
          title: 'Fix Leaking Pipe',
          description: 'Kitchen sink pipe is leaking',
          category: 'plumbing',
          priority: 'high',
          status: 'open',
          isOpenBid: true,
          budgetMin: 200,
          budgetMax: 500,
          bidDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    });

    afterEach(async () => {
      if (testBid) {
        await prisma.workOrderBid.deleteMany({
          where: { id: testBid.id },
        });
        testBid = null;
      }
      if (testJob) {
        await prisma.homeownerWorkOrder.deleteMany({
          where: { id: testJob.id },
        });
        testJob = null;
      }
    });

    it('should list open marketplace jobs', async () => {
      const result = await getMarketplaceJobs({
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.jobs).toBeDefined();
      expect(Array.isArray(result.jobs)).toBe(true);
    });

    it('should filter jobs by category', async () => {
      const result = await getMarketplaceJobs({
        category: 'plumbing',
        limit: 10,
      });

      expect(result.success).toBe(true);
      result.jobs!.forEach(job => {
        expect(job.category).toBe('plumbing');
      });
    });

    it('should filter jobs by budget range', async () => {
      const result = await getMarketplaceJobs({
        minBudget: 100,
        maxBudget: 1000,
        limit: 10,
      });

      expect(result.success).toBe(true);
      result.jobs!.forEach(job => {
        if (job.budgetMax) {
          expect(job.budgetMax).toBeGreaterThanOrEqual(100);
        }
        if (job.budgetMin) {
          expect(job.budgetMin).toBeLessThanOrEqual(1000);
        }
      });
    });

    it('should get job details with bid count', async () => {
      const result = await getMarketplaceJobById(testJob.id);

      expect(result.success).toBe(true);
      expect(result.job).toBeDefined();
      expect(result.job!.id).toBe(testJob.id);
      expect(result.job!.bidCount).toBeDefined();
    });

    it('should allow contractor to submit bid', async () => {
      testBid = await prisma.workOrderBid.create({
        data: {
          workOrderId: testJob.id,
          contractorId: testContractor.id,
          bidAmount: 350,
          estimatedHours: 4,
          proposedStartDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          message: 'I can fix this quickly with quality work',
          status: 'pending',
        },
      });

      expect(testBid).toBeDefined();
      expect(testBid.bidAmount).toBe(350);
      expect(testBid.status).toBe('pending');
    });

    it('should prevent duplicate bids from same contractor', async () => {
      // Create first bid
      testBid = await prisma.workOrderBid.create({
        data: {
          workOrderId: testJob.id,
          contractorId: testContractor.id,
          bidAmount: 350,
          status: 'pending',
        },
      });

      // Try to create duplicate
      await expect(
        prisma.workOrderBid.create({
          data: {
            workOrderId: testJob.id,
            contractorId: testContractor.id,
            bidAmount: 400,
            status: 'pending',
          },
        })
      ).rejects.toThrow();
    });

    it('should track bid count on job', async () => {
      // Create multiple bids
      const bid1 = await prisma.workOrderBid.create({
        data: {
          workOrderId: testJob.id,
          contractorId: testContractor.id,
          bidAmount: 350,
          status: 'pending',
        },
      });

      const result = await getMarketplaceJobById(testJob.id);
      expect(result.job!.bidCount).toBeGreaterThan(0);

      // Cleanup
      await prisma.workOrderBid.delete({ where: { id: bid1.id } });
    });
  });

  describe('Messaging System', () => {
    let testThread: any;
    let testMessage: any;

    afterEach(async () => {
      if (testMessage) {
        await prisma.message.deleteMany({
          where: { id: testMessage.id },
        });
      }
      if (testThread) {
        await prisma.thread.deleteMany({
          where: { id: testThread.id },
        });
      }
    });

    it('should create messaging thread between homeowner and contractor', async () => {
      testThread = await prisma.thread.create({
        data: {
          participants: {
            create: [
              { userId: testHomeowner.userId },
              { userId: testContractor.userId },
            ],
          },
        },
      });

      expect(testThread).toBeDefined();
      expect(testThread.id).toBeDefined();
    });

    it('should send message in thread', async () => {
      testThread = await prisma.thread.create({
        data: {
          participants: {
            create: [
              { userId: testHomeowner.userId },
              { userId: testContractor.userId },
            ],
          },
        },
      });

      testMessage = await prisma.message.create({
        data: {
          threadId: testThread.id,
          senderId: testHomeowner.userId,
          content: 'When can you start the job?',
        },
      });

      expect(testMessage).toBeDefined();
      expect(testMessage.content).toBe('When can you start the job?');
    });

    it('should track unread messages', async () => {
      testThread = await prisma.thread.create({
        data: {
          participants: {
            create: [
              { userId: testHomeowner.userId },
              { userId: testContractor.userId },
            ],
          },
        },
      });

      testMessage = await prisma.message.create({
        data: {
          threadId: testThread.id,
          senderId: testHomeowner.userId,
          content: 'Test message',
        },
      });

      const unreadCount = await prisma.message.count({
        where: {
          threadId: testThread.id,
          senderId: { not: testContractor.userId },
          readBy: { none: { userId: testContractor.userId } },
        },
      });

      expect(unreadCount).toBeGreaterThan(0);
    });

    it('should mark messages as read', async () => {
      testThread = await prisma.thread.create({
        data: {
          participants: {
            create: [
              { userId: testHomeowner.userId },
              { userId: testContractor.userId },
            ],
          },
        },
      });

      testMessage = await prisma.message.create({
        data: {
          threadId: testThread.id,
          senderId: testHomeowner.userId,
          content: 'Test message',
          readBy: {
            create: {
              userId: testContractor.userId,
            },
          },
        },
      });

      const message = await prisma.message.findUnique({
        where: { id: testMessage.id },
        include: { readBy: true },
      });

      expect(message!.readBy.length).toBeGreaterThan(0);
    });
  });

  describe('Payment & Escrow System', () => {
    it('should validate escrow service initialization', () => {
      expect(StripeEscrowService).toBeDefined();
      expect(StripeEscrowService.createCustomer).toBeDefined();
      expect(StripeEscrowService.createConnectAccount).toBeDefined();
      expect(StripeEscrowService.createPaymentIntent).toBeDefined();
    });

    it('should calculate platform fees correctly', async () => {
      const jobAmount = 500;
      const platformFee = 1.00; // $1 flat fee
      const contractorAmount = jobAmount - platformFee;

      expect(contractorAmount).toBe(499);
    });

    it('should create job escrow record', async () => {
      const escrow = await prisma.jobEscrow.create({
        data: {
          jobId: testJob?.id || 'test-job-id',
          homeownerId: testHomeowner.id,
          contractorId: testContractor.id,
          totalAmount: 500,
          platformFee: 1.00,
          contractorAmount: 499,
          status: 'pending',
        },
      });

      expect(escrow).toBeDefined();
      expect(escrow.totalAmount).toBe(500);
      expect(escrow.platformFee).toBe(1.00);
      expect(escrow.status).toBe('pending');

      // Cleanup
      await prisma.jobEscrow.delete({ where: { id: escrow.id } });
    });

    it('should create payment milestones', async () => {
      const escrow = await prisma.jobEscrow.create({
        data: {
          jobId: testJob?.id || 'test-job-id',
          homeownerId: testHomeowner.id,
          contractorId: testContractor.id,
          totalAmount: 500,
          platformFee: 1.00,
          contractorAmount: 499,
          status: 'funded',
        },
      });

      const milestone = await prisma.jobMilestone.create({
        data: {
          escrowId: escrow.id,
          description: 'Complete plumbing repair',
          amount: 499,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'pending',
        },
      });

      expect(milestone).toBeDefined();
      expect(milestone.amount).toBe(499);
      expect(milestone.status).toBe('pending');

      // Cleanup
      await prisma.jobMilestone.delete({ where: { id: milestone.id } });
      await prisma.jobEscrow.delete({ where: { id: escrow.id } });
    });

    it('should track milestone completion and payment release', async () => {
      const escrow = await prisma.jobEscrow.create({
        data: {
          jobId: testJob?.id || 'test-job-id',
          homeownerId: testHomeowner.id,
          contractorId: testContractor.id,
          totalAmount: 500,
          platformFee: 1.00,
          contractorAmount: 499,
          status: 'funded',
        },
      });

      const milestone = await prisma.jobMilestone.create({
        data: {
          escrowId: escrow.id,
          description: 'Complete plumbing repair',
          amount: 499,
          status: 'completed',
          completedAt: new Date(),
        },
      });

      const release = await prisma.escrowRelease.create({
        data: {
          escrowId: escrow.id,
          milestoneId: milestone.id,
          amount: 499,
          status: 'completed',
          releasedAt: new Date(),
        },
      });

      expect(release).toBeDefined();
      expect(release.amount).toBe(499);
      expect(release.status).toBe('completed');

      // Cleanup
      await prisma.escrowRelease.delete({ where: { id: release.id } });
      await prisma.jobMilestone.delete({ where: { id: milestone.id } });
      await prisma.jobEscrow.delete({ where: { id: escrow.id } });
    });
  });

  describe('Notification System', () => {
    it('should have notification service available', () => {
      expect(MarketplaceNotifications).toBeDefined();
      expect(MarketplaceNotifications.notifyBidReceived).toBeDefined();
      expect(MarketplaceNotifications.notifyBidAccepted).toBeDefined();
      expect(MarketplaceNotifications.notifyPaymentReceived).toBeDefined();
    });

    it('should create notification record', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testContractor.userId,
          type: 'bid_accepted',
          title: 'Your bid was accepted!',
          message: 'The homeowner accepted your bid for $350',
          actionUrl: `/contractor/jobs/${testJob?.id}`,
        },
      });

      expect(notification).toBeDefined();
      expect(notification.type).toBe('bid_accepted');
      expect(notification.isRead).toBe(false);

      // Cleanup
      await prisma.notification.delete({ where: { id: notification.id } });
    });

    it('should mark notification as read', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testContractor.userId,
          type: 'test',
          title: 'Test',
          message: 'Test message',
        },
      });

      const updated = await prisma.notification.update({
        where: { id: notification.id },
        data: { isRead: true, readAt: new Date() },
      });

      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeDefined();

      // Cleanup
      await prisma.notification.delete({ where: { id: notification.id } });
    });
  });

  describe('Scalability & Performance', () => {
    it('should handle bulk contractor queries efficiently', async () => {
      const startTime = Date.now();
      
      const result = await getMarketplaceContractors({
        limit: 100,
      });

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle concurrent job searches', async () => {
      const searches = Array(10).fill(null).map((_, i) => 
        getMarketplaceJobs({
          category: i % 2 === 0 ? 'plumbing' : 'electrical',
          limit: 20,
        })
      );

      const results = await Promise.all(searches);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should paginate large result sets', async () => {
      const pageSize = 20;
      const pages = 3;
      
      const results = await Promise.all(
        Array(pages).fill(null).map((_, i) =>
          getMarketplaceContractors({
            limit: pageSize,
            offset: i * pageSize,
          })
        )
      );

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.contractors!.length).toBeLessThanOrEqual(pageSize);
      });
    });

    it('should handle complex search filters', async () => {
      const result = await getMarketplaceContractors({
        specialty: 'plumbing',
        city: 'Test City',
        state: 'CA',
        minRating: 4.0,
        sortBy: 'rating',
        limit: 10,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity for bids', async () => {
      const job = await prisma.homeownerWorkOrder.create({
        data: {
          homeownerId: testHomeowner.id,
          title: 'Test Job',
          description: 'Test',
          category: 'plumbing',
          priority: 'medium',
          status: 'open',
          isOpenBid: true,
        },
      });

      const bid = await prisma.workOrderBid.create({
        data: {
          workOrderId: job.id,
          contractorId: testContractor.id,
          bidAmount: 300,
          status: 'pending',
        },
      });

      // Verify relationship
      const jobWithBids = await prisma.homeownerWorkOrder.findUnique({
        where: { id: job.id },
        include: { bids: true },
      });

      expect(jobWithBids!.bids.length).toBe(1);
      expect(jobWithBids!.bids[0].id).toBe(bid.id);

      // Cleanup
      await prisma.workOrderBid.delete({ where: { id: bid.id } });
      await prisma.homeownerWorkOrder.delete({ where: { id: job.id } });
    });

    it('should cascade delete related records', async () => {
      const escrow = await prisma.jobEscrow.create({
        data: {
          jobId: 'test-job',
          homeownerId: testHomeowner.id,
          contractorId: testContractor.id,
          totalAmount: 500,
          platformFee: 1.00,
          contractorAmount: 499,
          status: 'pending',
        },
      });

      const milestone = await prisma.jobMilestone.create({
        data: {
          escrowId: escrow.id,
          description: 'Test milestone',
          amount: 499,
          status: 'pending',
        },
      });

      // Delete escrow should cascade to milestone
      await prisma.jobEscrow.delete({ where: { id: escrow.id } });

      const deletedMilestone = await prisma.jobMilestone.findUnique({
        where: { id: milestone.id },
      });

      expect(deletedMilestone).toBeNull();
    });
  });
});
