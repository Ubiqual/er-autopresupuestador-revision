'use server';

import prisma from '@/lib/prisma';

export async function fetchBasicPricingDetailsByBookingId({ bookingId }: { bookingId: string }) {
  if (!bookingId) {
    throw new Error('bookingId is required');
  }

  try {
    const pricingDetails = await prisma.pricingDetails.findMany({
      where: {
        pricingResult: {
          tripId: bookingId
        }
      },
      select: {
        numberOfPeople: true,
        finalPricePerKm: true,
        finalPricePerMinute: true
      }
    });

    if (!pricingDetails || pricingDetails.length === 0) {
      throw new Error('PricingDetails not found for the provided bookingId');
    }

    return pricingDetails;
  } catch (error) {
    throw new Error('Failed to fetch basic pricing details');
  }
}
