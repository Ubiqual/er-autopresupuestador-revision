import { Button } from '@/components/ui';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import { isDayFullyFilled } from '@/utils/addressModalHelpers';
import { t } from '@/utils/i18n';

interface DaySelectorProps {
  currentDay: number;
  handleDayChange: (dayIndex: number) => void; // Just a callback from the parent
}

const DaySelector = ({ currentDay, handleDayChange }: DaySelectorProps) => {
  const { dailyStops, numDays } = useDailyStops();
  return (
    <div className="flex overflow-x-auto whitespace-nowrap justify-start lg:justify-center mb-4">
      {Array.from({ length: numDays }, (_, dayIndex) => {
        const isCurrentDay = currentDay === dayIndex;
        let isDisabled = false;
        if (dayIndex > currentDay) {
          if (dayIndex === currentDay + 1) {
            isDisabled = !isDayFullyFilled(currentDay, dailyStops);
          } else {
            isDisabled = true;
          }
        }

        return (
          <Button
            key={dayIndex}
            variant={isCurrentDay ? 'default' : 'outline'}
            rounded="full"
            color={isCurrentDay ? 'primary' : 'white'}
            onClick={() => !isDisabled && handleDayChange(dayIndex)}
            className="px-3 py-1 mx-1"
            disabled={isDisabled}
          >
            {`${t('bookingPage.tripsModal.day')} ${dayIndex + 1}`}
          </Button>
        );
      })}
    </div>
  );
};

export default DaySelector;
