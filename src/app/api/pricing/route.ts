import prisma from '@/lib/prisma';
import type { MiddleSegmentPricing, SegmentPricing } from '@/types/TravelCalculations';
import { calculateRestPeriods } from '@/utils/calculateRestPeriods';
import { convertDurationToMinutes } from '@/utils/convertDrivingToMinutes';
import { t } from '@/utils/i18n';
import type { PricingDetails } from '@prisma/client';
import { addMinutes, format } from 'date-fns';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { fetchConfigureTrip } from '../admin/fetchConfigureTrip';
import { fetchCustomExtrasForBooking } from '../admin/fetchCustomExtrasForBooking';
import { fetchRestHours } from '../admin/fetchRestHours';
import { fetchSeason } from '../admin/fetchSeason';
import { fetchServiceMinimums } from '../admin/fetchServcieMinimum';
import { fetchBasicPricingDetailsByBookingId } from '../fetchPricingDetails';
import fetchVat from '../fetchVat';
import { calculateExtras } from './calculateExtras';
import { calculateMiddleSegmentsPrices } from './utils/calculateMiddleSegmentsPrices';
import { calculateRestTimePrice } from './utils/calculateRestTimePrice';
import { calculateSegmentPrices } from './utils/calculateSegmentPrices';
import { generateQuery } from './utils/fetchPricingPerBus';

