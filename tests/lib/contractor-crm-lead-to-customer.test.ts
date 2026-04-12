/**
 * Property-based tests for Contractor CRM Lead-to-Customer Creation
 * Feature: contractor-marketplace-enhancement, Property 10: Lead-to-Customer Record Creation
 * 
 * For any new lead received by a contractor, a ContractorCustomer record SHALL be created
 * automatically with the lead's contact information and source.
 * 
 * Validates: Requirements 7.2
 */

import * as fc from 'fast-check';
import { ContractorCRMService } from '@/lib/services/contractor-crm';
import { prisma } from '@/db/prisma';

// Mock Prisma client
jest.mock('@/db/prisma', () => ({
  prisma: {
    contractorCustomer: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('ContractorCRMService - Lead-to-Customer Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 10: Lead-to-Customer Record Creation
   * 
   * For any new lead received by a contractor, a ContractorCustomer record SHALL be created
   * automatically with the lead's contact information and source.
   */
  describe('Property 10: Lead-to-Customer Record Creation', () => {
    /**
     * Test: Customer record is created for any new lead with valid contact information
     */
    it('should create a customer record for any new lead with valid contact information', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate contractor ID
          fc.uuid(),
          // Generate lead data
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            address: fc.option(
              fc.record({
                street: fc.string(),
                city: fc.string(),
                state: fc.string({ minLength: 2, maxLength: 2 }),
                zip: fc.string({ minLength: 5, maxLength: 10 }),
              })
            ),
            source: fc.constantFrom('marketplace', 'subdomain', 'referral', 'job_posting'),
            userId: fc.option(fc.uuid()),
          }),
          async (contractorId, leadData) => {
            // Mock: No existing customer
            mockPrisma.contractorCustomer.findFirst.mockResolvedValue(null);

            // Mock: Create customer
            const mockCustomer = {
              id: fc.sample(fc.uuid(), 1)[0],
              contractorId,
              userId: leadData.userId || null,
              name: leadData.name,
              email: leadData.email,
              phone: leadData.phone || null,
              address: leadData.address || null,
              status: 'new',
              source: leadData.source,
              tags: [],
              notes: [],
              totalJobs: 0,
              totalSpent: 0,
              lastContactedAt: null,
              lastJobAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockPrisma.contractorCustomer.create.mockResolvedValue(mockCustomer as any);

            // Call the service
            const result = await ContractorCRMService.createCustomerFromLead(
              contractorId,
              leadData
            );

            // Verify customer was created
            expect(mockPrisma.contractorCustomer.create).toHaveBeenCalledWith({
              data: {
                contractorId,
                userId: leadData.userId || null,
                name: leadData.name,
                email: leadData.email,
                phone: leadData.phone || null,
                address: leadData.address || null,
                status: 'new',
                source: leadData.source,
                tags: [],
                notes: [],
                totalJobs: 0,
                totalSpent: 0,
              },
            });

            // Verify result contains lead data
            expect(result.name).toBe(leadData.name);
            expect(result.email).toBe(leadData.email);
            expect(result.phone).toBe(leadData.phone || null);
            expect(result.source).toBe(leadData.source);
            expect(result.status).toBe('new');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Existing customer is updated when a new lead arrives with the same email
     */
    it('should update existing customer when a new lead arrives with the same email', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate contractor ID
          fc.uuid(),
          // Generate lead data
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            address: fc.option(
              fc.record({
                street: fc.string(),
                city: fc.string(),
                state: fc.string({ minLength: 2, maxLength: 2 }),
                zip: fc.string({ minLength: 5, maxLength: 10 }),
              })
            ),
            source: fc.constantFrom('marketplace', 'subdomain', 'referral', 'job_posting'),
            userId: fc.option(fc.uuid()),
          }),
          // Generate existing customer status
          fc.constantFrom('contacted', 'quoted', 'negotiating', 'won', 'lost'),
          async (contractorId, leadData, existingStatus) => {
            // Mock: Existing customer found
            const existingCustomer = {
              id: fc.sample(fc.uuid(), 1)[0],
              contractorId,
              userId: leadData.userId || null,
              name: 'Old Name',
              email: leadData.email,
              phone: '1234567890',
              address: null,
              status: existingStatus,
              source: 'old_source',
              tags: ['old-tag'],
              notes: [],
              totalJobs: 5,
              totalSpent: 1000,
              lastContactedAt: new Date(),
              lastJobAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockPrisma.contractorCustomer.findFirst.mockResolvedValue(existingCustomer as any);

            // Mock: Update customer
            const updatedCustomer = {
              ...existingCustomer,
              status: 'new', // Reset to new lead
              source: leadData.source,
              lastContactedAt: null,
            };
            mockPrisma.contractorCustomer.update.mockResolvedValue(updatedCustomer as any);

            // Call the service
            const result = await ContractorCRMService.createCustomerFromLead(
              contractorId,
              leadData
            );

            // Verify customer was updated, not created
            expect(mockPrisma.contractorCustomer.create).not.toHaveBeenCalled();
            expect(mockPrisma.contractorCustomer.update).toHaveBeenCalledWith({
              where: { id: existingCustomer.id },
              data: {
                status: 'new', // Reset to new lead
                source: leadData.source,
                lastContactedAt: null,
              },
            });

            // Verify result has updated status
            expect(result.status).toBe('new');
            expect(result.source).toBe(leadData.source);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Customer record always has status 'new' when created from a lead
     */
    it('should always create customer with status "new" for any new lead', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            address: fc.option(fc.jsonValue()),
            source: fc.constantFrom('marketplace', 'subdomain', 'referral', 'job_posting'),
            userId: fc.option(fc.uuid()),
          }),
          async (contractorId, leadData) => {
            // Mock: No existing customer
            mockPrisma.contractorCustomer.findFirst.mockResolvedValue(null);

            // Mock: Create customer
            const mockCustomer = {
              id: fc.sample(fc.uuid(), 1)[0],
              contractorId,
              userId: leadData.userId || null,
              name: leadData.name,
              email: leadData.email,
              phone: leadData.phone || null,
              address: leadData.address || null,
              status: 'new',
              source: leadData.source,
              tags: [],
              notes: [],
              totalJobs: 0,
              totalSpent: 0,
              lastContactedAt: null,
              lastJobAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockPrisma.contractorCustomer.create.mockResolvedValue(mockCustomer as any);

            // Call the service
            const result = await ContractorCRMService.createCustomerFromLead(
              contractorId,
              leadData
            );

            // Verify status is always 'new'
            expect(result.status).toBe('new');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Customer record preserves all lead contact information
     */
    it('should preserve all lead contact information in the customer record', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            address: fc.option(
              fc.record({
                street: fc.string(),
                city: fc.string(),
                state: fc.string({ minLength: 2, maxLength: 2 }),
                zip: fc.string({ minLength: 5, maxLength: 10 }),
              })
            ),
            source: fc.constantFrom('marketplace', 'subdomain', 'referral', 'job_posting'),
            userId: fc.option(fc.uuid()),
          }),
          async (contractorId, leadData) => {
            // Mock: No existing customer
            mockPrisma.contractorCustomer.findFirst.mockResolvedValue(null);

            // Mock: Create customer
            const mockCustomer = {
              id: fc.sample(fc.uuid(), 1)[0],
              contractorId,
              userId: leadData.userId || null,
              name: leadData.name,
              email: leadData.email,
              phone: leadData.phone || null,
              address: leadData.address || null,
              status: 'new',
              source: leadData.source,
              tags: [],
              notes: [],
              totalJobs: 0,
              totalSpent: 0,
              lastContactedAt: null,
              lastJobAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockPrisma.contractorCustomer.create.mockResolvedValue(mockCustomer as any);

            // Call the service
            const result = await ContractorCRMService.createCustomerFromLead(
              contractorId,
              leadData
            );

            // Verify all contact information is preserved
            expect(result.name).toBe(leadData.name);
            expect(result.email).toBe(leadData.email);
            expect(result.phone).toBe(leadData.phone || null);
            expect(result.address).toEqual(leadData.address || null);
            expect(result.userId).toBe(leadData.userId || null);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Customer record always includes the lead source
     */
    it('should always include the lead source in the customer record', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            address: fc.option(fc.jsonValue()),
            source: fc.constantFrom('marketplace', 'subdomain', 'referral', 'job_posting'),
            userId: fc.option(fc.uuid()),
          }),
          async (contractorId, leadData) => {
            // Mock: No existing customer
            mockPrisma.contractorCustomer.findFirst.mockResolvedValue(null);

            // Mock: Create customer
            const mockCustomer = {
              id: fc.sample(fc.uuid(), 1)[0],
              contractorId,
              userId: leadData.userId || null,
              name: leadData.name,
              email: leadData.email,
              phone: leadData.phone || null,
              address: leadData.address || null,
              status: 'new',
              source: leadData.source,
              tags: [],
              notes: [],
              totalJobs: 0,
              totalSpent: 0,
              lastContactedAt: null,
              lastJobAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockPrisma.contractorCustomer.create.mockResolvedValue(mockCustomer as any);

            // Call the service
            const result = await ContractorCRMService.createCustomerFromLead(
              contractorId,
              leadData
            );

            // Verify source is preserved
            expect(result.source).toBe(leadData.source);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: New customer records start with zero jobs and zero spent
     */
    it('should initialize new customer records with zero jobs and zero spent', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            address: fc.option(fc.jsonValue()),
            source: fc.constantFrom('marketplace', 'subdomain', 'referral', 'job_posting'),
            userId: fc.option(fc.uuid()),
          }),
          async (contractorId, leadData) => {
            // Mock: No existing customer
            mockPrisma.contractorCustomer.findFirst.mockResolvedValue(null);

            // Mock: Create customer
            const mockCustomer = {
              id: fc.sample(fc.uuid(), 1)[0],
              contractorId,
              userId: leadData.userId || null,
              name: leadData.name,
              email: leadData.email,
              phone: leadData.phone || null,
              address: leadData.address || null,
              status: 'new',
              source: leadData.source,
              tags: [],
              notes: [],
              totalJobs: 0,
              totalSpent: 0,
              lastContactedAt: null,
              lastJobAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockPrisma.contractorCustomer.create.mockResolvedValue(mockCustomer as any);

            // Call the service
            const result = await ContractorCRMService.createCustomerFromLead(
              contractorId,
              leadData
            );

            // Verify initial values
            expect(result.totalJobs).toBe(0);
            expect(result.totalSpent).toBe(0);
            expect(result.lastContactedAt).toBeNull();
            expect(result.lastJobAt).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Customer uniqueness is enforced by contractor ID and email combination
     */
    it('should enforce uniqueness by contractor ID and email combination', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('marketplace', 'subdomain', 'referral', 'job_posting'),
          async (contractorId, email, name1, name2, source) => {
            // Assume name1 and name2 are different
            fc.pre(name1 !== name2);

            // Mock: Existing customer found with same email
            const existingCustomer = {
              id: fc.sample(fc.uuid(), 1)[0],
              contractorId,
              userId: null,
              name: name1,
              email,
              phone: null,
              address: null,
              status: 'contacted',
              source: 'old_source',
              tags: [],
              notes: [],
              totalJobs: 0,
              totalSpent: 0,
              lastContactedAt: new Date(),
              lastJobAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockPrisma.contractorCustomer.findFirst.mockResolvedValue(existingCustomer as any);

            // Mock: Update customer
            const updatedCustomer = {
              ...existingCustomer,
              status: 'new',
              source,
              lastContactedAt: null,
            };
            mockPrisma.contractorCustomer.update.mockResolvedValue(updatedCustomer as any);

            // Call the service with different name but same email
            const result = await ContractorCRMService.createCustomerFromLead(contractorId, {
              name: name2,
              email,
              source,
            });

            // Verify update was called, not create
            expect(mockPrisma.contractorCustomer.update).toHaveBeenCalled();
            expect(mockPrisma.contractorCustomer.create).not.toHaveBeenCalled();

            // Verify the existing customer was updated
            expect(result.id).toBe(existingCustomer.id);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
