import { ToastType } from '@/contexts/ToastModalContext';
import type {
  CheckIntermediateStopTimeChangeParams,
  CheckIntermediateStopTimeChangeResult,
  ComputeIsSaveDisabledParams,
  DailyStops,
  HandleMoreThan9HDriveParams,
  ResetAllStatesParams,
  UpdateDropoffTimeParams
} from '@/types/AddressModal';
import type { StopData } from '@/types/TravelCalculations';
import type { ConfigureTrips, RestHours } from '@prisma/client';
import { addHours, format, parse } from 'date-fns';
import type { Dispatch, SetStateAction } from 'react';
import { t } from './i18n';

export function parseTime(timeStr: string): Date {
  return parse(timeStr, 'yyyy-MM-dd HH:mm', new Date());
}

export function calculateMinPickupTime(
  day: number,
  initialDateAndTime: string,
  dailyStops: Map<number, DailyStops>,
  restHours?: RestHours
) {
  if (day === 0) {
    return initialDateAndTime;
  }
  const previousDayDropoff = dailyStops.get(day - 1)?.dropoff;
  if (previousDayDropoff && previousDayDropoff.time && restHours) {
    const minTimeForDay = addHours(
      parse(previousDayDropoff.time, 'yyyy-MM-dd HH:mm', new Date()),
      restHours.fullDayRest
    );
    return format(minTimeForDay, 'yyyy-MM-dd HH:mm');
  }
  return initialDateAndTime;
}

export function calculateMaxPickupTime(
  minTime: string,
  day: number,
  dailyStops: Map<number, DailyStops>,
  restHours?: RestHours,
  tripMinimums?: ConfigureTrips | null
) {
  // If there is a previous day's pickup (in a trip scenario), calculate differently
  const previousDayPickup = dailyStops.get(day)?.pickup;
  if (previousDayPickup && previousDayPickup.time && tripMinimums && restHours) {
    const addHoursToPickup = tripMinimums.minimumTimePerDay + restHours.excursionsLimit * 2;
    const maxTimeDate = addHours(parse(previousDayPickup.time, 'yyyy-MM-dd HH:mm', new Date()), addHoursToPickup);
    return format(maxTimeDate, 'yyyy-MM-dd HH:mm');
  }

  const minTimeDate = parse(minTime, 'yyyy-MM-dd HH:mm', new Date());
  const maxTimeDate = addHours(minTimeDate, 14);
  return format(maxTimeDate, 'yyyy-MM-dd HH:mm');
}

export function isDayFullyFilled(day: number, dailyStops: Map<number, DailyStops>) {
  const dayStops = dailyStops.get(day);
  if (!dayStops) {
    return false;
  }

  const { pickup, dropoff, intermediates } = dayStops;
  if (!pickup.address || !pickup.time) {
    return false;
  }
  if (!dropoff.address || !dropoff.time) {
    return false;
  }
  if (intermediates.some((stop) => !stop.address || !stop.time)) {
    return false;
  }

  return true;
}

export function isAllDaysValid(numDays: number, isTrip: boolean, dailyStops: Map<number, DailyStops>) {
  if (!isTrip) {
    return true;
  }

  for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
    const dayStops = dailyStops.get(dayIndex);
    if (
      !dayStops ||
      !dayStops.pickup.address ||
      !dayStops.pickup.time ||
      !dayStops.dropoff.address ||
      !dayStops.dropoff.time ||
      dayStops.intermediates.some((stop) => !stop.address || !stop.time)
    ) {
      return false;
    }
  }
  return true;
}

export function validateStopTimesAgainstMinTimes(
  currentMinTimes: { address: string; time: string }[],
  intermediateStops: StopData[],
  dropoffLocation: StopData,
  setIntermediateStops: Dispatch<SetStateAction<StopData[]>>,
  updateDropoffTimeFn: (intermediateStops: StopData[], dropoffLocation: StopData) => void
) {
  const updatedStops = [...intermediateStops];
  let changed = false;

  updatedStops.forEach((stop, index) => {
    if (stop.time) {
      const stopMinTime = currentMinTimes.find((entry) => entry.address === stop.address)?.time || '';
      if (stopMinTime && stop.time < stopMinTime) {
        // Reset the stop time if it's less than the minTime
        updatedStops[index].time = '';
        changed = true;
      }
    }
  });

  if (changed) {
    setIntermediateStops(updatedStops);
    updateDropoffTimeFn(updatedStops, dropoffLocation);
  }

  return updatedStops;
}

