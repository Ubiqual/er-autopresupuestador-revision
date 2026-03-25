import { ToastType } from '@/contexts/ToastModalContext';
import type {
  AdjustTotalDistanceAndDurationForTripParams,
  CalculateRestAndWaitingTimeParams,
  CalculateRestAndWaitingTimeReturn,
  CheckForTimeErrorsParams,
  DistanceResults,
  FetchDistancesParams,
  StopData,
  TransferCalculateRestParams,
  TransferCalculateRestReturn,
  TravelDayInfo,
  TravelSegment
} from '@/types/TravelCalculations';
import { addHours, addMinutes, addSeconds, differenceInSeconds, format, parse } from 'date-fns';
import { t } from './i18n';

export const handleDistanceMatrixResponse = ({
  response,
  status,
  adjustmentPercentage,
  results,
  origin,
  destination,
  showToast
}: {
  response: google.maps.DistanceMatrixResponse;
  status: google.maps.DistanceMatrixStatus;
  adjustmentPercentage: number;
  results: {
    distances: { origin: string; destination: string; value: number }[];
    durations: { origin: string; destination: string; value: number }[];
  };
  origin?: string;
  destination?: string;
  showToast: ({ message, toastType }: { message: string; toastType: ToastType }) => void;
}) => {
  if (status === 'OK') {
    const element = response.rows[0].elements[0];
    const durationValue = element.duration_in_traffic ? element.duration_in_traffic.value : element.duration?.value;
    const adjustedDurationValue = durationValue + durationValue * adjustmentPercentage;

    // Store both distance and duration with origin and destination
    results.distances.push({
      origin: origin ?? '',
      destination: destination ?? '',
      value: element.distance?.value
    });

    results.durations.push({
      origin: origin ?? '',
      destination: destination ?? '',
      value: adjustedDurationValue
    });
  } else {
    showToast({ message: `Ha ocurrido un error: ${t('bookingPage.errors.title')}`, toastType: ToastType.error });
  }
};

export async function fetchDistancesAndDurations(params: FetchDistancesParams): Promise<{
  departureDateTime: Date;
  results: DistanceResults;
}> {
  const {
    service,
    baseAddress,
    dailyStops,
    pickup,
    dropoff,
    stopPairs,
    date,
    adjustmentPercentage,
    i,
    departureDateTime,
    showToast
  } = params;

  const results: DistanceResults = {
    distances: [],
    durations: []
  };

  const requestConfig = {
    travelMode: window.google.maps.TravelMode.DRIVING,
    drivingOptions: {
      departureTime: date,
      trafficModel: window.google.maps.TrafficModel.BEST_GUESS
    }
  };

  // Step 1: Calculate driving time from base to pickup
  await new Promise<void>((resolve) => {
    service.getDistanceMatrix(
      {
        ...requestConfig,
        origins: [i === 0 ? baseAddress : dailyStops.get(i - 1)!.dropoff.address],
        destinations: [pickup.address]
      },
      (response, status) => {
        handleDistanceMatrixResponse({ response, status, adjustmentPercentage, results, showToast });
        resolve();
      }
    );
  });

  const baseToPickupDuration = results.durations[0]?.value;
  const updatedDepartureDateTime = new Date(departureDateTime.getTime() - baseToPickupDuration * 1000);

  // Step 2: Calculate driving time from pickup to dropoff (via all stops)

  await Promise.all(
    stopPairs.map(
      ([origin, destination]) =>
        new Promise<void>((resolve) => {
          service.getDistanceMatrix(
            {
              ...requestConfig,
              origins: [origin.address],
              destinations: [destination.address]
            },
            (response, status) => {
              handleDistanceMatrixResponse({
                response,
                status,
                origin: origin.address,
                destination: destination.address,
                adjustmentPercentage,
                results,
                showToast
              });
              resolve();
            }
          );
        })
    )
  );

  // Step 3: Calculate driving time from dropoff back to base
  await new Promise<void>((resolve) => {
    service.getDistanceMatrix(
      {
        ...requestConfig,
        origins: [dropoff.address],
        destinations: [baseAddress]
      },
      (response, status) => {
        handleDistanceMatrixResponse({ response, status, adjustmentPercentage, results, showToast });
        resolve();
      }
    );
  });

  return { departureDateTime: updatedDepartureDateTime, results };
}

