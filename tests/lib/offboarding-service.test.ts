/**
 * Property-based tests for OffboardingService
 * Feature: tenant-lifecycle-management
 */

import * as fc from 'fast-check';
import type { DepartureType } from '@/types/tenant-lifecycle';

// Mock Prisma client - create fresh mocks for each test
const createMockPrisma = () => ({
  lease: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  tenantDeparture: {
    create: jest.fn(),
  },
  tenantHistory: {
    create: jest.fn(),
  },
  unitTurnoverChecklist: {
    create: jest.fn(),
  },
  rentPayment: {
    updateMany: jest.fn(),
  },
  unit: {
    update: jest.fn(),
  },
});

let mockPrisma = createMockPrisma();

jest.mock('@/db/prisma', () => ({
  get prisma() {
    return mockPrisma;
  },
}));

// Import after mocking
import { OffboardingService } from '@/lib/services/offboarding-service';

describe('OffboardingService', () => {
  let service: OffboardingService;

  const createMockLease = (overrides: Partial<any> = {}) => ({
    id: 'lease-123',
    tenantId: 'tenant-123',
    unitId: 'unit-123',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-01-01'),
    rentAmount: 1500,
    status: 'active',
    tenant: {
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '555-1234',
    },
    unit: {
      id: 'unit-123',
      property: {
        id: 'property-123',
        landlordId: 'landlord-123',
      },
    },
    rentPayments: [],
    ...overrides,
  });

  beforeEach(() => {
    // Create fresh mocks for each test
    mockPrisma = createMockPrisma();
    service = new OffboardingService();
  });

  /**
   * Property 15: Offboarding Creates Tenant History
   * For any successful offboarding operation, a TenantHistory record SHALL be created
   * containing accurate lease data, departure information, and deposit summary.
   * 
   * Validates: Requirements 8.4, 11.5
   */
  describe('Property 15: Offboarding Creates Tenant History', () => {
    const departureTypes: DepartureType[] = ['eviction', 'voluntary', 'lease_end', 'mutual_agreement'];

    it('should create tenant history for any departure type', async () => {
      for (const departureType of departureTypes) {
        // Reset mocks for each iteration
        mockPrisma = createMockPrisma();
        
        const lease = createMockLease();
        
        mockPrisma.lease.findUnique.mockResolvedValue(lease);
        mockPrisma.lease.update.mockResolvedValue({ ...lease, status: 'terminated' });
        mockPrisma.tenantDeparture.create.mockResolvedValue({ id: 'departure-id' });
        mockPrisma.rentPayment.updateMany.mockResolvedValue({ count: 0 });
        mockPrisma.tenantHistory.create.mockResolvedValue({ id: 'history-id' });
        mockPrisma.unitTurnoverChecklist.create.mockResolvedValue({ id: 'checklist-id' });

        await service.executeOffboarding({
          leaseId: lease.id,
          departureType,
          departureDate: new Date(),
        });

        expect(mockPrisma.tenantHistory.create).toHaveBeenCalled();
        const historyCall = mockPrisma.tenantHistory.create.mock.calls[0][0];
        expect(historyCall.data.departureType).toBe(departureType);
      }
    });

    it.each([
      { name: 'Alice Smith', email: 'alice@example.com', phoneNumber: '555-0001' },
      { name: 'Bob Jones', email: 'bob@test.org', phoneNumber: null },
      { name: 'Charlie Brown', email: 'charlie@mail.net', phoneNumber: '555-9999' },
      { name: 'Diana Prince', email: 'diana@wonder.com', phoneNumber: '555-1234' },
    ])('should preserve tenant data in history for tenant: $name', async (tenantInfo) => {
      const lease = createMockLease({ tenant: tenantInfo });
      
      mockPrisma.lease.findUnique.mockResolvedValue(lease);
      mockPrisma.lease.update.mockResolvedValue({ ...lease, status: 'terminated' });
      mockPrisma.tenantDeparture.create.mockResolvedValue({ id: 'departure-id' });
      mockPrisma.rentPayment.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.tenantHistory.create.mockResolvedValue({ id: 'history-id' });
      mockPrisma.unitTurnoverChecklist.create.mockResolvedValue({ id: 'checklist-id' });

      await service.executeOffboarding({
        leaseId: lease.id,
        departureType: 'voluntary',
        departureDate: new Date(),
      });

      const historyCall = mockPrisma.tenantHistory.create.mock.calls[0][0];
      expect(historyCall.data.tenantName).toBe(tenantInfo.name);
      expect(historyCall.data.tenantEmail).toBe(tenantInfo.email);
      expect(historyCall.data.tenantPhone).toBe(tenantInfo.phoneNumber);
    });

    it.each(departureTypes)('should set wasEvicted correctly for departure type: %s', async (departureType) => {
      const lease = createMockLease();
      
      mockPrisma.lease.findUnique.mockResolvedValue(lease);
      mockPrisma.lease.update.mockResolvedValue({ ...lease, status: 'terminated' });
      mockPrisma.tenantDeparture.create.mockResolvedValue({ id: 'departure-id' });
      mockPrisma.rentPayment.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.tenantHistory.create.mockResolvedValue({ id: 'history-id' });
      mockPrisma.unitTurnoverChecklist.create.mockResolvedValue({ id: 'checklist-id' });

      await service.executeOffboarding({
        leaseId: lease.id,
        departureType,
        departureDate: new Date(),
      });

      const historyCall = mockPrisma.tenantHistory.create.mock.calls[0][0];
      
      if (departureType === 'eviction') {
        expect(historyCall.data.wasEvicted).toBe(true);
      } else {
        expect(historyCall.data.wasEvicted).toBe(false);
      }
    });

    it('should use correct IDs from lease in history', async () => {
      const lease = createMockLease();
      
      mockPrisma.lease.findUnique.mockResolvedValue(lease);
      mockPrisma.lease.update.mockResolvedValue({ ...lease, status: 'terminated' });
      mockPrisma.tenantDeparture.create.mockResolvedValue({ id: 'departure-id' });
      mockPrisma.rentPayment.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.tenantHistory.create.mockResolvedValue({ id: 'history-id' });
      mockPrisma.unitTurnoverChecklist.create.mockResolvedValue({ id: 'checklist-id' });

      await service.executeOffboarding({
        leaseId: lease.id,
        departureType: 'voluntary',
        departureDate: new Date(),
      });

      const historyCall = mockPrisma.tenantHistory.create.mock.calls[0][0];
      expect(historyCall.data.unitId).toBe(lease.unitId);
      expect(historyCall.data.leaseId).toBe(lease.id);
      expect(historyCall.data.tenantId).toBe(lease.tenantId);
      expect(historyCall.data.propertyId).toBe(lease.unit.property.id);
      expect(historyCall.data.landlordId).toBe(lease.unit.property.landlordId);
    });
  });

  /**
   * Property 16: Offboarding Failure Halts Workflow
   * If any critical step in the offboarding workflow fails, subsequent steps
   * SHALL NOT be executed and the failure SHALL be reported.
   * 
   * Validates: Requirements 8.4, 8.5
   */
  describe('Property 16: Offboarding Failure Halts Workflow', () => {
    it('should halt workflow when lease termination fails', async () => {
      const lease = createMockLease();
      mockPrisma.lease.findUnique.mockResolvedValue(lease);
      mockPrisma.lease.update.mockRejectedValue(new Error('Database error'));

      const result = await service.executeOffboarding({
        leaseId: lease.id,
        departureType: 'voluntary',
        departureDate: new Date(),
      });

      // Workflow should fail
      expect(result.success).toBe(false);
      expect(result.leaseTerminated).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('Failed to terminate lease'));
      
      // Subsequent steps should NOT be called
      expect(mockPrisma.tenantDeparture.create).not.toHaveBeenCalled();
      expect(mockPrisma.tenantHistory.create).not.toHaveBeenCalled();
      expect(mockPrisma.unitTurnoverChecklist.create).not.toHaveBeenCalled();
    });

    it('should return error when lease not found', async () => {
      mockPrisma.lease.findUnique.mockResolvedValue(null);

      const result = await service.executeOffboarding({
        leaseId: 'non-existent',
        departureType: 'voluntary',
        departureDate: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Lease not found');
      
      // No operations should be attempted
      expect(mockPrisma.lease.update).not.toHaveBeenCalled();
      expect(mockPrisma.tenantDeparture.create).not.toHaveBeenCalled();
    });

    it('should return error when property has no landlord', async () => {
      const leaseWithoutLandlord = createMockLease({
        unit: {
          id: 'unit-123',
          property: {
            id: 'property-123',
            landlordId: null,
          },
        },
      });
      mockPrisma.lease.findUnique.mockResolvedValue(leaseWithoutLandlord);

      const result = await service.executeOffboarding({
        leaseId: leaseWithoutLandlord.id,
        departureType: 'voluntary',
        departureDate: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Property has no associated landlord');
    });

    it('should continue workflow when non-critical steps fail', async () => {
      const lease = createMockLease();
      mockPrisma.lease.findUnique.mockResolvedValue(lease);
      mockPrisma.lease.update.mockResolvedValue({ ...lease, status: 'terminated' });
      mockPrisma.tenantDeparture.create.mockRejectedValue(new Error('Departure creation failed'));
      mockPrisma.rentPayment.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.tenantHistory.create.mockResolvedValue({ id: 'history-id' });
      mockPrisma.unitTurnoverChecklist.create.mockResolvedValue({ id: 'checklist-id' });

      const result = await service.executeOffboarding({
        leaseId: lease.id,
        departureType: 'voluntary',
        departureDate: new Date(),
      });

      // Workflow should succeed overall (departure recording is non-critical)
      expect(result.success).toBe(true);
      expect(result.leaseTerminated).toBe(true);
      expect(result.departureRecorded).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('Failed to record departure'));
      
      // Subsequent steps should still be called
      expect(mockPrisma.tenantHistory.create).toHaveBeenCalled();
      expect(mockPrisma.unitTurnoverChecklist.create).toHaveBeenCalled();
    });

    it.each([
      { failing: ['departure'], expectedErrors: 1 },
      { failing: ['payments'], expectedErrors: 1 },
      { failing: ['history'], expectedErrors: 1 },
      { failing: ['checklist'], expectedErrors: 1 },
      { failing: ['departure', 'payments'], expectedErrors: 2 },
      { failing: ['departure', 'history', 'checklist'], expectedErrors: 3 },
      { failing: ['departure', 'payments', 'history', 'checklist'], expectedErrors: 4 },
    ])('should report $expectedErrors error(s) when $failing fail', async ({ failing, expectedErrors }) => {
      const lease = createMockLease();
      
      mockPrisma.lease.findUnique.mockResolvedValue(lease);
      mockPrisma.lease.update.mockResolvedValue({ ...lease, status: 'terminated' });
      
      // Configure failures based on failing array
      if (failing.includes('departure')) {
        mockPrisma.tenantDeparture.create.mockRejectedValue(new Error('Departure failed'));
      } else {
        mockPrisma.tenantDeparture.create.mockResolvedValue({ id: 'departure-id' });
      }
      
      if (failing.includes('payments')) {
        mockPrisma.rentPayment.updateMany.mockRejectedValue(new Error('Payments failed'));
      } else {
        mockPrisma.rentPayment.updateMany.mockResolvedValue({ count: 0 });
      }
      
      if (failing.includes('history')) {
        mockPrisma.tenantHistory.create.mockRejectedValue(new Error('History failed'));
      } else {
        mockPrisma.tenantHistory.create.mockResolvedValue({ id: 'history-id' });
      }
      
      if (failing.includes('checklist')) {
        mockPrisma.unitTurnoverChecklist.create.mockRejectedValue(new Error('Checklist failed'));
      } else {
        mockPrisma.unitTurnoverChecklist.create.mockResolvedValue({ id: 'checklist-id' });
      }

      const result = await service.executeOffboarding({
        leaseId: lease.id,
        departureType: 'voluntary',
        departureDate: new Date(),
      });

      // Should still succeed (all failures are non-critical)
      expect(result.success).toBe(true);
      expect(result.errors?.length).toBe(expectedErrors);
    });
  });

  /**
   * Additional tests for offboarding workflow integrity
   */
  describe('Offboarding Workflow Integrity', () => {
    it('should mark unit available when markUnitAvailable is true', async () => {
      const lease = createMockLease();
      mockPrisma.lease.findUnique.mockResolvedValue(lease);
      mockPrisma.lease.update.mockResolvedValue({ ...lease, status: 'terminated' });
      mockPrisma.tenantDeparture.create.mockResolvedValue({ id: 'departure-id' });
      mockPrisma.rentPayment.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.tenantHistory.create.mockResolvedValue({ id: 'history-id' });
      mockPrisma.unitTurnoverChecklist.create.mockResolvedValue({ id: 'checklist-id' });
      mockPrisma.unit.update.mockResolvedValue({ id: lease.unitId, isAvailable: true });

      const departureDate = new Date('2024-06-01');
      await service.executeOffboarding({
        leaseId: lease.id,
        departureType: 'voluntary',
        departureDate,
        markUnitAvailable: true,
      });

      expect(mockPrisma.unit.update).toHaveBeenCalledWith({
        where: { id: lease.unitId },
        data: {
          isAvailable: true,
          availableFrom: departureDate,
        },
      });
    });

    it('should NOT mark unit available when markUnitAvailable is false or undefined', async () => {
      const lease = createMockLease();
      mockPrisma.lease.findUnique.mockResolvedValue(lease);
      mockPrisma.lease.update.mockResolvedValue({ ...lease, status: 'terminated' });
      mockPrisma.tenantDeparture.create.mockResolvedValue({ id: 'departure-id' });
      mockPrisma.rentPayment.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.tenantHistory.create.mockResolvedValue({ id: 'history-id' });
      mockPrisma.unitTurnoverChecklist.create.mockResolvedValue({ id: 'checklist-id' });

      await service.executeOffboarding({
        leaseId: lease.id,
        departureType: 'voluntary',
        departureDate: new Date(),
        markUnitAvailable: false,
      });

      expect(mockPrisma.unit.update).not.toHaveBeenCalled();
    });

    it('should return tenantHistoryId when history is created successfully', async () => {
      const historyId = 'history-uuid-123';
      const lease = createMockLease();
      mockPrisma.lease.findUnique.mockResolvedValue(lease);
      mockPrisma.lease.update.mockResolvedValue({ ...lease, status: 'terminated' });
      mockPrisma.tenantDeparture.create.mockResolvedValue({ id: 'departure-id' });
      mockPrisma.rentPayment.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.tenantHistory.create.mockResolvedValue({ id: historyId });
      mockPrisma.unitTurnoverChecklist.create.mockResolvedValue({ id: 'checklist-id' });

      const result = await service.executeOffboarding({
        leaseId: lease.id,
        departureType: 'voluntary',
        departureDate: new Date(),
      });

      expect(result.tenantHistoryId).toBe(historyId);
    });

    it('should return turnoverChecklistId when checklist is created successfully', async () => {
      const checklistId = 'checklist-uuid-123';
      const lease = createMockLease();
      mockPrisma.lease.findUnique.mockResolvedValue(lease);
      mockPrisma.lease.update.mockResolvedValue({ ...lease, status: 'terminated' });
      mockPrisma.tenantDeparture.create.mockResolvedValue({ id: 'departure-id' });
      mockPrisma.rentPayment.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.tenantHistory.create.mockResolvedValue({ id: 'history-id' });
      mockPrisma.unitTurnoverChecklist.create.mockResolvedValue({ id: checklistId });

      const result = await service.executeOffboarding({
        leaseId: lease.id,
        departureType: 'voluntary',
        departureDate: new Date(),
      });

      expect(result.turnoverChecklistId).toBe(checklistId);
    });

    it.each([
      new Date('2020-01-01'),
      new Date('2024-06-15'),
      new Date('2025-12-31'),
      new Date('2030-07-04'),
    ])('should handle departure date: %s', async (departureDate) => {
      const lease = createMockLease();
      
      mockPrisma.lease.findUnique.mockResolvedValue(lease);
      mockPrisma.lease.update.mockResolvedValue({ ...lease, status: 'terminated' });
      mockPrisma.tenantDeparture.create.mockResolvedValue({ id: 'departure-id' });
      mockPrisma.rentPayment.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.tenantHistory.create.mockResolvedValue({ id: 'history-id' });
      mockPrisma.unitTurnoverChecklist.create.mockResolvedValue({ id: 'checklist-id' });

      const result = await service.executeOffboarding({
        leaseId: lease.id,
        departureType: 'voluntary',
        departureDate,
      });

      expect(result.success).toBe(true);
      
      // Verify departure date is used in history
      const historyCall = mockPrisma.tenantHistory.create.mock.calls[0][0];
      expect(historyCall.data.departureDate).toEqual(departureDate);
    });
  });
});
