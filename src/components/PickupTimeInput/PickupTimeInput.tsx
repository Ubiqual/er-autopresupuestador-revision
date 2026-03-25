import { Input } from '@/components/ui/index';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import { t } from '@/utils/i18n';
import { format } from 'date-fns';
import React from 'react';

type PickupTimeInputProps = {
  date: Date | undefined;
  loading: boolean;
  minTime: string;
  maxTime: string;
  setDate: (date: Date) => void; // Function to update the date
};

const PickupTimeInput: React.FC<PickupTimeInputProps> = ({ date, loading, minTime, maxTime, setDate }) => {
  const { setDailyStops } = useDailyStops();
  const handleTimeChange = (value: string) => {
    const newDate = new Date(value);
    setDate(newDate);
    setDailyStops((prevDailyStops) => {
      const newDailyStops = new Map(prevDailyStops);
      const firstDayStops = newDailyStops.get(0);

      if (firstDayStops) {
        newDailyStops.set(0, {
          ...firstDayStops,
          pickup: { ...firstDayStops.pickup, time: value }
        });
      }

      return newDailyStops;
    });
  };
  return (
    <div className="md:flex-1 md:flex md:flex-col">
      <label className="block text-md font-medium text-[#313131] mb-4">{t('bookingPage.labels.pickupTime')}</label>
      <Input
        type="time"
        value={date ? format(date, 'yyyy-MM-dd HH:mm') : ''}
        hideDate={true}
        onChange={(e) => handleTimeChange(e.target.value)}
        isTimeInput={true}
        disabled={loading}
        minTime={minTime}
        maxTime={maxTime}
        placeholderName={t('bookingPage.placeholders.selectTime')}
      />
    </div>
  );
};

export default PickupTimeInput;