/**
 * Handles the logic for "Excursiones", "Bodas", and "Viajes" services.
 * Performs duration checks, rest time calculations, and waiting time updates.
 */
export function calculateRestAndWaitingTime(
  params: CalculateRestAndWaitingTimeParams
): CalculateRestAndWaitingTimeReturn {
  const {
    serviceName,
    stops,
    MAX_EXCURSION_DURATION_SECONDS,
    MAX_DRIVING_TIME_SECONDS,
    restHours,
    i,
    results,
    pickup,
    intermediates,
    dropoff,
    returnTrips,
    dailyStops,
    setLoading,
    setTotalTravelInfo,
    setPricingData,
    restTimestamps,
    departureDateTime,
    showToast
  } = params;

  let { totalRestTime, totalWaitingTime } = params;
  const baseToPickupDuration = results.durations[0]?.value;
  const dropoffToBaseDuration = results.durations[results.durations.length - 1]?.value;
  const lowerServiceName = serviceName.toLowerCase();

  // Proceed only if service is one of "excursiones", "bodas", or "viajes"
  if (lowerServiceName === 'excursiones' || lowerServiceName === 'bodas' || lowerServiceName === 'viajes') {
    const dropoffTimeStr = stops[stops.length - 1].time || '00:00';
    const dropoffDateTime = parse(dropoffTimeStr, 'yyyy-MM-dd HH:mm', new Date());
    const excursionDurationSeconds = differenceInSeconds(
      dropoffDateTime,
      new Date(dailyStops.get(i)!.pickup!.time as string)
    );
    // Check duration limit for "Excursiones" and "Bodas" (but not for "Viajes")
    if (
      (lowerServiceName === 'excursiones' || lowerServiceName === 'bodas' || lowerServiceName === 'viajes') &&
      excursionDurationSeconds > MAX_EXCURSION_DURATION_SECONDS
    ) {
      // Error condition: Excursion/Boda longer than allowed hours
      setLoading(false);
      setTotalTravelInfo([]);
      setPricingData(null);
      showToast({
        message: `Ha ocurrido un error: ${t('bookingPage.errors.longerThan14H', {
          hours: restHours!.excursionsLimit
        })}`,
        toastType: ToastType.error
      });
      return {
        error: true,
        totalRestTime,
        restTimestamps,
        totalWaitingTime
      };
    }

    let cumulativeDrivingTime = i === 0 ? baseToPickupDuration : 0;
    let continuousDrivingTime = i === 0 ? baseToPickupDuration : 0;

    // Base to Pickup rest check
    if (baseToPickupDuration > restHours!.drivingTime * 3600 && i === 0) {
      totalRestTime += restHours!.restDuration * 3600;
      const restTime = addSeconds(new Date(departureDateTime), baseToPickupDuration - 60);
      restTime.setSeconds(0, 0);
      restTimestamps.push(restTime);
      continuousDrivingTime = 0;
    }
    if (cumulativeDrivingTime > MAX_DRIVING_TIME_SECONDS) {
      cumulativeDrivingTime = 0;
      continuousDrivingTime = 0;
    }

    const allStops = [pickup, ...intermediates, dropoff];

    // For "Bodas", insert return trips before the last stop
    if (lowerServiceName === 'bodas' && returnTrips.length !== 0) {
      allStops.splice(
        allStops.length - 1,
        0,
        ...returnTrips.map((returnTrip) => {
          return { address: returnTrip.address, time: returnTrip.time, day: 0 } as StopData;
        })
      );
    }

    allStops.slice(0, -1).forEach((stop, index) => {
      const driveTimefromStop =
        results.durations.find((dur) => dur.origin === stop?.address && dur.destination === stops[index + 1]?.address)
          ?.value || 0;
      const RangeFromPickupToDropoffStop = differenceInSeconds(
        new Date(stops[index + 1]?.time as string),
        new Date(stop.time as string)
      );
      cumulativeDrivingTime += driveTimefromStop;
      continuousDrivingTime += driveTimefromStop;

      // If driving time to next stop exceeds rest hours, apply rest
      if (continuousDrivingTime > restHours!.drivingTime * 3600) {
        totalRestTime += restHours!.restDuration * 3600;
        const restTime = addSeconds(new Date(stop.time!), driveTimefromStop - 60);
        restTime.setSeconds(0, 0);
        restTimestamps.push(restTime);
        continuousDrivingTime = 0;
      }

      if (lowerServiceName !== 'viajes' && cumulativeDrivingTime > MAX_DRIVING_TIME_SECONDS) {
        cumulativeDrivingTime = 0;
        continuousDrivingTime = 0;
      }

      // Calculate waiting time if there's any excess between stop times and driving times
      if (RangeFromPickupToDropoffStop > driveTimefromStop) {
        totalWaitingTime += RangeFromPickupToDropoffStop - driveTimefromStop;
        if (RangeFromPickupToDropoffStop - driveTimefromStop > restHours!.restDuration * 3600) {
          continuousDrivingTime = 0;
        }
      }
    });

    // Dropoff to Base rest check
    if (i === dailyStops.size - 1) {
      cumulativeDrivingTime += dropoffToBaseDuration;
      continuousDrivingTime += dropoffToBaseDuration;

      // Check if cumulative driving time exceeds the maximum driving time
      if (cumulativeDrivingTime > MAX_DRIVING_TIME_SECONDS) {
        const excessDrivingTime = cumulativeDrivingTime - MAX_DRIVING_TIME_SECONDS;

        // If the excess driving time is greater than the allowed continuous driving time, apply a rest
        if (excessDrivingTime > restHours!.drivingTime * 3600) {
          totalRestTime += restHours!.restDuration * 3600;

          // Calculate the timestamp for the rest time
          const restTime = addSeconds(new Date(stops[stops.length - 1]!.time!), dropoffToBaseDuration - 60);
          restTime.setSeconds(0, 0); // Round to the nearest minute

          restTimestamps.push(restTime);
        }

        // Reset cumulative and continuous driving time after rest
        cumulativeDrivingTime = 0;
        continuousDrivingTime = 0;
      }

      // Check if continuous driving time alone exceeds the allowed threshold
      if (continuousDrivingTime > restHours!.drivingTime * 3600) {
        totalRestTime += restHours!.restDuration * 3600;

        // Calculate the timestamp for the rest time
        const restTime = addSeconds(new Date(stops[stops.length - 1]!.time!), dropoffToBaseDuration - 60);
        restTime.setSeconds(0, 0); // Round to the nearest minute

        restTimestamps.push(restTime);

        // Reset continuous driving time after rest
        continuousDrivingTime = 0;
      }
    }
  }

  return {
    error: false,
    totalRestTime,
    restTimestamps,
    totalWaitingTime
  };
}

