/* eslint-disable max-lines */
import Bus from '@/assets/icons/bus.svg';
import Forest from '@/assets/icons/forest.svg';
import Plane from '@/assets/icons/plane.svg';
import Rings from '@/assets/icons/rings.svg';
import Train from '@/assets/icons/train.svg';
import Travel from '@/assets/icons/travel.svg';
import AddStopButtonSection from '@/components/AddStopButtonSection/AddStopButtonSection';
import DaySelector from '@/components/DaySelector/DaySelector';
import DropoffLocationSection from '@/components/DropoffLocationSection/DropoffLocationSection';
import IntermediateStopsSection from '@/components/IntermediateStopsSection/IntermediateStopsSection';
import PickupLocationSection from '@/components/PickupLocationSection/PickupLocationSection';
import SaveCancelButtonsSection from '@/components/SaveCancelButtonsSection/SaveCancelButtonsSection';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import { useLocations } from '@/contexts/LocationsContext';
import { ToastType, useToastModal } from '@/contexts/ToastModalContext';
import useCalculateTravelTime from '@/hooks/useCalculateTravelTime';
import { formatName } from '@/lib/utils';
import type { DailyStops } from '@/types/AddressModal';
import type { StopData } from '@/types/TravelCalculations';
import {
  calculateMaxPickupTime,
  calculateMinPickupTime,
  checkIntermediateStopTimeChange,
  computeIsSaveDisabled,
  computeUpdatedMinTimes,
  handleMoreThan9HDrive,
  resetAllStatesHelper,
  updateDropoffTime,
  validateStopTimesAgainstMinTimes
} from '@/utils/addressModalHelpers';
import { t } from '@/utils/i18n';
import type { ConfigureTrips, ConfigureWeddings, RestHours, Service } from '@prisma/client';
import { addHours, format, parse, setMinutes } from 'date-fns';
import { useEffect, useRef, useState } from 'react';

interface AddressModalProps {
  isOpen: boolean;
  isExcursion: boolean;
  isWedding: boolean;
  initialDate?: Date;
  selectedService?: Service;
  restHours?: RestHours;
  baseAddress: string;
  isTrip: boolean;
  tripMinimums?: ConfigureTrips | null;
  weddingLimit?: ConfigureWeddings | null;
  editMode?: boolean;
  initialLastStopIndex?: number;
  searchButtonRef?: React.RefObject<HTMLDivElement>;
}

const serviceIcons: { [key: string]: JSX.Element } = {
  traslados: <Bus width={50} height={50} />,
  'transfer aeropuerto': <Plane width={50} height={50} />,
  'transfer tren': <Train width={50} height={50} />,
  excursiones: <Forest width={50} height={50} />,
  viajes: <Travel width={50} height={50} />,
  bodas: <Rings width={50} height={50} />
};

