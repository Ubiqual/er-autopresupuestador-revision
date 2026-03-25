import type { SearchedApiResponse } from '@/types/searchedTrips';

export const convertPricingDataToResults = (pricingData: SearchedApiResponse[]) => {
  return pricingData.map((data, dayIndex) => {
    const { result } = data;

    return {
      tripId: '', // Placeholder, assuming it's assigned elsewhere
      dayIndex,
      totalPrice: result.totalPrice,
      totalDuration: result.totalDuration,
      restTimePrice: result.restTimePrice,
      minimumPerDayDuration: result.minimumPerDayDuration,
      minimumPricePerDayDuration: result.minimumPricePerDayDuration,
      minimumTimePerDayDuration: result.minimumTimePerDayDuration,

      // Convert segments
      segments: result.segments.map((segment) => ({
        segment: segment.segment,
        distance: segment.distance,
        duration: segment.duration,
        adjustedDistance: segment.adjustedDistance,
        adjustedDuration: segment.adjustedDuration,
        kmPrice: segment.kmPrice,
        timePrice: segment.timePrice,
        price: segment.price,
        priceWithoutMinimums: segment.priceWithoutMinimums,
        kmPriceWithMinimum: segment.kmPriceWithMinimum,
        timePriceWithMinimum: segment.timePriceWithMinimum,
        kmPriceWithoutMinimum: segment.kmPriceWithoutMinimum,
        timePriceWithoutMinimum: segment.timePriceWithoutMinimum,
        totalPriceWithMinimumWithoutRest: segment.totalPriceWithMinimumWithoutRest,
        restPrice: segment.restPrice,
        totalPrice: segment.totalPrice,
        segmentStartTime: segment.segmentStartTime
      })),

      // Convert details
      details: result.details.map((detail) => ({
        numberOfPeople: detail.numberOfPeople,
        finalPricePerKm: detail.finalPricePerKm,
        finalPricePerMinute: detail.finalPricePerMinute,
        seasonAdjustment: detail.seasonAdjustment,
        busTypeAdjustment: detail.busTypeAdjustment,
        busyTimeAdjustment: detail.busyTimeAdjustment,
        nightTimeAdjustment: detail.nightTimeAdjustment
      })),

      // Convert middle segments with prices
      middleSegmentsWithPrices: result.middleSegmentsWithPrices.map((segment) => ({
        origin: segment.origin,
        arrivalTime: segment.arrivalTime,
        destination: segment.destination,
        distance: segment.distance,
        kmPrice: segment.kmPrice,
        timePrice: segment.timePrice,
        priceWithoutRest: segment.priceWithoutRest,
        duration: segment.duration,
        restPrice: segment.restPrice,
        totalPrice: segment.totalPrice,
        waitingTime: segment.waitingTime,
        totalDuration: segment.totalDuration,
        pickupTime: segment.pickupTime
      })),

      extras: result.extras || []
    };
  });
};
