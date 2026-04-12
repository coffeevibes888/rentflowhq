/**
 * Property-Based Test for Invoice Number Uniqueness
 * Feature: contractor-marketplace-enhancement, Property 11: Invoice Number Uniqueness
 * Validates: Requirements 8.2
 * 
 * Property: For any created invoice, the invoiceNumber SHALL be unique across 
 * all invoices in the system.
 */

import * as fc from 'fast-check';
import { prisma } from '@/db/prisma';
import { ContractorInvoicingService } from '@/lib/services/contractor-invoicing';

describe('Invoice Number Uniqueness', () => {
  let testContractorId: string;
  let testCustomerId: string;
  const createdInvoiceIds: string[] = [];

  beforeAll(async () => {
    // Create test contractor
    const user = await prisma.user.create({
      data: {
        email: `test-contractor-${Date.now()}@example.com`,
        name: 'Test Contractor',
        role: 'contractor',
      },
    });

    const contractor = await prisma.contractorProfile.create({
      data: {
        userId: user.id,
        slug: `test-contractor-${Date.now()}`,
        businessName: 'Test Contractor Business',
        displayName: 'Test Contractor',
        email: user.email,
        phone: '555-0100',
        specialties: ['plumbing'],
        serviceRadius: 50,
        hourlyRate: 100,
      },
    });

    testContractorId = contractor.id;

    // Create test customer
    const customer = await prisma.contractorCustomer.create({
      data: {
        contractorId: testContractorId,
        name: 'Test Customer',
        email: `test-customer-${Date.now()}@example.com`,
        status: 'customer',
      },
    });

    testCustomerId = customer.id;
  });

  afterAll(async () => {
    // Clean up created invoices
    if (createdInvoiceIds.length > 0) {
      await prisma.contractorInvoice.deleteMany({
        where: {
          id: { in: createdInvoiceIds },
        },
      });
    }

    // Clean up test data
    if (testCustomerId) {
      await prisma.contractorCustomer.delete({
        where: { id: testCustomerId },
      });
    }

    if (testContractorId) {
      const contractor = await prisma.contractorProfile.findUnique({
        where: { id: testContractorId },
        select: { userId: true },
      });

      await prisma.contractorProfile.delete({
        where: { id: testContractorId },
      });

      if (contractor?.userId) {
        await prisma.user.delete({
          where: { id: contractor.userId },
        });
      }
    }
  });

  test('Property 11: Invoice numbers are unique across all invoices', async () => {
    const lineItemArbitrary = fc.record({
      description: fc.string({ minLength: 1, maxLength: 50 }),
      quantity: fc.integer({ min: 1, max: 10 }),
      unitPrice: fc.double({ min: 1, max: 1000, noNaN: true }),
      type: fc.constantFrom('labor' as const, 'material' as const, 'other' as const),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(lineItemArbitrary, { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 1, max: 30 }), // days until due
        async (lineItems, daysUntilDue) => {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + daysUntilDue);

          // Create invoice
          const invoice = await ContractorInvoicingService.createInvoice({
            contractorId: testContractorId,
            customerId: testCustomerId,
            lineItems,
            dueDate,
          });

          createdInvoiceIds.push(invoice.id);

          // Check that invoice number is unique
          const duplicates = await prisma.contractorInvoice.count({
            where: {
              invoiceNumber: invoice.invoiceNumber,
            },
          });

          // Should only find one invoice with this number
          return duplicates === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11a: Multiple invoices created in sequence have unique numbers', async () => {
    const invoiceNumbers = new Set<string>();
    const numberOfInvoices = 10;

    for (let i = 0; i < numberOfInvoices; i++) {
      const invoice = await ContractorInvoicingService.createInvoice({
        contractorId: testContractorId,
        customerId: testCustomerId,
        lineItems: [
          {
            description: `Test Item ${i}`,
            quantity: 1,
            unitPrice: 100,
            type: 'labor',
          },
        ],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      createdInvoiceIds.push(invoice.id);

      // Check that this invoice number hasn't been seen before
      expect(invoiceNumbers.has(invoice.invoiceNumber)).toBe(false);
      invoiceNumbers.add(invoice.invoiceNumber);
    }

    // Verify all invoice numbers are unique
    expect(invoiceNumbers.size).toBe(numberOfInvoices);
  });

  test('Property 11b: Invoice numbers follow expected format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            description: fc.string({ minLength: 1, maxLength: 50 }),
            quantity: fc.integer({ min: 1, max: 10 }),
            unitPrice: fc.double({ min: 1, max: 1000, noNaN: true }),
            type: fc.constantFrom('labor' as const, 'material' as const, 'other' as const),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (lineItems) => {
          const invoice = await ContractorInvoicingService.createInvoice({
            contractorId: testContractorId,
            customerId: testCustomerId,
            lineItems,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });

          createdInvoiceIds.push(invoice.id);

          // Verify format: INV-YYYYMMDD-XXXXX
          const formatRegex = /^INV-\d{8}-\d{5}$/;
          return formatRegex.test(invoice.invoiceNumber);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 11c: Invoice numbers contain current date', async () => {
    const invoice = await ContractorInvoicingService.createInvoice({
      contractorId: testContractorId,
      customerId: testCustomerId,
      lineItems: [
        {
          description: 'Test Item',
          quantity: 1,
          unitPrice: 100,
          type: 'labor',
        },
      ],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    createdInvoiceIds.push(invoice.id);

    // Extract date from invoice number (format: INV-YYYYMMDD-XXXXX)
    const dateStr = invoice.invoiceNumber.split('-')[1];
    const invoiceDate = new Date(
      parseInt(dateStr.substring(0, 4)),
      parseInt(dateStr.substring(4, 6)) - 1,
      parseInt(dateStr.substring(6, 8))
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    invoiceDate.setHours(0, 0, 0, 0);

    // Invoice date should be today
    expect(invoiceDate.getTime()).toBe(today.getTime());
  });

  test('Property 11d: Concurrent invoice creation maintains uniqueness', async () => {
    const numberOfConcurrentInvoices = 5;
    const invoicePromises = [];

    // Create multiple invoices concurrently
    for (let i = 0; i < numberOfConcurrentInvoices; i++) {
      invoicePromises.push(
        ContractorInvoicingService.createInvoice({
          contractorId: testContractorId,
          customerId: testCustomerId,
          lineItems: [
            {
              description: `Concurrent Test Item ${i}`,
              quantity: 1,
              unitPrice: 100,
              type: 'labor',
            },
          ],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
      );
    }

    const invoices = await Promise.all(invoicePromises);
    invoices.forEach(inv => createdInvoiceIds.push(inv.id));

    // Extract all invoice numbers
    const invoiceNumbers = invoices.map(inv => inv.invoiceNumber);

    // Check for duplicates
    const uniqueNumbers = new Set(invoiceNumbers);
    expect(uniqueNumbers.size).toBe(numberOfConcurrentInvoices);
  });
});
