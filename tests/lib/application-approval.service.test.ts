/**
 * Property Tests for Application Approval Service
 * Feature: lease-workflow
 * 
 * These tests validate universal correctness properties across many generated inputs
 * for the application approval workflow.
 */

import * as fc from 'fast-check';

// Mock dependencies
const mockPrisma = {
  rentalApplication: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  unit: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  legalDocument: {
    create: jest.fn(),
  },
  lease: {
    create: jest.fn(),
  },
  documentSignatureRequest: {
    create: jest.fn(),
  },
  propertyLeaseTemplate: {
    findUnique: jest.fn(),
  },
  leaseTemplate: {
    findFirst: jest.fn(),
  },
};

const mockResolveTemplateForProperty = jest.fn();
const mockBuildLeaseDataFromRecords = jest.fn();
const mockGenerateLeaseHtml = jest.fn();
const mockHtmlToPdfBuffer = jest.fn();
const mockUploadToCloudinary = jest.fn();
const mockSendBrandedEmail = jest.fn();
const mockCreateNotification = jest.fn();

// Set up mocks before any imports
jest.mock('@/db/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/services/lease-template.service', () => ({
  resolveTemplateForProperty: mockResolveTemplateForProperty,
}));

jest.mock('@/lib/services/lease-builder', () => ({
  generateLeaseHtml: mockGenerateLeaseHtml,
  buildLeaseDataFromRecords: mockBuildLeaseDataFromRecords,
}));

jest.mock('@/lib/services/pdf', () => ({
  htmlToPdfBuffer: mockHtmlToPdfBuffer,
}));

jest.mock('@/lib/cloudinary', () => ({
  uploadToCloudinary: mockUploadToCloudinary,
}));

jest.mock('@/lib/services/email-service', () => ({
  sendBrandedEmail: mockSendBrandedEmail,
}));

jest.mock('@/lib/services/notification-service', () => ({
  NotificationService: {
    createNotification: mockCreateNotification,
  },
}));

// Generators for property-based tests
const uuidArb = fc.uuid();
const emailArb = fc.emailAddress();
const phoneArb = fc.stringMatching(/^\d{10}$/);
const nameArb = fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0);
const addressArb = fc.record({
  street: fc.string({ minLength: 5, maxLength: 100 }),
  city: fc.string({ minLength: 2, maxLength: 50 }),
  state: fc.constantFrom('CA', 'NY', 'TX', 'FL', 'NV', 'WA'),
  zipCode: fc.stringMatching(/^\d{5}$/),
});
const rentAmountArb = fc.integer({ min: 500, max: 10000 });
const dateArb = fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') });
const unitTypeArb = fc.constantFrom('apartment', 'house', 'condo', 'studio', 'room');

// Complex generators
const landlordArb = fc.record({
  id: uuidArb,
  name: nameArb,
  companyName: fc.option(nameArb, { nil: null }),
  companyAddress: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: null }),
  companyEmail: fc.option(emailArb, { nil: null }),
  companyPhone: fc.option(phoneArb, { nil: null }),
  securityDepositMonths: fc.integer({ min: 0, max: 3 }),
  petDepositEnabled: fc.boolean(),
  petDepositAmount: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
  petRentEnabled: fc.boolean(),
  petRentAmount: fc.option(fc.integer({ min: 0, max: 200 }), { nil: null }),
  cleaningFeeEnabled: fc.boolean(),
  cleaningFeeAmount: fc.option(fc.integer({ min: 0, max: 500 }), { nil: null }),
  ownerUserId: uuidArb,
  owner: fc.record({ email: emailArb, name: nameArb }),
});

const propertyArb = fc.record({
  id: uuidArb,
  name: nameArb,
  slug: fc.string({ minLength: 3, maxLength: 30 }),
  address: addressArb,
  amenities: fc.array(fc.constantFrom('parking', 'pool', 'gym', 'laundry', 'storage')),
});

const unitArb = fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 20 }),
  type: unitTypeArb,
  rentAmount: rentAmountArb,
  isAvailable: fc.constant(true),
});

const tenantArb = fc.record({
  id: uuidArb,
  name: nameArb,
  email: emailArb,
});

const applicationArb = fc.record({
  id: uuidArb,
  fullName: nameArb,
  email: emailArb,
  phone: phoneArb,
  status: fc.constant('pending'),
});

