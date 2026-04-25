import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { onContractSigned } from '@/lib/services/contractor-automation';

type Params = { params: { token: string } };

// ── GET — load contract for public signing page ───────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const db = prisma as any;
    const contract = await db.contractorContract.findUnique({
      where: { token: params.token },
      select: {
        id: true,
        contractNumber: true,
        title: true,
        type: true,
        body: true,
        status: true,
        customerName: true,
        customerEmail: true,
        contractorName: true,
        contractorEmail: true,
        contractorPhone: true,
        contractAmount: true,
        depositAmount: true,
        paymentTerms: true,
        expiresAt: true,
        signedAt: true,
        declinedAt: true,
        notes: true,
      },
    });

    if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (contract.expiresAt && contract.expiresAt < new Date()) {
      // Mark expired if not already
      if (!['signed', 'void', 'expired'].includes(contract.status)) {
        await db.contractorContract.update({
          where: { token: params.token },
          data: { status: 'expired' },
        });
        await db.contractorContractEvent.create({
          data: { contractId: contract.id, eventType: 'expired', actor: 'system' },
        });
      }
      return NextResponse.json({ error: 'This signing link has expired', code: 'EXPIRED' }, { status: 410 });
    }

    // Mark as viewed if sent
    if (contract.status === 'sent') {
      await db.contractorContract.update({
        where: { token: params.token },
        data: { status: 'viewed', viewedAt: new Date() },
      });
      await db.contractorContractEvent.create({
        data: { contractId: contract.id, eventType: 'viewed', actor: 'customer' },
      });
    }

    return NextResponse.json({ contract });
  } catch (error) {
    console.error('GET /api/sign/contractor/[token]', error);
    return NextResponse.json({ error: 'Failed to load contract' }, { status: 500 });
  }
}

// ── POST — submit signature ───────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const db = prisma as any;
    const contract = await db.contractorContract.findUnique({
      where: { token: params.token },
    });

    if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (contract.expiresAt && contract.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Signing link has expired', code: 'EXPIRED' }, { status: 410 });
    }

    if (contract.status === 'signed') {
      return NextResponse.json({ error: 'Contract already signed' }, { status: 400 });
    }

    if (['void', 'expired', 'declined'].includes(contract.status)) {
      return NextResponse.json({ error: 'This contract can no longer be signed' }, { status: 400 });
    }

    const body = await req.json();
    const { action, signatureDataUrl, signerName, declineReason } = body as {
      action: 'sign' | 'decline';
      signatureDataUrl?: string;
      signerName?: string;
      declineReason?: string;
    };

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';
    const ua = req.headers.get('user-agent') || '';

    if (action === 'decline') {
      await db.contractorContract.update({
        where: { token: params.token },
        data: { status: 'declined', declinedAt: new Date(), declineReason: declineReason || null },
      });
      await db.contractorContractEvent.create({
        data: {
          contractId: contract.id,
          eventType: 'declined',
          actor: 'customer',
          actorName: contract.customerName,
          actorIp: ip,
          note: declineReason || null,
        },
      });

      // Notify contractor of decline
      try {
        const profile = await prisma.contractorProfile.findUnique({
          where: { id: contract.contractorId },
          select: { userId: true },
        });
        if (profile?.userId) {
          await db.notification.create({
            data: {
              userId: profile.userId,
              type: 'alert',
              title: 'Contract Declined',
              message: `${contract.customerName} declined "${contract.title}"${declineReason ? `: ${declineReason}` : ''}`,
              actionUrl: `/contractor/contracts/${contract.id}`,
            },
          });
        }
      } catch (_) {}

      return NextResponse.json({ success: true, status: 'declined' });
    }

    if (action === 'sign') {
      if (!signatureDataUrl) {
        return NextResponse.json({ error: 'Signature is required' }, { status: 400 });
      }

      await db.contractorContract.update({
        where: { token: params.token },
        data: {
          status: 'signed',
          signedAt: new Date(),
          customerSignatureDataUrl: signatureDataUrl,
          customerSignedIp: ip,
          customerSignedUserAgent: ua,
          customerSignedName: signerName || contract.customerName,
        },
      });

      await db.contractorContractEvent.create({
        data: {
          contractId: contract.id,
          eventType: 'signed',
          actor: 'customer',
          actorName: signerName || contract.customerName,
          actorIp: ip,
          note: `Signed by ${signerName || contract.customerName}`,
        },
      });

      // Notify contractor via notification if they have a user account
      try {
        const profile = await prisma.contractorProfile.findUnique({
          where: { id: contract.contractorId },
          select: { userId: true },
        });
        if (profile?.userId) {
          await db.notification.create({
            data: {
              userId: profile.userId,
              type: 'contract_signed',
              title: 'Contract Signed',
              message: `${signerName || contract.customerName} signed "${contract.title}" (${contract.contractNumber}).`,
              actionUrl: `/contractor/contracts/${contract.id}`,
            },
          });
        }
      } catch (_) {
        // Non-critical
      }

      // Run post-signing automation (transitions job, notifies contractor, etc.)
      try {
        await onContractSigned(contract.id);
      } catch (automationError) {
        console.error('Post-signing automation error (non-blocking):', automationError);
      }

      return NextResponse.json({ success: true, status: 'signed', signedAt: new Date() });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/sign/contractor/[token]', error);
    return NextResponse.json({ error: 'Failed to process signature' }, { status: 500 });
  }
}
