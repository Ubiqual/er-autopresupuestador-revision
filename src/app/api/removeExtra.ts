'use server';

import prisma from '@/lib/prisma';

export async function removeCustomExtra({
  extraId,
  bookingId,
  price
}: {
  extraId: string;
  bookingId: string;
  price: number;
}) {
  if (!extraId) {
    throw new Error('ID is required');
  }

  try {
    await prisma.$transaction([
      prisma.customExtras.delete({
        where: { id: extraId }
      }),
      prisma.bookings.update({
        where: { id: bookingId },
        data: {
          totalPrice: { decrement: price }
        }
      })
    ]);
    return { message: 'CustomExtra removed successfully' };
  } catch (error) {
    throw new Error('Failed to remove customExtra');
  }
}
