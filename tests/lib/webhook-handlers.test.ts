/**
 * Webhook Handler Tests
 * 
 * Tests webhook handlers with mock data to ensure they process events correctly
 */

import { BackgroundCheckService, CheckrWebhookEvent } from '@/lib/services/background-check';
import { IdentityVerificationService, PersonaWebhookEvent } from '@/lib/services/identity-verification';

describe('Webhook Handlers', () => {
  describe('Background Check Webhook', () => {
    it('should handle report.completed event with clear status', async () => {
      const mockEvent: CheckrWebhookEvent = {
        type: 'report.completed',
        data: {
          id: 'test-report-123',
          status: 'clear',
          completed_at: new Date().toISOString(),
        },
      };

      // Should not throw
      await expect(
        BackgroundCheckService.handleWebhook(mockEvent)
      ).resolves.not.toThrow();
    });

    it('should handle report.completed event with consider status', async () => {
      const mockEvent: CheckrWebhookEvent = {
        type: 'report.completed',
        data: {
          id: 'test-report-456',
          status: 'consider',
          completed_at: new Date().toISOString(),
        },
      };

      // Should not throw
      await expect(
        BackgroundCheckService.handleWebhook(mockEvent)
      ).resolves.not.toThrow();
    });

    it('should handle report.suspended event', async () => {
      const mockEvent: CheckrWebhookEvent = {
        type: 'report.suspended',
        data: {
          id: 'test-report-789',
        },
      };

      // Should not throw
      await expect(
        BackgroundCheckService.handleWebhook(mockEvent)
      ).resolves.not.toThrow();
    });
  });

  describe('Identity Verification Webhook', () => {
    it('should handle inquiry.completed event', async () => {
      const mockEvent: PersonaWebhookEvent = {
        type: 'inquiry.completed',
        data: {
          id: 'test-inquiry-123',
          status: 'completed',
        },
      };

      // Should not throw
      await expect(
        IdentityVerificationService.handleWebhook(mockEvent)
      ).resolves.not.toThrow();
    });

    it('should handle inquiry.failed event', async () => {
      const mockEvent: PersonaWebhookEvent = {
        type: 'inquiry.failed',
        data: {
          id: 'test-inquiry-456',
          status: 'failed',
        },
      };

      // Should not throw
      await expect(
        IdentityVerificationService.handleWebhook(mockEvent)
      ).resolves.not.toThrow();
    });

    it('should handle inquiry.expired event', async () => {
      const mockEvent: PersonaWebhookEvent = {
        type: 'inquiry.expired',
        data: {
          id: 'test-inquiry-789',
          status: 'expired',
        },
      };

      // Should not throw
      await expect(
        IdentityVerificationService.handleWebhook(mockEvent)
      ).resolves.not.toThrow();
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should verify background check webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'test-signature';

      // Should return true when secret not configured (development mode)
      const result = BackgroundCheckService.verifyWebhookSignature(payload, signature);
      expect(result).toBe(true);
    });

    it('should verify identity verification webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'test-signature';

      // Should return true when secret not configured (development mode)
      const result = IdentityVerificationService.verifyWebhookSignature(payload, signature);
      expect(result).toBe(true);
    });
  });
});
