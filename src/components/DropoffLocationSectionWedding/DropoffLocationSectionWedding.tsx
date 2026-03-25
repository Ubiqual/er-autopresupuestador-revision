import { useDailyStops } from '@/contexts/DailyStopsContext';
import type { StopData } from '@/types/TravelCalculations';
import { t } from '@/utils/i18n';
import { type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import AddressAutocomplete from '../Booking/AdressAutoComplete';

interface DropoffLocationSectionWeddingProps {
  dropoffLocation: StopData;
  setDropoffLocation: Dispatch<SetStateAction<StopData>>;
  previousDayRef: MutableRefObject<number | null>;
  pickupLocationRef: MutableRefObject<StopData>;
  intermediateStopsRef: MutableRefObject<StopData[]>;
  calculateDrivingTimes: (stops: StopData[]) => void;
  handleAddressSelect: (value: string) => void;
  InitalDropdownWidth: MutableRefObject<HTMLInputElement | null>;
  setIntermediateStops: Dispatch<SetStateAction<StopData[]>>;
  step: number;
  intermediateStops: StopData[];
  lastStopIndex: number | null;
  setisAddStopDisabled: Dispatch<SetStateAction<boolean>>;
}

const DropoffLocationSectionWedding = ({
  dropoffLocation,
  setDropoffLocation,
  previousDayRef,
  pickupLocationRef,
  intermediateStopsRef,
  calculateDrivingTimes,
  handleAddressSelect,
  InitalDropdownWidth,
  setIntermediateStops,
  setisAddStopDisabled,
  step,
  lastStopIndex,
  intermediateStops
}: DropoffLocationSectionWeddingProps) => {
  const { setReturnTrips } = useDailyStops();

  const onCelebrationSelect = (value: string) => {
    const updatedIntermediateStops = [...intermediateStopsRef.current];
    updatedIntermediateStops[lastStopIndex!] = {
      ...updatedIntermediateStops[lastStopIndex!],
      address: value,
      day: previousDayRef.current!
    };

    const stopsForCalc: StopData[] = [
      pickupLocationRef.current,
      ...updatedIntermediateStops,
      { address: '', time: '', day: 0 }
    ];
    calculateDrivingTimes(stopsForCalc);

    setIntermediateStops((prev) => {
      const sliceUpToLast = prev.slice(0, lastStopIndex! + 1);
      const base = sliceUpToLast.length > 0 ? sliceUpToLast : prev;
      const rebuilt = [...base];
      rebuilt[lastStopIndex!] = { ...rebuilt[lastStopIndex!], address: value };
      return rebuilt;
    });

    setDropoffLocation({ address: '', time: '', day: previousDayRef.current! });

    setisAddStopDisabled(false);

    setReturnTrips([]);
  };

  const onDropoffSelect = (value: string) => {
    const stopsForCalc: StopData[] = [
      pickupLocationRef.current,
      ...intermediateStopsRef.current,
      { address: value, time: '', day: previousDayRef.current! }
    ];
    calculateDrivingTimes(stopsForCalc);
    handleAddressSelect(value);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-3">
      {step === 0 && lastStopIndex != null && (
        <>
          <label className="block text-md font-medium">{t('bookingPage.locationsModal.celebration')}</label>
          <AddressAutocomplete
            ref={InitalDropdownWidth}
            value={intermediateStops[lastStopIndex]?.address}
            onChange={(val) => {
              setIntermediateStops((prev) => {
                const copy = [...prev];
                copy[lastStopIndex!] = { ...copy[lastStopIndex!], address: val };
                return copy;
              });
              setReturnTrips([]);
            }}
            placeholder={t('bookingPage.locationsModal.dropOffLocation')}
            onSelect={onCelebrationSelect}
          />
        </>
      )}

      {step !== 0 && (
        <>
          <label className="block text-md font-medium mr-[1.5rem]">
            {t('bookingPage.locationsModal.dropOffWedding')}
          </label>
          <AddressAutocomplete
            ref={InitalDropdownWidth}
            value={dropoffLocation.address}
            onChange={(val) => {
              setDropoffLocation((prev) => ({
                ...prev,
                address: val,
                day: previousDayRef.current!
              }));
            }}
            placeholder={t('bookingPage.locationsModal.dropOffLocation')}
            onSelect={onDropoffSelect} // ← and here
          />
        </>
      )}
    </div>
  );
};

export default DropoffLocationSectionWedding;
