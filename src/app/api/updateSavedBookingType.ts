'use server';

import prisma from '@/lib/prisma';
import type { BookingsType } from '@prisma/client';

export const updateSavedBookingType = async (id: string, bookingType: BookingsType) => {
  try {
    await prisma.bookings.update({
      where: { id },
      data: { bookingType }
    });
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, error: (error as Error).message };
  }
};
