import { addMinutes, differenceInMinutes, format } from 'date-fns';

interface Segment {
  distance: number;
  duration: number;
  origin: string;
  destination: string;
}

interface Pricing {
  numberOfPeople: number;
  finalPricePerKm: number;
  finalPricePerMinute: number;
}

interface BusSelection {
  [busType: string]: number;
}

interface Stop {
  time?: string;
  calculatedTime?: Date;
}

interface ReturnTrip {
  time: string;
  buses: { busType: string; numberOfBuses: number }[];
}

interface RestHours {
  restDuration: number;
}

interface CalculateMiddleSegmentsParams {
  middleSegments: Segment[];
  stops: Stop[];
  busSelection: BusSelection;
  returnTrips: ReturnTrip[];
  result: Pricing[];
  uniqueRestTimestamps: Date[];
  segments: { segmentEndTime: string }[];
  serviceName: string;
  restHours?: RestHours | null;
  totalPrice: { value: number };
  lastStopIndex: number | null;
}

export function calculateMiddleSegmentsPrices({
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
}: CalculateMiddleSegmentsParams) {
  const middleSegmentsWithPrices = middleSegments.map((segment, index) => {
    let kmPriceTotal = 0;
    let timePriceTotal = 0;
    let segmentTotalPrice = 0;
    let restPriceTotal = 0;
    let waitingTime = 0;

    let pickupTime: Date;
    let arrivalTime: Date;

    // Determine pickup and arrival times
    /**
     * TODO: we should fix this by ids or in some other way to prevent admin killing the logic
     * look for other places where this occurs (search for services words)
     *
     * also fix buses texts
     */
    if (['transfer aeropuerto', 'transfer tren', 'traslados'].includes(serviceName.toLowerCase())) {
      if (index === 0) {
        pickupTime = new Date(stops[0].time!);
      } else {
        pickupTime = new Date(stops[index].calculatedTime!);
      }
      arrivalTime = addMinutes(pickupTime, segment.duration / 60);

      if (index === stops.length - 2) {
        const segmentEndTime = new Date(segments[1].segmentEndTime);
        const stopTime = stops[stops.length - 2].time ? new Date(stops[stops.length - 2].time!) : null;

        arrivalTime = stopTime && stopTime > segmentEndTime ? stopTime : segmentEndTime;
      }

      if (stops[index + 1]) {
        stops[index + 1].calculatedTime = arrivalTime;
      }
      waitingTime = 0;
    } else {
      pickupTime = new Date(stops[index].time!);
      arrivalTime = addMinutes(pickupTime, segment.duration / 60);
      if (index < stops.length - 1) {
        waitingTime = (new Date(stops[index + 1].time!).getTime() - arrivalTime.getTime()) / (1000 * 60);
      }
    }

    const segmentStartTime = pickupTime;
    const segmentEndTime = arrivalTime;

    if (serviceName.toLowerCase() === 'bodas' && index === middleSegments.length - 1) {
      waitingTime = 0;

      const startIdx = (lastStopIndex ?? 0) + 1;
      const returnSegments = middleSegments.slice(startIdx);

      const totalReturnDistanceInKm = returnSegments.reduce((sum, seg) => sum + seg.distance, 0) / 1000;
      const totalReturnDurationInMinutes = returnSegments.reduce((sum, seg) => sum + seg.duration / 60, 0);

      returnTrips.forEach((trip, tripIndex) => {
        trip.buses.forEach((bus, busIndex) => {
          if (bus.numberOfBuses > 0) {
            const pricing = result.find((r) => r.numberOfPeople === parseInt(bus.busType, 10));
            if (!pricing) {
              return;
            }
            // use the summed distance instead of just the last segment
            const distanceInKm =
              tripIndex === returnTrips.length - 1 ? segment.distance / 1000 : totalReturnDistanceInKm * 2;

            const kmPriceForBus = pricing.finalPricePerKm * distanceInKm;
            kmPriceTotal += kmPriceForBus * bus.numberOfBuses;
            segmentTotalPrice += kmPriceForBus * bus.numberOfBuses;

            if (tripIndex === returnTrips.length - 1) {
              const durationInMinutes = differenceInMinutes(
                addMinutes(trip.time, totalReturnDurationInMinutes),
                returnTrips[0].time
              );
              // use the summed duration instead of just the last segment
              // const durationInMinutes = totalReturnDurationInMinutes;
              const timePriceForBus =
                pricing.finalPricePerMinute *
                (durationInMinutes - totalReturnDurationInMinutes + segment.duration / 60);

              timePriceTotal += timePriceForBus * bus.numberOfBuses;
              if (busIndex === trip.buses.length - 1) {
                waitingTime += durationInMinutes - totalReturnDurationInMinutes;
              }
              segmentTotalPrice += timePriceForBus * bus.numberOfBuses;
            }

            uniqueRestTimestamps.forEach((restTimestamp) => {
              if (restTimestamp >= segmentStartTime && restTimestamp < segmentEndTime) {
                const restPriceForBus = pricing.finalPricePerMinute * (restHours!.restDuration * 60);
                restPriceTotal += restPriceForBus * bus.numberOfBuses;
              }
            });
          }
        });
      });
    } else {
      for (const [busType, quantity] of Object.entries(busSelection)) {
        const pricing = result.find((r) => r.numberOfPeople === parseInt(busType));
        if (pricing) {
          const distanceInKm = segment.distance / 1000;
          const durationInMinutes = segment.duration / 60 + (waitingTime > 0 ? waitingTime : 0);

          const kmPriceForBus = pricing.finalPricePerKm * distanceInKm;
          const timePriceForBus = pricing.finalPricePerMinute * durationInMinutes;
          const segmentPriceForBus = (kmPriceForBus + timePriceForBus) * (quantity as number);

          kmPriceTotal += kmPriceForBus * (quantity as number);
          timePriceTotal += timePriceForBus * (quantity as number);
          segmentTotalPrice += segmentPriceForBus;

          uniqueRestTimestamps.forEach((restTimestamp) => {
            if (restTimestamp >= segmentStartTime && restTimestamp < segmentEndTime) {
              const restPriceForBus = pricing.finalPricePerMinute * restHours!.restDuration * 60;
              restPriceTotal += restPriceForBus * (quantity as number);
            }
          });
        }
      }
    }

    const totalPriceWithRest = segmentTotalPrice + restPriceTotal;
    totalPrice.value += totalPriceWithRest;

    return {
      origin: segment.origin,
      destination: segment.destination,
      kmPrice: kmPriceTotal,
      timePrice: timePriceTotal,
      priceWithoutRest: segmentTotalPrice,
      restPrice: restPriceTotal,
      totalPrice: totalPriceWithRest,
      distance: segment.distance / 1000,
      duration: segment.duration / 60,
      totalDuration: segment.duration / 60 + (waitingTime < 0 ? 0 : waitingTime),
      waitingTime: waitingTime > 0 ? waitingTime : 0,
      pickupTime: format(pickupTime, 'yyyy-MM-dd HH:mm'),
      arrivalTime: arrivalTime.toISOString()
    };
  });

  return { middleSegmentsWithPrices };
}
