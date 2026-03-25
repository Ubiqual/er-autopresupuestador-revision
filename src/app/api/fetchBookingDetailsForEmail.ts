'server-only';
'use server';

import prisma from '@/lib/prisma';

export async function fetchBookingForEmails(id: string) {
  return await prisma.bookings.findUnique({
    where: { id },
    include: {
      dailyStops: true,
      buses: true,
      returnTrip: true
    }
  });
}
