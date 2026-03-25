'use server';
import prisma from '@/lib/prisma';
import type { StopData } from '@/types/TravelCalculations';

function transformStopData(json: unknown): StopData {
  return json as StopData;
}

function transformStopDataArray(json: unknown): StopData[] {
  if (!json) {
    return [];
  }
  return json as StopData[];
}

export async function fetchBookingDetails(id: string) {
  const booking = await prisma.bookings.findUnique({
    where: { id },
    include: {
      dailyStops: true,
      pricingResults: {
        include: {
          segments: true,
          details: true,
          extras: {
            include: { extra: true }
          },
          middleSegmentsWithPrices: true
        }
      },
      buses: true,
      missingKmInfo: true,
      customExtras: true,
      returnTrip: true
    }
  });

  if (!booking) {
    return null;
  }

  const transformedDailyStops = booking.dailyStops.map((ds) => ({
    ...ds,
    pickup: transformStopData(ds.pickup),
    dropoff: transformStopData(ds.dropoff),
    intermediates: transformStopDataArray(ds.intermediates)
  }));

  return {
    ...booking,
    dailyStops: transformedDailyStops
  };
}