export function updateDropoffTime({
  intermediateStops,
  dropoffLocation,
  dayKey,
  currentDay,
  pickupLocationRef,
  drivingTimes,
  dailyStops,
  isTrip,
  selectedService,
  returnTrips,
  updateDailyStops,
  setDropoffLocation
}: UpdateDropoffTimeParams) {
  // Case when there are no intermediate stops
  if (intermediateStops.length === 0) {
    let pickupTime = pickupLocationRef.current.time as string;
    let pickupAddress = pickupLocationRef.current.address;
    let cacheKey = `${pickupAddress}_${dropoffLocation.address}`;
    let drivingTime = drivingTimes[cacheKey] || 0;

    const newDropoffTime = addHours(parse(pickupTime, 'yyyy-MM-dd HH:mm', new Date()), drivingTime);
    const updatedDropoff = {
      ...dropoffLocation,
      time: format(newDropoffTime, 'yyyy-MM-dd HH:mm')
    };

    let updatedStops = [pickupLocationRef.current, updatedDropoff];

    pickupTime = dailyStops.get(dayKey)?.pickup.time ?? (pickupLocationRef.current.time as string);
    pickupAddress = dailyStops.get(dayKey)?.pickup.address ?? pickupLocationRef.current.address;
    cacheKey = `${pickupAddress}_${dropoffLocation.address}`;
    drivingTime = drivingTimes[cacheKey] || 0;

    const newDropoffTimeRecalculated = addHours(parse(pickupTime, 'yyyy-MM-dd HH:mm', new Date()), drivingTime);
    const updatedDropoffRecalculated = {
      ...dropoffLocation,
      time: format(newDropoffTimeRecalculated, 'yyyy-MM-dd HH:mm')
    };

    updatedStops = [pickupLocationRef.current, updatedDropoffRecalculated];
    setDropoffLocation(updatedDropoffRecalculated);
    updateDailyStops(dayKey, {
      pickup: dayKey !== currentDay ? (dailyStops.get(dayKey)?.pickup ?? pickupLocationRef.current) : updatedStops[0],
      dropoff: updatedDropoffRecalculated,
      intermediates: []
    });

    return updatedStops;
  }

  // Case when there are intermediate stops
  const lastStop = intermediateStops[intermediateStops.length - 1];
  let lastTime = lastStop.time as string;
  let lastAddress = lastStop.address;

  if (selectedService?.name.toLowerCase() === 'bodas' && returnTrips.length > 0) {
    const lastReturnTrip = returnTrips[returnTrips.length - 1];
    if ((lastReturnTrip.stops ?? []).length > 0) {
      lastTime = lastReturnTrip?.stops?.[lastReturnTrip.stops.length - 1]?.time ?? '';
    } else {
      lastTime = lastReturnTrip.time;
    }
    lastAddress = lastReturnTrip?.stops?.[lastReturnTrip.stops.length - 1]?.address;
  }

  const cacheKey = `${lastAddress}_${dropoffLocation.address}`;
  const drivingTime = drivingTimes[cacheKey] || 0;

  let newDropoffTime = addHours(parse(lastTime, 'yyyy-MM-dd HH:mm', new Date()), drivingTime);
  if (newDropoffTime.toDateString() === 'Invalid Date') {
    newDropoffTime = new Date(pickupLocationRef.current.time as string);
  }

  const updatedDropoff = {
    ...dropoffLocation,
    time: format(newDropoffTime, 'yyyy-MM-dd HH:mm'),
    day: dayKey
  };

  const updatedStops = [pickupLocationRef.current, ...intermediateStops, updatedDropoff];
  setDropoffLocation(updatedDropoff);
  updateDailyStops(dayKey, {
    pickup:
      isTrip && dayKey !== currentDay
        ? (dailyStops.get(dayKey)?.pickup ?? pickupLocationRef.current)
        : pickupLocationRef.current,
    dropoff: updatedDropoff,
    intermediates: intermediateStops
  });

  return updatedStops;
}

export function handleMoreThan9HDrive({
  index,
  is2hourLimitExceeded,
  intermediateStops,
  setIntermediateStops,
  verifiedAddresses,
  setVerifiedAddresses,
  setisAddStopDisabled,
  restHours,
  calculateDrivingTimes,
  pickupLocationRef,
  dropoffLocationRef,
  lastStopIndex,
  setDropoffLocation,
  showToastModal
}: HandleMoreThan9HDriveParams) {
  // Remove the stop
  const updatedStops = intermediateStops;
  if (lastStopIndex === 0 && index - 2 === lastStopIndex) {
    setDropoffLocation({ time: '', address: '', day: 0 });
    updatedStops[lastStopIndex] = {
      ...updatedStops[lastStopIndex],
      address: '',
      time: ''
    };
  } else if (index - 1 === lastStopIndex) {
    updatedStops[lastStopIndex] = {
      ...updatedStops[lastStopIndex],
      address: '',
      time: ''
    };
  } else {
    updatedStops.splice(index - 2, 1);
  }

  setIntermediateStops(updatedStops);
  // Update verified addresses
  const updatedVerified = verifiedAddresses;
  if (lastStopIndex === 0 && index - 2 === lastStopIndex) {
    setDropoffLocation({ time: '', address: '', day: 0 });
    updatedStops[lastStopIndex] = {
      ...updatedStops[lastStopIndex],
      address: '',
      time: ''
    };
  } else if (index - 1 === lastStopIndex) {
    updatedStops[lastStopIndex] = {
      ...updatedStops[lastStopIndex],
      address: '',
      time: ''
    };
  } else {
    updatedVerified.splice(index - 2, 1);
  }

  setVerifiedAddresses(updatedVerified);

  // Show modal instead of toast
  setisAddStopDisabled(false);

  if (is2hourLimitExceeded) {
    showToastModal({ message: t('bookingPage.errors.longerDriveThan2H'), toastType: ToastType.error });
  } else {
    showToastModal({
      message: t('bookingPage.errors.longerDriveThan9H', {
        hours: restHours?.fullDayDriving
      }),
      toastType: ToastType.error
    });
  }

  calculateDrivingTimes([pickupLocationRef.current, ...updatedStops, dropoffLocationRef.current]);
}

