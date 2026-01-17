import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Create a new contractor lead
 * POST /api/contractor/leads
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const {
      projectType,
      projectTitle,
      projectDescription,
      timeline,
      urgency,
      budgetMin,
      budgetMax,
      propertyAddress,
      propertyCity,
      propertyState,
      propertyZip,
      propertyType,
      customerName,
      customerEmail,
      customerPhone,
      isExclusive,
      preselectedContractorId,
      photos,
    } = body;

    // Validate required fields
    if (!projectType || !projectDescription || !customerName || !customerEmail || !propertyZip) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate lead score based on completeness and quality signals
    let leadScore = 50; // Base score
    
    // Completeness bonuses
    if (projectTitle) leadScore += 5;
    if (budgetMin || budgetMax) leadScore += 10;
    if (propertyAddress) leadScore += 5;
    if (customerPhone) leadScore += 10;
    if (photos && photos.length > 0) leadScore += 15;
    if (projectDescription.length > 100) leadScore += 5;
    if (projectDescription.length > 300) leadScore += 5;
    
    // Timeline/urgency bonuses
    if (urgency === 'emergency') leadScore += 15;
    else if (urgency === 'urgent') leadScore += 10;
    else if (urgency === 'normal') leadScore += 5;
    
    // Verified user bonus
    if (session?.user?.id) leadScore += 10;

    // Cap at 100
    leadScore = Math.min(leadScore, 100);

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the lead
    const lead = await prisma.contractorLead.create({
      data: {
        source: preselectedContractorId ? 'subdomain' : 'marketplace',
        sourceId: preselectedContractorId || null,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        customerUserId: session?.user?.id || null,
        projectType,
        projectTitle: projectTitle || null,
        projectDescription,
        projectPhotos: photos || [],
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        timeline: timeline || null,
        urgency: urgency || 'normal',
        propertyAddress: propertyAddress || null,
        propertyCity: propertyCity || null,
        propertyState: propertyState || null,
        propertyZip,
        propertyType: propertyType || 'residential',
        leadScore,
        isVerified: !!session?.user?.id,
        isExclusive: isExclusive || false,
        maxContractors: isExclusive ? 1 : 3,
        status: 'new',
        expiresAt,
      },
    });

    // If preselected contractor, create match immediately
    if (preselectedContractorId) {
      await createLeadMatch(lead.id, preselectedContractorId, true);
    } else {
      // Find and match contractors
      await matchContractorsToLead(lead.id);
    }

    // TODO: Send email confirmation to customer
    // TODO: Send notifications to matched contractors

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      message: 'Your request has been submitted. Contractors will reach out soon.',
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit request' },
      { status: 500 }
    );
  }
}

/**
 * Get leads for the current user (as customer) or contractor
 * GET /api/contractor/leads
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || 'customer'; // customer or contractor
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (role === 'contractor') {
      // Get contractor's profile
      const contractor = await prisma.contractorProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!contractor) {
        return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
      }

      // Get leads matched to this contractor
      const matches = await prisma.contractorLeadMatch.findMany({
        where: {
          contractorId: contractor.id,
          ...(status && { status }),
        },
        include: {
          lead: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json({
        success: true,
        leads: matches.map(m => ({
          ...m.lead,
          matchStatus: m.status,
          matchId: m.id,
          leadCost: m.leadCost,
          viewedAt: m.viewedAt,
          respondedAt: m.respondedAt,
        })),
      });
    } else {
      // Get leads submitted by this customer
      const leads = await prisma.contractorLead.findMany({
        where: {
          customerUserId: session.user.id,
          ...(status && { status }),
        },
        include: {
          matches: {
            include: {
              contractor: {
                select: {
                  id: true,
                  businessName: true,
                  profilePhoto: true,
                  avgRating: true,
                  totalReviews: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json({
        success: true,
        leads,
      });
    }
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

/**
 * Match contractors to a lead based on specialty, location, and availability
 */
