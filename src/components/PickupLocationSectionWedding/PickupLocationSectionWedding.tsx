import type { StopData } from '@/types/TravelCalculations';
import type { ReturnTrip } from '@/types/WeedingReturnTrips';
import { t } from '@/utils/i18n';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import AddressAutocomplete from '../Booking/AdressAutoComplete';

interface PickupLocationSectionProps {
  currentDay: number;
  pickupLocation: StopData;
  setPickupLocation: Dispatch<SetStateAction<StopData>>;
  calculateDrivingTimes: (overrideStops?: StopData[]) => Promise<
    | {
        [x: string]: number;
      }
    | undefined
  >;
  setIntermediateStops: Dispatch<SetStateAction<StopData[]>>;
  setLastStopIndex: Dispatch<SetStateAction<number | null>>;
  setReturnTrips: Dispatch<SetStateAction<ReturnTrip[]>>;
  InitalDropdownWidth: MutableRefObject<HTMLInputElement | null>;
  intermediateStopsRef: MutableRefObject<StopData[]>;
  steps: number;
  lastStopIndex?: number | null;
}

const PickupLocationSectionWedding = ({
  currentDay,
  pickupLocation,
  setPickupLocation,
  calculateDrivingTimes,
  setIntermediateStops,
  setLastStopIndex,
  setReturnTrips,
  InitalDropdownWidth,
  intermediateStopsRef,
  steps,
  lastStopIndex
}: PickupLocationSectionProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-3">
      {steps === 0 && (
        <>
          <label className="block text-md font-medium text-gray-700 mr-[2.5rem]">
            {t('bookingPage.locationsModal.pickupWedding')}
          </label>

          <AddressAutocomplete
            ref={InitalDropdownWidth}
            value={pickupLocation.address}
            onChange={(value) => {
              setPickupLocation((prev) => ({ ...prev, address: value }));
              setIntermediateStops([{ address: '', time: '', day: currentDay }]);
              setLastStopIndex(0);
              setReturnTrips([]);
            }}
            onSelect={() => {
              calculateDrivingTimes();
            }}
            placeholder={t('bookingPage.locationsModal.pickupLocation')}
            disabled={currentDay > 0}
            dropdownWidth={InitalDropdownWidth?.current?.offsetWidth}
          />
        </>
      )}
      {steps !== 0 && (
        <>
          <label className="block text-md font-medium text-gray-700">
            {t('bookingPage.locationsModal.celebration')}
          </label>

          <AddressAutocomplete
            ref={InitalDropdownWidth}
            value={intermediateStopsRef.current[lastStopIndex ?? 0]?.address}
            onChange={(value) => {
              setPickupLocation((prev) => ({ ...prev, address: value }));
            }}
            onSelect={() => {
              calculateDrivingTimes();
            }}
            placeholder={t('bookingPage.locationsModal.pickupLocation')}
            disabled={true}
            dropdownWidth={InitalDropdownWidth?.current?.offsetWidth}
          />
        </>
      )}
    </div>
  );
};

export default PickupLocationSectionWedding;
