/**
 * Background Check Service Tests
 * 
 * Tests for the BackgroundCheckService functionality
 */

import { BackgroundCheckService, CandidateData, CheckrWebhookEvent } from '@/lib/services/background-check';
import { prisma } from '@/db/prisma';

// Mock Prisma
jest.mock('@/db/prisma', () => ({
  prisma: {
    contractorProfile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('BackgroundCheckService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCheckStatus', () => {
    it('should return not_started status when no check exists', async () => {
      (prisma.contractorProfile.findUnique as jest.Mock).mockResolvedValue({
        backgroundCheckId: null,
        backgroundCheckDate: null,
        backgroundCheckExpires: null,
      });

      const status = await BackgroundCheckService.getCheckStatus('contractor-123');

      expect(status).toEqual({
        isVerified: false,
        checkId: null,
        status: 'not_started',
        completedAt: null,
        expiresAt: null,
        needsRenewal: false,
      });
    });

    it('should return clear status when check is valid', async () => {
      const now = new Date();
      const completedDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const expiresDate = new Date(now.getTime() + 335 * 24 * 60 * 60 * 1000); // 335 days from now

      (prisma.contractorProfile.findUnique as jest.Mock).mockResolvedValue({
        backgroundCheckId: 'check-123',
        backgroundCheckDate: completedDate,
        backgroundCheckExpires: expiresDate,
      });

      const status = await BackgroundCheckService.getCheckStatus('contractor-123');

      expect(status.isVerified).toBe(true);
      expect(status.status).toBe('clear');
      expect(status.needsRenewal).toBe(false);
    });

    it('should return expired status when check has expired', async () => {
      const now = new Date();
      const completedDate = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000); // 400 days ago
      const expiresDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000); // 35 days ago

      (prisma.contractorProfile.findUnique as jest.Mock).mockResolvedValue({
        backgroundCheckId: 'check-123',
        backgroundCheckDate: completedDate,
        backgroundCheckExpires: expiresDate,
      });

      const status = await BackgroundCheckService.getCheckStatus('contractor-123');

      expect(status.isVerified).toBe(false);
      expect(status.status).toBe('expired');
      expect(status.needsRenewal).toBe(true);
    });

    it('should indicate renewal needed within 30 days', async () => {
      const now = new Date();
      const completedDate = new Date(now.getTime() - 345 * 24 * 60 * 60 * 1000); // 345 days ago
      const expiresDate = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days from now

      (prisma.contractorProfile.findUnique as jest.Mock).mockResolvedValue({
        backgroundCheckId: 'check-123',
        backgroundCheckDate: completedDate,
        backgroundCheckExpires: expiresDate,
      });

      const status = await BackgroundCheckService.getCheckStatus('contractor-123');

      expect(status.isVerified).toBe(true);
      expect(status.status).toBe('clear');
      expect(status.needsRenewal).toBe(true);
    });

    it('should return pending status when check is initiated but not completed', async () => {
      (prisma.contractorProfile.findUnique as jest.Mock).mockResolvedValue({
        backgroundCheckId: 'check-123',
        backgroundCheckDate: null,
        backgroundCheckExpires: null,
      });

      const status = await BackgroundCheckService.getCheckStatus('contractor-123');

      expect(status.isVerified).toBe(false);
      expect(status.status).toBe('pending');
      expect(status.checkId).toBe('check-123');
    });
  });

  describe('initiateCheck', () => {
    it('should create a background check and return invitation', async () => {
      const candidateData: CandidateData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
      };

      (prisma.contractorProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'contractor-123',
        userId: 'user-123',
        businessName: 'Test Contractor',
      });

      (prisma.contractorProfile.update as jest.Mock).mockResolvedValue({});

      const invitation = await BackgroundCheckService.initiateCheck('contractor-123', candidateData);

      expect(invitation).toHaveProperty('invitationUrl');
      expect(invitation).toHaveProperty('candidateId');
      expect(invitation).toHaveProperty('expiresAt');
      expect(prisma.contractorProfile.update).toHaveBeenCalled();
    });

    it('should throw error if contractor not found', async () => {
      (prisma.contractorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const candidateData: CandidateData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      await expect(
        BackgroundCheckService.initiateCheck('contractor-123', candidateData)
      ).rejects.toThrow('Contractor not found');
    });
  });

  describe('handleWebhook', () => {
    it('should handle report.completed event with clear status', async () => {
      const event: CheckrWebhookEvent = {
        type: 'report.completed',
        data: {
          id: 'report-123',
          status: 'clear',
          completed_at: new Date().toISOString(),
        },
      };

      (prisma.contractorProfile.findFirst as jest.Mock).mockResolvedValue({
        id: 'contractor-123',
        backgroundCheckId: 'report-123',
      });

      (prisma.contractorProfile.update as jest.Mock).mockResolvedValue({});

      await BackgroundCheckService.handleWebhook(event);

      expect(prisma.contractorProfile.update).toHaveBeenCalledWith({
        where: { id: 'contractor-123' },
        data: expect.objectContaining({
          backgroundCheckDate: expect.any(Date),
          backgroundCheckExpires: expect.any(Date),
        }),
      });
    });

    it('should handle report.completed event with consider status', async () => {
      const event: CheckrWebhookEvent = {
        type: 'report.completed',
        data: {
          id: 'report-123',
          status: 'consider',
          completed_at: new Date().toISOString(),
        },
      };

      (prisma.contractorProfile.findFirst as jest.Mock).mockResolvedValue({
        id: 'contractor-123',
        backgroundCheckId: 'report-123',
      });

      (prisma.contractorProfile.update as jest.Mock).mockResolvedValue({});

      await BackgroundCheckService.handleWebhook(event);

      expect(prisma.contractorProfile.update).toHaveBeenCalledWith({
        where: { id: 'contractor-123' },
        data: expect.objectContaining({
          backgroundCheckDate: expect.any(Date),
          backgroundCheckExpires: null,
        }),
      });
    });

    it('should handle report.suspended event', async () => {
      const event: CheckrWebhookEvent = {
        type: 'report.suspended',
        data: {
          id: 'report-123',
        },
      };

      (prisma.contractorProfile.findFirst as jest.Mock).mockResolvedValue({
        id: 'contractor-123',
        backgroundCheckId: 'report-123',
      });

      (prisma.contractorProfile.update as jest.Mock).mockResolvedValue({});

      await BackgroundCheckService.handleWebhook(event);

      expect(prisma.contractorProfile.update).toHaveBeenCalledWith({
        where: { id: 'contractor-123' },
        data: {
          backgroundCheckDate: null,
          backgroundCheckExpires: null,
        },
      });
    });

    it('should not throw if contractor not found for webhook', async () => {
      const event: CheckrWebhookEvent = {
        type: 'report.completed',
        data: {
          id: 'report-123',
          status: 'clear',
        },
      };

      (prisma.contractorProfile.findFirst as jest.Mock).mockResolvedValue(null);

      // Should not throw
      await expect(BackgroundCheckService.handleWebhook(event)).resolves.not.toThrow();
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true when webhook secret is not configured', () => {
      const result = BackgroundCheckService.verifyWebhookSignature('payload', 'signature');
      expect(result).toBe(true);
    });
  });
});
