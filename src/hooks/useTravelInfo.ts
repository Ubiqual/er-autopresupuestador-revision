/* eslint-disable max-lines */
'use client';

import { useBusSelection } from '@/contexts/BusSelectionContext';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import { useToastModal } from '@/contexts/ToastModalContext';
import type { ApiResponse, TravelDayInfo } from '@/types/TravelCalculations';
import { formatTimestampToLocalISOString } from '@/utils/formatTimeStampToLocalISOString';
import { getLocationDetails } from '@/utils/getLocationDetails';
import {
  adjustTotalDistanceAndDurationForTrip,
  buildFinalSegments,
  calculateRestAndWaitingTime,
  calculateSegmentWithRest,
  checkForTimeErrors,
  checkIfWithinSpainPortugalAndorra,
  fetchDistancesAndDurations,
  sortIndividualStops,
  transferRestCalculation,
  updateDayTravelInfo
} from '@/utils/travelCalculations';
import type { ConfigureWeddings, RestHours } from '@prisma/client';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { useEffect, useState } from 'react';

interface UseTravelInfoProps {
  baseAddress: string;
  date?: Date;
  restHours?: RestHours;
  serviceName: string;
  isTrip?: boolean;
  weddingLimit?: ConfigureWeddings | null;
  pricing?: {
    id: string;
    pricingResultId: string;
    numberOfPeople: number;
    finalPricePerKm: number | null;
    finalPricePerMinute: number | null;
    seasonAdjustment: number | null;
    busTypeAdjustment: number | null;
    busyTimeAdjustment: number | null;
    nightTimeAdjustment: number | null;
  }[];
  bookingId?: string;
  lastStopIndex: number | null;
}

interface TravelInfoReturn {
  calculateTravelInfo: () => Promise<void>;
  totalTravelInfo: TravelDayInfo[];
  pricingData: ApiResponse[] | null;
  loading: boolean;
}