export function transferRestCalculation(params: TransferCalculateRestParams): TransferCalculateRestReturn {
  const {
    totalDrivingTime,
    dailyDrivingTime,
    accumulatedDrivingTime,
    currentDateTime,
    totalRestTime,
    drivingTimeLimitShortRestSeconds,
    MAX_DRIVING_TIME_SECONDS,
    shortRestDurationSeconds,
    restHours
  } = params;

  let { restTimestamps } = params;
  if (totalDrivingTime <= 0) {
    return { totalRestTime, restTimestamps }; // Base case: all driving time processed
  }

  const drivingChunk = Math.min(
    drivingTimeLimitShortRestSeconds,
    MAX_DRIVING_TIME_SECONDS - dailyDrivingTime,
    totalDrivingTime
  );

  if (dailyDrivingTime >= MAX_DRIVING_TIME_SECONDS) {
    // Apply a full-day rest
    const newDateTime = addHours(currentDateTime, restHours.fullDayRest);
    return transferRestCalculation({
      ...params,
      totalDrivingTime,
      dailyDrivingTime: 0,
      accumulatedDrivingTime: 0,
      currentDateTime: newDateTime
      // totalRestTime and restTimestamps remain unchanged
    });
  } else if (accumulatedDrivingTime >= drivingTimeLimitShortRestSeconds) {
    // Insert a short rest
    if (!restTimestamps.length || restTimestamps[restTimestamps.length - 1].getTime() !== currentDateTime.getTime()) {
      currentDateTime.setSeconds(0, 0);
      restTimestamps = [...restTimestamps, new Date(currentDateTime)];
    }

    return transferRestCalculation({
      ...params,
      totalDrivingTime: totalDrivingTime - drivingChunk,
      dailyDrivingTime: dailyDrivingTime + drivingTimeLimitShortRestSeconds,
      accumulatedDrivingTime: 0,
      currentDateTime: addSeconds(currentDateTime, shortRestDurationSeconds + drivingTimeLimitShortRestSeconds),
      totalRestTime: totalRestTime + shortRestDurationSeconds,
      restTimestamps
    });
  }

  // Continue driving without rest
  return transferRestCalculation({
    ...params,
    totalDrivingTime: totalDrivingTime - drivingChunk,
    dailyDrivingTime: dailyDrivingTime + drivingChunk,
    accumulatedDrivingTime: accumulatedDrivingTime + drivingChunk,
    currentDateTime: addSeconds(currentDateTime, drivingChunk)
    // totalRestTime and restTimestamps remain unchanged
  });
}