const templateArb = fc.record({
  id: uuidArb,
  name: nameArb,
  type: fc.constantFrom('builder', 'uploaded_pdf'),
  isDefault: fc.boolean(),
});

// Helper to set up common mocks for successful approval
function setupSuccessfulApprovalMocks(
  application: any,
  tenant: any,
  property: any,
  unit: any,
  landlord: any,
  template: any,
  startDate: Date
) {
  const fullApplication = {
    ...application,
    applicant: tenant,
    unit: {
      ...unit,
      property: {
        ...property,
        landlord,
      },
      leases: [],
    },
  };

  const fullUnit = {
    ...unit,
    property: {
      ...property,
      landlord,
    },
    leases: [],
  };

  mockPrisma.rentalApplication.findUnique.mockResolvedValue(fullApplication);
  mockPrisma.unit.findUnique.mockResolvedValue(fullUnit);
  mockResolveTemplateForProperty.mockResolvedValue(template);
  
  mockGenerateLeaseHtml.mockReturnValue('<html>Lease Content</html>');
  mockBuildLeaseDataFromRecords.mockImplementation((params: any) => ({
    landlordLegalName: params.landlord.name,
    tenantNames: [params.tenant.name],
    tenantEmails: [params.tenant.email],
    propertyAddress: `${params.property.address.street}, ${params.property.address.city}`,
    unitNumber: params.unit.name,
    monthlyRent: params.unit.rentAmount,
    leaseStartDate: params.leaseTerms.startDate,
    leaseEndDate: params.leaseTerms.endDate,
  }));
  mockHtmlToPdfBuffer.mockResolvedValue(Buffer.from('PDF content'));
  mockUploadToCloudinary.mockResolvedValue({ secure_url: 'https://cloudinary.com/lease.pdf' });
  mockSendBrandedEmail.mockResolvedValue(undefined);
  mockCreateNotification.mockResolvedValue(undefined);
  
  mockPrisma.legalDocument.create.mockResolvedValue({ id: 'doc-id' });
  mockPrisma.lease.create.mockResolvedValue({
    id: 'lease-id',
    status: 'pending_signature',
    startDate,
    endDate: null,
    rentAmount: Number(unit.rentAmount),
  });
  mockPrisma.documentSignatureRequest.create.mockResolvedValue({ id: 'sig-req-id' });
  mockPrisma.rentalApplication.update.mockResolvedValue({ ...application, status: 'approved' });
  mockPrisma.unit.update.mockResolvedValue({ ...unit, isAvailable: false });
}