async function matchContractorsToLead(leadId: string) {
  const lead = await prisma.contractorLead.findUnique({
    where: { id: leadId },
  });

  if (!lead) return;

  // Find matching contractors
  const contractors = await prisma.contractorProfile.findMany({
    where: {
      isPublic: true,
      acceptingNewWork: true,
      isAvailable: true,
      specialties: {
        has: lead.projectType,
      },
      // Location matching - check if contractor serves this zip code
      OR: [
        { serviceAreas: { has: lead.propertyZip || '' } },
        { baseState: lead.propertyState },
        // If no specific service areas, match by state
        { serviceAreas: { isEmpty: true }, baseState: lead.propertyState },
      ],
    },
    include: {
      leadCredit: true,
      leadPreferences: true,
    },
    orderBy: [
      { rankScore: 'desc' },
      { avgRating: 'desc' },
    ],
    take: lead.maxContractors * 2, // Get extra in case some don't qualify
  });

  // Filter and score contractors
  const scoredContractors = contractors
    .filter(c => {
      // Check if contractor has credits or subscription
      const credit = c.leadCredit;
      if (!credit) return true; // New contractors get free leads initially
      
      // Check preferences
      const prefs = c.leadPreferences;
      if (prefs?.isPaused) return false;
      if (prefs?.minJobValue && lead.budgetMax && parseFloat(lead.budgetMax.toString()) < parseFloat(prefs.minJobValue.toString())) return false;
      
      return true;
    })
    .map(c => ({
      contractor: c,
      score: calculateMatchScore(c, lead),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, lead.maxContractors);

  // Create matches
  for (const { contractor, score } of scoredContractors) {
    await createLeadMatch(leadId, contractor.id, lead.isExclusive, score);
  }

  // Update lead status
  await prisma.contractorLead.update({
    where: { id: leadId },
    data: { status: scoredContractors.length > 0 ? 'matching' : 'new' },
  });
}

/**
 * Create a lead match record
 */
async function createLeadMatch(
  leadId: string, 
  contractorId: string, 
  isExclusive: boolean,
  matchScore: number = 50
) {
  // Determine pricing based on contractor's preferences
  const contractor = await prisma.contractorProfile.findUnique({
    where: { id: contractorId },
    include: { leadCredit: true },
  });

  const pricingModel = contractor?.leadCredit?.preferredPricing || 'per_lead';
  
  // Calculate lead cost based on lead quality and exclusivity
  let leadCost = 10; // Base cost
  if (isExclusive) leadCost *= 2;
  // Higher quality leads cost more
  const lead = await prisma.contractorLead.findUnique({ where: { id: leadId } });
  if (lead && lead.leadScore > 70) leadCost += 5;
  if (lead && lead.leadScore > 85) leadCost += 5;

  const match = await prisma.contractorLeadMatch.create({
    data: {
      leadId,
      contractorId,
      pricingModel,
      leadCost: pricingModel === 'per_lead' ? leadCost : null,
      bookingFeePercent: pricingModel === 'per_booking' ? 6 : null,
      matchScore,
      status: 'pending',
      priority: matchScore,
    },
  });

  // ✅ NEW: Emit event for contractor lead match (notifies contractor)
  try {
    const { dbTriggers } = await import('@/lib/event-system');
    if (lead) {
      await dbTriggers.onContractorLeadMatch(match, lead);
    }
  } catch (error) {
    console.error('Failed to emit lead match event:', error);
  }
}

/**
 * Calculate how well a contractor matches a lead
 */
function calculateMatchScore(contractor: any, lead: any): number {
  let score = 50; // Base score

  // Rating bonus
  if (contractor.avgRating >= 4.5) score += 20;
  else if (contractor.avgRating >= 4.0) score += 15;
  else if (contractor.avgRating >= 3.5) score += 10;

  // Experience bonus
  if (contractor.completedJobs > 100) score += 15;
  else if (contractor.completedJobs > 50) score += 10;
  else if (contractor.completedJobs > 20) score += 5;

  // Response rate bonus
  if (contractor.responseRate > 90) score += 10;
  else if (contractor.responseRate > 75) score += 5;

  // Verification bonuses
  if (contractor.insuranceVerified) score += 5;
  if (contractor.backgroundChecked) score += 5;
  if (contractor.identityVerified) score += 5;

  // Location proximity (if we had coordinates, we'd calculate distance)
  if (contractor.baseCity === lead.propertyCity) score += 10;
  if (contractor.baseState === lead.propertyState) score += 5;

  return Math.min(score, 100);
}
