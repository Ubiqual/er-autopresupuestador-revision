import { Button, Input } from '@/components/ui';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import type { StopData } from '@/types/TravelCalculations';
import { updateDropoffTime } from '@/utils/addressModalHelpers';
import { t } from '@/utils/i18n';
import type { Service } from '@prisma/client';
import { Cross1Icon } from '@radix-ui/react-icons';
import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import AddressAutocomplete from '../Booking/AdressAutoComplete';

interface IntermediateStopsSectionProps {
  intermediateStops: StopData[];
  setIntermediateStops: Dispatch<SetStateAction<StopData[]>>;
  verifiedAddresses: boolean[];
  setVerifiedAddresses: Dispatch<SetStateAction<boolean[]>>;
  setisAddStopDisabled: Dispatch<SetStateAction<boolean>>;
  isWedding: boolean;
  isExcursion: boolean;
  isTrip: boolean;
  currentDay: number;
  pickupLocationRef: MutableRefObject<StopData>;
  dropoffLocationRef: MutableRefObject<StopData>;
  dropoffLocation: StopData;
  drivingTimes: { [key: string]: number };
  selectedService?: Service;
  setDropoffLocation: Dispatch<SetStateAction<StopData>>;
  setLastStopIndex: Dispatch<SetStateAction<number | null>>;
  intermediateStopsRef: MutableRefObject<StopData[]>;
  calculateDrivingTimes: (stops: StopData[]) => void;
  fetchMinTimes: () => void;
  minTimes: { address: string; time: string }[];
  maxTime?: string;
  handleIntermediateStopTimeChange: (index: number, value: string) => void;
  lastStopIndex: number | null;
  setMinTimes: Dispatch<SetStateAction<{ address: string; time: string }[]>>;
  InitalDropdownWidth: MutableRefObject<HTMLInputElement | null>;
}

const IntermediateStopsSection = ({
  intermediateStops,
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
  dropoffLocationRef,
  drivingTimes,
  selectedService,
  setDropoffLocation,
  setLastStopIndex,
  intermediateStopsRef,
  calculateDrivingTimes,
  fetchMinTimes,
  minTimes,
  maxTime,
  handleIntermediateStopTimeChange,
  lastStopIndex,
  setMinTimes,
  InitalDropdownWidth
}: IntermediateStopsSectionProps) => {
  const { dailyStops, updateDailyStops, returnTrips, setReturnTrips } = useDailyStops();

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

    if (
      minTimes[intermediateStops.length - 1] &&
      selectedService?.name.toLowerCase() === 'bodas' &&
      intermediateStops.length > 0 &&
      intermediateStops.length - 1 === lastStopIndex
    ) {
      setReturnTrips([]);
    }
  };

  const handleRemoveIntermediateStop = (index: number) => {
    const removedStopAddress = intermediateStops[index].address;
    const updatedMinTimes = minTimes.filter((entry) => entry.address !== removedStopAddress);
    setMinTimes(updatedMinTimes);

    const updatedStops = intermediateStops.filter((_, i) => i !== index);
    setIntermediateStops(updatedStops);

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

    if (isWedding && index === intermediateStops.length - 1) {
      setLastStopIndex(null);
    }
    const allIntermediateStopsHaveTime = updatedStops.every((stop) => stop.address !== '' && stop.time !== '');
    setisAddStopDisabled(!allIntermediateStopsHaveTime);
  };

  return (
    <>
      {intermediateStops.map((stop, index) => {
        return (
          <div key={index} className="flex gap-2 mb-3 items-center">
            <div className="hidden lg:block lg:min-w-[7.5rem]"></div>
            <AddressAutocomplete
              ref={InitalDropdownWidth}
              value={stop.address}
              onSelect={(value) => {
                validateAddress(value, index);
                const updatedStops = [...intermediateStopsRef.current];
                updatedStops[index] = { ...updatedStops[index], address: value };
                calculateDrivingTimes([pickupLocationRef.current, ...updatedStops, dropoffLocationRef.current]);
                fetchMinTimes();
              }}
              onChange={(value) => handleIntermediateStopChange(index, value)}
              placeholder={
                !(isTrip || isExcursion || isWedding)
                  ? `${t('bookingPage.locationsModal.stopTransfers')} ${index + 1}`
                  : `${t('bookingPage.locationsModal.stop')} ${index + 1}`
              }
              dropdownWidth={InitalDropdownWidth?.current?.offsetWidth}
              disabled={index === 0 && (pickupLocationRef.current.address === '' || dropoffLocation.address === '')}
            />
            {(isExcursion || isWedding || isTrip) && (
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
              onClick={() => handleRemoveIntermediateStop(index)}
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

export default IntermediateStopsSection;
