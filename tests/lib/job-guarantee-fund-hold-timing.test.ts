/**
 * Property-Based Test for Job Guarantee Fund Hold Timing
 * Feature: contractor-marketplace-enhancement, Property 7: Job Guarantee Fund Hold Timing
 * Validates: Requirements 6.1, 6.2
 * 
 * Property: For any completed job, funds SHALL be held for exactly 7 days before automatic 
 * release. If a dispute is filed within 7 days, the hold status SHALL change to 'disputed' 
 * and release SHALL be paused.
 */

import * as fc from 'fast-check';
import { prismaBase as db } from '@/db/prisma-base';
import { jobGuaranteeService } from '@/lib/services/job-guarantee';
import { addDays, differenceInDays } from 'date-fns';
import { randomUUID } from 'crypto';

describe('Job Guarantee Fund Hold Timing', () => {
  // Helper to create test users
  async function createTestUsers() {
    const contractor = await db.User.create({
      data: {
        email: `contractor-${Date.now()}-${Math.random()}@example.com`,
        name: 'Test Contractor',
        role: 'contractor',
      },
    });

    const customer = await db.User.create({
      data: {
        email: `customer-${Date.now()}-${Math.random()}@example.com`,
        name: 'Test Customer',
        role: 'user',
      },
    });

    const landlord = await db.User.create({
      data: {
        email: `landlord-${Date.now()}-${Math.random()}@example.com`,
        name: 'Test Landlord',
        role: 'landlord',
      },
    });

    // Create landlord profile
    const landlordProfile = await db.landlord.create({
      data: {
        name: 'Test Landlord',
        subdomain: `test-landlord-${Date.now()}-${Math.random()}`.substring(0, 50),
        owner: {
          connect: { id: landlord.id },
        },
      },
    });

    return { contractor, customer, landlord, landlordProfile };
  }

  // Cleanup helper
  async function cleanup(
    contractorId: string,
    customerId: string,
    landlordId: string,
    landlordProfileId: string
  ) {
    // Delete in correct order to respect foreign key constraints
    await db.disputeTimeline.deleteMany({
      where: {
        dispute: {
          landlordId: landlordProfileId,
        },
      },
    });

    await db.disputeEvidence.deleteMany({
      where: {
        dispute: {
          landlordId: landlordProfileId,
        },
      },
    });

    await db.disputeMessage.deleteMany({
      where: {
        dispute: {
          landlordId: landlordProfileId,
        },
      },
    });

    await db.dispute.deleteMany({
      where: {
        landlordId: landlordProfileId,
      },
    });

    await db.jobGuaranteeHold.deleteMany({
      where: {
        OR: [{ contractorId }, { customerId }],
      },
    });

    await db.landlord.delete({
      where: { id: landlordProfileId },
    });

    await db.User.deleteMany({
      where: {
        id: { in: [contractorId, customerId, landlordId] },
      },
    });
  }

  test('Property 7a: Hold release date is exactly 7 days after creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 100, max: 10000, noNaN: true }), // Random amount between $100 and $10,000
        async (amount) => {
          const { contractor, customer, landlord, landlordProfile } =
            await createTestUsers();

          try {
            const jobId = randomUUID();

            // Create hold
            const result = await jobGuaranteeService.holdFunds({
              jobId,
              contractorId: contractor.id,
              customerId: customer.id,
              amount,
            });

            // Verify release date is exactly 7 days from now
            const now = new Date();
            const daysDiff = differenceInDays(result.releaseAt, now);

            // Should be 7 days (allow small variance for test execution time)
            expect(daysDiff).toBeGreaterThanOrEqual(6);
            expect(daysDiff).toBeLessThanOrEqual(7);

            // Verify hold status is 'held'
            expect(result.status).toBe('held');
          } finally {
            await cleanup(
              contractor.id,
              customer.id,
              landlord.id,
              landlordProfile.id
            );
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  test('Property 7b: Funds cannot be released before 7 days', async () => {
    const { contractor, customer, landlord, landlordProfile } =
      await createTestUsers();

    try {
      const jobId = randomUUID();
      const amount = 500;

      // Create hold
      const result = await jobGuaranteeService.holdFunds({
        jobId,
        contractorId: contractor.id,
        customerId: customer.id,
        amount,
      });

      // Try to release immediately (should fail)
      await expect(
        jobGuaranteeService.releaseFunds({
          holdId: result.holdId,
          contractorStripeAccountId: 'acct_test',
        })
      ).rejects.toThrow('Release date has not been reached');

      // Verify hold is still in 'held' status
      const hold = await jobGuaranteeService.getHold(result.holdId);
      expect(hold?.status).toBe('held');
    } finally {
      await cleanup(
        contractor.id,
        customer.id,
        landlord.id,
        landlordProfile.id
      );
    }
  }, 30000);

  test('Property 7c: Dispute filed within 7 days changes status to disputed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 100, max: 2500, noNaN: true }), // Amount within guarantee coverage
        fc.constantFrom('quality', 'payment', 'timeline', 'scope'),
        fc.constantFrom(
          'work_not_completed',
          'poor_quality',
          'overcharge',
          'damage'
        ),
        async (amount, type, category) => {
          const { contractor, customer, landlord, landlordProfile } =
            await createTestUsers();

          try {
            const jobId = randomUUID();

            // Create hold
            const holdResult = await jobGuaranteeService.holdFunds({
              jobId,
              contractorId: contractor.id,
              customerId: customer.id,
              amount,
            });

            // File dispute within 7 days
            const disputeResult = await jobGuaranteeService.initiateDispute({
              holdId: holdResult.holdId,
              customerId: customer.id,
              landlordId: landlordProfile.id,
              type,
              category,
              title: 'Test Dispute',
              description: 'Testing dispute filing',
              desiredResolution: 'Refund',
            });

            // Verify hold status changed to 'disputed'
            const hold = await jobGuaranteeService.getHold(holdResult.holdId);
            expect(hold?.status).toBe('disputed');
            expect(hold?.disputeId).toBe(disputeResult.disputeId);

            // Verify dispute was created
            const dispute = await db.dispute.findUnique({
              where: { id: disputeResult.disputeId },
            });
            expect(dispute).not.toBeNull();
            expect(dispute?.status).toBe('open');
          } finally {
            await cleanup(
              contractor.id,
              customer.id,
              landlord.id,
              landlordProfile.id
            );
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  test('Property 7d: Disputed hold cannot be released', async () => {
    const { contractor, customer, landlord, landlordProfile } =
      await createTestUsers();

    try {
      const jobId = randomUUID();
      const amount = 1000;

      // Create hold
      const holdResult = await jobGuaranteeService.holdFunds({
        jobId,
        contractorId: contractor.id,
        customerId: customer.id,
        amount,
      });

      // File dispute
      await jobGuaranteeService.initiateDispute({
        holdId: holdResult.holdId,
        customerId: customer.id,
        landlordId: landlordProfile.id,
        type: 'quality',
        category: 'poor_quality',
        title: 'Quality Issue',
        description: 'Work not done properly',
        desiredResolution: 'Refund',
      });

      // Manually update release date to past (simulate 7 days passed)
      await db.jobGuaranteeHold.update({
        where: { id: holdResult.holdId },
        data: {
          releaseAt: addDays(new Date(), -1), // Yesterday
        },
      });

      // Try to release (should fail because status is 'disputed')
      await expect(
        jobGuaranteeService.releaseFunds({
          holdId: holdResult.holdId,
          contractorStripeAccountId: 'acct_test',
        })
      ).rejects.toThrow('Cannot release funds with status: disputed');
    } finally {
      await cleanup(
        contractor.id,
        customer.id,
        landlord.id,
        landlordProfile.id
      );
    }
  }, 30000);

  test('Property 7e: Dispute cannot be filed after 7 days', async () => {
    const { contractor, customer, landlord, landlordProfile } =
      await createTestUsers();

    try {
      const jobId = randomUUID();
      const amount = 800;

      // Create hold
      const holdResult = await jobGuaranteeService.holdFunds({
        jobId,
        contractorId: contractor.id,
        customerId: customer.id,
        amount,
      });

      // Manually update release date to past (simulate 8 days passed)
      await db.jobGuaranteeHold.update({
        where: { id: holdResult.holdId },
        data: {
          releaseAt: addDays(new Date(), -1), // Yesterday
        },
      });

      // Try to file dispute (should fail)
      await expect(
        jobGuaranteeService.initiateDispute({
          holdId: holdResult.holdId,
          customerId: customer.id,
          landlordId: landlordProfile.id,
          type: 'quality',
          category: 'poor_quality',
          title: 'Late Dispute',
          description: 'Trying to dispute after window',
          desiredResolution: 'Refund',
        })
      ).rejects.toThrow('Dispute window has expired');
    } finally {
      await cleanup(
        contractor.id,
        customer.id,
        landlord.id,
        landlordProfile.id
      );
    }
  }, 30000);

  test('Property 7f: Multiple holds can exist for same contractor', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.double({ min: 100, max: 5000, noNaN: true }), { minLength: 2, maxLength: 5 }),
        async (amounts) => {
          const { contractor, customer, landlord, landlordProfile } =
            await createTestUsers();

          try {
            const holdIds: string[] = [];

            // Create multiple holds
            for (const amount of amounts) {
              const jobId = randomUUID();
              const result = await jobGuaranteeService.holdFunds({
                jobId,
                contractorId: contractor.id,
                customerId: customer.id,
                amount,
              });
              holdIds.push(result.holdId);
            }

            // Verify all holds exist and are independent
            for (let i = 0; i < holdIds.length; i++) {
              const hold = await jobGuaranteeService.getHold(holdIds[i]);
              expect(hold).not.toBeNull();
              expect(hold?.status).toBe('held');
              expect(hold?.amount.toNumber()).toBeCloseTo(amounts[i], 2);
            }

            // Verify each has its own 7-day release date
            const holds = await jobGuaranteeService.getContractorHolds(
              contractor.id
            );
            expect(holds.length).toBe(amounts.length);
          } finally {
            await cleanup(
              contractor.id,
              customer.id,
              landlord.id,
              landlordProfile.id
            );
          }
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);

  test('Property 7g: Hold amount is preserved throughout lifecycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 100, max: 10000, noNaN: true }),
        async (amount) => {
          const { contractor, customer, landlord, landlordProfile } =
            await createTestUsers();

          try {
            const jobId = randomUUID();

            // Create hold
            const result = await jobGuaranteeService.holdFunds({
              jobId,
              contractorId: contractor.id,
              customerId: customer.id,
              amount,
            });

            // Verify amount immediately after creation
            expect(result.amount).toBeCloseTo(amount, 2);

            // Retrieve hold and verify amount
            const hold = await jobGuaranteeService.getHold(result.holdId);
            expect(hold?.amount.toNumber()).toBeCloseTo(amount, 2);

            // File dispute and verify amount unchanged
            await jobGuaranteeService.initiateDispute({
              holdId: result.holdId,
              customerId: customer.id,
              landlordId: landlordProfile.id,
              type: 'quality',
              category: 'poor_quality',
              title: 'Test',
              description: 'Test',
              desiredResolution: 'Refund',
            });

            const holdAfterDispute = await jobGuaranteeService.getHold(
              result.holdId
            );
            expect(holdAfterDispute?.amount.toNumber()).toBeCloseTo(amount, 2);
          } finally {
            await cleanup(
              contractor.id,
              customer.id,
              landlord.id,
              landlordProfile.id
            );
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});
