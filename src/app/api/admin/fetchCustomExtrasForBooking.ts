'use server';

import prisma from '@/lib/prisma';

export const fetchCustomExtrasForBooking = async ({ bookingId }: { bookingId: string }) => {
  return await prisma.customExtras.findMany({
    where: {
      booking: {
        id: bookingId
      }
    }
  });
};
