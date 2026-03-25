import { Input } from '@/components/ui';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import type { StopData } from '@/types/TravelCalculations';
import { t } from '@/utils/i18n';
import { isAfter } from 'date-fns';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import AddressAutocomplete from '../Booking/AdressAutoComplete';

interface PickupLocationSectionProps {
  currentDay: number;
  pickupLocation: StopData;
  dropoffLocation: StopData;
  setPickupLocation: Dispatch<SetStateAction<StopData>>;
  calculateDrivingTimes: (overrideStops?: StopData[]) => Promise<
    | {
        [x: string]: number;
      }
    | undefined
  >;
  setDropoffLocation: Dispatch<SetStateAction<StopData>>;
  setIntermediateStops: Dispatch<SetStateAction<StopData[]>>;
  minTime2: string;
  maxTime2?: string;
  serviceType: string;
  InitalDropdownWidth: MutableRefObject<HTMLInputElement | null>;
  totalDays: number;
  intermediateStopsRef: MutableRefObject<StopData[]>;
  updateDropoffOnTripsWhenEmpty: ({
    value,
    drivingTimes
  }: {
    value: string;
    drivingTimes: {
      [key: string]: number;
    };
  }) => void;
}

const PickupLocationSection = ({
  currentDay,
  pickupLocation,
  dropoffLocation,
  setPickupLocation,
  calculateDrivingTimes,
  setDropoffLocation,
  minTime2,
  maxTime2,
  InitalDropdownWidth,
  serviceType,
  totalDays,
  intermediateStopsRef,
  setIntermediateStops,
  updateDropoffOnTripsWhenEmpty
}: PickupLocationSectionProps) => {
  const { dailyStops } = useDailyStops();
  const isDropoffLocationEmpty = dropoffLocation.address === '';
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-3">
      <label className="block text-md font-medium text-gray-700 mr-[4.2rem]">
        {t('bookingPage.locationsModal.pickup')}
      </label>

      <AddressAutocomplete
        ref={InitalDropdownWidth}
        value={pickupLocation.address}
        onChange={(value) => {
          setPickupLocation((prev) => ({ ...prev, address: value }));
        }}
        onSelect={(value) => {
          if (['excursiones'].includes(serviceType) && isDropoffLocationEmpty) {
            setDropoffLocation((prev) => ({ ...prev, address: value }));
            setIntermediateStops([
              {
                address: '',
                time: '',
                day: currentDay
              }
            ]);
          } else if (serviceType === 'viajes' && currentDay === totalDays - 1 && isDropoffLocationEmpty) {
            setDropoffLocation((prev) => ({ ...prev, address: value }));
          }
          calculateDrivingTimes();
        }}
        placeholder={t('bookingPage.locationsModal.pickupLocation')}
        disabled={currentDay > 0}
        dropdownWidth={InitalDropdownWidth?.current?.offsetWidth}
      />
      {currentDay > 0 && (
        <Input
          type="time"
          value={isAfter(minTime2, new Date(pickupLocation.time || '')) ? '' : pickupLocation.time}
          onChange={(e) => {
            setPickupLocation((prev) => ({ ...prev, time: e.target.value }));

            if (serviceType === 'viajes' && currentDay === totalDays - 1 && dropoffLocation.time === '') {
              const updatedStops = [
                { ...pickupLocation, time: e.target.value },
                ...intermediateStopsRef.current,
                { address: dailyStops.get(0)?.pickup.address || '', time: '', day: totalDays - 1 }
              ];
              let drivingTime: { [key: string]: number } = {};
              const updateDropoffTime = async () => {
                drivingTime = (await calculateDrivingTimes(updatedStops)) as { [key: string]: number };
                updateDropoffOnTripsWhenEmpty({ value: e.target.value, drivingTimes: drivingTime });
              };
              updateDropoffTime();
            }
          }}
          minTime={minTime2}
          placeholderName={t('timeInputPlaceholder')}
          maxTime={maxTime2 ?? ''}
          isTimeInput={true}
        />
      )}
    </div>
  );
};

export default PickupLocationSection;