export const calculateSegmentWithRest = (
  startDate: Date,
  segmentDuration: number, // Segment duration in minutes
  segmentDistance: number, // Segment distance in km
  cumulativeDrivingTime: number, // Cumulative driving time in minutes from previous segments
  drivingLimitMinutes: number, // 9 hours in minutes
  mandatoryRestMinutes: number, // 10 hours in minutes
  waitingTime: number = 0, // Waiting time in minutes
  nextDayStartTime?: Date // Optional: Start time of the next day
): {
  segmentStartTime: string;
  segmentEndTime: string;
  distance: number;
  duration: number;
  remainingCumulativeDrivingTime: number; // Remaining cumulative driving time after this segment
} => {
  let remainingMinutes = (segmentDuration + waitingTime) / 60;
  let currentDateTime = new Date(startDate);
  let totalDrivingTime = cumulativeDrivingTime;

  // Apply 10-hour rest after reaching 9 hours of cumulative driving
  while (remainingMinutes > 0) {
    // Calculate how much more the driver can drive within the current 9-hour limit
    const allowableDrivingTime = Math.min(drivingLimitMinutes - totalDrivingTime, remainingMinutes);

    if (totalDrivingTime >= drivingLimitMinutes) {
      // Apply the mandatory 10-hour rest
      const restStartTime = currentDateTime;
      const restEndTime = addMinutes(restStartTime, mandatoryRestMinutes);
      currentDateTime = restEndTime;
      totalDrivingTime = 0; // Reset cumulative driving time after rest
    }

    // Drive the allowable amount of time
    currentDateTime = addMinutes(currentDateTime, allowableDrivingTime);
    totalDrivingTime += Math.min(allowableDrivingTime, remainingMinutes - waitingTime);
    remainingMinutes -= allowableDrivingTime;

    if (remainingMinutes > 0 && totalDrivingTime >= drivingLimitMinutes) {
      // Apply rest before continuing the remainder of the segment
      const restEndTime = addMinutes(currentDateTime, mandatoryRestMinutes);
      currentDateTime = restEndTime;
      totalDrivingTime = 0;
    }
  }

  // If nextDayStartTime is provided (i.e., it's not the last day), update the segmentEndTime
  const segmentEndTime = nextDayStartTime
    ? format(nextDayStartTime, 'yyyy-MM-dd HH:mm:ss')
    : format(currentDateTime, 'yyyy-MM-dd HH:mm:ss');

  return {
    segmentStartTime: format(startDate, 'yyyy-MM-dd HH:mm:ss'),
    segmentEndTime,
    distance: segmentDistance,
    duration: segmentDuration,
    remainingCumulativeDrivingTime: totalDrivingTime // Carry over for the next segment
  };
};