const useTravelInfo = ({
  baseAddress,
  date,
  restHours,
  serviceName,
  isTrip,
  weddingLimit,
  pricing,
  bookingId,
  lastStopIndex
}: UseTravelInfoProps): TravelInfoReturn => {
  const { showToast } = useToastModal();
  const { dailyStops, returnTrips } = useDailyStops();
  const { busSelection } = useBusSelection();

  const [totalTravelInfo, setTotalTravelInfo] = useState<TravelDayInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjustmentPercentage, setAdjustmentPercentage] = useState<number>(0);
  const [pricingData, setPricingData] = useState<ApiResponse[] | null>(null);
  const MAX_DRIVING_TIME_SECONDS = (restHours?.fullDayDriving ?? 0) * 3600;
  const MAX_EXCURSION_DURATION_SECONDS = (restHours?.excursionsLimit ?? 0) * 3600;

  useEffect(() => {
    setTotalTravelInfo([]);
    setPricingData(null);
    setLoading(false);
  }, [serviceName, date, dailyStops, busSelection]);

  useEffect(() => {
    const fetchGoogleIncrement = async () => {
      const response = await fetch('/api/google-increment');
      const data = await response.json();
      if (data.adjustmentPercentage) {
        setAdjustmentPercentage(data.adjustmentPercentage);
      }
    };
    fetchGoogleIncrement();
  }, []);

  const calculateTravelInfo = async () => {
    if (!dailyStops.size || !baseAddress || !window.google || !window.google.maps || !date) {
      return;
    }
    setLoading(true);

    const service = new window.google.maps.DistanceMatrixService();

    const allDaysTravelInfo: TravelDayInfo[] = [];
    const allDaysPricingData: ApiResponse[] = [];

    const dayPromises = Array.from({ length: dailyStops.size }, (_, i) =>
      (async () => {
        let totalWaitingTime = 0;
        let totalRestTime = 0;
        const restTimestamps: Date[] = [];
        const currentDay = dailyStops.get(i);
        if (!currentDay) {
          return;
        }

        const { pickup, dropoff, intermediates } = currentDay;
        const stops = [pickup, ...intermediates, dropoff];
        let departureDateTime = date!;
        const stopPairs = stops.map((stop, index) => [stop, stops[index + 1]]).slice(0, -1);

        const { departureDateTime: updatedDepartureDateTime, results } = await fetchDistancesAndDurations({
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
        });

        departureDateTime = updatedDepartureDateTime;
        const emptySegment = {
          segmentStartTime: '',
          segmentEndTime: '',
          distance: 0,
          duration: 0,
          remainingCumulativeDrivingTime: 0
        };
        let cumulativeDrivingTime = 0;
        const lastStopToDropoffTime = (() => {
          const lastOrigin = stops[stops.length - 2];
          const lastDestination = stops[stops.length - 1];
          const matchingDuration = results.durations.find(
            (item) => item.origin === lastOrigin.address && item.destination === lastDestination.address
          );
          return matchingDuration?.value || 0;
        })();

        const stopsAddresses = stops.map((stop) => stop.address);
        const locationDetails = await Promise.all(stopsAddresses.map(getLocationDetails));
        const isInMadrid = locationDetails.every((details) => details.isInMadridCommunity);
        const isWithinSpainPortugalAndorra = locationDetails.every((details) =>
          checkIfWithinSpainPortugalAndorra(details.country)
        );

        const pickupToDropoffDurationSeconds = results.durations
          .slice(1, stopPairs.length + 1)
          .reduce((acc, dur) => acc + dur.value, 0);

        const dropoffToBaseDuration = results.durations[results.durations.length - 1]?.value;
        const baseToPickupDistance = results.distances[0]?.value / 1000;
        const pickupToDropoffDistance =
          results.distances.slice(1, stopPairs.length + 1).reduce((acc, dist) => acc + dist.value, 0) / 1000;
        let dropoffToBaseDistance = 0;
        if (i === dailyStops.size - 1) {
          dropoffToBaseDistance = results.distances[results.distances.length - 1]?.value / 1000;
        }

        const { totalDistance, totalDrivingDurationSeconds, returnTripsDistances } =
          adjustTotalDistanceAndDurationForTrip({
            isTrip: !!isTrip,
            dailyStopsSize: dailyStops.size,
            dayIndex: i,
            distances: results.distances,
            durations: results.durations,
            results,
            stops,
            serviceName,
            returnTrips
          });

        const errorFound = checkForTimeErrors({
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
        });
        if (errorFound) {
          return;
        }

        const middleSegmentDistance = results.distances
          .slice(1, results.distances.length - 1)
          .reduce((acc, distance) => acc + distance.value, 0);
        const middleSegmentDuration = results.durations
          .slice(1, results.durations.length - 1)
          .reduce((acc, d) => acc + d.value, 0);

        const { individualStopsDistance, individualStopsDuration } = sortIndividualStops(
          pickup,
          intermediates,
          dropoff,
          results.distances,
          results.durations
        );

        if (
          serviceName.toLowerCase() === 'excursiones' ||
          serviceName.toLowerCase() === 'bodas' ||
          serviceName.toLowerCase() === 'viajes'
        ) {
          const calculatedRestAndWaitingTime = calculateRestAndWaitingTime({
            serviceName,
            stops,
            date,
            MAX_EXCURSION_DURATION_SECONDS,
            MAX_DRIVING_TIME_SECONDS,
            restHours: restHours!,
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
            totalRestTime,
            restTimestamps,
            totalWaitingTime,
            departureDateTime,
            showToast
          });

          if (calculatedRestAndWaitingTime.error) {
            return;
          }

          totalRestTime += calculatedRestAndWaitingTime.totalRestTime;
          restTimestamps.push(...calculatedRestAndWaitingTime.restTimestamps);
          totalWaitingTime += calculatedRestAndWaitingTime.totalWaitingTime;
        }

        if (
          restHours &&
          (serviceName.toLowerCase() === 'traslados' ||
            serviceName.toLowerCase() === 'transfer aeropuerto' ||
            serviceName.toLowerCase() === 'transfer tren')
        ) {
          const drivingTimeLimitShortRestSeconds = restHours.drivingTime * 3600;
          const shortRestDurationSeconds = restHours.restDuration * 3600;

          const { totalRestTime: updatedRestTime, restTimestamps: updatedRestTimestamps } = transferRestCalculation({
            totalDrivingTime: totalDrivingDurationSeconds,
            dailyDrivingTime: 0,
            accumulatedDrivingTime: 0,
            currentDateTime: departureDateTime,
            totalRestTime,
            restTimestamps,
            drivingTimeLimitShortRestSeconds,
            MAX_DRIVING_TIME_SECONDS,
            shortRestDurationSeconds,
            restHours: restHours!
          });
          totalRestTime += updatedRestTime;
          restTimestamps.push(...updatedRestTimestamps);
        }

        const duration = intervalToDuration({
          start: 0,
          end: (totalDrivingDurationSeconds + totalWaitingTime + totalRestTime) * 1000
        });
        const totalDrivingDuration = intervalToDuration({
          start: 0,
          end: totalDrivingDurationSeconds * 1000
        });
        const totalDurationFormatted = formatDuration(duration, { format: ['days', 'hours', 'minutes'] });

        updateDayTravelInfo(
          allDaysTravelInfo,
          totalDistance,
          totalDurationFormatted,
          baseToPickupDistance,
          pickupToDropoffDistance,
          dropoffToBaseDistance
        );

        const firstSegment =
          i === 0
            ? calculateSegmentWithRest(
                departureDateTime,
                results.durations[0]?.value,
                results.distances[0].value,
                cumulativeDrivingTime,
                restHours!.fullDayDriving * 60,
                restHours!.fullDayRest * 60
              )
            : { ...emptySegment, segmentEndTime: stops[0].time ?? '' };

        cumulativeDrivingTime = firstSegment.remainingCumulativeDrivingTime;

        const middleSegment = calculateSegmentWithRest(
          new Date(firstSegment.segmentEndTime),
          middleSegmentDuration,
          middleSegmentDistance + returnTripsDistances,
          cumulativeDrivingTime,
          restHours!.fullDayDriving * 60,
          restHours!.fullDayRest * 60,
          totalWaitingTime,
          i !== dailyStops.size - 1 ? new Date(dailyStops.get(i + 1)!.pickup!.time as string) : undefined
        );

        cumulativeDrivingTime = middleSegment.remainingCumulativeDrivingTime;

        const lastSegment = calculateSegmentWithRest(
          new Date(middleSegment.segmentEndTime),
          results.durations[results.durations.length - 1]?.value ?? 0,
          results.distances[results.distances.length - 1]?.value ?? 0,
          cumulativeDrivingTime,
          restHours!.fullDayDriving * 60,
          restHours!.fullDayRest * 60
        );

        const finalSegments = buildFinalSegments(
          isTrip,
          dailyStops.size,
          i,
          emptySegment,
          firstSegment,
          middleSegment,
          lastSegment
        );
        const pricingResponse = await fetch('/api/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date:
              i === 0
                ? format(departureDateTime, 'yyyy-MM-dd HH:mm:ss')
                : format(stops[0].time ?? '', 'yyyy-MM-dd HH:mm:ss'),
            busSelection,
            stops: stops,
            drivingDuration: totalDrivingDuration,
            totalDuration: duration,
            segments: finalSegments,
            middleSegments: individualStopsDistance.map((distance, i) => ({
              distance: distance.value,
              duration: individualStopsDuration[i].value,
              origin: distance.origin,
              destination: distance.destination
            })),
            restTimestamps: restTimestamps.map((timestamp) => formatTimestampToLocalISOString(timestamp)),
            serviceName: serviceName,
            restTime: totalRestTime,
            dayCount: dailyStops.size,
            currentDayIndex: i,
            isInMadrid,
            isWithinSpainPortugalAndorra,
            dailyStops: dailyStops.get(0),
            dailyStopsOfPreviousDay: dailyStops.get(dailyStops.size - 2),
            returnTrips,
            pricing,
            bookingId,
            lastStopIndex
          })
        });
        const pricingDataJson = await pricingResponse.json();
        allDaysPricingData[i] = pricingDataJson;
      })()
    );

    await Promise.all(dayPromises);

    setTotalTravelInfo(allDaysTravelInfo);
    setPricingData(allDaysPricingData);
    setLoading(false);
  };

  return { calculateTravelInfo, totalTravelInfo, pricingData, loading };
};

export default useTravelInfo;
