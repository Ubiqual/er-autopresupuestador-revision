import { DatePicker } from '@/components/ui/index';
import { t } from '@/utils/i18n';
import { isAfter, isBefore } from 'date-fns';
import React from 'react';

type PickupDatePickerProps = {
  initialDate: Date | undefined;
  loading: boolean;
  onDateChange: (newDate: Date) => void;
};

const PickupDatePicker: React.FC<PickupDatePickerProps> = ({ initialDate, loading, onDateChange }) => {
  const today = new Date();

  // Local handleDateChange function
  const handleDateChange = (newDate: Date) => {
    if (newDate && initialDate) {
      // Preserve the hours and minutes of the currently selected date
      const copyNewDate = newDate;
      if (isAfter(copyNewDate.setHours(initialDate.getHours(), initialDate.getMinutes(), 0, 0), new Date())) {
        newDate.setHours(initialDate.getHours(), initialDate.getMinutes(), 0, 0);
        onDateChange(newDate);
      } else if (isBefore(copyNewDate.setHours(initialDate.getHours(), initialDate.getMinutes(), 0, 0), new Date())) {
        const currentHours = today.getHours();
        const currentMinutes = today.getMinutes();

        const updatedDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          currentHours,
          currentMinutes,
          0
        );
        onDateChange(updatedDate);
      }
    } else {
      onDateChange(newDate);
    }
  };

  return (
    <div className="w-full md:flex-1 md:flex md:flex-col">
      <label className="block text-md font-medium text-[#313131] mb-4">{t('bookingPage.labels.pickupDate')}</label>
      <DatePicker date={initialDate} disabled={loading} onDateChange={handleDateChange} />
    </div>
  );
};

export default PickupDatePicker;