export function computeUpdatedMinTimes({
  intermediateStops,
  pickupStop,
  dropoffStop,
  minTimes,
  getMinTime,
  currentDay,
  isTrip,
  lastStopIndex
}: {
  intermediateStops: StopData[];
  pickupStop: StopData;
  dropoffStop: StopData;
  minTimes: { address: string; time: string }[];
  getMinTime: (params: { stops: StopData[]; index: number; dayNumber: number; lastStopIndex?: number | null }) => {
    time?: string;
    address?: string;
    error?: string;
  };
  currentDay: number;
  isTrip: boolean;
  lastStopIndex: number | null;
}) {
  const allIntermediateStopsHaveTime = intermediateStops.every((stop) => stop.address !== '' && stop.time !== '');
  const errors: Array<{ type: 'drivingTimeExceeded' | 'drivingTimeExceeded2H'; index: number }> = [];
  const stopsChain = [pickupStop, ...intermediateStops, dropoffStop];
  const updatedMinTimes = stopsChain.map((stop, index) => {
    const result = getMinTime({ stops: stopsChain, index: index, dayNumber: currentDay, lastStopIndex });

    if (result.error === 'drivingTimeExceeded') {
      errors.push({ type: 'drivingTimeExceeded', index });
      return { address: stop.address, time: '' };
    } else if (result.error === 'drivingTimeExceeded2H') {
      errors.push({ type: 'drivingTimeExceeded2H', index });
      return { address: stop.address, time: '' };
    }

    const previousStopTime = index > 0 ? intermediateStops[index - 1]?.time : pickupStop.time;
    if (result.time && result.time !== previousStopTime) {
      return { address: result.address ?? '', time: result.time };
    } else {
      return minTimes[index] || { address: stop.address ?? '', time: '' };
    }
  });

  const uniqueMinTimes = isTrip ? [...minTimes, ...updatedMinTimes] : [...updatedMinTimes];
  return { updatedMinTimes: uniqueMinTimes.slice(1, uniqueMinTimes.length - 1), errors, allIntermediateStopsHaveTime };
}

export function computeIsSaveDisabled({
  pickupLocation,
  dropoffLocation,
  isExcursion,
  isTrip,
  isWedding,
  intermediateStops,
  dailyStops,
  currentDay,
  returnTrips
}: ComputeIsSaveDisabledParams) {
  return (
    !pickupLocation.address ||
    !dropoffLocation.address ||
    !pickupLocation.time ||
    ((isExcursion || isTrip) && !dropoffLocation.time) ||
    intermediateStops.some((stop) => !stop.address || ((isExcursion || isTrip || isWedding) && !stop.time)) ||
    (isTrip && !isAllDaysValid(currentDay, isTrip, dailyStops)) ||
    (isWedding && returnTrips.length === 0) ||
    returnTrips.some((trip) => !trip.time || !trip.buses.some((bus) => bus.numberOfBuses > 0))
  );
}

export function checkIntermediateStopTimeChange({
  newTime,
  maxTime,
  restHours
}: CheckIntermediateStopTimeChangeParams): CheckIntermediateStopTimeChangeResult {
  if (maxTime && newTime >= maxTime) {
    return {
      shouldDisableAddStop: true,
      toastMessage: restHours ? `Longer than ${restHours.excursionsLimit} hours` : 'Time exceeds limit'
    };
  }
  return {
    shouldDisableAddStop: false
  };
}

export function resetAllStatesHelper({
  setDailyStops,
  setCurrentDay,
  setPickupLocation,
  setDropoffLocation,
  setIntermediateStops,
  setVerifiedAddresses,
  setIsAddStopDisabled,
  pickupLocationRef,
  dropoffLocationRef,
  intermediateStopsRef,
  initialDateAndTime,
  isExcursion,
  currentDay
}: ResetAllStatesParams) {
  setDailyStops(new Map());
  setCurrentDay(0);
  setPickupLocation({ address: '', time: initialDateAndTime, day: 0 });
  setDropoffLocation({ address: '', time: '', day: 0 });
  if (isExcursion) {
    setIntermediateStops([
      {
        address: '',
        time: '',
        day: currentDay
      }
    ]);
  } else {
    setIntermediateStops([]);
  }

  setVerifiedAddresses([]);
  setIsAddStopDisabled(false);

  pickupLocationRef.current = { address: '', time: initialDateAndTime, day: 0 };
  dropoffLocationRef.current = { address: '', time: '', day: 0 };
  intermediateStopsRef.current = [];
}
