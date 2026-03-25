import { useDailyStops } from '@/contexts/DailyStopsContext';
import type { StopData } from '@/types/TravelCalculations';
import { t } from '@/utils/i18n';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import AddressAutocomplete from '../Booking/AdressAutoComplete';

interface DropoffLocationSectionProps {
  dropoffLocation: StopData;
  setDropoffLocation: Dispatch<SetStateAction<StopData>>;
  previousDayRef: MutableRefObject<number | null>;
  pickupLocationRef: MutableRefObject<StopData>;
  intermediateStopsRef: MutableRefObject<StopData[]>;
  calculateDrivingTimes: (stops: StopData[]) => void;
  handleAddressSelect: (value: string) => void;
  InitalDropdownWidth: MutableRefObject<HTMLInputElement | null>;
  setIntermediateStops: Dispatch<SetStateAction<StopData[]>>;
  setLastStopIndex: Dispatch<SetStateAction<number | null>>;
  setisAddStopDisabled: Dispatch<SetStateAction<boolean>>;
  shouldRemoveIntermediateStops?: boolean;
}

const DropoffLocationSection = ({
  dropoffLocation,
  setDropoffLocation,
  previousDayRef,
  pickupLocationRef,
  intermediateStopsRef,
  calculateDrivingTimes,
  handleAddressSelect,
  InitalDropdownWidth,
  setIntermediateStops,
  setLastStopIndex,
  setisAddStopDisabled,
  shouldRemoveIntermediateStops
}: DropoffLocationSectionProps) => {
  const { setReturnTrips } = useDailyStops();
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-3">
      <label className="block text-md font-medium  mr-[5.5rem]">{t('bookingPage.locationsModal.dropOff')}</label>
      <AddressAutocomplete
        ref={InitalDropdownWidth}
        value={dropoffLocation.address}
        onChange={(value) => {
          setDropoffLocation((prev) => ({ ...prev, address: value, day: previousDayRef.current as number }));
          if (shouldRemoveIntermediateStops) {
            setReturnTrips([]);
            setLastStopIndex(null);
            setisAddStopDisabled(false);
            setIntermediateStops([]);
          }
        }}
        placeholder={t('bookingPage.locationsModal.dropOffLocation')}
        onSelect={(value) => {
          const updatedStops = [
            pickupLocationRef.current,
            ...intermediateStopsRef.current,
            { address: value, time: '', day: previousDayRef.current as number }
          ];
          calculateDrivingTimes(updatedStops);
          handleAddressSelect(value);
        }}
      />
    </div>
  );
};

export default DropoffLocationSection;