export function checkIfWithinSpainPortugalAndorra(Country: string | null): boolean {
  const validCountries = ['España', 'Portugal', 'Andorra'];
  return validCountries.includes(Country || '');
}

export function checkForTimeErrors({
  serviceName,
  lastStopToDropoffTime,
  weddingLimit,
  setLoading,
  setTotalTravelInfo,
  setPricingData,
  totalDrivingDurationSeconds,
  MAX_DRIVING_TIME_SECONDS,
  baseToPickupDistance,
  dropoffToBaseDuration,
  pickupToDropoffDurationSeconds,
  restHours,
  showToast
}: CheckForTimeErrorsParams): boolean {
  const lowerServiceName = serviceName.toLowerCase();

  // Check for Bodas minimum return time
  if (
    lowerServiceName === 'bodas' &&
    weddingLimit &&
    lastStopToDropoffTime * 2 > weddingLimit.minimumReturnTime * 3600
  ) {
    setLoading(false);
    setTotalTravelInfo([]);
    setPricingData(null);
    showToast({
      message: `Ha ocurrido un error: ${t('bookingPage.errors.longerDriveThan2H')}`,
      toastType: ToastType.error
    });
    return true; // Error found
  }

  // Check for exceeding 2 * MAX_DRIVING_TIME_SECONDS
  if (totalDrivingDurationSeconds > 2 * MAX_DRIVING_TIME_SECONDS) {
    setLoading(false);
    setTotalTravelInfo([]);
    setPricingData(null);
    showToast({
      message: `Ha ocurrido un error: ${t('bookingPage.errors.longerDriveThan18H', {
        hours: restHours!.fullDayDriving * 2
      })}`,
      toastType: ToastType.error
    });
    return true; // Error found
  }

  // Check for any segment exceeding MAX_DRIVING_TIME_SECONDS
  if (
    baseToPickupDistance > MAX_DRIVING_TIME_SECONDS ||
    dropoffToBaseDuration > MAX_DRIVING_TIME_SECONDS ||
    pickupToDropoffDurationSeconds > MAX_DRIVING_TIME_SECONDS
  ) {
    setLoading(false);
    setTotalTravelInfo([]);
    setPricingData(null);
    showToast({
      message: `Ha ocurrido un error: ${t('bookingPage.errors.longerDriveThan9H', {
        hours: restHours!.fullDayDriving
      })}`,
      toastType: ToastType.error
    });
    return true; // Error found
  }

  return false; // No errors
}

