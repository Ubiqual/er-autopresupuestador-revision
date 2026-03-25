'use server';

import prisma from '@/lib/prisma';
import type { PricingResult, StopData } from '@/types/TravelCalculations';
import type { ReturnTrip } from '@/types/WeedingReturnTrips';
import { getSession } from '@auth0/nextjs-auth0';
import { type BookingsType, type User } from '@prisma/client';
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
  buildSegmentSQL,
  buildUpdateDeleteSQL
} from './updateBookingsHelpers';

export const updateBooking = async (payload: {
  id: string;
  baseAddress: string;
  serviceType: string;
  date: string;
  totalDuration: number;
  totalDistance: number;
  totalPrice: number;
  days: number;
  bookingType: BookingsType;
  dailyStops: {
    dayIndex: number;
    pickup: StopData;
    dropoff: StopData;
    intermediates: StopData[];
  }[];
  pricingResults: PricingResult[];
  buses: { busTypeId: string; quantity: number }[];
  missingKmInfo: {
    effectiveDistance: number;
    adjustedDistance: number;
    missingKm: number;
    additionalPrice: number;
    differenceInTotalPrice: number;
  }[];
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
    if (payload.returnTrips.length > 0 && adjustedDailyStops.length > 0) {
      const lastStop: { pickup: StopData; dropoff: StopData; intermediates: (StopData | ReturnTrip)[] } =
        adjustedDailyStops[adjustedDailyStops.length - 1];
      if (lastStop.intermediates.length > 0) {
        lastStop.intermediates.pop();
      }
      lastStop.intermediates.push(...payload.returnTrips);
    }

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

    const updateDeleteSQL = buildUpdateDeleteSQL({
      id: payload.id,
      baseAddress: payload.baseAddress,
      serviceType: payload.serviceType,
      date: payload.date,
      totalDuration: payload.totalDuration,
      totalDistance: payload.totalDistance,
      totalPrice: payload.totalPrice,
      days: payload.days,
      bookingType: payload.bookingType
    });
    const dailyStopSQL = buildDailyStopSQL(adjustedDailyStops, payload.id);
    const pricingResultSQL = buildPricingResultSQL(adjustedPricingResults, payload.id, pricingResultIds);
    const segmentSQL = buildSegmentSQL(adjustedPricingResults, pricingResultIds);
    const detailsSQL = buildPricingDetailsSQL(adjustedPricingResults, pricingResultIds);
    const extrasSQL = buildExtrasSQL(adjustedPricingResults, pricingResultIds);
    const middleSegSQL = buildMiddleSegmentSQL(adjustedPricingResults, pricingResultIds);
    const busesSQL = buildBusesSQL(payload.buses, payload.id);
    const missingKmSQL = buildMissingKmSQL(payload.missingKmInfo, payload.id);

    const fullSQL = `
      DO $$
      BEGIN
        ${updateDeleteSQL}
        ${dailyStopSQL}
        ${pricingResultSQL}
        ${segmentSQL}
        ${detailsSQL}
        ${extrasSQL}
        ${middleSegSQL}
        ${busesSQL}
        ${missingKmSQL}
      END $$;
    `;

    await prisma.$executeRawUnsafe(fullSQL);
    return { booking: 'success' };
  } catch (error) {
    throw error instanceof Error && error.message ? error : new Error('Failed to update booking');
  }
};
