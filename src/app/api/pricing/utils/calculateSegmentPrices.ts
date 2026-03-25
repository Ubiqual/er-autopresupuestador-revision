import { format, isAfter, isBefore } from 'date-fns';

interface Segment {
  distance: number;
  duration: number;
  segmentStartTime: Date;
  segmentEndTime: Date;
}

interface Pricing {
  numberOfPeople: number;
  finalPricePerKm: number;
  finalPricePerMinute: number;
}

interface BusSelection {
  [busType: string]: number;
}

interface RestHours {
  restDuration: number;
}

interface CalculateSegmentPricesParams {
  segments: Segment[];
  minimumKM: number;
  minimumTime: number;
  busSelection: BusSelection;
  result: Pricing[];
  uniqueRestTimestamps: Date[];
  currentDayIndex: number;
  dayCount: number;
  restHours: RestHours | null;
  totalPrice: { value: number }; // Wrap totalPrice in an object
}

export function calculateSegmentPrices({
  segments,
  minimumKM,
  minimumTime,
  busSelection,
  result,
  uniqueRestTimestamps,
  currentDayIndex,
  dayCount,
  restHours,
  totalPrice // Pass totalPrice as an object
}: CalculateSegmentPricesParams) {
  const segmentsWithPrices = segments.map((segment, index) => {
    const distanceInKm = segment.distance / 1000;
    const durationInMinutes = segment.duration / 60;
    let kmPriceTotal = 0;
    let timePriceTotal = 0;
    let segmentTotalPrice = 0;
    let segmentPriceWithoutMinimums = 0;

    let kmPriceWithMinimum = 0;
    let timePriceWithMinimum = 0;
    let kmPriceWithoutMinimum = 0;
    let timePriceWithoutMinimum = 0;

    let restPriceTotal = 0;

    const segmentStartTime = segment.segmentStartTime;
    const segmentEndTime = segment.segmentEndTime;

    // Adjust distance and duration to meet minimums for segments 0 and 2
    const adjustedDistanceInKm = index === 0 || index === 2 ? Math.max(minimumKM, distanceInKm) : distanceInKm;
    const adjustedDurationInMinutes =
      index === 0 || index === 2 ? Math.max(minimumTime, durationInMinutes) : durationInMinutes;

    // Calculate price for each bus type in busSelection
    for (const [busType, quantity] of Object.entries(busSelection)) {
      const pricing = result.find((r) => r.numberOfPeople === parseInt(busType));
      if (pricing) {
        // Per Km and Per Minute Prices with Minimum Adjustments
        const kmPricePerBusWithMinimum = pricing.finalPricePerKm * adjustedDistanceInKm;
        const timePricePerBusWithMinimum = pricing.finalPricePerMinute * adjustedDurationInMinutes;

        // Per Km and Per Minute Prices without Minimum Adjustments
        const kmPricePerBusWithoutMinimum = pricing.finalPricePerKm * distanceInKm;
        const timePricePerBusWithoutMinimum = pricing.finalPricePerMinute * durationInMinutes;

        // Segment prices
        const segmentPriceForBusWithMinimum =
          (kmPricePerBusWithMinimum + timePricePerBusWithMinimum) * (quantity as number);
        const segmentPriceForBusWithoutMinimum =
          (kmPricePerBusWithoutMinimum + timePricePerBusWithoutMinimum) * (quantity as number);

        // Accumulate totals
        kmPriceTotal += kmPricePerBusWithMinimum * (quantity as number);
        timePriceTotal += timePricePerBusWithMinimum * (quantity as number);
        segmentTotalPrice += segmentPriceForBusWithMinimum;
        segmentPriceWithoutMinimums += segmentPriceForBusWithoutMinimum;

        // Accumulate per-km and per-minute details for minimum and non-minimum values
        kmPriceWithMinimum += kmPricePerBusWithMinimum;
        timePriceWithMinimum += timePricePerBusWithMinimum;
        kmPriceWithoutMinimum += kmPricePerBusWithoutMinimum;
        timePriceWithoutMinimum += timePricePerBusWithoutMinimum;

        // Check rest timestamps within this segment's range
        if ((currentDayIndex === 0 && index === 0) || (currentDayIndex === dayCount - 1 && index === 2)) {
          uniqueRestTimestamps.forEach((restTimestamp) => {
            if (isAfter(restTimestamp, segmentStartTime) && isBefore(restTimestamp, segmentEndTime)) {
              const restPriceForBus = pricing.finalPricePerMinute * restHours!.restDuration * 60;
              restPriceTotal += restPriceForBus * (quantity as number);
            }
          });
        }
      }
    }

    if ((currentDayIndex === 0 && index === 0) || (currentDayIndex === dayCount - 1 && index === 2)) {
      totalPrice.value += segmentTotalPrice + restPriceTotal; // Update totalPrice
    }

    const totalPriceWithMinimumWithRest = segmentTotalPrice + restPriceTotal;
    const totalPriceWithMinimumWithoutRest = segmentTotalPrice;

    return {
      segment: index + 1,
      segmentStartTime: segmentStartTime ? format(segmentStartTime, 'yyyy-MM-dd HH:mm') : '',
      distance: distanceInKm,
      duration: durationInMinutes,
      adjustedDistance: adjustedDistanceInKm,
      adjustedDuration: adjustedDurationInMinutes,
      kmPrice: kmPriceTotal,
      timePrice: timePriceTotal,
      price: segmentTotalPrice,
      priceWithoutMinimums: segmentPriceWithoutMinimums,
      kmPriceWithMinimum,
      timePriceWithMinimum,
      kmPriceWithoutMinimum,
      timePriceWithoutMinimum,
      totalPriceWithMinimumWithoutRest,
      restPrice: restPriceTotal,
      totalPrice: totalPriceWithMinimumWithRest
    };
  });

  return { segmentsWithPrices };
}