describe('Application Approval Service - Property Tests', () => {
  // Import the service inside describe to ensure mocks are set up
  let approveApplication: any;
  let isUnitAvailable: any;
  let ApprovalErrorCodes: any;

  beforeAll(async () => {
    const service = await import('@/lib/services/application-approval.service');
    approveApplication = service.approveApplication;
    isUnitAvailable = service.isUnitAvailable;
    ApprovalErrorCodes = service.ApprovalErrorCodes;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 8: Auto-Generated Lease Data Population
   * Validates: Requirements 4.2, 4.3, 4.4
   * 
   * For any auto-generated lease from an approved application, the lease SHALL contain:
   * (1) tenant name and email from the application,
   * (2) property name and address from the listing,
   * (3) unit name and type from the unit, and
   * (4) rent amount matching the unit configuration.
   */
  describe('Property 8: Auto-Generated Lease Data Population', () => {
    it('populates lease with tenant information from application', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          templateArb,
          dateArb,
          async (application, tenant, property, unit, landlord, template, startDate) => {
            setupSuccessfulApprovalMocks(application, tenant, property, unit, landlord, template, startDate);

            await approveApplication({
              applicationId: application.id,
              unitId: unit.id,
              leaseStartDate: startDate,
              landlordId: landlord.id,
            });

            // Verify buildLeaseDataFromRecords was called with correct tenant info
            expect(mockBuildLeaseDataFromRecords).toHaveBeenCalledWith(
              expect.objectContaining({
                tenant: expect.objectContaining({
                  name: tenant.name || application.fullName,
                  email: tenant.email || application.email,
                }),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('populates lease with property information from listing', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          templateArb,
          dateArb,
          async (application, tenant, property, unit, landlord, template, startDate) => {
            setupSuccessfulApprovalMocks(application, tenant, property, unit, landlord, template, startDate);

            await approveApplication({
              applicationId: application.id,
              unitId: unit.id,
              leaseStartDate: startDate,
              landlordId: landlord.id,
            });

            // Verify buildLeaseDataFromRecords was called with correct property info
            expect(mockBuildLeaseDataFromRecords).toHaveBeenCalledWith(
              expect.objectContaining({
                property: expect.objectContaining({
                  name: property.name,
                  address: expect.objectContaining({
                    street: property.address.street,
                    city: property.address.city,
                    state: property.address.state,
                    zipCode: property.address.zipCode,
                  }),
                }),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('populates lease with unit information', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          templateArb,
          dateArb,
          async (application, tenant, property, unit, landlord, template, startDate) => {
            setupSuccessfulApprovalMocks(application, tenant, property, unit, landlord, template, startDate);

            await approveApplication({
              applicationId: application.id,
              unitId: unit.id,
              leaseStartDate: startDate,
              landlordId: landlord.id,
            });

            // Verify buildLeaseDataFromRecords was called with correct unit info
            expect(mockBuildLeaseDataFromRecords).toHaveBeenCalledWith(
              expect.objectContaining({
                unit: expect.objectContaining({
                  name: unit.name,
                  type: unit.type,
                  rentAmount: Number(unit.rentAmount),
                }),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('uses unit rent amount by default', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          templateArb,
          dateArb,
          async (application, tenant, property, unit, landlord, template, startDate) => {
            setupSuccessfulApprovalMocks(application, tenant, property, unit, landlord, template, startDate);

            await approveApplication({
              applicationId: application.id,
              unitId: unit.id,
              leaseStartDate: startDate,
              landlordId: landlord.id,
              // No rentAmount override provided
            });

            // Verify lease was created with unit's rent amount
            expect(mockPrisma.lease.create).toHaveBeenCalledWith(
              expect.objectContaining({
                data: expect.objectContaining({
                  rentAmount: Number(unit.rentAmount),
                }),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('allows rent amount override when provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          templateArb,
          dateArb,
          rentAmountArb,
          async (application, tenant, property, unit, landlord, template, startDate, overrideRent) => {
            setupSuccessfulApprovalMocks(application, tenant, property, unit, landlord, template, startDate);
            
            // Update mock to return the override rent
            mockPrisma.lease.create.mockResolvedValue({
              id: 'lease-id',
              status: 'pending_signature',
              startDate,
              endDate: null,
              rentAmount: overrideRent,
            });

            await approveApplication({
              applicationId: application.id,
              unitId: unit.id,
              leaseStartDate: startDate,
              landlordId: landlord.id,
              rentAmount: overrideRent, // Override provided
            });

            // Verify lease was created with override rent amount
            expect(mockPrisma.lease.create).toHaveBeenCalledWith(
              expect.objectContaining({
                data: expect.objectContaining({
                  rentAmount: overrideRent,
                }),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Auto-Generated Lease Record Creation
   * Validates: Requirements 4.5, 4.6
   * 
   * For any auto-generated lease, the system SHALL create:
   * (1) a Lease record with status "pending_signature", and
   * (2) exactly one Signature_Request record for tenant role (landlord signs after tenant).
   */
  describe('Property 9: Auto-Generated Lease Record Creation', () => {
    it('creates lease with pending_signature status', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          templateArb,
          dateArb,
          async (application, tenant, property, unit, landlord, template, startDate) => {
            setupSuccessfulApprovalMocks(application, tenant, property, unit, landlord, template, startDate);

            const result = await approveApplication({
              applicationId: application.id,
              unitId: unit.id,
              leaseStartDate: startDate,
              landlordId: landlord.id,
            });

            // Verify lease was created with pending_signature status
            expect(mockPrisma.lease.create).toHaveBeenCalledWith(
              expect.objectContaining({
                data: expect.objectContaining({
                  status: 'pending_signature',
                  generatedFrom: 'auto',
                }),
              })
            );

            // Verify result indicates pending_signature
            expect(result.lease.status).toBe('pending_signature');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('creates signature request for tenant', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          templateArb,
          dateArb,
          async (application, tenant, property, unit, landlord, template, startDate) => {
            setupSuccessfulApprovalMocks(application, tenant, property, unit, landlord, template, startDate);

            await approveApplication({
              applicationId: application.id,
              unitId: unit.id,
              leaseStartDate: startDate,
              landlordId: landlord.id,
            });

            // Verify signature request was created for tenant
            expect(mockPrisma.documentSignatureRequest.create).toHaveBeenCalledWith(
              expect.objectContaining({
                data: expect.objectContaining({
                  role: 'tenant',
                  recipientEmail: tenant.email || application.email,
                  recipientName: tenant.name || application.fullName,
                  status: 'sent',
                }),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sets generatedAt timestamp on auto-generated lease', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          templateArb,
          dateArb,
          async (application, tenant, property, unit, landlord, template, startDate) => {
            setupSuccessfulApprovalMocks(application, tenant, property, unit, landlord, template, startDate);

            const beforeApproval = new Date();
            
            await approveApplication({
              applicationId: application.id,
              unitId: unit.id,
              leaseStartDate: startDate,
              landlordId: landlord.id,
            });

            const afterApproval = new Date();

            // Verify generatedAt was set
            expect(mockPrisma.lease.create).toHaveBeenCalledWith(
              expect.objectContaining({
                data: expect.objectContaining({
                  generatedAt: expect.any(Date),
                }),
              })
            );

            // Get the actual call and verify timestamp is reasonable
            const leaseCreateCall = mockPrisma.lease.create.mock.calls[0][0];
            const generatedAt = leaseCreateCall.data.generatedAt;
            expect(generatedAt.getTime()).toBeGreaterThanOrEqual(beforeApproval.getTime());
            expect(generatedAt.getTime()).toBeLessThanOrEqual(afterApproval.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Unit Availability Validation
   * Validates: Requirements 2.7
   * 
   * For any application approval attempt where the specified unit is not available
   * (already occupied or doesn't exist), the system SHALL reject the approval with an error.
   */
  describe('Property 4: Unit Availability Validation', () => {
    it('rejects approval when unit is not available', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          dateArb,
          async (application, tenant, property, unit, landlord, startDate) => {
            // Setup: unit is not available
            const unavailableUnit = { ...unit, isAvailable: false };
            
            const fullApplication = {
              ...application,
              applicant: tenant,
              unit: {
                ...unavailableUnit,
                property: {
                  ...property,
                  landlord,
                },
                leases: [],
              },
            };

            const fullUnit = {
              ...unavailableUnit,
              property: {
                ...property,
                landlord,
              },
              leases: [],
            };

            mockPrisma.rentalApplication.findUnique.mockResolvedValue(fullApplication);
            mockPrisma.unit.findUnique.mockResolvedValue(fullUnit);

            await expect(
              approveApplication({
                applicationId: application.id,
                unitId: unit.id,
                leaseStartDate: startDate,
                landlordId: landlord.id,
              })
            ).rejects.toMatchObject({
              code: ApprovalErrorCodes.UNIT_UNAVAILABLE,
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects approval when unit has active lease', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          dateArb,
          async (application, tenant, property, unit, landlord, startDate) => {
            // Setup: unit has an active lease
            const fullApplication = {
              ...application,
              applicant: tenant,
              unit: {
                ...unit,
                property: {
                  ...property,
                  landlord,
                },
                leases: [],
              },
            };

            const fullUnit = {
              ...unit,
              property: {
                ...property,
                landlord,
              },
              leases: [{ id: 'existing-lease-id' }], // Has active lease
            };

            mockPrisma.rentalApplication.findUnique.mockResolvedValue(fullApplication);
            mockPrisma.unit.findUnique.mockResolvedValue(fullUnit);

            await expect(
              approveApplication({
                applicationId: application.id,
                unitId: unit.id,
                leaseStartDate: startDate,
                landlordId: landlord.id,
              })
            ).rejects.toMatchObject({
              code: ApprovalErrorCodes.UNIT_UNAVAILABLE,
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects approval when unit does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          dateArb,
          async (application, tenant, property, unit, landlord, startDate) => {
            // Setup: unit doesn't exist
            const fullApplication = {
              ...application,
              applicant: tenant,
              unit: {
                ...unit,
                property: {
                  ...property,
                  landlord,
                },
                leases: [],
              },
            };

            mockPrisma.rentalApplication.findUnique.mockResolvedValue(fullApplication);
            mockPrisma.unit.findUnique.mockResolvedValue(null); // Unit not found

            await expect(
              approveApplication({
                applicationId: application.id,
                unitId: unit.id,
                leaseStartDate: startDate,
                landlordId: landlord.id,
              })
            ).rejects.toMatchObject({
              code: ApprovalErrorCodes.UNIT_UNAVAILABLE,
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('isUnitAvailable returns false for unavailable units', async () => {
      await fc.assert(
        fc.asyncProperty(
          unitArb,
          async (unit) => {
            // Setup: unit is not available
            mockPrisma.unit.findUnique.mockResolvedValue({
              ...unit,
              isAvailable: false,
              leases: [],
            });

            const result = await isUnitAvailable(unit.id);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('isUnitAvailable returns false for units with active leases', async () => {
      await fc.assert(
        fc.asyncProperty(
          unitArb,
          async (unit) => {
            // Setup: unit has active lease
            mockPrisma.unit.findUnique.mockResolvedValue({
              ...unit,
              isAvailable: true,
              leases: [{ id: 'active-lease' }],
            });

            const result = await isUnitAvailable(unit.id);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('isUnitAvailable returns true for available units with no leases', async () => {
      await fc.assert(
        fc.asyncProperty(
          unitArb,
          async (unit) => {
            // Setup: unit is available with no leases
            mockPrisma.unit.findUnique.mockResolvedValue({
              ...unit,
              isAvailable: true,
              leases: [],
            });

            const result = await isUnitAvailable(unit.id);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 1: Application Status Transitions
   * Validates: Requirements 2.3, 2.5
   * 
   * For any rental application, when a landlord approves it the status SHALL become "approved",
   * and when a landlord rejects it the status SHALL become "rejected".
   * The status transition must be atomic and consistent.
   */
  describe('Property 1: Application Status Transitions', () => {
    it('approval sets status to approved', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          templateArb,
          dateArb,
          async (application, tenant, property, unit, landlord, template, startDate) => {
            setupSuccessfulApprovalMocks(application, tenant, property, unit, landlord, template, startDate);

            const result = await approveApplication({
              applicationId: application.id,
              unitId: unit.id,
              leaseStartDate: startDate,
              landlordId: landlord.id,
            });

            // Verify application status was updated to approved
            expect(mockPrisma.rentalApplication.update).toHaveBeenCalledWith(
              expect.objectContaining({
                where: { id: application.id },
                data: expect.objectContaining({
                  status: 'approved',
                }),
              })
            );

            expect(result.application.status).toBe('approved');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects approval of non-pending applications', async () => {
      await fc.assert(
        fc.asyncProperty(
          applicationArb,
          tenantArb,
          propertyArb,
          unitArb,
          landlordArb,
          dateArb,
          fc.constantFrom('approved', 'rejected'),
          async (application, tenant, property, unit, landlord, startDate, existingStatus) => {
            // Setup: application is not pending
            const nonPendingApplication = {
              ...application,
              status: existingStatus,
              applicant: tenant,
              unit: {
                ...unit,
                property: {
                  ...property,
                  landlord,
                },
                leases: [],
              },
            };

            mockPrisma.rentalApplication.findUnique.mockResolvedValue(nonPendingApplication);

            await expect(
              approveApplication({
                applicationId: application.id,
                unitId: unit.id,
                leaseStartDate: startDate,
                landlordId: landlord.id,
              })
            ).rejects.toMatchObject({
              code: ApprovalErrorCodes.APPLICATION_NOT_PENDING,
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects approval when application not found', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          uuidArb,
          uuidArb,
          dateArb,
          async (applicationId, unitId, landlordId, startDate) => {
            // Setup: application doesn't exist
            mockPrisma.rentalApplication.findUnique.mockResolvedValue(null);

            await expect(
              approveApplication({
                applicationId,
                unitId,
                leaseStartDate: startDate,
                landlordId,
              })
            ).rejects.toMatchObject({
              code: ApprovalErrorCodes.APPLICATION_NOT_FOUND,
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
