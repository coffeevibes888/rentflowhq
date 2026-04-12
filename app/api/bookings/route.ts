import { prisma } from '@/db/prisma';
import { NextResponse } from 'next/server';
import { eventBus } from '@/lib/event-system';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contractorId, date, time, name, email, phone, service } = body;

    // Create booking/appointment request
    const booking = await prisma.contractorAppointment.create({
      data: {
        contractorId,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        serviceRequested: service,
        requestedDate: new Date(date),
        requestedTime: time,
        status: 'pending',
        source: 'website_booking',
      },
    });

    // Emit event for new booking
    await eventBus.emit('contractor.booking.created', {
      bookingId: booking.id,
      contractorId,
      customerName: name,
      customerEmail: email,
      requestedDate: date,
      requestedTime: time,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
