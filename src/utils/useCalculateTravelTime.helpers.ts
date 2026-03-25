import type { MinTimeResult, StopData } from '@/types/TravelCalculations';
import type { ConfigureWeddings, RestHours } from '@prisma/client';
import { addHours, format, parse } from 'date-fns';

interface PrepareDistanceMatrixRequestsParams {
  stopsToUse: StopData[];
  service: google.maps.DistanceMatrixService;
  requestConfig: {
    travelMode: google.maps.TravelMode;
    drivingOptions: {
      departureTime: Date;
      trafficModel: google.maps.TrafficModel;
    };
  };
  updatedDrivingTimes: { [key: string]: number };
  drivingTimes: { [key: string]: number };
  adjustmentPercentage: number;
}

export function prepareDistanceMatrixRequests(params: PrepareDistanceMatrixRequestsParams): Promise<void>[] {
  const { stopsToUse, service, requestConfig, updatedDrivingTimes, drivingTimes, adjustmentPercentage } = params;
  const requests: Promise<void>[] = [];
  for (let i = 0; i < stopsToUse.length - 1; i++) {
    const origin = stopsToUse[i].address;
    const destination = stopsToUse[i + 1].address;

    if (!origin || !destination) {
      continue;
    }

    const cacheKey = `${origin}_${destination}`;
    if (drivingTimes[cacheKey] || updatedDrivingTimes[cacheKey]) {
      continue;
    }

    requests.push(
      new Promise<void>((resolve, reject) => {
        service.getDistanceMatrix(
          {
            ...requestConfig,
            origins: [origin],
            destinations: [destination]
          },
          (result, status) => {
            if (status === 'OK' && result?.rows[0]?.elements[0]?.status === 'OK') {
              const durationValue = result.rows[0].elements[0].duration_in_traffic
                ? result.rows[0].elements[0].duration_in_traffic.value
                : result.rows[0].elements[0].duration?.value;
              const duration = durationValue + durationValue * adjustmentPercentage; // Duration in seconds

              updatedDrivingTimes[cacheKey] = duration / 3600; // Convert to hours
              resolve();
            } else {
              reject(new Error(`DistanceMatrixService error: ${status}`));
            }
          }
        );
      })
    );
  }
  return requests;
}

