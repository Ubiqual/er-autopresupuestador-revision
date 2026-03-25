/* eslint-disable max-lines */

import type { PricingResult, StopData } from '@/types/TravelCalculations';
import type { BookingsType } from '@prisma/client';

function escapeQuotes(str: string): string {
  return str.replace(/'/g, "''");
}

export function buildUpdateDeleteSQL(payload: {
  id: string;
  baseAddress: string;
  serviceType: string;
  date: string;
  totalDuration: number;
  totalDistance: number;
  totalPrice: number;
  days: number;
  bookingType: BookingsType;
}) {
  return `
    UPDATE "Bookings"
    SET
      "baseAddress" = '${escapeQuotes(payload.baseAddress)}',
      "serviceType" = '${escapeQuotes(payload.serviceType)}',
      "date" = '${escapeQuotes(payload.date)}',
      "totalDuration" = ${payload.totalDuration},
      "totalDistance" = ${payload.totalDistance},
      "totalPrice" = ${payload.totalPrice},
      "days" = ${payload.days},
      "bookingType" = '${payload.bookingType}'
    WHERE "id" = '${payload.id}';

    DELETE FROM "MiddleSegmentPricing"
    USING "PricingResult"
    WHERE "MiddleSegmentPricing"."pricingResultId" = "PricingResult"."id"
      AND "PricingResult"."tripId" = '${payload.id}';

    DELETE FROM "pricing_result_extra"
    USING "PricingResult"
    WHERE "pricing_result_extra"."pricingResultId" = "PricingResult"."id"
      AND "PricingResult"."tripId" = '${payload.id}';

    DELETE FROM "PricingDetails"
    USING "PricingResult"
    WHERE "PricingDetails"."pricingResultId" = "PricingResult"."id"
      AND "PricingResult"."tripId" = '${payload.id}';

    DELETE FROM "SegmentPricing"
    USING "PricingResult"
    WHERE "SegmentPricing"."pricingResultId" = "PricingResult"."id"
      AND "PricingResult"."tripId" = '${payload.id}';

    DELETE FROM "PricingResult"
    WHERE "tripId" = '${payload.id}';

    DELETE FROM "DailyStop"
    WHERE "tripId" = '${payload.id}';

    DELETE FROM "BookingsSelectedBuses"
    WHERE "tripId" = '${payload.id}';

    DELETE FROM "MissingKmInfo"
    WHERE "tripId" = '${payload.id}';
  `;
}

export function buildDailyStopSQL(
  dailyStops: {
    dayIndex: number;
    pickup: StopData;
    dropoff: StopData;
    intermediates: StopData[];
  }[],
  bookingId: string
) {
  if (!dailyStops.length) {
    throw new Error('Daily stops are required for the booking.');
  }

  const values = dailyStops
    .map((ds) => {
      const pickupJson = escapeQuotes(JSON.stringify(ds.pickup));
      const dropoffJson = escapeQuotes(JSON.stringify(ds.dropoff));
      const interJson = escapeQuotes(JSON.stringify(ds.intermediates));
      return `(
        gen_random_uuid(),
        '${bookingId}',
        ${ds.dayIndex},
        '${pickupJson}',
        '${dropoffJson}',
        '${interJson}'
      )`;
    })
    .join(',');

  return `
    INSERT INTO "DailyStop"("id","tripId","dayIndex","pickup","dropoff","intermediates")
    VALUES ${values};
  `;
}

export function buildPricingResultSQL(
  pricingResults: PricingResult[],
  bookingId: string,
  pricingResultIds: { id: string; dayIndex: number }[]
) {
  if (!pricingResults.length) {
    throw new Error('Pricing results are required for the booking.');
  }

  const values = pricingResults
    .map((pr, idx) => {
      if (
        pr.totalPrice === undefined ||
        pr.totalDuration === undefined ||
        pr.restTimePrice === undefined ||
        pr.minimumPerDayDuration === undefined ||
        pr.minimumPricePerDayDuration === undefined ||
        pr.minimumTimePerDayDuration === undefined
      ) {
        throw new Error(`Missing required pricing result fields at index ${idx}.`);
      }
      const preId = pricingResultIds[idx].id;
      return `(
        '${preId}',
        '${bookingId}',
        ${idx},
        ${pr.totalPrice},
        ${pr.totalDuration},
        ${pr.restTimePrice},
        ${pr.minimumPerDayDuration},
        ${pr.minimumPricePerDayDuration},
        ${pr.minimumTimePerDayDuration}
      )`;
    })
    .join(',');

  return `
    INSERT INTO "PricingResult"(
      "id","tripId","dayIndex","totalPrice","totalDuration",
      "restTimePrice","minimumPerDayDuration","minimumPricePerDayDuration",
      "minimumTimePerDayDuration"
    )
    VALUES ${values};
  `;
}

export function buildSegmentSQL(pricingResults: PricingResult[], pricingResultIds: { id: string; dayIndex: number }[]) {
  const segmentsArray = pricingResults.flatMap((pr, idx) => {
    if (!pr.segments || pr.segments.length === 0) {
      throw new Error(`Missing segments for pricing result at index ${idx}.`);
    }
    return pr.segments.map((seg) => ({ ...seg, dayIndex: idx }));
  });

  const values = segmentsArray
    .map((seg) => {
      const matching = pricingResultIds.find((p) => p.dayIndex === seg.dayIndex);
      if (!matching) {
        throw new Error(`Missing pricing result ID for segment with dayIndex ${seg.dayIndex}.`);
      }
      return `(
        gen_random_uuid(),
        '${matching.id}',
        ${seg.segment},
        ${seg.distance},
        ${seg.duration},
        ${seg.adjustedDistance},
        ${seg.adjustedDuration},
        ${seg.kmPrice},
        ${seg.timePrice},
        ${seg.price},
        ${seg.priceWithoutMinimums},
        ${seg.kmPriceWithMinimum},
        ${seg.timePriceWithMinimum},
        ${seg.kmPriceWithoutMinimum},
        ${seg.timePriceWithoutMinimum},
        ${seg.totalPriceWithMinimumWithoutRest},
        ${seg.restPrice},
        ${seg.totalPrice},
        '${escapeQuotes(seg.segmentStartTime)}'
      )`;
    })
    .join(',');

  return `
    INSERT INTO "SegmentPricing"(
      "id","pricingResultId","segment","distance","duration",
      "adjustedDistance","adjustedDuration","kmPrice","timePrice",
      "price","priceWithoutMinimums","kmPriceWithMinimum",
      "timePriceWithMinimum","kmPriceWithoutMinimum",
      "timePriceWithoutMinimum","totalPriceWithMinimumWithoutRest",
      "restPrice","totalPrice","segmentStartTime"
    )
    VALUES ${values};
  `;
}

export function buildPricingDetailsSQL(
  pricingResults: PricingResult[],
  pricingResultIds: { id: string; dayIndex: number }[]
) {
  const detailsArray = pricingResults.flatMap((pr, idx) => {
    if (!pr.details || pr.details.length === 0) {
      throw new Error(`Missing pricing details for pricing result at index ${idx}.`);
    }
    return pr.details.map((d) => ({ ...d, dayIndex: idx }));
  });

  const values = detailsArray
    .map((d) => {
      const matching = pricingResultIds.find((p) => p.dayIndex === d.dayIndex);
      if (!matching) {
        throw new Error(`Missing pricing result ID for pricing details with dayIndex ${d.dayIndex}.`);
      }
      return `(
        gen_random_uuid(),
        '${matching.id}',
        ${d.numberOfPeople},
        ${d.finalPricePerKm},
        ${d.finalPricePerMinute},
        ${d.seasonAdjustment},
        ${d.busTypeAdjustment},
        ${d.busyTimeAdjustment},
        ${d.nightTimeAdjustment}
      )`;
    })
    .join(',');

  return `
    INSERT INTO "PricingDetails"(
      "id","pricingResultId","numberOfPeople",
      "finalPricePerKm","finalPricePerMinute",
      "seasonAdjustment","busTypeAdjustment",
      "busyTimeAdjustment","nightTimeAdjustment"
    )
    VALUES ${values};
  `;
}

export function buildExtrasSQL(pricingResults: PricingResult[], pricingResultIds: { id: string; dayIndex: number }[]) {
  const extrasFragments = pricingResults.flatMap((pr, idx) => {
    if (!pr.extras || pr.extras.length === 0) {
      return [];
    }
    return pr.extras.map((ex) => ({ extraId: ex.id, dayIndex: idx }));
  });

  if (extrasFragments.length === 0) {
    return '';
  }

  const values = extrasFragments
    .map((ex) => {
      const matching = pricingResultIds.find((p) => p.dayIndex === ex.dayIndex);
      if (!matching) {
        throw new Error(`Missing pricing result ID for pricing extra with dayIndex ${ex.dayIndex}.`);
      }
      return `(
          gen_random_uuid(),
          '${matching.id}',
          '${ex.extraId}'
        )`;
    })
    .join(',');

  return `
      INSERT INTO "pricing_result_extra"(
        "id","pricingResultId","extraId"
      )
      VALUES ${values};
    `;
}

export function buildMiddleSegmentSQL(
  pricingResults: PricingResult[],
  pricingResultIds: { id: string; dayIndex: number }[]
) {
  const middleSegArray = pricingResults.flatMap((pr, idx) => {
    if (!pr.middleSegmentsWithPrices || pr.middleSegmentsWithPrices.length === 0) {
      throw new Error(`Missing middle segments for pricing result at index ${idx}.`);
    }
    return pr.middleSegmentsWithPrices.map((ms) => ({ ...ms, dayIndex: idx }));
  });

  const values = middleSegArray
    .map((ms) => {
      const matching = pricingResultIds.find((p) => p.dayIndex === ms.dayIndex);
      if (!matching) {
        throw new Error(`Missing pricing result ID for middle segment with dayIndex ${ms.dayIndex}.`);
      }
      return `(
        gen_random_uuid(),
        '${matching.id}',
        '${escapeQuotes(ms.origin)}',
        '${escapeQuotes(ms.arrivalTime)}',
        '${escapeQuotes(ms.destination)}',
        ${ms.distance},
        ${ms.kmPrice},
        ${ms.timePrice},
        ${ms.priceWithoutRest},
        ${ms.duration},
        ${ms.restPrice},
        ${ms.totalPrice},
        ${ms.waitingTime},
        ${ms.totalDuration},
        '${escapeQuotes(ms.pickupTime)}'
      )`;
    })
    .join(',');

  return `
    INSERT INTO "MiddleSegmentPricing"(
      "id","pricingResultId","origin","arrivalTime","destination",
      "distance","kmPrice","timePrice","priceWithoutRest","duration",
      "restPrice","totalPrice","waitingTime","totalDuration","pickupTime"
    )
    VALUES ${values};
  `;
}

export function buildBusesSQL(buses: { busTypeId: string; quantity: number }[], bookingId: string) {
  if (!buses.length) {
    throw new Error('Bus records are required.');
  }

  const values = buses
    .map((b) => {
      if (!b.busTypeId) {
        throw new Error('Incomplete bus record data.');
      }
      return `(
        gen_random_uuid(),
        '${bookingId}',
        '${b.busTypeId}',
        ${b.quantity}
      )`;
    })
    .join(',');

  return `
    INSERT INTO "BookingsSelectedBuses"("id","tripId","busTypeId","quantity")
    VALUES ${values};
  `;
}

export function buildMissingKmSQL(
  missingKmInfo: {
    effectiveDistance: number;
    adjustedDistance: number;
    missingKm: number;
    additionalPrice: number;
    differenceInTotalPrice: number;
  }[],
  bookingId: string
) {
  if (!missingKmInfo || missingKmInfo.length === 0) {
    return '';
  }
  const mk = missingKmInfo[0];
  return `
      INSERT INTO "MissingKmInfo"(
        "id","tripId","effectiveDistance","adjustedDistance",
        "missingKm","additionalPrice","differenceInTotalPrice"
      )
      VALUES(
        gen_random_uuid(),
        '${bookingId}',
        ${mk.effectiveDistance},
        ${mk.adjustedDistance},
        ${mk.missingKm},
        ${mk.additionalPrice},
        ${mk.differenceInTotalPrice}
      );
    `;
}