export async function POST(req: NextRequest) {
  try {
    const {
      date,
      busSelection,
      segments,
      restTime,
      serviceName,
      stops,
      drivingDuration,
      totalDuration,
      middleSegments,
      restTimestamps,
      dayCount,
      currentDayIndex,
      isInMadrid,
      isWithinSpainPortugalAndorra,
      dailyStops,
      returnTrips,
      dailyStopsOfPreviousDay,
      pricing,
      bookingId,
      lastStopIndex
    } = await req.json();

    const travelTimeOnly = date.split(' ')[1];

    const restHours = await fetchRestHours();
    const tripMinimums = await fetchConfigureTrip();

    const totalDurationinMinutes = Math.round(convertDurationToMinutes(totalDuration));

    const totalDrivingDuration = Math.round(convertDurationToMinutes(drivingDuration));
    const drivingTimeLimitInMinutes = restHours && restHours.fullDayDriving * 60;
    const durationLimitInMinutes = restHours && restHours.excursionsLimit * 60;
    const restDurationInHours = restHours && restHours.fullDayRest;
    let restTimeinMinutes = 0;

    if (!drivingTimeLimitInMinutes || !durationLimitInMinutes || !restDurationInHours) {
      return NextResponse.json({ error: t('errors.dbImportsError') }, { status: 500 });
    }
    if (totalDrivingDuration > drivingTimeLimitInMinutes) {
      restTimeinMinutes = calculateRestPeriods(totalDrivingDuration, drivingTimeLimitInMinutes, restDurationInHours);
    } else {
      if (totalDurationinMinutes > durationLimitInMinutes) {
        restTimeinMinutes = calculateRestPeriods(totalDrivingDuration, durationLimitInMinutes, restDurationInHours);
      }
    }

    const endDate = addMinutes(dailyStops.pickup.time, totalDurationinMinutes + restTimeinMinutes * 60);
    const endDateFormated = format(endDate, 'yyyy-MM-dd HH:mm:ss');
    const travelDateUTC = new Date(dailyStops.pickup.time.split(' ')[0] + 'T00:00:00.000Z');
    const pickupLocation = stops[0].address;
    const dropoffLocation = stops[stops.length - 1].address;

    let totalDURATION = 0;
    let minimumPricePerDayDuration = 0;
    let minimumPerDayDuration = 0;
    let extraTotalPrice = 0;
    const totalPrice = { value: 0 };

    const season = await fetchSeason(travelDateUTC);
    const vat = await fetchVat();

    if (!season) {
      return NextResponse.json({ error: t('errors.noSeasonFound') }, { status: 404 });
    }

    const seasonAdjustment = season.adjustmentPercentage || 0;

    const serviceMinimums = await fetchServiceMinimums(serviceName);

    const minimumKM = serviceMinimums
      ? dayCount > 1 && currentDayIndex !== 0 && currentDayIndex !== dayCount - 1
        ? 0
        : serviceMinimums.minimumKM
      : 0;
    const minimumTime = serviceMinimums
      ? dayCount > 1 && currentDayIndex !== 0 && currentDayIndex !== dayCount - 1
        ? 0
        : serviceMinimums.minimumTime
      : 0;

    const travelStartDateTime = dayCount > 1 ? dailyStops.pickup.time : segments[0].segmentStartTime;
    const travelEndDateTime = endDateFormated;
    const result = await prisma.$queryRawUnsafe<
      {
        numberOfPeople: number;
        finalPricePerKm: number;
        finalPricePerMinute: number;
        seasonAdjustment: number;
        busTypeAdjustment: number;
        busyTimeAdjustment: number;
        nightTimeAdjustment: number;
      }[]
    >(
      generateQuery({
        serviceName,
        travelStartDateTime,
        travelEndDateTime,
        seasonAdjustment
      })
    );

    if (pricing && bookingId) {
      const oldPrices = await fetchBasicPricingDetailsByBookingId({ bookingId });
      const isUnchanged = pricing.every((p: PricingDetails) => {
        const oldPrice = oldPrices.find((op) => op.numberOfPeople === p.numberOfPeople);
        return (
          oldPrice &&
          oldPrice.finalPricePerKm === p.finalPricePerKm &&
          oldPrice.finalPricePerMinute === p.finalPricePerMinute
        );
      });
      if (!isUnchanged) {
        result.forEach((item) => {
          const matchedPricing = pricing.find((p: PricingDetails) => p.numberOfPeople === item.numberOfPeople);
          if (matchedPricing) {
            item.finalPricePerKm = matchedPricing.finalPricePerKm;
            item.finalPricePerMinute = matchedPricing.finalPricePerMinute;
          }
        });
      }
    }

    if (result.length === 0) {
      return NextResponse.json({ error: t('errors.noPricingData') }, { status: 404 });
    }

    const uniqueRestTimestamps = Array.from(
      new Set(restTimestamps.map((timestamp: Date) => new Date(timestamp).getTime()))
    )
      .sort((a, b): number => (a as number) - (b as number)) // Sort to ensure timestamps are in ascending order
      .map((timestamp) => new Date(timestamp as Date));

    const { segmentsWithPrices } = calculateSegmentPrices({
      segments,
      minimumKM,
      minimumTime,
      busSelection,
      result,
      uniqueRestTimestamps,
      currentDayIndex,
      dayCount,
      restHours,
      totalPrice // Pass the totalPrice variable
    });

    const { middleSegmentsWithPrices } = calculateMiddleSegmentsPrices({
      middleSegments,
      stops,
      busSelection,
      returnTrips,
      result,
      uniqueRestTimestamps,
      segments,
      serviceName,
      restHours,
      totalPrice,
      lastStopIndex
    });

    const restTimePrice = calculateRestTimePrice(restTime, busSelection, result);

    const extras = await calculateExtras({
      date,
      time: travelTimeOnly,
      startLocation: pickupLocation,
      dropOffLocation: dropoffLocation,
      totalDuration: totalDuration,
      totalDrivingDuration: drivingDuration,
      serviceName,
      isInMadrid,
      isWithinSpainPortugalAndorra,
      dayCount,
      currentDayIndex,
      dailyStopsOfPreviousDay,
      segments
    });

    if (extras instanceof Error) {
      return NextResponse.json({ error: extras.message }, { status: 500 });
    }
    for (const [, quantity] of Object.entries(busSelection)) {
      // Multiply each extra by the quantity of buses
      const extrasPriceForBusType = extras.reduce((total, extra) => total + extra.price * (quantity as number), 0);
      extraTotalPrice += extrasPriceForBusType;
    }
    totalPrice.value += extraTotalPrice;

    const minimumTimePerDayDuration = tripMinimums!.minimumTimePerDay * 60;
    segmentsWithPrices.forEach((segment: SegmentPricing) => {
      totalDURATION += segment.duration;
    });

    middleSegmentsWithPrices.forEach((segment: MiddleSegmentPricing) => {
      totalDURATION += segment.waitingTime ?? 0;
    });

    if (serviceName.toLowerCase() === 'viajes' && totalDURATION < tripMinimums!.minimumTimePerDay * 60) {
      totalDURATION += uniqueRestTimestamps.length * restHours!.restDuration * 60;
      const missingMinutes = tripMinimums!.minimumTimePerDay * 60 - totalDURATION;
      minimumPerDayDuration = missingMinutes;
      for (const [busType, quantity] of Object.entries(busSelection)) {
        const pricing = result.find((r) => r.numberOfPeople === parseInt(busType));
        if (pricing) {
          totalPrice.value += pricing.finalPricePerMinute * missingMinutes * (quantity as number);
          minimumPricePerDayDuration += pricing.finalPricePerMinute * missingMinutes * (quantity as number);
        }
      }
    }

    if (bookingId) {
      const customExtras = await fetchCustomExtrasForBooking({ bookingId });
      const extrasTotal = customExtras.reduce((sum, extra) => sum + extra.price, 0);
      totalPrice.value += extrasTotal;
    }

    const netPrice = totalPrice.value;
    const vatRate = vat?.rate ?? 0;
    const finalPriceWithVat = netPrice * (1 + vatRate);

    return NextResponse.json({
      result: {
        details: result.map(
          ({
            numberOfPeople,
            finalPricePerKm,
            finalPricePerMinute,
            seasonAdjustment,
            busTypeAdjustment,
            busyTimeAdjustment,
            nightTimeAdjustment
          }) => ({
            numberOfPeople,
            finalPricePerKm,
            finalPricePerMinute,
            seasonAdjustment,
            busTypeAdjustment,
            busyTimeAdjustment,
            nightTimeAdjustment
          })
        ),
        segments: segmentsWithPrices,
        middleSegmentsWithPrices,
        restTimePrice,
        totalPrice: finalPriceWithVat,
        extras,
        minimumPricePerDayDuration,
        minimumPerDayDuration,
        totalDuration: totalDURATION,
        minimumTimePerDayDuration
      }
    });
  } catch (error) {
    return NextResponse.json({ error: t('errors.unexpectedError') }, { status: 500 });
  }
}
