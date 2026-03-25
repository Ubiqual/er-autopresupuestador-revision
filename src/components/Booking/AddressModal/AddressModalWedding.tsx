/* eslint-disable max-lines */
import Bus from '@/assets/icons/bus.svg';
import Forest from '@/assets/icons/forest.svg';
import Plane from '@/assets/icons/plane.svg';
import Rings from '@/assets/icons/rings.svg';
import Train from '@/assets/icons/train.svg';
import Travel from '@/assets/icons/travel.svg';
import AddStopButtonSectionWedding from '@/components/AddStopButtonSectionWedding/AddStopButtonSectionWedding';
import DropoffLocationSectionWedding from '@/components/DropoffLocationSectionWedding/DropoffLocationSectionWedding';
import IntermediateStopsSectionWedding from '@/components/IntermediateStopsSectionWedding/IntermediateStopsSectionWedding';
import PickupLocationSectionWedding from '@/components/PickupLocationSectionWedding/PickupLocationSectionWedding';
import SaveCancelButtonsSectionWedding from '@/components/SaveCancelButtonsSectionWedding/SaveCancelButtonsSectionWedding';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useBusSelection } from '@/contexts/BusSelectionContext';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import { useLocations } from '@/contexts/LocationsContext';
import { ToastType, useToastModal } from '@/contexts/ToastModalContext';
import useCalculateTravelTime from '@/hooks/useCalculateTravelTime';
import type { StopData } from '@/types/TravelCalculations';
import {
  checkIntermediateStopTimeChange,
  computeIsSaveDisabled,
  computeUpdatedMinTimes,
  handleMoreThan9HDrive,
  resetAllStatesHelper,
  updateDropoffTime,
  validateStopTimesAgainstMinTimes
} from '@/utils/addressModalHelpers';
import { t } from '@/utils/i18n';
import type { ConfigureWeddings, RestHours, Service } from '@prisma/client';
import { addHours, format, parse, setMinutes } from 'date-fns';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';
import ReturnTripsModal from './ReturnTripsModal';

interface AddressModalWeddingProps {
  isOpen: boolean;
  isExcursion: boolean;
  isWedding: boolean;
  initialDate?: Date;
  selectedService?: Service;
  restHours?: RestHours;
  baseAddress: string;
  isTrip: boolean;
  weddingLimit?: ConfigureWeddings | null;
  editMode?: boolean;
  lastStopIndex: number | null;
  setLastStopIndex: Dispatch<SetStateAction<number | null>>;
}

const serviceIcons: { [key: string]: JSX.Element } = {
  traslados: <Bus width={50} height={50} />,
  'transfer aeropuerto': <Plane width={50} height={50} />,
  'transfer tren': <Train width={50} height={50} />,
  excursiones: <Forest width={50} height={50} />,
  viajes: <Travel width={50} height={50} />,
  bodas: <Rings width={50} height={50} />
};

