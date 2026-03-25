'server-only';
'use server';
import prisma from '@/lib/prisma';
import type { BookingsType } from '@prisma/client';

export async function updateBookingType({ bookingId, bookingType }: { bookingId: string; bookingType: BookingsType }) {
  try {
    return await prisma.bookings.update({
      where: { id: bookingId },
      data: { bookingType }
    });
  } catch (error) {
    throw new Error(`Failed to update booking type: ${error}`);
  }
}
