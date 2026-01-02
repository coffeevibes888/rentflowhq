/**
 * Property Tests for Lease Template Service
 * Feature: lease-workflow
 * 
 * These tests validate universal correctness properties across many generated inputs
 */

import * as fc from 'fast-check';

// Mock prisma before importing the service
const mockPrisma = {
  leaseTemplate: {
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  propertyLeaseTemplate: {
    create: jest.fn(),
    createMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock('@/db/prisma', () => ({
  prisma: mockPrisma,
}));

import {
  resolveTemplateForProperty,
  createTemplate,
  assignTemplateToProperties,
  setDefaultTemplate,
} from '@/lib/services/lease-template.service';

// Generators for property-based tests
const uuidArb = fc.uuid();
const templateNameArb = fc.string({ minLength: 1, maxLength: 100 });
const templateTypeArb = fc.constantFrom('builder', 'uploaded_pdf') as fc.Arbitrary<'builder' | 'uploaded_pdf'>;

const builderConfigArb = fc.record({
  defaultLeaseDuration: fc.integer({ min: 0, max: 24 }),
  autoRenewal: fc.boolean(),
  renewalNoticeDays: fc.integer({ min: 0, max: 90 }),
  rentDueDay: fc.integer({ min: 1, max: 28 }),
  gracePeriodDays: fc.integer({ min: 0, max: 15 }),
  lateFeePercent: fc.float({ min: 0, max: 10 }),
  securityDepositMonths: fc.integer({ min: 0, max: 3 }),
  tenantPaysUtilities: fc.array(fc.constantFrom('electric', 'gas', 'water', 'internet')),
  landlordPaysUtilities: fc.array(fc.constantFrom('trash', 'sewer')),
  petsAllowed: fc.boolean(),
  smokingAllowed: fc.boolean(),
  quietHoursStart: fc.constantFrom('22:00', '23:00'),
  quietHoursEnd: fc.constantFrom('07:00', '08:00'),
  leadPaintDisclosure: fc.boolean(),
  moldDisclosure: fc.boolean(),
  bedBugDisclosure: fc.boolean(),
});

const templateArb = fc.record({
  id: uuidArb,
  landlordId: uuidArb,
  name: templateNameArb,
  type: templateTypeArb,
  isDefault: fc.boolean(),
  builderConfig: fc.option(builderConfigArb, { nil: null }),
  pdfUrl: fc.option(fc.webUrl(), { nil: null }),
  signatureFields: fc.constant(null),
  mergeFields: fc.constant(null),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  properties: fc.constant([]),
});

describe('Lease Template Service - Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 6: Template Resolution
   * Validates: Requirements 3.4, 3.6, 4.8
   * 
   * For any property, the template resolution function SHALL return:
   * (1) the property-specific template if one exists,
   * (2) the landlord's default template if no property-specific template exists, or
   * (3) null if neither exists.
   * Unassigned templates SHALL never be returned.
   */
  describe('Property 6: Template Resolution', () => {
    it('returns property-specific template when one exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          uuidArb,
          templateArb,
          async (propertyId, landlordId, template) => {
            // Setup: property has a specific template assigned
            const propertyTemplate = { ...template, landlordId };
            mockPrisma.propertyLeaseTemplate.findUnique.mockResolvedValue({
              leaseTemplate: propertyTemplate,
            });

            const result = await resolveTemplateForProperty(propertyId, landlordId);

            expect(result).toEqual(propertyTemplate);
            expect(mockPrisma.propertyLeaseTemplate.findUnique).toHaveBeenCalledWith({
              where: { propertyId },
              include: {
                leaseTemplate: {
                  include: {
                    properties: { include: { property: true } },
                  },
                },
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns default template when no property-specific template exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          uuidArb,
          templateArb,
          async (propertyId, landlordId, template) => {
            // Setup: no property-specific template, but landlord has default
            const defaultTemplate = { ...template, landlordId, isDefault: true };
            mockPrisma.propertyLeaseTemplate.findUnique.mockResolvedValue(null);
            mockPrisma.leaseTemplate.findFirst.mockResolvedValue(defaultTemplate);

            const result = await resolveTemplateForProperty(propertyId, landlordId);

            expect(result).toEqual(defaultTemplate);
            expect(mockPrisma.leaseTemplate.findFirst).toHaveBeenCalledWith({
              where: { landlordId, isDefault: true },
              include: {
                properties: { include: { property: true } },
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns null when no template exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          uuidArb,
          async (propertyId, landlordId) => {
            // Setup: no property-specific template and no default
            mockPrisma.propertyLeaseTemplate.findUnique.mockResolvedValue(null);
            mockPrisma.leaseTemplate.findFirst.mockResolvedValue(null);

            const result = await resolveTemplateForProperty(propertyId, landlordId);

            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('prioritizes property-specific over default template', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          uuidArb,
          templateArb,
          templateArb,
          async (propertyId, landlordId, propertyTemplate, defaultTemplate) => {
            // Setup: both property-specific and default exist
            const specificTemplate = { ...propertyTemplate, landlordId, isDefault: false };
            const landlordDefault = { ...defaultTemplate, landlordId, isDefault: true };
            
            mockPrisma.propertyLeaseTemplate.findUnique.mockResolvedValue({
              leaseTemplate: specificTemplate,
            });
            mockPrisma.leaseTemplate.findFirst.mockResolvedValue(landlordDefault);

            const result = await resolveTemplateForProperty(propertyId, landlordId);

            // Should return property-specific, not default
            expect(result).toEqual(specificTemplate);
            // Should NOT have queried for default since property-specific was found
            expect(mockPrisma.leaseTemplate.findFirst).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Template-Property Association
   * Validates: Requirements 3.1, 3.3, 3.4
   * 
   * For any lease template created via the Lease Builder for a specific property,
   * the template SHALL be automatically associated with that property.
   * For any uploaded PDF template without explicit property selection,
   * the template SHALL NOT be associated with any property.
   */
  describe('Property 5: Template-Property Association', () => {
    it('builder templates can be assigned to properties', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          uuidArb,
          fc.array(uuidArb, { minLength: 1, maxLength: 5 }),
          templateNameArb,
          builderConfigArb,
          async (templateId, landlordId, propertyIds, name, builderConfig) => {
            // Setup: create template returns the template
            const createdTemplate = {
              id: templateId,
              landlordId,
              name,
              type: 'builder',
              isDefault: false,
              builderConfig,
              pdfUrl: null,
              signatureFields: null,
              mergeFields: null,
              properties: [],
            };

            mockPrisma.leaseTemplate.create.mockResolvedValue(createdTemplate);
            mockPrisma.propertyLeaseTemplate.deleteMany.mockResolvedValue({ count: 0 });
            mockPrisma.propertyLeaseTemplate.createMany.mockResolvedValue({ count: propertyIds.length });
            mockPrisma.leaseTemplate.findUnique.mockResolvedValue({
              ...createdTemplate,
              properties: propertyIds.map(pid => ({ propertyId: pid, property: { id: pid } })),
            });

            const result = await createTemplate({
              landlordId,
              name,
              type: 'builder',
              builderConfig,
              propertyIds,
            });

            // Verify property assignments were created
            expect(mockPrisma.propertyLeaseTemplate.deleteMany).toHaveBeenCalledWith({
              where: { propertyId: { in: propertyIds } },
            });
            expect(mockPrisma.propertyLeaseTemplate.createMany).toHaveBeenCalledWith({
              data: propertyIds.map((propertyId: string) => ({
                propertyId,
                leaseTemplateId: templateId,
              })),
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('uploaded PDF templates without propertyIds are not assigned to any property', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          uuidArb,
          templateNameArb,
          fc.webUrl(),
          async (templateId, landlordId, name, pdfUrl) => {
            // Setup: create template without propertyIds
            const createdTemplate = {
              id: templateId,
              landlordId,
              name,
              type: 'uploaded_pdf',
              isDefault: false,
              builderConfig: null,
              pdfUrl,
              signatureFields: null,
              mergeFields: null,
              properties: [],
            };

            mockPrisma.leaseTemplate.create.mockResolvedValue(createdTemplate);

            const result = await createTemplate({
              landlordId,
              name,
              type: 'uploaded_pdf',
              pdfUrl,
              // No propertyIds provided
            });

            // Verify no property assignments were created
            expect(mockPrisma.propertyLeaseTemplate.deleteMany).not.toHaveBeenCalled();
            expect(mockPrisma.propertyLeaseTemplate.createMany).not.toHaveBeenCalled();
            expect(result.properties).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('assigning template to properties removes previous assignments for those properties', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          fc.array(uuidArb, { minLength: 1, maxLength: 5 }),
          async (templateId, propertyIds) => {
            // Setup
            mockPrisma.propertyLeaseTemplate.deleteMany.mockResolvedValue({ count: propertyIds.length });
            mockPrisma.propertyLeaseTemplate.createMany.mockResolvedValue({ count: propertyIds.length });
            mockPrisma.leaseTemplate.findUnique.mockResolvedValue({
              id: templateId,
              properties: propertyIds.map(pid => ({ propertyId: pid })),
            });

            await assignTemplateToProperties(templateId, propertyIds);

            // Verify old assignments were deleted first
            expect(mockPrisma.propertyLeaseTemplate.deleteMany).toHaveBeenCalledWith({
              where: { propertyId: { in: propertyIds } },
            });

            // Then new assignments were created
            expect(mockPrisma.propertyLeaseTemplate.createMany).toHaveBeenCalledWith({
              data: propertyIds.map((propertyId: string) => ({
                propertyId,
                leaseTemplateId: templateId,
              })),
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional test: Setting default template
   */
  describe('Default Template Management', () => {
    it('setting a template as default unsets other defaults for the same landlord', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          uuidArb,
          async (templateId, landlordId) => {
            // Setup
            mockPrisma.leaseTemplate.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.leaseTemplate.update.mockResolvedValue({
              id: templateId,
              landlordId,
              isDefault: true,
              properties: [],
            });

            await setDefaultTemplate(templateId, landlordId);

            // Verify other defaults were unset
            expect(mockPrisma.leaseTemplate.updateMany).toHaveBeenCalledWith({
              where: { landlordId, isDefault: true },
              data: { isDefault: false },
            });

            // Verify this template was set as default
            expect(mockPrisma.leaseTemplate.update).toHaveBeenCalledWith({
              where: { id: templateId },
              data: { isDefault: true },
              include: {
                properties: { include: { property: true } },
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
