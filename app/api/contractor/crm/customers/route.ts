/**
 * Contractor CRM Customers API
 * 
 * GET /api/contractor/crm/customers - Get all customers
 * GET /api/contractor/crm/customers/[id] - Get customer details with history
 * 
 * Requirements: 7.3, 7.4, 7.7
 */

import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { ContractorCRMService } from '@/lib/services/contractor-crm';

/**
 * GET /api/contractor/crm/customers
 * Get all customers for the authenticated contractor with optional filters
 * 
 * Query params:
 * - status: comma-separated list of statuses
 * - search: search by name, email, or phone
 * - tags: comma-separated list of tags
 * 
 * Returns: { success: boolean, customers: Customer[] }
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get contractor profile for this user
    const contractor = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!contractor) {
      return NextResponse.json(
        { error: 'Contractor profile not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    
    const filters: {
      status?: string[];
      search?: string;
      tags?: string[];
    } = {};

    // Parse status filter
    const statusParam = searchParams.get('status');
    if (statusParam) {
      filters.status = statusParam.split(',');
    }

    // Parse search filter
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    // Parse tags filter
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      filters.tags = tagsParam.split(',');
    }

    // Get customers from CRM service
    const customers = await ContractorCRMService.getCustomers(contractor.id, filters);

    return NextResponse.json({
      success: true,
      customers,
    });

  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to retrieve customers. Please try again later.'
      },
      { status: 500 }
    );
  }
}
