'use server';

import prisma from '@/lib/prisma';
import type { PricingResult, StopData } from '@/types/TravelCalculations';
import type { ReturnTrip } from '@/types/WeedingReturnTrips';
import { getSession } from '@auth0/nextjs-auth0';
import type { BookingsType, User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';
import {
  buildBusesSQL,
  buildDailyStopSQL,
  buildExtrasSQL,
  buildMiddleSegmentSQL,
  buildMissingKmSQL,
  buildPricingDetailsSQL,
  buildPricingResultSQL,
  buildSegmentSQL
} from '../update-booking/updateBookingsHelpers';

function escapeQuotes(str: string): string {
  return str.replace(/'/g, "''");
}

export const saveBooking = async (payload: {
  baseAddress: string;
  serviceType: string;
  date: string;
  totalDuration: number;
  totalDistance: number;
  totalPrice: number | null;
  days: number;
  dailyStops: { dayIndex: number; pickup: StopData; dropoff: StopData; intermediates: StopData[] }[];
  pricingResults: PricingResult[];
  buses: { busTypeId: string; quantity: number }[];
  missingKmInfo: {
    effectiveDistance: number | null;
    adjustedDistance: number | null;
    missingKm: number | null;
    additionalPrice: number | null;
    differenceInTotalPrice: number | null;
  }[];
  bookingType: BookingsType;
  returnTrips: ReturnTrip[];
  overrideUserAdminBooking?: User | null;
}) => {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      redirect('/api/auth/login');
    }
    const user =
      payload.overrideUserAdminBooking || (await prisma.user.findUnique({ where: { email: session.user.email } }));
    if (!user) {
      throw new Error('User not found');
    }

    const adjustedDailyStops = payload.dailyStops.map((stop) => ({
      ...stop,
      pickup: { ...stop.pickup, time: stop.pickup.time },
      dropoff: { ...stop.dropoff, time: stop.dropoff.time },
      intermediates: stop.intermediates.map((i) => ({ ...i, time: i.time }))
    }));
    // Removed logic that pushed returnTrips into intermediates

    const adjustedPricingResults = payload.pricingResults.map((res) => ({
      ...res,
      segments: res.segments.map((seg) => ({
        ...seg,
        segmentStartTime: seg.segmentStartTime
      })),
      middleSegmentsWithPrices: res.middleSegmentsWithPrices.map((ms) => ({
        ...ms,
        pickupTime: ms.pickupTime
      }))
    }));

    const pricingResultIds = adjustedPricingResults.map((_, index) => ({
      id: randomUUID(),
      dayIndex: index
    }));

    const bookingId = randomUUID();
    const bookingSQL = `
      INSERT INTO "Bookings"(
        "id", "baseAddress", "serviceType", "date", "totalDuration",
        "totalDistance", "totalPrice", "days", "bookingType", "userId",
        "createdAt", "updatedAt"
      )
      VALUES (
        '${bookingId}',
        '${escapeQuotes(payload.baseAddress)}',
        '${escapeQuotes(payload.serviceType)}',
        '${escapeQuotes(payload.date)}',
        ${payload.totalDuration},
        ${payload.totalDistance},
        ${payload.totalPrice},
        ${payload.days},
        '${payload.bookingType}',
        '${user.id}',
        now(),
        now()
      );
    `;
    const dailyStopSQL = buildDailyStopSQL(adjustedDailyStops, bookingId);
    const pricingResultSQL = buildPricingResultSQL(adjustedPricingResults, bookingId, pricingResultIds);
    const segmentSQL = buildSegmentSQL(adjustedPricingResults, pricingResultIds);
    const detailsSQL = buildPricingDetailsSQL(adjustedPricingResults, pricingResultIds);
    const extrasSQL = buildExtrasSQL(adjustedPricingResults, pricingResultIds);
    const middleSegSQL = buildMiddleSegmentSQL(adjustedPricingResults, pricingResultIds);
    const busesSQL = buildBusesSQL(payload.buses, bookingId);
    const adjustedMissingKmInfo = payload.missingKmInfo.map((info) => ({
      effectiveDistance: info.effectiveDistance ?? 0,
      adjustedDistance: info.adjustedDistance ?? 0,
      missingKm: info.missingKm ?? 0,
      additionalPrice: info.additionalPrice ?? 0,
      differenceInTotalPrice: info.differenceInTotalPrice ?? 0
    }));
    const missingKmSQL = buildMissingKmSQL(adjustedMissingKmInfo, bookingId);

    // Add ReturnTrip SQL
    let returnTripSQL = '';
    if (payload.returnTrips && payload.returnTrips.length > 0) {
      const values = payload.returnTrips
        .map(
          (rt) => `(
        gen_random_uuid(),
        '${bookingId}',
        '${escapeQuotes(rt.address)}',
        '${rt.stops ? escapeQuotes(JSON.stringify(rt.stops)) : ''}',
        '${escapeQuotes(rt.time)}',
        '${rt.buses ? escapeQuotes(JSON.stringify(rt.buses)) : ''}'
      )`
        )
        .join(',');
      returnTripSQL = `
        INSERT INTO "ReturnTrip"(
          "id", "tripId", "address", "stops", "time", "buses"
        )
        VALUES ${values};
      `;
    }

    const fullSQL = `
      DO $$
      BEGIN
        ${bookingSQL}
        ${dailyStopSQL}
        ${pricingResultSQL}
        ${segmentSQL}
        ${detailsSQL}
        ${extrasSQL}
        ${middleSegSQL}
        ${busesSQL}
        ${missingKmSQL}
        ${returnTripSQL}
      END $$;
    `;

    await prisma.$executeRawUnsafe(fullSQL);
    return { trip: 'success' };
  } catch (error) {
    throw error instanceof Error && error.message ? error : new Error('Failed to save booking');
  }
};
