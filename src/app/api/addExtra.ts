'use server';

import prisma from '@/lib/prisma';

interface AddExtraParams {
  bookingId: string;
  name: string;
  price: number;
  vat: number;
}

export async function addExtra({ name, price, bookingId, vat }: AddExtraParams) {
  try {
    const finalPriceWithVat = price * (1 + vat);

    const [customExtra] = await prisma.$transaction([
      prisma.customExtras.create({
        data: {
          name,
          price,
          booking: { connect: { id: bookingId } }
        }
      }),
      prisma.$executeRaw`
        UPDATE "Bookings"
        SET "totalPrice" = "totalPrice" + ${finalPriceWithVat}
        WHERE "id" = ${bookingId}
      `
    ]);

    return customExtra;
  } catch (error) {
    throw new Error('Failed to add custom extra.');
  }
}