interface UpdateMaxTimeIfNeededParams {
  isExcursion: boolean;
  isWedding: boolean;
  isTrip: boolean;
  pickupTime: string;
  restHours?: RestHours;
  initialDate: Date;
  overrideStops?: StopData[];
  setMaxTime: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export function updateMaxTimeIfNeeded(params: UpdateMaxTimeIfNeededParams) {
  const { isExcursion, isWedding, isTrip, pickupTime, restHours, initialDate, overrideStops, setMaxTime } = params;
  if (isExcursion || isWedding || isTrip) {
    const pickupDateTime = parse(overrideStops?.[0].time ?? pickupTime, 'yyyy-MM-dd HH:mm', initialDate);
    const maxDateTime = addHours(pickupDateTime, (restHours && restHours.excursionsLimit) || 0);
    setMaxTime(format(maxDateTime, 'yyyy-MM-dd HH:mm'));
  } else {
    setMaxTime(undefined);
  }
}

interface CalculateIndexOneTimeParams {
  stops: StopData[];
  index: number;
  dayNumber: number;
  restHours?: RestHours;
  baseAddress: string;
  drivingTimes: { [key: string]: number };
  initialDate: Date;
}

export function calculateIndexOneTime(
  params: CalculateIndexOneTimeParams
): MinTimeResult & { drivingTime: number; prevTime?: Date } {
  const { stops, index, dayNumber, restHours, baseAddress, drivingTimes, initialDate } = params;

  const prevAddress = stops[index - 1].address;
  const currentAddress = stops[index].address;
  const cacheKeyPrevCurrent = `${prevAddress}_${currentAddress}`;
  let drivingTime = drivingTimes[cacheKeyPrevCurrent] || 0;

  const cacheKeyBaseToStop1 = `${baseAddress}_${stops[0].address}`;
  const drivingTimeBaseToStop1 = drivingTimes[cacheKeyBaseToStop1] || 0;

  const totalDrivingTime = dayNumber === 0 ? drivingTime + drivingTimeBaseToStop1 : drivingTime;

  if (restHours && totalDrivingTime > restHours.drivingTime) {
    drivingTime += restHours.restDuration;
  }

  const prevTime = parse(stops[index - 1].time!, 'yyyy-MM-dd HH:mm', initialDate);
  return { drivingTime, prevTime };
}

interface CalculateConsecutiveStopsTimeParams {
  stops: StopData[];
  index: number;
  restHours?: RestHours;
  isWedding: boolean;
  weddingLimit?: ConfigureWeddings | null;
  drivingTimes: { [key: string]: number };
  initialDate: Date;
  lastStopIndex?: number | null;
}

export function calculateConsecutiveStopsTime(
  params: CalculateConsecutiveStopsTimeParams
): MinTimeResult & { drivingTime: number; prevTime?: Date } {
  const { stops, index, restHours, isWedding, weddingLimit, drivingTimes, initialDate, lastStopIndex } = params;

  let drivingTime = 0;
  let cumulativeDrivingTime = 0;
  let prevTime: Date | undefined;
  for (let i = 1; i <= index; i++) {
    const prevAddress = stops[i - 1].address;
    const currentAddress = stops[i].address;
    const cacheKey = `${prevAddress}_${currentAddress}`;
    const previousStopDepartureTime = parse(stops[i - 1].time!, 'yyyy-MM-dd HH:mm', initialDate);

    if (i <= stops.length - 1) {
      const currentSegmentDriving = drivingTimes[cacheKey] || 0;
      const arrivalTime = addHours(previousStopDepartureTime, currentSegmentDriving);

      const currentStopDepartureTime = parse(stops[i].time!, 'yyyy-MM-dd HH:mm', initialDate);
      const restTime = (currentStopDepartureTime.getTime() - arrivalTime.getTime()) / (1000 * 60 * 60); // in hours

      if (restHours && restTime > restHours.restDuration && index !== stops.length - 2) {
        cumulativeDrivingTime = currentSegmentDriving;
      } else {
        cumulativeDrivingTime += currentSegmentDriving;
      }
      drivingTime = currentSegmentDriving;
    }

    if (restHours && cumulativeDrivingTime > restHours.drivingTime) {
      cumulativeDrivingTime = 0; // Reset after adding break
      drivingTime += restHours.restDuration;
    }
    if (isWedding && weddingLimit && i === stops.length - 1) {
      if (lastStopIndex !== null && lastStopIndex !== undefined) {
        const stopsAfterCelebration = stops.slice(lastStopIndex + 2);
        stopsAfterCelebration.forEach((stop, index) => {
          if (index === 0) {
            const cacheKeySTOPS = `${stops[lastStopIndex + 1].address}_${stop.address}`;
            if (cacheKeySTOPS !== cacheKey) {
              const fromCelebrationAddressToFirstStop = drivingTimes[cacheKey];
              drivingTime += fromCelebrationAddressToFirstStop;
            }
          } else {
            const cacheKeySTOPS = `${stopsAfterCelebration[index - 1].address}_${stop.address}`;
            if (cacheKeySTOPS !== cacheKey) {
              const fromCelebrationAddressToFirstStop = drivingTimes[cacheKey];
              drivingTime += fromCelebrationAddressToFirstStop;
            }
          }
        });
      }
    }

    if (isWedding && weddingLimit && i === stops.length - 1 && drivingTime * 2 > weddingLimit.minimumReturnTime) {
      return { time: undefined, error: 'drivingTimeExceeded2H', drivingTime };
    }

    if (restHours && drivingTime > restHours.fullDayDriving) {
      return { time: undefined, error: 'drivingTimeExceeded', drivingTime };
    }

    prevTime = previousStopDepartureTime;
  }

  return { drivingTime, prevTime };
}