export function adjustTotalDistanceAndDurationForTrip({
  isTrip,
  dailyStopsSize,
  dayIndex,
  distances,
  durations,
  results,
  stops,
  serviceName,
  returnTrips
}: AdjustTotalDistanceAndDurationForTripParams): {
  totalDistance: number;
  totalDrivingDurationSeconds: number;
  returnTripsDistances: number;
} {
  let totalDistance = distances.reduce((acc, dist) => acc + dist.value, 0) / 1000;
  let totalDrivingDurationSeconds = durations.reduce((acc, dur) => acc + dur.value, 0);
  let returnTripsDistances = 0;

  if (isTrip && dailyStopsSize > 1) {
    if (dayIndex === dailyStopsSize - 1) {
      // Last day: Remove the first entry
      totalDistance = distances.slice(1).reduce((acc, dist) => acc + dist.value, 0) / 1000;
      totalDrivingDurationSeconds = durations.slice(1).reduce((acc, dur) => acc + dur.value, 0);
    } else if (dayIndex === 0) {
      // First day: Remove the last entry
      totalDistance = distances.slice(0, -1).reduce((acc, dist) => acc + dist.value, 0) / 1000;
      totalDrivingDurationSeconds = durations.slice(0, -1).reduce((acc, dur) => acc + dur.value, 0);
    } else {
      // In-between days: Remove both first and last entry
      totalDistance = distances.slice(1, -1).reduce((acc, dist) => acc + dist.value, 0) / 1000;
      totalDrivingDurationSeconds = durations.slice(1, -1).reduce((acc, dur) => acc + dur.value, 0);
    }
  }

  if (serviceName.toLowerCase() === 'bodas') {
    const lastDestinationStopToDropoff = results.distances.find(
      (destination: { origin: string; destination: string; value: number }) => {
        const secondToLastStopAddress = stops[stops.length - 2].address;
        const lastStopAddress = stops[stops.length - 1].address;

        return destination.origin === secondToLastStopAddress && destination.destination === lastStopAddress;
      }
    );

    returnTripsDistances = ((lastDestinationStopToDropoff?.value as number) * returnTrips.length * 2) / 1000;
    totalDistance += returnTripsDistances;
  }

  return { totalDistance, totalDrivingDurationSeconds, returnTripsDistances };
}

export const sortIndividualStops = (
  pickup: StopData,
  intermediates: StopData[],
  dropoff: StopData,
  distances: { origin: string; destination: string; value: number }[],
  durations: { origin: string; destination: string; value: number }[]
) => {
  const allStops = [pickup, ...intermediates, dropoff];

  const matchPairsWithIndex = (matrix: { origin: string; destination: string; value: number }[]) => {
    const result: {
      origin: string;
      destination: string;
      value: number;
      originIndex: number;
      destinationIndex: number;
    }[] = [];

    for (let i = 0; i < allStops.length - 1; i++) {
      const origin = allStops[i].address;
      const destination = allStops[i + 1].address;

      const entry = matrix.find((m) => m.origin === origin && m.destination === destination);

      if (entry) {
        result.push({
          ...entry,
          originIndex: i,
          destinationIndex: i + 1
        });
      }
    }

    return result;
  };

  const individualStopsDistance = matchPairsWithIndex(distances);
  const individualStopsDuration = matchPairsWithIndex(durations);

  return { individualStopsDistance, individualStopsDuration };
};

export const buildFinalSegments = (
  isTrip: boolean | undefined,
  dailyStopsSize: number,
  i: number,
  emptySegment: TravelSegment,
  firstSegment: TravelSegment,
  middleSegment: TravelSegment,
  lastSegment: TravelSegment
) => {
  let finalSegments = [firstSegment, middleSegment, lastSegment];

  // Adjust for intermediate stops in trip cases
  if (isTrip && dailyStopsSize === 1) {
    finalSegments = [firstSegment, middleSegment, lastSegment];
  } else if (isTrip && dailyStopsSize > 1 && i > 0 && i < dailyStopsSize - 1) {
    finalSegments = [emptySegment, middleSegment, emptySegment];
  } else if (isTrip && dailyStopsSize > 1 && i === 0) {
    finalSegments = [firstSegment, middleSegment, emptySegment];
  } else if (isTrip && dailyStopsSize >= 1 && i === dailyStopsSize - 1) {
    finalSegments = [emptySegment, middleSegment, lastSegment];
  }

  return finalSegments;
};

export const updateDayTravelInfo = (
  allDaysTravelInfo: TravelDayInfo[],
  totalDistance: number,
  totalDurationFormatted: string,
  baseToPickupDistance: number,
  pickupToDropoffDistance: number,
  dropoffToBaseDistance: number
) => {
  allDaysTravelInfo.push({
    totalDistance: `${totalDistance} km`,
    totalDuration: totalDurationFormatted,
    baseToPickupDistance: `${baseToPickupDistance} km`,
    pickupToDropoffDistance: `${pickupToDropoffDistance} km`,
    dropoffToBaseDistance: `${dropoffToBaseDistance} km`
  });
};
