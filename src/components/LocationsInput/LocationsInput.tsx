'use client';

import Location from '@/assets/icons/location-outline.svg';
import { Input } from '@/components/ui/index';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import { useLocations } from '@/contexts/LocationsContext';
import { t } from '@/utils/i18n';

interface LocationsInputProps {
  selectedServiceName: string;
  isTrip: boolean;
  disabled: boolean;
}

const LocationsInput = ({ selectedServiceName, isTrip, disabled }: LocationsInputProps) => {
  const { dailyStops } = useDailyStops();
  const { openModal, openDaysModal } = useLocations();

  const getRouteSummary = () => {
    if (!dailyStops.size) {
      return '';
    }

    const daysArray = Array.from(dailyStops.entries());

    const firstDay = daysArray[0]?.[1];
    const lastDay = daysArray[daysArray.length - 1]?.[1];

    if (!firstDay || !lastDay) {
      return '';
    }

    const firstPickup = firstDay.pickup?.address || '';
    const lastDropoff = lastDay.dropoff?.address || '';

    const totalIntermediateStops = daysArray.reduce((count, [, dayData]) => {
      return count + (dayData.intermediates?.length || 0);
    }, 0);

    const totalStops = daysArray.reduce((count, [dayIndex, dayData]) => {
      let dayStopCount = dayData.intermediates.length;

      if (dayIndex === 0 && dayData.dropoff.address) {
        dayStopCount += 1;
      }

      if (dayIndex === daysArray.length - 1 && dayData.pickup?.address) {
        dayStopCount += 1;
      }

      if (dayIndex > 0 && dayIndex < daysArray.length - 1) {
        dayStopCount += 2;
      }

      return count + dayStopCount;
    }, 0);

    if (totalIntermediateStops === 0) {
      if (!firstPickup || !lastDropoff) {
        return '';
      }
      return `${firstPickup} --- ${lastDropoff}`;
    }

    return `${firstPickup} --- ${isTrip ? totalStops : totalIntermediateStops} Stops --- ${lastDropoff}`;
  };

  const handleClick = () => {
    if (selectedServiceName === 'Viajes') {
      openDaysModal();
    } else {
      openModal();
    }
  };

  return (
    <div>
      <label className="block font-medium text-[#313131] mb-4">{t('bookingPage.labels.locations')}</label>
      <Input
        readOnly
        placeholder={t('bookingPage.placeholders.locations')}
        value={getRouteSummary()}
        onClick={handleClick}
        className="cursor-pointer"
        disabled={disabled}
        prefix={<Location width={24} height={24} style={{ color: '#bfbfbf' }} />}
      />
    </div>
  );
};

export default LocationsInput;