const AddressModal = ({
  isOpen,
  isExcursion,
  isWedding,
  initialDate = new Date(),
  selectedService,
  restHours,
  baseAddress,
  isTrip,
  tripMinimums,
  weddingLimit,
  editMode,
  initialLastStopIndex,
  searchButtonRef
}: AddressModalProps) => {
  const { dailyStops, setDailyStops, updateDailyStops, returnTrips, numDays } = useDailyStops();
  const { closeModal } = useLocations();
  const { showToast } = useToastModal();
  const isMultiDay = numDays > 1;
  const initialDateAndTime = `${format(initialDate, 'yyyy-MM-dd HH:mm')}`;

  const [currentDay, setCurrentDay] = useState(0);

  const [pickupLocation, setPickupLocation] = useState<StopData>(
    dailyStops.get(0)?.pickup || { address: '', time: initialDateAndTime, day: 0 }
  );
  const [dropoffLocation, setDropoffLocation] = useState<StopData>(
    dailyStops.get(0)?.dropoff || { address: '', time: '', day: 0 }
  );

  const [intermediateStops, setIntermediateStops] = useState<StopData[]>(dailyStops.get(0)?.intermediates || []);
  const [verifiedAddresses, setVerifiedAddresses] = useState<boolean[]>([]);
  const [isAddStopDisabled, setisAddStopDisabled] = useState(false);
  const [minTimes, setMinTimes] = useState<{ address: string; time: string }[]>([]);
  const [skipEffect, setSkipEffect] = useState(true);
  const [lastStopIndex, setLastStopIndex] = useState<number | null>(initialLastStopIndex || null);

  const previousDayRef = useRef<number | null>(null);

  const allStops = [pickupLocation, ...intermediateStops, dropoffLocation];

  const pickupLocationRef = useRef(pickupLocation);
  const dropoffLocationRef = useRef(dropoffLocation);
  const intermediateStopsRef = useRef(intermediateStops);
  const saveCancelButtonsRef = useRef<HTMLDivElement>(null);

  const { drivingTimes, maxTime, getMinTime, calculateDrivingTimes, getMaxTime } = useCalculateTravelTime({
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
    setLastStopIndex(initialLastStopIndex ?? null);
  }, [dailyStops, editMode]);

  useEffect(() => {
    if (!pickupLocation.address && (isTrip || isWedding || isExcursion)) {
      setisAddStopDisabled(true);

      if (intermediateStops.length > 0) {
        if (isExcursion) {
          setIntermediateStops([
            {
              address: '',
              time: '',
              day: currentDay
            }
          ]);

          updateDailyStops(currentDay, {
            pickup: pickupLocation,
            dropoff: dropoffLocation,
            intermediates: [
              {
                address: '',
                time: '',
                day: currentDay
              }
            ]
          });
        } else {
          setIntermediateStops([]);
          updateDailyStops(currentDay, {
            pickup: pickupLocation,
            dropoff: dropoffLocation,
            intermediates: []
          });
        }
      }
    } else {
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
      isExcursion,
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

  const minTime2 = calculateMinPickupTime(currentDay, initialDateAndTime, dailyStops, restHours);
  const maxTime2 = calculateMaxPickupTime(minTime2, currentDay - 1, dailyStops, restHours, tripMinimums);

  const parseTime = (timeStr: string) => parse(timeStr, 'yyyy-MM-dd HH:mm', new Date());

  const handleAddStop = (isLastStop: boolean = false) => {
    const newStop: StopData = { address: '', time: '', day: currentDay };

    if (isLastStop) {
      // Handle the addition of the last stop
      setIntermediateStops([...intermediateStops, newStop]);
      setLastStopIndex(intermediateStops.length);
    } else {
      // Handle the addition of a regular stop
      setIntermediateStops([...intermediateStops, newStop]);
    }
    if (isWedding || isExcursion || isTrip || isWedding) {
      setisAddStopDisabled(true);
    }
  };

  const handleIntermediateStopTimeChange = (index: number, value: string) => {
    const updatedStops = [...intermediateStops];
    updatedStops[index].time = value;
    const { shouldDisableAddStop, toastMessage } = checkIntermediateStopTimeChange({
      newTime: format(
        addHours(
          parse(value, 'yyyy-MM-dd HH:mm', new Date()),
          drivingTimes[`${updatedStops[index].address}_${dropoffLocation.address}`]
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
    setisAddStopDisabled(shouldDisableAddStop);
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

  const updateDropoffOnTripsWhenEmpty = ({
    value,
    drivingTimes
  }: {
    value: string;
    drivingTimes: { [key: string]: number };
  }) => {
    const updatedStops = [...intermediateStops];
    let stops: Map<number, DailyStops> = new Map(dailyStops);
    setDailyStops((prevDailyStops) => {
      const updatedDailyStops = new Map(prevDailyStops);
      updatedDailyStops.set(numDays - 1, {
        pickup: {
          ...(updatedDailyStops.get(numDays - 1)?.pickup || pickupLocation),
          time: value
        },
        dropoff: dropoffLocation,
        intermediates: intermediateStops
      });
      stops = updatedDailyStops;
      return updatedDailyStops;
    });
    updateDropoffTime({
      intermediateStops: updatedStops,
      dropoffLocation,
      dayKey: currentDay,
      currentDay,
      pickupLocationRef: { current: { ...pickupLocation, time: value } },
      drivingTimes,
      dailyStops: stops,
      isTrip,
      selectedService,
      returnTrips,
      updateDailyStops,
      setDropoffLocation
    });
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

    const { updatedMinTimes, errors, allIntermediateStopsHaveTime } = computeUpdatedMinTimes({
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
        showToastModal: showToast,
        setDropoffLocation,
        lastStopIndex
      });
    });
    setMinTimes(updatedMinTimes);
    if (!isAddStopDisabled && (isExcursion || isWedding || isTrip)) {
      setisAddStopDisabled(!allIntermediateStopsHaveTime);
    }
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

  const loadStopsForDay = (dayIndex: number) => {
    const stopsForDay = dailyStops.get(dayIndex);
    if (stopsForDay) {
      setPickupLocation(stopsForDay.pickup);
      setDropoffLocation(stopsForDay.dropoff);
      setIntermediateStops(stopsForDay.intermediates);
    } else {
      setPickupLocation({ address: '', time: initialDateAndTime, day: dayIndex });
      setDropoffLocation({ address: '', time: '', day: dayIndex });
      setIntermediateStops([]);
    }
  };

  const handleDayChange = (dayIndex: number) => {
    setSkipEffect(true);
    setDailyStops((prevDailyStops) => {
      const updatedDailyStops = new Map(prevDailyStops);
      updatedDailyStops.set(currentDay, {
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        intermediates: intermediateStops
      });
      return updatedDailyStops;
    });
    const stopsForDay = dailyStops.get(dayIndex);
    loadStopsForDay(dayIndex);
    if (dayIndex > 0 && isTrip) {
      const previousDayStops = dailyStops.get(dayIndex - 1);
      if (previousDayStops?.dropoff) {
        setPickupLocation({
          ...previousDayStops.dropoff,
          time: stopsForDay?.pickup.time ?? previousDayStops.dropoff.time,
          day: dayIndex
        });
      } else {
        setPickupLocation({ address: '', time: initialDateAndTime, day: dayIndex });
      }
    }
    if (dayIndex === numDays - 1) {
      setDropoffLocation((prev) => ({ ...prev, address: dailyStops.get(0)?.pickup?.address || '' }));
      const updatedStops = [
        pickupLocationRef.current,
        ...intermediateStopsRef.current,
        { address: dailyStops.get(0)?.pickup.address || '', time: '', day: dayIndex }
      ];
      calculateDrivingTimes(updatedStops);
    }
    setCurrentDay(dayIndex);
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

  const handleCloseModal = () => {
    closeModal();
    if (searchButtonRef?.current) {
      searchButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseModal}>
        <DialogContent
          className="fixed inset-0 bg-white p-4 w-full h-full flex items-center justify-center 
             top-1/2 left-1/2 lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2 
             lg:p-24 max-h-[100%] max-w-[100%] lg:rounded-lg lg:shadow-lg 
             lg:w-[90%] lg:max-w-[75vw] lg:h-[85%] lg:max-h-[700px] z-50"
        >
          <div className="w-full max-h-[90%] lg:max-h-[500px] overflow-y-auto pr-2">
            {selectedService?.name && (
              <div className="flex justify-center items-center mb-4">
                {serviceIcons[String(selectedService.name).toLowerCase()]}
                <DialogTitle className="font-medium text-center  text-3xl ml-6 text-[#4554a1]">
                  {formatName(selectedService?.name)}
                </DialogTitle>
              </div>
            )}

            <hr className="w-full border-t-1 border-[#4554a1] mb-6" />

            {/* Day Selector (Only if numDays > 1) */}
            {isMultiDay && (
              <DaySelector
                currentDay={currentDay}
                handleDayChange={handleDayChange} // Pass down the callback
              />
            )}

            {/* Pickup Location */}
            <PickupLocationSection
              currentDay={currentDay}
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              setPickupLocation={setPickupLocation}
              setDropoffLocation={setDropoffLocation}
              calculateDrivingTimes={calculateDrivingTimes}
              setIntermediateStops={setIntermediateStops}
              minTime2={minTime2}
              maxTime2={maxTime2}
              InitalDropdownWidth={InitalDropdownWidth}
              serviceType={selectedService!.name.toLowerCase()} // Pass service type
              totalDays={numDays}
              intermediateStopsRef={intermediateStopsRef}
              updateDropoffOnTripsWhenEmpty={updateDropoffOnTripsWhenEmpty}
            />

            {/* Intermediate Stops */}
            <IntermediateStopsSection
              intermediateStops={intermediateStops}
              setIntermediateStops={setIntermediateStops}
              verifiedAddresses={verifiedAddresses}
              setVerifiedAddresses={setVerifiedAddresses}
              setisAddStopDisabled={setisAddStopDisabled}
              isWedding={isWedding}
              isExcursion={isExcursion}
              isTrip={isTrip}
              currentDay={currentDay}
              pickupLocationRef={pickupLocationRef}
              dropoffLocationRef={dropoffLocationRef}
              dropoffLocation={dropoffLocation}
              drivingTimes={drivingTimes}
              selectedService={selectedService}
              setDropoffLocation={setDropoffLocation}
              setLastStopIndex={setLastStopIndex}
              intermediateStopsRef={intermediateStopsRef}
              calculateDrivingTimes={calculateDrivingTimes}
              fetchMinTimes={fetchMinTimes}
              minTimes={minTimes}
              maxTime={maxTime}
              lastStopIndex={lastStopIndex}
              handleIntermediateStopTimeChange={handleIntermediateStopTimeChange}
              setMinTimes={setMinTimes}
              InitalDropdownWidth={InitalDropdownWidth}
            />

            {(isExcursion || isTrip) && (
              <AddStopButtonSection
                isWedding={isWedding}
                isAddStopDisabled={isAddStopDisabled}
                lastStopIndex={lastStopIndex}
                isAddingStopDisabled={isAddStopDisabled}
                dropoffLocation={dropoffLocation}
                handleAddStop={handleAddStop}
                serviceIsTransfer={!(isTrip || isExcursion || isWedding)}
              />
            )}
            {/* Dropoff Location */}
            <DropoffLocationSection
              dropoffLocation={dropoffLocation}
              setDropoffLocation={setDropoffLocation}
              previousDayRef={previousDayRef}
              pickupLocationRef={pickupLocationRef}
              intermediateStopsRef={intermediateStopsRef}
              calculateDrivingTimes={calculateDrivingTimes}
              handleAddressSelect={handleAddressSelect}
              InitalDropdownWidth={InitalDropdownWidth}
              setIntermediateStops={setIntermediateStops}
              setLastStopIndex={setLastStopIndex}
              setisAddStopDisabled={setisAddStopDisabled}
              shouldRemoveIntermediateStops={isWedding || isExcursion || isTrip}
            />

            {/* Add Stop Button */}
            {!(isExcursion || isTrip) && (
              <AddStopButtonSection
                isWedding={isWedding}
                isAddStopDisabled={isAddStopDisabled}
                lastStopIndex={lastStopIndex}
                isAddingStopDisabled={isAddStopDisabled}
                serviceIsTransfer={!(isTrip || isExcursion || isWedding)}
                dropoffLocation={dropoffLocation}
                handleAddStop={handleAddStop}
              />
            )}

            {/* Save and Cancel Buttons */}
            <SaveCancelButtonsSection
              closeModal={handleCloseModal}
              currentDay={currentDay}
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              intermediateStops={intermediateStops}
              isTrip={isTrip}
              isSaveDisabled={isSaveDisabled}
              handleDayChange={handleDayChange}
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
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddressModal;
