import { Button, Input } from '@/components/ui';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import type { StopData } from '@/types/TravelCalculations';
import { updateDropoffTime } from '@/utils/addressModalHelpers';
import { t } from '@/utils/i18n';
import type { Service } from '@prisma/client';
import { Cross1Icon } from '@radix-ui/react-icons';
import { addHours, format, setMinutes, setSeconds } from 'date-fns';
import { useCallback, useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import AddressAutocomplete from '../Booking/AdressAutoComplete';

interface IntermediateStopsSectionWeddingProps {
  intermediateStopsAll: StopData[];
  setIntermediateStops: Dispatch<SetStateAction<StopData[]>>;
  verifiedAddresses: boolean[];
  setVerifiedAddresses: Dispatch<SetStateAction<boolean[]>>;
  setisAddStopDisabled: Dispatch<SetStateAction<boolean>>;
  isWedding: boolean;
  isExcursion: boolean;
  isTrip: boolean;
  currentDay: number;
  pickupLocationRef: MutableRefObject<StopData>;
  dropoffLocation: StopData;
  drivingTimes: { [key: string]: number };
  selectedService?: Service;
  setDropoffLocation: Dispatch<SetStateAction<StopData>>;
  setLastStopIndex: Dispatch<SetStateAction<number | null>>;
  intermediateStopsRef: MutableRefObject<StopData[]>;
  calculateDrivingTimes: (stops: StopData[]) => void;
  fetchMinTimes: () => void;
  setWeddingMinimumTimeForFirstPickup: Dispatch<SetStateAction<{ minTime: string; maxTime: string }>>;
  minTimes: { address: string; time: string }[];
  maxTime?: string;
  handleIntermediateStopTimeChange: (index: number, value: string) => void;
  lastStopIndex: number | null;
  setMinTimes: Dispatch<SetStateAction<{ address: string; time: string }[]>>;
  InitalDropdownWidth: MutableRefObject<HTMLInputElement | null>;
  steps: number;
}

const IntermediateStopsSectionWedding = ({
  intermediateStopsAll,
  setIntermediateStops,
  verifiedAddresses,
  setVerifiedAddresses,
  setisAddStopDisabled,
  isWedding,
  isExcursion,
  isTrip,
  currentDay,
  pickupLocationRef,
  dropoffLocation,
  drivingTimes,
  selectedService,
  setDropoffLocation,
  setLastStopIndex,
  intermediateStopsRef,
  calculateDrivingTimes,
  fetchMinTimes,
  setWeddingMinimumTimeForFirstPickup,
  minTimes,
  maxTime,
  handleIntermediateStopTimeChange,
  lastStopIndex,
  setMinTimes,
  InitalDropdownWidth,
  steps
}: IntermediateStopsSectionWeddingProps) => {
  const { dailyStops, updateDailyStops, returnTrips, setReturnTrips } = useDailyStops();

  const intermediateStops =
    steps === 0
      ? // steps 0: from start up to (but not including) lastStopIndex
        intermediateStopsAll.slice(0, lastStopIndex ?? intermediateStopsAll.length - 1)
      : // steps 1: after lastStopIndex to end
        intermediateStopsAll.slice((lastStopIndex ?? -1) + 1);

  useEffect(() => {
    if (
      minTimes[intermediateStops.length === 0 ? 0 : intermediateStops.length - 1] &&
      selectedService?.name.toLowerCase() === 'bodas' &&
      intermediateStopsAll.length > 0 &&
      lastStopIndex !== null &&
      intermediateStopsAll[lastStopIndex]?.address
    ) {
      const lastStopMinTime =
        minTimes.find((entry) => entry.address === intermediateStopsAll[lastStopIndex].address)?.time ?? '';

      setWeddingMinimumTimeForFirstPickup({
        minTime: lastStopMinTime,
        maxTime: maxTime ?? ''
      });
      if (intermediateStopsAll[lastStopIndex].time === '' && lastStopMinTime !== '') {
        const lastStopMinTimeDate = new Date(lastStopMinTime);
        let firstTimeAvaliable = setMinutes(lastStopMinTimeDate, Math.ceil(lastStopMinTimeDate.getMinutes() / 30) * 30);
        firstTimeAvaliable = setSeconds(firstTimeAvaliable, 0); // Ensure seconds are set to 0
        if (firstTimeAvaliable) {
          setIntermediateStops((prevStops) => {
            // if for some reason lastStopIndex is out of range, bail out
            if (lastStopIndex < 0 || lastStopIndex >= prevStops.length) {
              return prevStops;
            }

            return prevStops.map((stop, i) =>
              i === lastStopIndex ? { ...stop, time: format(firstTimeAvaliable, 'yyyy-MM-dd HH:mm') } : stop
            );
          });
        }
      }
    }

    if (steps === 1) {
      const current = returnTrips;

      const updated = current.map((trip) => {
        let stopsChanged = false;

        if (
          trip.stops.length !== intermediateStops.length + 1 ||
          trip.stops[trip.stops.length - 1].address !== dropoffLocation.address
        ) {
          stopsChanged = true;

          const newStops: StopData[] = [...intermediateStops];

          if (newStops.length > 0 && newStops[newStops.length - 1].time) {
            const last = newStops[newStops.length - 1];
            const drive = drivingTimes[`${last.address}_${dropoffLocation.address}`] ?? 0;
            const dropoffTime = addHours(new Date(last.time!), drive);

            newStops.push({
              ...dropoffLocation,
              time: format(dropoffTime, 'yyyy-MM-dd HH:mm')
            });
          } else {
            const pivot = intermediateStopsAll[lastStopIndex ?? 0];
            const drive = drivingTimes[`${pivot.address}_${dropoffLocation.address}`] ?? 0;
            const dropoffTime = addHours(new Date(pivot.time!), drive);

            if (!isNaN(dropoffTime.getTime())) {
              newStops.push({
                ...dropoffLocation,
                time: format(dropoffTime, 'yyyy-MM-dd HH:mm')
              });
            }
          }

          return { ...trip, stops: newStops };
        }

        return stopsChanged ? { ...trip, stops: trip.stops } : { ...trip };
      });

      setReturnTrips(updated);
    }
  }, [minTimes]);

  const validateAddress = useCallback((address: string, index: number) => {
    const service = new window.google.maps.DistanceMatrixService();
    const request = {
      origins: [address],
      destinations: [address],
      travelMode: window.google.maps.TravelMode.DRIVING
    };
    service.getDistanceMatrix(request, (response, status) => {
      if (status === 'OK' && response.rows[0].elements[0].status !== 'NOT_FOUND') {
        setVerifiedAddresses((prev) => {
          const updated = [...prev];
          updated[index] = true;
          return updated;
        });
      } else {
        setVerifiedAddresses((prev) => {
          const updated = [...prev];
          updated[index] = false;
          return updated;
        });
      }
    });
  }, []);

  const handleIntermediateStopChange = (index: number, value: string) => {
    setIntermediateStops((prevStops) => {
      const updatedStops = [...prevStops];
      updatedStops[index] = { ...updatedStops[index], address: value };
      return updatedStops;
    });
    setReturnTrips([]);
  };

  const handleRemoveIntermediateStop = (index: number) => {
    const reversedIntermediateStops =
      steps === 1
        ? // steps 0: from start up to (but not including) lastStopIndex
          intermediateStopsAll.slice(0, lastStopIndex ?? intermediateStopsAll.length - 1)
        : // steps 1: after lastStopIndex to end
          intermediateStopsAll.slice((lastStopIndex ?? -1) + 1);

    const removedStopAddress = intermediateStops[index]?.address;
    const updatedMinTimes = minTimes.filter((entry) => entry.address !== removedStopAddress);
    setMinTimes(updatedMinTimes);
    if (steps === 0) {
      setLastStopIndex((lastStopIndex || 0) - 1);
    }

    const lastStopPlace = intermediateStopsAll[lastStopIndex || 0];

    const updatedStops = intermediateStops.filter((_, i) => i !== index);

    if (steps === 0) {
      setIntermediateStops([...updatedStops, lastStopPlace, ...reversedIntermediateStops]);
    } else {
      setReturnTrips((prev) => {
        /* 2. at least one return trip exists */
        const [first, ...rest] = prev;

        /* inject stops only if they’re still missing */
        if (first.stops.length === 0 && intermediateStops.length > 0) {
          const updatedFirst = { ...first, stops: intermediateStops.filter((_, i) => i !== index) };
          return [updatedFirst, ...rest];
        }

        /* 3. otherwise leave state unchanged */
        return prev;
      });
      setIntermediateStops([...reversedIntermediateStops, lastStopPlace, ...updatedStops]);
    }

    if (isWedding || isExcursion || isTrip) {
      updateDropoffTime({
        intermediateStops: updatedStops,
        dropoffLocation,
        dayKey: currentDay,
        currentDay,
        pickupLocationRef,
        drivingTimes,
        dailyStops,
        isTrip,
        selectedService,
        returnTrips,
        updateDailyStops,
        setDropoffLocation
      });
      verifiedAddresses.splice(index, 1);
      setVerifiedAddresses([...verifiedAddresses]);
    }
  };

  return (
    <>
      {intermediateStops.map((stop, indexDefault) => {
        let index = indexDefault;
        if (steps === 1) {
          const numberOfStopsBeforeCelebration =
            intermediateStopsAll.slice(0, lastStopIndex ?? intermediateStopsAll.length - 1).length + 1;
          index = indexDefault + numberOfStopsBeforeCelebration;
          if (stop.time === '') {
            handleIntermediateStopTimeChange(
              index,
              minTimes.find((entry) => entry.address === stop.address)?.time || ''
            );
          }
        }

        return (
          <div key={index} className="flex gap-2 mb-3 items-center">
            <div className="hidden lg:block lg:min-w-[9.2rem]"></div>
            <AddressAutocomplete
              ref={InitalDropdownWidth}
              value={stop.address}
              onSelect={(value) => {
                validateAddress(value, index);
                const updatedStops = [...intermediateStopsRef.current];
                updatedStops[index] = { ...updatedStops[index], address: value };
                calculateDrivingTimes([pickupLocationRef.current, ...updatedStops, dropoffLocation]);
                fetchMinTimes();
                if (steps === 1) {
                  setisAddStopDisabled(false);
                }
              }}
              onChange={(value) => handleIntermediateStopChange(index, value)}
              placeholder={
                steps === 1 ? 'parada intermedia' : `${t('bookingPage.locationsModal.stopWedding')} ${index + 1}`
              }
              dropdownWidth={InitalDropdownWidth?.current?.offsetWidth}
            />

            {steps === 0 && (isExcursion || isWedding || isTrip) && lastStopIndex && (
              <Input
                type="time"
                value={stop.time || ''}
                onChange={(e) => handleIntermediateStopTimeChange(index, e.target.value)}
                isTimeInput={true}
                disabled={!verifiedAddresses[index]}
                placeholderName={t('timeInputPlaceholder')}
                minTime={minTimes.find((entry) => entry.address === stop.address)?.time || ''}
                maxTime={maxTime ?? ''}
                className="min-w-[11.5rem]"
                loading={minTimes[index] && !minTimes.find((entry) => entry.address === stop.address)?.time}
              />
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => handleRemoveIntermediateStop(indexDefault)}
              className="border-none"
            >
              <Cross1Icon className="w-4 h-4" />
            </Button>
          </div>
        );
      })}
    </>
  );
};

export default IntermediateStopsSectionWedding;
