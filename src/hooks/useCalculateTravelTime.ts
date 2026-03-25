import type { MinTimeResult, StopData } from '@/types/TravelCalculations';
import {
  calculateConsecutiveStopsTime,
  calculateIndexOneTime,
  prepareDistanceMatrixRequests,
  updateMaxTimeIfNeeded
} from '@/utils/useCalculateTravelTime.helpers';
import type { ConfigureWeddings, RestHours } from '@prisma/client';
import { addHours, format, parse } from 'date-fns';
import { useEffect, useState } from 'react';

interface CalculateTravelTimeProps {
  stops: StopData[];
  initialDate: Date;
  pickupTime: string;
  isExcursion: boolean;
  isWedding: boolean;
  isTrip: boolean;
  restHours?: RestHours;
  baseAddress: string;
  weddingLimit?: ConfigureWeddings | null;
}

const useCalculateTravelTime = ({
  stops,
  initialDate,
  pickupTime,
  isExcursion,
  restHours,
  isWedding,
  baseAddress,
  isTrip,
  weddingLimit
}: CalculateTravelTimeProps) => {
  const [drivingTimes, setDrivingTimes] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxTime, setMaxTime] = useState<string | undefined>(undefined);
  const [adjustmentPercentage, setAdjustmentPercentage] = useState<number>(0);

  const stopsWithBase = [{ address: baseAddress, day: 0 }, ...stops];

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

  // Asynchronously calculates driving times between stops and updates the state with the results.
  const calculateDrivingTimes = async (overrideStops?: StopData[]) => {
    setLoading(true);
    setError(null);

    try {
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps API is not available');
      }

      const service = new window.google.maps.DistanceMatrixService();
      const departureDateTime = parse(pickupTime, 'yyyy-MM-dd HH:mm', initialDate);

      const requestConfig = {
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: departureDateTime,
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS
        }
      };

      const stopsToUse = overrideStops ?? stopsWithBase;
      const updatedDrivingTimes = { ...drivingTimes };

      const requests = prepareDistanceMatrixRequests({
        stopsToUse,
        service,
        requestConfig,
        updatedDrivingTimes,
        drivingTimes,
        adjustmentPercentage
      });

      await Promise.all(requests);

      setDrivingTimes((prev) => ({
        ...prev,
        ...updatedDrivingTimes
      }));

      updateMaxTimeIfNeeded({
        isExcursion,
        isWedding,
        isTrip,
        pickupTime,
        restHours,
        initialDate,
        overrideStops,
        setMaxTime
      });
      return updatedDrivingTimes;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Calculates and sets the maximum allowed time (maxTime) for trips, weddings and excurstions that user can select in the dropdown
  const getMaxTime = ({ stops }: { stops: StopData[] }) => {
    const pickupDateTime = parse(stops?.[0].time ?? pickupTime, 'yyyy-MM-dd HH:mm', initialDate);
    const maxDateTime = addHours(pickupDateTime, (restHours && restHours.excursionsLimit) || 0);
    setMaxTime(format(maxDateTime, 'yyyy-MM-dd HH:mm'));
  };

  /**
   * Determines the earliest possible arrival time at a given stop index, taking into account driving times,
   * rest periods, wedding constraints, and full-day driving limits.
   * */
  const getMinTime = ({
    stops,
    index,
    dayNumber,
    lastStopIndex
  }: {
    stops: StopData[];
    index: number;
    dayNumber: number;
    lastStopIndex?: number | null;
  }): MinTimeResult => {
    if (index === -1 || index === stops.length) {
      return { time: undefined };
    }

    let prevTime: Date | undefined;
    let drivingTime = 0;

    if (index === 1) {
      const result = calculateIndexOneTime({
        stops,
        index,
        dayNumber,
        restHours,
        baseAddress,
        drivingTimes,
        initialDate
      });
      if (result.error) {
        return { time: result.time, error: result.error };
      }
      drivingTime = result.drivingTime;
      prevTime = result.prevTime;
    } else {
      const result = calculateConsecutiveStopsTime({
        stops,
        index,
        restHours,
        isWedding,
        weddingLimit,
        drivingTimes,
        initialDate,
        lastStopIndex
      });
      if (result.error) {
        return { time: result.time, error: result.error };
      }
      drivingTime = result.drivingTime;
      prevTime = result.prevTime;
    }

    if (prevTime) {
      const minTime = addHours(prevTime, drivingTime);
      if (minTime instanceof Date && !isNaN(minTime.getTime())) {
        return { address: stops[index].address, time: format(minTime, 'yyyy-MM-dd HH:mm') };
      } else {
        return { time: undefined, error: 'invalidDate' };
      }
    }

    return { time: undefined };
  };

  // Computes the minimum possible start time for a wedding-related return trip.
  const getWeddingMinTime = (index: number, returnTrips: { time: string }[], lastStopIndex: number) => {
    const fromStop = stops?.[stops.length - 2]?.address;
    const toStop = stops?.[stops.length - 1]?.address;
    if (!fromStop || !toStop) {
      return '';
    }

    let addMinHoursForReturnTrips = drivingTimes[`${fromStop}_${toStop}`] * 2;

    if (index === 0 && initialDate) {
      const minDateTime = addHours(initialDate, addMinHoursForReturnTrips);
      return format(minDateTime, 'yyyy-MM-dd HH:mm');
    } else {
      const prevTripTime = returnTrips[index - 1]?.time;
      if (!prevTripTime) {
        return '';
      }
      const stopsAfterLastStop = stops.slice((lastStopIndex ?? -1) + 2);

      if (stopsAfterLastStop.length > 0) {
        addMinHoursForReturnTrips = 0;
        stopsAfterLastStop.forEach((stop, index) => {
          if (index === 0) {
            const drivingTime = drivingTimes[`${stops[lastStopIndex + 1].address}_${stop.address}`];
            if (drivingTime) {
              addMinHoursForReturnTrips += drivingTime;
            }
          } else {
            const drivingTime = drivingTimes[`${stopsAfterLastStop[index - 1]?.address}_${stop.address}`];
            if (drivingTime) {
              addMinHoursForReturnTrips += drivingTime;
            }
          }
        });
      }
      const prevTripDateTime = new Date(prevTripTime);
      const minDateTime = addHours(prevTripDateTime, addMinHoursForReturnTrips * 2);
      return format(minDateTime, 'yyyy-MM-dd HH:mm');
    }
  };

  return { drivingTimes, loading, error, maxTime, getMinTime, calculateDrivingTimes, getMaxTime, getWeddingMinTime };
};

export default useCalculateTravelTime;