const AddressModalWedding = ({
  isOpen,
  isExcursion,
  isWedding,
  initialDate = new Date(),
  selectedService,
  restHours,
  baseAddress,
  isTrip,
  weddingLimit,
  editMode,
  setLastStopIndex,
  lastStopIndex
}: AddressModalWeddingProps) => {
  const { dailyStops, setDailyStops, updateDailyStops, returnTrips, numDays, setReturnTrips } = useDailyStops();
  const { closeModal } = useLocations();
  const { availableReturnBusTypes } = useBusSelection();
  const { showToast } = useToastModal();
  const isMultiDay = numDays > 1;
  const initialDateAndTime = `${format(initialDate, 'yyyy-MM-dd HH:mm')}`;
  const [steps, setSteps] = useState(0);

  const [currentDay, setCurrentDay] = useState(0);

  const [pickupLocation, setPickupLocation] = useState<StopData>(
    dailyStops.get(0)?.pickup || { address: '', time: initialDateAndTime, day: 0 }
  );
  const [dropoffLocation, setDropoffLocation] = useState<StopData>(
    dailyStops.get(0)?.dropoff || { address: '', time: '', day: 0 }
  );

  const [intermediateStops, setIntermediateStops] = useState<StopData[]>(dailyStops.get(0)?.intermediates || []);
  const [verifiedAddresses, setVerifiedAddresses] = useState<boolean[]>([]);
  const [isAddStopDisabled, setisAddStopDisabled] = useState(true);
  const [disableSwitchSteps, setDisableSwitchSteps] = useState(false);
  const [minTimes, setMinTimes] = useState<{ address: string; time: string }[]>([]);
  const [skipEffect, setSkipEffect] = useState(true);
  const [weddingMinMaxTimeForFirstPickup, setWeddingMinimumTimeForFirstPickup] = useState({ minTime: '', maxTime: '' });

  const previousDayRef = useRef<number | null>(null);

  const allStops = [pickupLocation, ...intermediateStops, dropoffLocation];

  const pickupLocationRef = useRef(pickupLocation);
  const dropoffLocationRef = useRef(dropoffLocation);
  const intermediateStopsRef = useRef(intermediateStops);

  const { drivingTimes, maxTime, getMinTime, calculateDrivingTimes, getMaxTime, getWeddingMinTime } =
    useCalculateTravelTime({
      stops: allStops,
      initialDate,
      pickupTime: pickupLocationRef.current.time!,
      isExcursion,
      restHours,
      isWedding,
      baseAddress,
      isTrip,
      weddingLimit
    });

  // NEW: Ref to measure pickup input width
  const InitalDropdownWidth = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (intermediateStops.length === 0) {
      setIntermediateStops([{ address: '', time: '', day: currentDay }]);
      setLastStopIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!editMode) {
      return;
    }
    const stopsForDayZero = dailyStops.get(0);
    if (!stopsForDayZero) {
      return;
    }

    if (intermediateStops.length === 0 && pickupLocation.address === '' && dropoffLocation.address === '') {
      if (stopsForDayZero.pickup && stopsForDayZero.dropoff) {
        setPickupLocation(stopsForDayZero.pickup);
        setDropoffLocation(stopsForDayZero.dropoff as StopData);
        if (stopsForDayZero.intermediates && stopsForDayZero.intermediates.length !== 0) {
          setIntermediateStops(stopsForDayZero.intermediates as StopData[]);
        }
      }
    }
    setLastStopIndex(null);
  }, [dailyStops, editMode]);

  useEffect(() => {
    if (!pickupLocation.address) {
      setisAddStopDisabled(true);

      if (intermediateStops.length > 0) {
        setIntermediateStops([]);

        updateDailyStops(currentDay, {
          pickup: pickupLocation,
          dropoff: dropoffLocation,
          intermediates: []
        });
      }
    } else if (intermediateStops[lastStopIndex ?? 0]?.address) {
      setisAddStopDisabled(false);
    }

    pickupLocationRef.current = pickupLocation;
  }, [pickupLocation]);

  useEffect(() => {
    intermediateStopsRef.current = intermediateStops;
    dropoffLocationRef.current = dropoffLocation;
  }, [intermediateStops, dropoffLocation]);

  useEffect(() => {
    resetAllStatesHelper({
      setDailyStops,
      setCurrentDay,
      setPickupLocation,
      setDropoffLocation,
      setIntermediateStops,
      setVerifiedAddresses,
      setIsAddStopDisabled: setisAddStopDisabled,
      pickupLocationRef,
      dropoffLocationRef,
      intermediateStopsRef,
      initialDateAndTime,
      isExcursion: isExcursion,
      currentDay
    });
  }, [isTrip, isWedding, isExcursion, selectedService, numDays, initialDateAndTime]);

  useEffect(() => {
    if (initialDateAndTime && pickupLocation.time !== initialDateAndTime) {
      setPickupLocation((prev) => ({ ...prev, time: initialDateAndTime }));
    }
  }, [initialDateAndTime]);

  useEffect(() => {
    if (isTrip && skipEffect && isMultiDay) {
      setSkipEffect(false);
      return;
    }

    if ((isExcursion || isTrip) && pickupLocationRef.current.time && dropoffLocationRef.current.time) {
      if (Object.keys(drivingTimes).length > 0 && pickupLocation.time) {
        const updatedStops = [...allStops];
        let prevTime = parse(pickupLocation.time!, 'yyyy-MM-dd HH:mm', new Date());

        updatedStops.forEach((stop, index) => {
          if (index === 0) {
            stop.time = format(prevTime, 'yyyy-MM-dd HH:mm');
          } else {
            const prevAddress = updatedStops[index - 1].address;
            const currentAddress = stop.address;
            const cacheKey = `${prevAddress}_${currentAddress}`;
            const drivingTime = drivingTimes[cacheKey] || 0;
            const drivingTimeMs = drivingTime * 3600 * 1000;
            const newTime = new Date(prevTime.getTime() + drivingTimeMs);
            const roundedTime = setMinutes(newTime, Math.ceil(newTime.getMinutes() / 30) * 30);
            stop.time = format(roundedTime, 'yyyy-MM-dd HH:mm');

            prevTime = roundedTime;
          }
        });
        setDailyStops((prevDailyStops) => {
          const newDailyStops = new Map(prevDailyStops);
          newDailyStops.set(currentDay, {
            pickup: updatedStops[0],
            dropoff: updatedStops[updatedStops.length - 1],
            intermediates: updatedStops.slice(1, updatedStops.length - 1)
          }); // Use currentDay as the key
          return newDailyStops;
        });
        updateDropoffTime({
          intermediateStops,
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
      }
    }
  }, [isExcursion, pickupLocation.time]);

  useEffect(() => {
    fetchMinTimes();
    getMaxTime({ stops: allStops });
  }, [drivingTimes, pickupLocation]);

  useEffect(() => {
    if (pickupLocation && dropoffLocation && intermediateStops.length >= 0 && drivingTimes) {
      // Use previousDayRef.current to access the previous day's value if needed

      if (previousDayRef.current !== null) {
        const previousDayStops = dailyStops.get(previousDayRef.current);
        // Update dropoff time for the previous day

        updateDropoffTime({
          intermediateStops: previousDayStops?.intermediates || [],
          dropoffLocation: previousDayStops?.dropoff || dropoffLocation,
          dayKey: previousDayRef.current,
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
        setDropoffLocation(dropoffLocation);
        previousDayRef.current = currentDay;
        return;
      }

      // Update dropoff time for the current day
      updateDropoffTime({
        intermediateStops,
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
    }
    previousDayRef.current = currentDay;
  }, [currentDay]);

  const parseTime = (timeStr: string) => parse(timeStr, 'yyyy-MM-dd HH:mm', new Date());
  const handleAddStop = (isLastStop: boolean = false) => {
    const newStop: StopData = { address: '', time: '', day: currentDay };

    let updatedStops: StopData[];

    if (isLastStop) {
      // mark this as the true last stop
      updatedStops = [...intermediateStops, newStop];
      setLastStopIndex(intermediateStops.length);
    } else if (lastStopIndex != null) {
      // we already have a true last stop
      if (steps === 0) {
        // insert *before* the true last stop
        updatedStops = [
          ...intermediateStops.slice(0, lastStopIndex),
          newStop,
          ...intermediateStops.slice(lastStopIndex)
        ];
        // bump the index of the true last stop forward
        setLastStopIndex(lastStopIndex + 1);
        setisAddStopDisabled(true);
      } else if (steps === 1) {
        // insert *after* the true last stop
        updatedStops = [...intermediateStops, newStop];
        // lastStopIndex stays pointing at the original true last stop
      } else {
        // fallback: just append
        updatedStops = [...intermediateStops, newStop];
      }
    } else {
      // no true last stop yet — just append
      updatedStops = [...intermediateStops, newStop];
    }

    setIntermediateStops(updatedStops);
  };
  const handleIntermediateStopTimeChange = (index: number, value: string) => {
    const updatedStops = [...intermediateStops];
    updatedStops[index].time = value;
    if (index !== lastStopIndex && steps === 0) {
      const { shouldDisableAddStop, toastMessage } = checkIntermediateStopTimeChange({
        newTime: format(
          addHours(
            parse(value, 'yyyy-MM-dd HH:mm', new Date()),
            drivingTimes[`${updatedStops[index].address}_${intermediateStops[lastStopIndex!].address}`]
          ),
          'yyyy-MM-dd HH:mm'
        ),
        maxTime,
        restHours
      });

      if (toastMessage) {
        showToast({
          message: t('bookingPage.errors.longerThan14H', { hours: restHours!.excursionsLimit }),
          toastType: ToastType.error
        });
      }

      if (steps === 0) {
        setDisableSwitchSteps(shouldDisableAddStop);
        setisAddStopDisabled(shouldDisableAddStop);
        setReturnTrips([]);
      }
    }

    setIntermediateStops(updatedStops);
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
    fetchMinTimes();
  };

  const isSaveDisabled = computeIsSaveDisabled({
    pickupLocation,
    dropoffLocation,
    isExcursion,
    isTrip,
    isWedding,
    intermediateStops,
    dailyStops,
    currentDay,
    returnTrips
  });
  const fetchMinTimes = () => {
    if (!(isExcursion || isWedding || isTrip)) {
      return;
    }

    const { updatedMinTimes, errors } = computeUpdatedMinTimes({
      intermediateStops,
      pickupStop: pickupLocation,
      dropoffStop: dropoffLocation,
      minTimes,
      getMinTime,
      currentDay,
      isTrip,
      lastStopIndex
    });

    // Handle errors (driving time exceeded) here:
    errors.forEach((err) => {
      handleMoreThan9HDrive({
        index: err.index,
        is2hourLimitExceeded: err.type === 'drivingTimeExceeded2H',
        intermediateStops,
        setIntermediateStops,
        setisAddStopDisabled,
        verifiedAddresses,
        setVerifiedAddresses,
        restHours,
        calculateDrivingTimes,
        pickupLocationRef,
        dropoffLocationRef,
        lastStopIndex,
        setDropoffLocation,
        showToastModal: showToast
      });
    });
    setMinTimes(updatedMinTimes);
    // if (!isAddStopDisabled && (isExcursion || isWedding || isTrip)) {
    //   setisAddStopDisabled(!allIntermediateStopsHaveTime);
    // }
    if (isAddStopDisabled && intermediateStops.length === 0 && pickupLocation.address) {
      setisAddStopDisabled(false);
    }
    // Validate stop times and update dropoff time if needed
    validateStopTimesAgainstMinTimes(
      updatedMinTimes,
      intermediateStops,
      dropoffLocation,
      setIntermediateStops,
      (updatedStops, dropoffLocation) =>
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
        })
    );
  };

  const handleAddressSelect = (value: string) => {
    setDropoffLocation((prev) => {
      const newDropoffLocation = { ...prev, address: value, day: previousDayRef.current as number };

      if (isWedding || isExcursion || isTrip) {
        updateDropoffTime({
          intermediateStops: intermediateStopsRef.current,
          dropoffLocation: newDropoffLocation,
          dayKey: previousDayRef.current as number,
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
      }

      return newDropoffLocation;
    });
  };

  const validateReturnTrips = () => {
    const lastReturnTrip = returnTrips[returnTrips.length - 1];

    // 1) Check that each bus type in availableReturnBusTypes
    //    has been selected up to its maxCount in the last return trip
    const missingBuses = Object.entries(availableReturnBusTypes).filter(([busType, maxCount]) => {
      const existingBus = lastReturnTrip.buses.find((b) => b.busType === busType);
      return !existingBus || existingBus.numberOfBuses < maxCount;
    });

    if (missingBuses.length > 0) {
      showToast({
        message: t('bookingPage.errors.lastReturnShouldHaveAllBuses', {
          buses: missingBuses.map(([busType, maxCount]) => `${maxCount} autocares de ${busType} personas`).join(', ')
        }),
        toastType: ToastType.error
      });
      return false;
    }

    // 2) Check that every return trip has a time
    const allTimesFilled = returnTrips.every((trip) => Boolean(trip.time));
    if (!allTimesFilled) {
      showToast({
        message: t('bookingPage.errors.everyReturnTripNeedsTime'),
        toastType: ToastType.error
      });
      return false;
    }

    // 3) If we got here, everything is valid
    return true;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={closeModal}>
        <DialogContent
          className="fixed inset-0 bg-white p-4 w-full h-full flex items-center justify-center 
             top-1/2 left-1/2 lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2 
             lg:p-24 max-h-[100%] h-[100%] w-[100%] max-w-[100%] lg:rounded-lg lg:shadow-lg 
             lg:w-[90%] lg:max-w-[75vw] lg:h-[85%] lg:max-h-[700px] z-50"
        >
          <div className="w-full max-h-[90%] lg:max-h-[500px] overflow-y-auto pr-2">
            <div className="flex justify-center items-center mb-4">
              {serviceIcons[String(selectedService?.name).toLowerCase()] || null}
              <DialogTitle className="font-medium text-center  text-3xl ml-6 text-[#4554a1]">
                {selectedService?.name.toLowerCase()}
              </DialogTitle>
            </div>
            <hr className="w-full border-t-1 border-[#4554a1] mb-6" />
            {/* Day Selector (Only if numDays > 1) */}
            <div className="flex overflow-x-auto whitespace-nowrap justify-start lg:justify-center mb-4">
              <Button
                key={0}
                variant={steps === 0 ? 'default' : 'outline'}
                rounded="full"
                color={steps === 0 ? 'primary' : 'white'}
                onClick={() => setSteps(0)}
                className="px-3 py-1 mx-1"
              >
                Ida
              </Button>
              <Button
                key={1}
                variant={steps === 1 ? 'default' : 'outline'}
                rounded="full"
                color={steps === 1 ? 'primary' : 'white'}
                onClick={() => setSteps(1)}
                disabled={
                  !pickupLocation?.address ||
                  intermediateStops.length === 0 ||
                  !intermediateStops[lastStopIndex ?? 0]?.address ||
                  (intermediateStops.length > 1 ? disableSwitchSteps : false)
                }
                className="px-3 py-1 mx-1"
              >
                Vuelta
              </Button>
            </div>

            {/* Pickup Location */}
            <PickupLocationSectionWedding
              currentDay={currentDay}
              pickupLocation={pickupLocation}
              setPickupLocation={setPickupLocation}
              calculateDrivingTimes={calculateDrivingTimes}
              InitalDropdownWidth={InitalDropdownWidth}
              intermediateStopsRef={intermediateStopsRef}
              steps={steps}
              lastStopIndex={lastStopIndex}
              setIntermediateStops={setIntermediateStops}
              setLastStopIndex={setLastStopIndex}
              setReturnTrips={setReturnTrips}
            />
            {/* Intermediate Stops */}
            <IntermediateStopsSectionWedding
              intermediateStopsAll={intermediateStops}
              setIntermediateStops={setIntermediateStops}
              verifiedAddresses={verifiedAddresses}
              setVerifiedAddresses={setVerifiedAddresses}
              setisAddStopDisabled={setisAddStopDisabled}
              isWedding={isWedding}
              isExcursion={isExcursion}
              isTrip={isTrip}
              currentDay={currentDay}
              pickupLocationRef={pickupLocationRef}
              dropoffLocation={dropoffLocation}
              drivingTimes={drivingTimes}
              selectedService={selectedService}
              setDropoffLocation={setDropoffLocation}
              setLastStopIndex={setLastStopIndex}
              intermediateStopsRef={intermediateStopsRef}
              calculateDrivingTimes={calculateDrivingTimes}
              fetchMinTimes={fetchMinTimes}
              setWeddingMinimumTimeForFirstPickup={setWeddingMinimumTimeForFirstPickup}
              minTimes={minTimes}
              maxTime={maxTime}
              lastStopIndex={lastStopIndex}
              handleIntermediateStopTimeChange={handleIntermediateStopTimeChange}
              setMinTimes={setMinTimes}
              InitalDropdownWidth={InitalDropdownWidth}
              steps={steps}
            />
            {/* Add Stop Button */}
            <AddStopButtonSectionWedding
              isAddingStopDisabled={isAddStopDisabled}
              handleAddStop={handleAddStop}
              steps={steps}
            />

            {/* Dropoff Location */}

            <DropoffLocationSectionWedding
              dropoffLocation={dropoffLocation}
              setDropoffLocation={setDropoffLocation}
              previousDayRef={previousDayRef}
              pickupLocationRef={pickupLocationRef}
              intermediateStopsRef={intermediateStopsRef}
              calculateDrivingTimes={calculateDrivingTimes}
              handleAddressSelect={handleAddressSelect}
              InitalDropdownWidth={InitalDropdownWidth}
              setIntermediateStops={setIntermediateStops}
              step={steps}
              lastStopIndex={lastStopIndex}
              intermediateStops={intermediateStops}
              setisAddStopDisabled={setisAddStopDisabled}
            />
            {steps === 1 && (
              <ReturnTripsModal
                lastStopAddress={
                  intermediateStops[lastStopIndex !== null ? lastStopIndex : intermediateStops.length - 1]?.address
                }
                initialTrip={intermediateStops[lastStopIndex !== null ? lastStopIndex : intermediateStops.length - 1]}
                availableReturnBusTypes={availableReturnBusTypes}
                handleIntermediateStopTimeChange={handleIntermediateStopTimeChange}
                weddingMinMaxTimeForFirstPickup={weddingMinMaxTimeForFirstPickup}
                lastStopIndex={lastStopIndex !== null ? lastStopIndex : intermediateStops.length - 1}
                getWeddingMinTime={getWeddingMinTime}
                maxTime={maxTime}
                drivingTimes={drivingTimes}
                intermediateStops={intermediateStops}
                dropoffLocation={dropoffLocation}
              />
            )}

            {/* Save and Cancel Buttons */}
            <SaveCancelButtonsSectionWedding
              closeModal={closeModal}
              currentDay={currentDay}
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              intermediateStops={intermediateStops}
              isTrip={isTrip}
              isSaveDisabled={isSaveDisabled}
              isExcursion={isExcursion}
              isWedding={isWedding}
              restHours={restHours}
              allStops={allStops}
              updateDropoffTime={updateDropoffTime}
              pickupLocationRef={pickupLocationRef}
              drivingTimes={drivingTimes}
              selectedService={selectedService}
              setDropoffLocation={setDropoffLocation}
              parseTime={parseTime}
              step={steps}
              disableSwitchSteps={
                !pickupLocation?.address ||
                intermediateStops.length === 0 ||
                !intermediateStops[lastStopIndex ?? 0]?.address ||
                (intermediateStops.length > 1 ? disableSwitchSteps : false)
              }
              setSteps={setSteps}
              validateReturnTrips={validateReturnTrips}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddressModalWedding;
